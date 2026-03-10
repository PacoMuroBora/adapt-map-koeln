'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mic, Loader2 } from 'lucide-react'
import { cn } from '@/utilities/ui'

type Status = 'idle' | 'recording' | 'processing'

type Color = 'purple' | 'orange' | 'green' | 'pink' | 'turquoise'

/**
 * Section accent (progress bar) colors — NOT the card background.
 * Card uses base (e.g. bg-am-orange); CTA and progress bar use -alt (e.g. bg-am-orange-alt).
 */
const SECTION_ACCENT_CLASSES: Record<Color, { bg: string; icon: string }> = {
  purple: { bg: 'bg-am-purple-alt', icon: 'text-am-darker' },
  orange: { bg: 'bg-am-orange-alt', icon: 'text-am-darker' },
  green: { bg: 'bg-am-green-alt', icon: 'text-am-darker' },
  pink: { bg: 'bg-am-pink-alt', icon: 'text-am-darker' },
  turquoise: { bg: 'bg-am-turquoise-alt', icon: 'text-am-darker' },
}

export interface AudioTranscribeButtonProps {
  /** Section key; CTA uses accent (-alt) color, not card background. */
  color?: Color
  onTranscript: (text: string) => void
  disabled?: boolean
  className?: string
}

/** Odd count so there is a center bar; heights mirrored for horizontal symmetry. */
const BAR_COUNT = 33

const BAR_CENTER_INDEX = (BAR_COUNT - 1) / 2
const BAR_INDEXES = Array.from({ length: BAR_COUNT }, (_, i) => i)

const BAR_MAX_HEIGHT = 56

function WaveformBars({
  className,
  level,
  phase,
  compact = false,
}: {
  className?: string
  level: number
  phase: number
  /** Scale bars to fit inside small button; use currentColor for visibility */
  compact?: boolean
}) {
  const dynamicHeights = useMemo(() => {
    return BAR_INDEXES.map((index) => {
      const distFromCenter = Math.abs(index - BAR_CENTER_INDEX)
      const normalizedDistance = distFromCenter / BAR_CENTER_INDEX
      const centerWeight = Math.pow(1 - normalizedDistance, 1.45)
      const edgeDampen = 0.45 + centerWeight * 0.55

      // Keep a subtle animated wave even at low input volume.
      const wave = (Math.sin(phase + index * 0.47) + 1) / 2
      const oscillation = wave * (4 + centerWeight * 14) * (0.45 + level * 0.9)
      const volumeBoost = level * (8 + centerWeight * 28)
      const baseHeight = 7 + centerWeight * 7

      const rawHeight = (baseHeight + oscillation + volumeBoost) * edgeDampen
      const heightPx = Math.min(BAR_MAX_HEIGHT, Math.max(6, rawHeight))
      return compact ? (heightPx / BAR_MAX_HEIGHT) * 20 : heightPx
    })
  }, [level, phase, compact])

  return (
    <div className={cn('flex items-center justify-center gap-0.5', className)} aria-hidden>
      {dynamicHeights.map((heightPx, i) => (
        <div
          key={i}
          className={cn(
            'min-w-px w-px shrink-0 min-h-[3px] rounded-full transition-[height] duration-75 ease-out origin-center',
            compact ? 'max-h-5 bg-current' : 'min-h-[6px] max-h-14 bg-foreground/60',
          )}
          style={{ height: `${heightPx}px` }}
        />
      ))}
    </div>
  )
}

export function AudioTranscribeButton({
  color,
  onTranscript,
  disabled = false,
  className,
}: AudioTranscribeButtonProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [waveLevel, setWaveLevel] = useState(0)
  const [wavePhase, setWavePhase] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastFrameUpdateRef = useRef(0)
  const smoothedLevelRef = useRef(0)

  const isRecording = status === 'recording'
  const isProcessing = status === 'processing'
  const accent = SECTION_ACCENT_CLASSES[color ?? 'purple']

  const stopTracks = useCallback((stream: MediaStream) => {
    stream.getTracks().forEach((t) => t.stop())
  }, [])

  const stopAudioAnalysis = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }

    analyserRef.current = null

    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }

    smoothedLevelRef.current = 0
    lastFrameUpdateRef.current = 0
    setWaveLevel(0)
    setWavePhase(0)
  }, [])

  const startAudioAnalysis = useCallback(async (stream: MediaStream) => {
    const Ctx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return

    const audioContext = new Ctx()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 1024
    analyser.smoothingTimeConstant = 0.8
    source.connect(analyser)

    audioContextRef.current = audioContext
    sourceNodeRef.current = source
    analyserRef.current = analyser

    const data = new Uint8Array(analyser.fftSize)

    const tick = (now: number) => {
      const currentAnalyser = analyserRef.current
      if (!currentAnalyser) return

      currentAnalyser.getByteTimeDomainData(data)

      let sumSquares = 0
      for (let i = 0; i < data.length; i++) {
        const normalized = (data[i] - 128) / 128
        sumSquares += normalized * normalized
      }

      const rms = Math.sqrt(sumSquares / data.length)
      smoothedLevelRef.current = smoothedLevelRef.current * 0.82 + rms * 0.18

      // Keep updates around 20fps to avoid excessive rerenders.
      if (now - lastFrameUpdateRef.current > 50) {
        lastFrameUpdateRef.current = now
        setWaveLevel(Math.min(1, smoothedLevelRef.current * 5))
        setWavePhase(now * 0.018)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    return () => {
      stopAudioAnalysis()
    }
  }, [stopAudioAnalysis])

  const handleToggle = useCallback(async () => {
    if (disabled) return
    setError(null)

    if (isRecording) {
      stopAudioAnalysis()
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') {
        mr.stop()
      }
      return
    }

    if (status === 'idle') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        const mediaRecorder = new MediaRecorder(stream, { mimeType })
        mediaRecorderRef.current = mediaRecorder
        chunksRef.current = []
        await startAudioAnalysis(stream)

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        mediaRecorder.onstop = async () => {
          stopAudioAnalysis()
          stopTracks(stream)
          mediaRecorderRef.current = null
          const blob = new Blob(chunksRef.current, { type: mimeType })
          chunksRef.current = []

          if (blob.size === 0) {
            setStatus('idle')
            return
          }

          setStatus('processing')
          try {
            const formData = new FormData()
            formData.append('audio_file', blob, 'audio.webm')

            const res = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData,
            })

            if (!res.ok) {
              const err = await res.json().catch(() => ({}))
              throw new Error(err?.error ?? `HTTP ${res.status}`)
            }

            const data = await res.json()
            const transcript = typeof data?.transcript === 'string' ? data.transcript.trim() : ''
            if (transcript) onTranscript(transcript)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Transkription fehlgeschlagen')
          } finally {
            setStatus('idle')
          }
        }

        mediaRecorder.onerror = () => {
          stopAudioAnalysis()
          stopTracks(stream)
          setError('Aufnahme fehlgeschlagen')
          setStatus('idle')
        }

        mediaRecorder.start()
        setStatus('recording')
      } catch (err) {
        stopAudioAnalysis()
        setError(
          err instanceof Error ? err.message : 'Mikrofon nicht verfügbar. Bitte Zugriff erlauben.',
        )
      }
    }
  }, [
    disabled,
    isRecording,
    status,
    onTranscript,
    stopTracks,
    startAudioAnalysis,
    stopAudioAnalysis,
  ])

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || isProcessing}
        aria-label={isRecording ? 'Aufnahme beenden' : 'Sprache aufnehmen'}
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm transition-all focus-visible:outline-none focus-visible:ring-none disabled:pointer-events-none disabled:opacity-50',
          accent.bg,
          accent.icon,
          isRecording && 'scale-105 ring-2 ring-am-darker/40',
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-6 w-6 shrink-0 animate-spin" aria-hidden />
        ) : isRecording ? (
          <WaveformBars
            level={waveLevel}
            phase={wavePhase}
            compact
            className="h-6 w-[85%] min-w-0 shrink-0 transition-none"
          />
        ) : (
          <Mic className="h-6 w-6 shrink-0" aria-hidden />
        )}
      </button>
      {error && <p className="text-xs text-destructive text-center max-w-[200px]">{error}</p>}
    </div>
  )
}
