'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import type { BackgroundControls } from './usePersistentControls'

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uReferenceResolution;
  uniform vec2 uPointer;
  uniform float uScroll;
  uniform int uInteractionMode;

  uniform float uCellSize;
  uniform float uGap;
  uniform float uBorderWidth;
  uniform float uLineThreshold;
  uniform int uLineSnap;

  uniform float uNoiseScale;
  uniform float uSpeed;
  uniform float uContrast;
  uniform float uBrightness;

  uniform vec3 uColorLight;
  uniform vec3 uColorDark;
  uniform vec3 uColorLightScrolled;
  uniform vec3 uColorDarkScrolled;
  uniform vec3 uBackgroundColor;
  uniform vec3 uBackgroundColorScrolled;
  uniform float uSaturation;
  uniform float uUseBackgroundFill;

  uniform float uParallaxOffset;    // vertical parallax: noise translated opposite to scroll (scroll down -> add sample y -> texture moves down)

  uniform float uPointerRadius;      // base radius (trail points)
  uniform float uPointerRadiusHead;  // head only (current cursor; can be 1.5x on hover)
  uniform float uPointerStrength;
  uniform float uScrollStrength;

  const int MAX_TRAIL = 64;
  uniform vec3 uTrailPoints[MAX_TRAIL]; // xy = pos (0..1), z = age (0..1)
  uniform int uTrailCount;
  uniform float uTrailStrength;

  // Simple hash-based noise
  float hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p.x + p.y) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 u = f * f * (3.0 - 2.0 * f);

    float n00 = hash(i + vec2(0.0, 0.0));
    float n10 = hash(i + vec2(1.0, 0.0));
    float n01 = hash(i + vec2(0.0, 1.0));
    float n11 = hash(i + vec2(1.0, 1.0));

    return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
  }

  // Map current viewport UV to a centered "reference canvas" UV.
  // This makes smaller viewports look like a crop of the reference size.
  vec2 toReferenceUV(vec2 uv) {
    vec2 currentPx = uv * uResolution;
    vec2 refOriginPx = 0.5 * (uReferenceResolution - uResolution);
    vec2 refPx = currentPx + refOriginPx;
    return refPx / uReferenceResolution;
  }

  float getCellValue(vec2 sampleUV) {
    float aspect = uReferenceResolution.x / uReferenceResolution.y;
    vec2 gridUV = sampleUV;
    gridUV.x *= aspect;
    // Parallax: translate noise opposite to scroll (scroll down -> subtract so texture moves up)
    gridUV.y -= uParallaxOffset;

    float t = uTime * uSpeed;
    vec2 flow = vec2(
      sin(gridUV.y * 3.1415 + t * 0.9),
      cos(gridUV.x * 3.1415 * 0.25 + t * 0.6)
    );

    vec2 noiseUV = gridUV * uNoiseScale * 4.0 + flow * 0.35 + vec2(t * 0.4, -t * 0.27);
    float field = noise(noiseUV);
    float value = 0.5 + 0.5 * field;

    float interaction = 0.0;

    if (uInteractionMode == 1 || uInteractionMode == 3) {
      vec2 pointerUV = toReferenceUV(uPointer);
      float d = distance(sampleUV, pointerUV);
      if (uPointerRadiusHead > 0.0) {
        float falloff = smoothstep(uPointerRadiusHead, 0.0, d);
        interaction += falloff * uPointerStrength;
      }
    }

    if (uInteractionMode == 2 || uInteractionMode == 3) {
      interaction += uScroll * uScrollStrength;
    }

    if (uInteractionMode == 4) {
      interaction += 0.35 * sin(t * 0.7) + 0.25 * cos(t * 1.1 + gridUV.x * 0.5);
    }

    value += interaction;
    value = (value - 0.5) * uContrast + 0.5 + uBrightness;
    value = clamp(value, 0.0, 1.0);

    return value;
  }

  float lineActivationFromValue(float value, float lineStartDarkness) {
    float darkness = clamp(1.0 - value, 0.0, 1.0);
    return smoothstep(lineStartDarkness, 1.0, darkness);
  }

  vec3 applySaturation(vec3 c, float s) {
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(l), c, s);
  }

  void main() {
    vec2 refOriginPx = 0.5 * (uReferenceResolution - uResolution);
    vec2 refFragCoord = gl_FragCoord.xy + refOriginPx;

    // Grid cell index and center in screen space
    float cell = uCellSize;
    float halfCell = cell * 0.5;

    vec2 cellIndex = floor(refFragCoord / cell);
    vec2 cellCenter = (cellIndex + 0.5) * cell;
    vec2 cellUV = cellCenter / uReferenceResolution.xy;

    // Per-cell scalar value (no neighbour-based dithering)
    float value = getCellValue(cellUV);

    // Trail paint: faded circles darken the field so squares/lines respond along the path
    float trailInfluence = 0.0;
    for (int i = 0; i < MAX_TRAIL; i++) {
      if (i >= uTrailCount) break;
      vec3 tp = uTrailPoints[i];
      vec2 p = toReferenceUV(tp.xy);
      float age = clamp(tp.z, 0.0, 1.0);
      float d = distance(cellUV, p);
      float r = uPointerRadius * 1.25 * (1.0 - age * 0.5);
      if (r > 0.001) {
        float falloff = (1.0 - age) * smoothstep(r, 0.0, d);
        trailInfluence += falloff;
      }
    }
    trailInfluence = clamp(trailInfluence, 0.0, 1.0);
    value = clamp(value - uTrailStrength * trailInfluence, 0.0, 1.0);

    // Grid cell logic in screen space (per-fragment, but based on precomputed cell center)
    vec2 local = refFragCoord - cellCenter;
    float maxAbs = max(abs(local.x), abs(local.y));

    // Darker -> bigger square; pure white => square with zero size
    float darkness = 1.0 - value;
    darkness = clamp(darkness, 0.0, 1.0);

    // Two-phase mapping:
    // 1) grow squares smoothly until they touch
    // 2) only on darker values, add seam lines between touching cells
    float lineStartDarkness = clamp(uLineThreshold, 0.0, 1.0);
    float growT = smoothstep(0.0, lineStartDarkness, darkness);
    float size = halfCell * growT;

    float insideSquare = step(maxAbs, size);

    // Seam lines between touching cells: only when both neighboring cells are dark enough
    float seamMask = 0.0;
    float lineT = lineActivationFromValue(value, lineStartDarkness);
    float lineFlag = step(lineStartDarkness, darkness);
    if (uBorderWidth > 0.0 && (uLineSnap == 1 ? lineFlag > 0.0 : lineT > 0.0)) {
      vec2 cellStepUV = vec2(cell / uReferenceResolution.x, cell / uReferenceResolution.y);

      float valueL = getCellValue(clamp(cellUV - vec2(cellStepUV.x, 0.0), vec2(0.0), vec2(1.0)));
      float valueR = getCellValue(clamp(cellUV + vec2(cellStepUV.x, 0.0), vec2(0.0), vec2(1.0)));
      float valueD = getCellValue(clamp(cellUV - vec2(0.0, cellStepUV.y), vec2(0.0), vec2(1.0)));
      float valueU = getCellValue(clamp(cellUV + vec2(0.0, cellStepUV.y), vec2(0.0), vec2(1.0)));

      float lineL = lineActivationFromValue(valueL, lineStartDarkness);
      float lineR = lineActivationFromValue(valueR, lineStartDarkness);
      float lineD = lineActivationFromValue(valueD, lineStartDarkness);
      float lineU = lineActivationFromValue(valueU, lineStartDarkness);
      float darkL = clamp(1.0 - valueL, 0.0, 1.0);
      float darkR = clamp(1.0 - valueR, 0.0, 1.0);
      float darkD = clamp(1.0 - valueD, 0.0, 1.0);
      float darkU = clamp(1.0 - valueU, 0.0, 1.0);
      float lineFlagL = step(lineStartDarkness, darkL);
      float lineFlagR = step(lineStartDarkness, darkR);
      float lineFlagD = step(lineStartDarkness, darkD);
      float lineFlagU = step(lineStartDarkness, darkU);

      // Edge strips rendered inside the cell to avoid corner pinholes.
      float edgeX = uLineSnap == 1
        ? step(halfCell - uBorderWidth, abs(local.x))
        : smoothstep(uBorderWidth, 0.0, halfCell - abs(local.x));
      float edgeY = uLineSnap == 1
        ? step(halfCell - uBorderWidth, abs(local.y))
        : smoothstep(uBorderWidth, 0.0, halfCell - abs(local.y));

      float currentLine = uLineSnap == 1 ? lineFlag : lineT;
      float neighborLineL = uLineSnap == 1 ? lineFlagL : lineL;
      float neighborLineR = uLineSnap == 1 ? lineFlagR : lineR;
      float neighborLineD = uLineSnap == 1 ? lineFlagD : lineD;
      float neighborLineU = uLineSnap == 1 ? lineFlagU : lineU;

      float rightSeam = step(0.0, local.x) * edgeX * currentLine * neighborLineR;
      float leftSeam = step(local.x, 0.0) * edgeX * currentLine * neighborLineL;
      float topSeam = step(0.0, local.y) * edgeY * currentLine * neighborLineU;
      float bottomSeam = step(local.y, 0.0) * edgeY * currentLine * neighborLineD;

      seamMask = max(max(rightSeam, leftSeam), max(topSeam, bottomSeam));
    }

    // Single solid square color; scalar value only affects size / seam activation
    vec3 colorLight = uUseBackgroundFill > 0.5 ? mix(uColorLightScrolled, uColorLight, uSaturation) : uColorLight;
    vec3 colorDark = uUseBackgroundFill > 0.5 ? mix(uColorDarkScrolled, uColorDark, uSaturation) : uColorDark;
    vec3 color = colorLight;

    // Seam lines are composited on top
    color = mix(color, colorDark, seamMask);

    float alpha = clamp(insideSquare + seamMask, 0.0, 1.0);

    vec3 finalColor;
    float outAlpha;
    if (uUseBackgroundFill > 0.5) {
      vec3 bgColor = mix(uBackgroundColorScrolled, uBackgroundColor, uSaturation);
      finalColor = mix(bgColor, color, alpha);
      finalColor = applySaturation(finalColor, uSaturation);
      outAlpha = 1.0;
    } else {
      finalColor = applySaturation(color, uSaturation);
      outAlpha = alpha;
    }

    gl_FragColor = vec4(finalColor, outAlpha);
  }
`

interface QuadProps {
  controls: BackgroundControls
}

function interactionModeToIndex(mode: BackgroundControls['interactionMode']): number {
  switch (mode) {
    case 'none':
      return 0
    case 'mouse':
      return 1
    case 'scroll':
      return 2
    case 'mouse+scroll':
      return 3
    case 'auto':
      return 4
    default:
      return 0
  }
}

const FullscreenQuad: React.FC<
  QuadProps & {
    pointerRef: React.MutableRefObject<{ x: number; y: number }>
    scrollRef: React.MutableRefObject<number>
    pointerTypeRef: React.MutableRefObject<string>
    pointerCursorRef: React.MutableRefObject<boolean>
    clickPulseRef: React.MutableRefObject<number>
    parallaxOffsetY?: number
    useBackgroundFill?: boolean
    backgroundColor?: string
    backgroundColorScrolled?: string
    saturationTarget?: number
    saturationLerp?: number
  }
> = ({
  controls,
  pointerRef,
  scrollRef,
  pointerTypeRef,
  pointerCursorRef,
  clickPulseRef,
  parallaxOffsetY = 0,
    useBackgroundFill = false,
    backgroundColor = '#ffffff',
    backgroundColorScrolled = '#ffffff',
    saturationTarget = 1,
    saturationLerp = 0.08,
}) => {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const { size, viewport, gl } = useThree()

  const trailRef = useRef<{ x: number; y: number; age: number }[]>([])
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 })
  const cursorMultAnimRef = useRef(1)
  const saturationCurrentRef = useRef(1)

  const MAX_TRAIL = 64
  const CURSOR_HOVER_EASE = 6
  const initialDrawingSize = gl.getDrawingBufferSize(new THREE.Vector2())

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(initialDrawingSize.x, initialDrawingSize.y) },
      uReferenceResolution: { value: new THREE.Vector2(REFERENCE_WIDTH, REFERENCE_HEIGHT) },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uScroll: { value: 0 },
      uParallaxOffset: { value: 0 },
      uInteractionMode: { value: 0 },

      uCellSize: { value: controls.gridCellSize },
      uGap: { value: controls.gridGap },
      uBorderWidth: { value: controls.gridBorderWidth },
      uLineThreshold: { value: controls.lineThreshold },
      uLineSnap: { value: controls.lineSnap ? 1 : 0 },

      uNoiseScale: { value: controls.fieldNoiseScale },
      uSpeed: { value: controls.fieldSpeed },
      uContrast: { value: controls.fieldContrast },
      uBrightness: { value: controls.fieldBrightness },

      uColorLight: { value: new THREE.Color(controls.squareColor) },
      uColorDark: { value: new THREE.Color(controls.lineColor) },
      uColorLightScrolled: { value: new THREE.Color(controls.squareColorScrolled) },
      uColorDarkScrolled: { value: new THREE.Color(controls.lineColorScrolled) },
      uBackgroundColor: { value: new THREE.Color('#ffffff') },
      uBackgroundColorScrolled: { value: new THREE.Color('#ffffff') },
      uSaturation: { value: 1 },
      uUseBackgroundFill: { value: 0 },

      uPointerRadius: { value: controls.interactionPointerRadius },
      uPointerRadiusHead: { value: controls.interactionPointerRadius },
      uPointerStrength: { value: controls.interactionPointerStrength },
      uScrollStrength: { value: controls.interactionScrollStrength },

      uTrailPoints: {
        value: Array.from({ length: MAX_TRAIL }, () => new THREE.Vector3(0.5, 0.5, 1)),
      },
      uTrailCount: { value: 0 },
      uTrailStrength: { value: controls.trailStrength },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Keep resolution in sync with canvas size
  useEffect(() => {
    if (!materialRef.current) return
    const drawSize = gl.getDrawingBufferSize(new THREE.Vector2())
    materialRef.current.uniforms.uResolution.value.set(drawSize.x, drawSize.y)
  }, [size, gl])

  // Push control values into uniforms when they change
  useEffect(() => {
    if (!materialRef.current) return
    const uniformsRef = materialRef.current.uniforms

    uniformsRef.uCellSize.value = controls.gridCellSize
    uniformsRef.uGap.value = controls.gridGap
    uniformsRef.uBorderWidth.value = controls.gridBorderWidth
    uniformsRef.uLineThreshold.value = controls.lineThreshold
    uniformsRef.uLineSnap.value = controls.lineSnap ? 1 : 0

    uniformsRef.uNoiseScale.value = controls.fieldNoiseScale
    uniformsRef.uSpeed.value = controls.fieldSpeed
    uniformsRef.uContrast.value = controls.fieldContrast
    uniformsRef.uBrightness.value = controls.fieldBrightness

    uniformsRef.uColorLight.value.set(controls.squareColor)
    uniformsRef.uColorDark.value.set(controls.lineColor)
    uniformsRef.uColorLightScrolled.value.set(controls.squareColorScrolled)
    uniformsRef.uColorDarkScrolled.value.set(controls.lineColorScrolled)

    if (useBackgroundFill) {
      uniformsRef.uBackgroundColor.value.set(backgroundColor)
      uniformsRef.uBackgroundColorScrolled.value.set(backgroundColorScrolled)
      uniformsRef.uUseBackgroundFill.value = 1
    } else {
      uniformsRef.uUseBackgroundFill.value = 0
    }

    uniformsRef.uPointerStrength.value = controls.interactionPointerStrength
    uniformsRef.uScrollStrength.value = controls.interactionScrollStrength
    uniformsRef.uTrailStrength.value = controls.trailStrength
    uniformsRef.uInteractionMode.value = interactionModeToIndex(controls.interactionMode)
  }, [controls, useBackgroundFill, backgroundColor, backgroundColorScrolled])

  useFrame((_state, delta) => {
    if (!materialRef.current) return

    const pointer = pointerRef.current
    const scroll = scrollRef.current
    const uniformsRef = materialRef.current.uniforms
    uniformsRef.uTime.value += delta
    uniformsRef.uPointer.value.set(pointer.x, pointer.y)
    uniformsRef.uScroll.value = scroll
    uniformsRef.uParallaxOffset.value = parallaxOffsetY

    if (useBackgroundFill) {
      const cur = saturationCurrentRef.current
      const next = cur + (saturationTarget - cur) * Math.min(1, saturationLerp)
      saturationCurrentRef.current = next
      uniformsRef.uSaturation.value = next
    } else {
      uniformsRef.uSaturation.value = 1
    }

    const isTouchOrPen =
      pointerTypeRef.current === 'touch' || pointerTypeRef.current === 'pen'
    const touchMult =
      isTouchOrPen && size.width < MOBILE_WIDTH_THRESHOLD
        ? TOUCH_PEN_RADIUS_MULT_MOBILE
        : isTouchOrPen
          ? TOUCH_PEN_RADIUS_MULT
          : 1
    const baseMult = touchMult

    const targetCursorMult =
      !isTouchOrPen && pointerCursorRef.current ? 2 : 1
    const cur = cursorMultAnimRef.current
    cursorMultAnimRef.current =
      cur + (targetCursorMult - cur) * Math.min(1, delta * CURSOR_HOVER_EASE)
    const cursorMult = cursorMultAnimRef.current

    // Click / tap pulse: animate radius multiplier back to 1 over CLICK_PULSE_DURATION
    const pulse = clickPulseRef.current
    if (pulse > 0) {
      clickPulseRef.current = Math.max(0, pulse - delta / CLICK_PULSE_DURATION)
    }
    const pulseMult = 1 + pulse * 0.5 // 1 -> 1.5x radius at click/tap, ease back to 1

    const baseRadius = controls.interactionPointerRadius * baseMult
    uniformsRef.uPointerRadius.value = baseRadius
    uniformsRef.uPointerRadiusHead.value =
      baseRadius * cursorMult * pulseMult

    // Mouse trail: interpolate between last and current pointer, then age / fade
    const trail = trailRef.current
    const last = lastPointerRef.current
    const curr = pointer

    const dx = curr.x - last.x
    const dy = curr.y - last.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const stepSize = 0.02

    if (dist > 0.0) {
      const steps = Math.min(8, Math.max(1, Math.ceil(dist / stepSize)))
      for (let i = 1; i <= steps; i++) {
        const t = i / steps
        const x = last.x + dx * t
        const y = last.y + dy * t
        trail.push({ x, y, age: 0 })
      }
      lastPointerRef.current = { x: curr.x, y: curr.y }
    }

    // Age and trim (fade time from Leva)
    const fadeSeconds = controls.trailFadeSeconds
    for (let i = 0; i < trail.length; i++) {
      trail[i].age += delta / fadeSeconds
    }
    const maxTrail = MAX_TRAIL
    let filtered = trail.filter((p) => p.age < 1.0)
    if (filtered.length > maxTrail) {
      filtered = filtered.slice(filtered.length - maxTrail)
    }
    trailRef.current = filtered

    // Push into uniforms
    const uTrailPoints = uniformsRef.uTrailPoints.value as THREE.Vector3[]
    const count = filtered.length
    for (let i = 0; i < maxTrail; i++) {
      if (i < count) {
        const p = filtered[i]
        uTrailPoints[i].set(p.x, p.y, p.age)
      } else {
        uTrailPoints[i].set(0.5, 0.5, 1)
      }
    }
    uniformsRef.uTrailCount.value = count
  })

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

interface HeatDitherGridCanvasProps {
  controls: BackgroundControls
  /** Vertical parallax offset 0..1 (e.g. scroll-based). Pattern shifts so background lags. */
  parallaxOffsetY?: number
  /** When set (0=hero, 1=scrolled), enables background fill and saturation transition. Uses controls.backgroundColor, heroSaturation, scrolledSaturation, saturationLerp when present. */
  transitionProgress?: number
}

const TOUCH_PEN_RADIUS_MULT = 2
const TOUCH_PEN_RADIUS_MULT_MOBILE = 2.5
const CLICK_PULSE_DURATION = 0.35
/** Reference viewport (e.g. design size). Grid scales with viewport to keep proportion. */
const REFERENCE_WIDTH = 1600
const REFERENCE_HEIGHT = 1270
const MOBILE_WIDTH_THRESHOLD = 600

const defaultLandingBackgroundColor = '#EEFD81'

export const HeatDitherGridCanvas: React.FC<HeatDitherGridCanvasProps> = ({
  controls,
  parallaxOffsetY = 0,
  transitionProgress,
}) => {
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 })
  const useBackgroundFill = transitionProgress !== undefined
  const backgroundColor = controls.backgroundColor ?? defaultLandingBackgroundColor
  const backgroundColorScrolled = controls.backgroundColorScrolled ?? '#FFFFFF'
  const heroSaturation = controls.heroSaturation ?? 1
  const scrolledSaturation = controls.scrolledSaturation ?? 0
  const saturationLerp = controls.saturationLerp ?? 0.08
  const saturationTarget = useBackgroundFill
    ? heroSaturation + (scrolledSaturation - heroSaturation) * Math.max(0, Math.min(1, transitionProgress ?? 0))
    : 1
  const scrollRef = useRef(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pointerTypeRef = useRef<string>('mouse')
  const pointerCursorRef = useRef<boolean>(false)
  const clickPulseRef = useRef<number>(0)

  // Track scroll position once for the whole route
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      if (max <= 0) {
        scrollRef.current = 0
      } else {
        scrollRef.current = window.scrollY / max
      }
    }

    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => window.removeEventListener('scroll', updateScroll)
  }, [])

  // Track pointer at window level so we keep position when cursor is over Leva, buttons, etc.
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      pointerTypeRef.current = e.pointerType
      const target = containerRef.current
      if (!target) return
      const rect = target.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      if (width <= 0 || height <= 0) return
      const x = (e.clientX - rect.left) / width
      const y = 1 - (e.clientY - rect.top) / height
      pointerRef.current = { x, y }

      // Detect CSS cursor: pointer by walking up from the event target
      let isPointerCursor = false
      let el = e.target as Element | null
      while (el) {
        const style = window.getComputedStyle(el)
        if (style.cursor === 'pointer') {
          isPointerCursor = true
          break
        }
        el = el.parentElement
      }
      pointerCursorRef.current = isPointerCursor
    }

    const handlePointerDown = (e: PointerEvent) => {
      // Only primary button / primary touch
      if (e.button !== 0 && e.button !== -1) return
      clickPulseRef.current = 1
    }

    const handlePointerLeave = () => {
      pointerRef.current = { x: 0.5, y: 0.5 }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    document.body.addEventListener('pointerleave', handlePointerLeave, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerdown', handlePointerDown)
      document.body.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full">
      <Canvas
        linear
        flat
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        dpr={[1, 2]}
        className="bg-transparent w-full h-full"
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping
          gl.setClearColor(0x000000, 0)
        }}
      >
        <FullscreenQuad
          controls={controls}
          pointerRef={pointerRef}
          scrollRef={scrollRef}
          pointerTypeRef={pointerTypeRef}
          pointerCursorRef={pointerCursorRef}
          clickPulseRef={clickPulseRef}
          parallaxOffsetY={parallaxOffsetY}
          useBackgroundFill={useBackgroundFill}
          backgroundColor={backgroundColor}
          backgroundColorScrolled={backgroundColorScrolled}
          saturationTarget={saturationTarget}
          saturationLerp={saturationLerp}
        />
      </Canvas>
    </div>
  )
}
