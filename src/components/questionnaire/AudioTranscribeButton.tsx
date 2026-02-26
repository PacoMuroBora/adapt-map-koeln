'use client'

import { useCallback, useRef, useState } from 'react'
import { Mic, Loader2 } from 'lucide-react'
import { cn } from '@/utilities/ui'

type Status = 'idle' | 'recording' | 'processing'

type Color = 'purple' | 'orange' | 'green' | 'pink' | 'turquoise'

/**
 * Section accent (progress bar) colors — NOT the card background.
 * Card uses base (e.g. bg-am-orange); CTA and progress bar use -alt (e.g. bg-am-orange-alt).
 */
const SECTION_ACCENT_CLASSES: Record<
  Color,
  { bg: string; icon: string }
> = {
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
const WAVEFORM_MAX_WIDTH = 280

function WaveformBars({ className }: { className?: string }) {
  const half = Math.floor(BAR_COUNT / 2)
  const symmetricHeights = Array.from({ length: BAR_COUNT }, (_, i) => {
    const distFromCenter = Math.min(i, BAR_COUNT - 1 - i)
    return 8 + (distFromCenter % 4) * 4
  })
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-0.5',
        className,
      )}
      aria-hidden
    >
      {symmetricHeights.map((heightPx, i) => (
        <div
          key={i}
          className="w-0.5 min-h-[6px] max-h-6 rounded-full bg-foreground/60 animate-waveform origin-center"
          style={{
            animationDelay: `${(i % (half + 1)) * 0.04}s`,
            height: `${heightPx}px`,
          }}
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const isRecording = status === 'recording'
  const isProcessing = status === 'processing'
  const accent = SECTION_ACCENT_CLASSES[color ?? 'purple']

  const stopTracks = useCallback((stream: MediaStream) => {
    stream.getTracks().forEach((t) => t.stop())
  }, [])

  const handleToggle = useCallback(async () => {
    if (disabled) return
    setError(null)

    if (isRecording) {
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') {
        mr.stop()
      }
      return
    }

    if (status === 'idle') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'
        const mediaRecorder = new MediaRecorder(stream, { mimeType })
        mediaRecorderRef.current = mediaRecorder
        chunksRef.current = []

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        mediaRecorder.onstop = async () => {
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
            const transcript =
              typeof data?.transcript === 'string'
                ? data.transcript.trim()
                : ''
            if (transcript) onTranscript(transcript)
          } catch (err) {
            setError(
              err instanceof Error ? err.message : 'Transkription fehlgeschlagen',
            )
          } finally {
            setStatus('idle')
          }
        }

        mediaRecorder.onerror = () => {
          stopTracks(stream)
          setError('Aufnahme fehlgeschlagen')
          setStatus('idle')
        }

        mediaRecorder.start()
        setStatus('recording')
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Mikrofon nicht verfügbar. Bitte Zugriff erlauben.',
        )
      }
    }
  }, [disabled, isRecording, status, onTranscript, stopTracks])

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 pb-8',
        className,
      )}
    >
      {/* Fixed-height slot so waveform visibility causes no layout shift */}
      <div
        className="flex h-12 w-full max-w-[200px] items-center justify-center sm:max-w-[280px]"
        aria-hidden
      >
        <WaveformBars
          className={cn(
            'h-12 w-full max-w-[200px] transition-opacity duration-200 sm:max-w-[280px]',
            isRecording ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        />
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || isProcessing}
        aria-label={isRecording ? 'Aufnahme beenden' : 'Sprache aufnehmen'}
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
          isRecording && 'bg-background text-foreground border border-border',
          !isRecording && accent.bg && accent.icon,
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        ) : (
          <Mic className="h-6 w-6" aria-hidden />
        )}
      </button>
      {error && (
        <p className="text-xs text-destructive text-center max-w-[200px]">
          {error}
        </p>
      )}
    </div>
  )
}
