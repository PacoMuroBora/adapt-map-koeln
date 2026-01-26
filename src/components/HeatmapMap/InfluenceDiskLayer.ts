/**
 * Custom MapLibre WebGL layer for rendering influence disks with physical radius.
 * 
 * Each data point renders as a circle with:
 * - Fixed physical radius in meters (not pixels)
 * - Radial falloff (alpha = 0 at rim, hard cutoff)
 * - Weighted blending when circles overlap
 * - Color mapped from value (0-1) to color stops
 */

import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl'

// GeoJSON type definitions (minimal, for our use case)
type GeoJSONPosition = [number, number] | [number, number, number]

interface GeoJSONPoint {
  type: 'Point'
  coordinates: GeoJSONPosition
}

interface GeoJSONFeature<T = GeoJSONPoint> {
  type: 'Feature'
  geometry: T
  properties: Record<string, unknown>
}

interface GeoJSONFeatureCollection<T = GeoJSONPoint> {
  type: 'FeatureCollection'
  features: GeoJSONFeature<T>[]
}

// Color stops matching HeatIntensitySlider (0-9, 10 colors)
const COLOR_STOPS = [
  '#1a5f5f', // Dark Teal/Blue-Green
  '#1e3a5f', // Dark Blue
  '#2e5a8a', // Medium Blue
  '#4a90c2', // Lighter Blue
  '#87ceeb', // Pale Blue
  '#fffacd', // Pale Yellow
  '#ffd700', // Bright Yellow
  '#ffb347', // Light Orange/Peach
  '#cd853f', // Medium Orange/Reddish-Brown
  '#8b4513', // Dark Brown/Reddish-Brown
]

// Convert hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [0, 0, 0]
}

// Interpolate color from value (0-1) to color stops
function valueToColor(value: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, value))
  const index = clamped * (COLOR_STOPS.length - 1)
  const lowerIndex = Math.floor(index)
  const upperIndex = Math.min(Math.ceil(index), COLOR_STOPS.length - 1)
  const t = index - lowerIndex

  if (lowerIndex === upperIndex) {
    return hexToRgb(COLOR_STOPS[lowerIndex])
  }

  const lowerColor = hexToRgb(COLOR_STOPS[lowerIndex])
  const upperColor = hexToRgb(COLOR_STOPS[upperIndex])

  return [
    lowerColor[0] * (1 - t) + upperColor[0] * t,
    lowerColor[1] * (1 - t) + upperColor[1] * t,
    lowerColor[2] * (1 - t) + upperColor[2] * t,
  ]
}

// Convert meters to pixels at given latitude and zoom
function metersToPixels(meters: number, latitude: number, zoom: number): number {
  // Earth's radius in meters
  const R = 6378137
  // Meters per pixel at equator
  const metersPerPixelAtEquator = (2 * Math.PI * R) / (256 * Math.pow(2, zoom))
  // Adjust for latitude (Mercator projection)
  const metersPerPixel = metersPerPixelAtEquator / Math.cos((latitude * Math.PI) / 180)
  return meters / metersPerPixel
}

// Vertex shader: renders a full-screen quad for the accumulation pass
const vertexShaderSource = `
attribute vec2 a_pos;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
  v_texCoord = (a_pos + 1.0) * 0.5;
}
`

// Fragment shader for accumulation pass: accumulates color*weight and weight
const accumulationFragmentShaderSource = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_radius;
uniform vec3 u_color;
uniform float u_weight;
uniform float u_minAlpha; // Minimum alpha at center (0.0-1.0)

varying vec2 v_texCoord;

void main() {
  vec2 coord = v_texCoord * u_resolution;
  vec2 delta = coord - u_center;
  float dist = length(delta);
  
  // Hard cutoff at radius
  if (dist > u_radius) {
    discard;
  }
  
  // Radial falloff: linear from center to rim
  // At center (dist=0): alpha = 0.7-0.8 (high but not fully opaque, map visible)
  // At rim (dist=radius): alpha = 0.0 (fully transparent)
  // This ensures the map is always visible even at the center
  float falloff = 1.0 - (dist / u_radius);
  // Use minAlpha as the maximum alpha at center (0.7-0.8), fade to 0 at rim
  // This gives good visibility while keeping map visible
  float maxAlpha = u_minAlpha;
  float alpha = maxAlpha * falloff;
  
  // Accumulate: color * weight * alpha (RGB), and weight * alpha (A)
  // This allows weighted color blending when circles overlap
  // Note: weight modulates the alpha, so low weights make circles more transparent
  gl_FragColor = vec4(u_color * u_weight * alpha, u_weight * alpha);
}
`

// Fragment shader for final pass: computes weighted average color
const finalFragmentShaderSource = `
precision highp float;

uniform sampler2D u_accumulationTexture;
uniform float u_opacity;

varying vec2 v_texCoord;

void main() {
  vec4 accum = texture2D(u_accumulationTexture, v_texCoord);
  
  // accum.rgb = sum(color * weight * alpha)
  // accum.a = sum(weight * alpha)
  
  // Discard pixels with no data (use higher threshold to avoid floating point precision issues)
  if (accum.a < 0.01) {
    discard; // No data here - fully transparent, don't affect map
  }
  
  // Weighted average color: divide accumulated color by accumulated weight
  vec3 finalColor = accum.rgb / max(accum.a, 0.001);
  
  // Final alpha: boost accumulated weight to ensure visibility
  // For single circles with low weight, multiply by factor to make them visible
  // Clamp to reasonable range and apply layer opacity
  float boostedAlpha = accum.a * 3.0; // Boost low values (e.g., 0.2 weight * 0.75 alpha = 0.15, boosted to 0.45)
  float finalAlpha = min(boostedAlpha, 1.0) * u_opacity;
  
  gl_FragColor = vec4(finalColor, finalAlpha);
}
`

export interface InfluenceDiskLayerOptions {
  id: string
  data: GeoJSONFeatureCollection<GeoJSONPoint>
  radiusMeters?: number // Default radius in meters
  opacity?: number // Overall layer opacity
  minAlpha?: number // Minimum alpha at center (0.0-1.0), default 0.3
}

export class InfluenceDiskLayer implements CustomLayerInterface {
  id: string
  type = 'custom' as const
  renderingMode = '2d' as const

  private data: GeoJSONFeatureCollection<GeoJSONPoint>
  private radiusMeters: number
  private opacity: number
  private minAlpha: number

  // WebGL resources
  private gl: WebGLRenderingContext | null = null
  private map: MapLibreMap | null = null
  private accumulationProgram: WebGLProgram | null = null
  private finalProgram: WebGLProgram | null = null
  private accumulationFramebuffer: WebGLFramebuffer | null = null
  private accumulationTexture: WebGLTexture | null = null
  private quadBuffer: WebGLBuffer | null = null
  private textureWidth: number = 0
  private textureHeight: number = 0

  // Uniform locations
  private accResLoc: WebGLUniformLocation | null = null
  private accCenterLoc: WebGLUniformLocation | null = null
  private accRadiusLoc: WebGLUniformLocation | null = null
  private accColorLoc: WebGLUniformLocation | null = null
  private accWeightLoc: WebGLUniformLocation | null = null
  private accMinAlphaLoc: WebGLUniformLocation | null = null
  private finalTexLoc: WebGLUniformLocation | null = null
  private finalOpacityLoc: WebGLUniformLocation | null = null

  constructor(options: InfluenceDiskLayerOptions) {
    this.id = options.id
    this.data = options.data
    this.radiusMeters = options.radiusMeters ?? 5000 // Default 5000m (5km) radius
    this.opacity = options.opacity ?? 0.8
    this.minAlpha = options.minAlpha ?? 0.75 // Default 0.75 (75% max opacity at center, map always visible)
  }

  onAdd(map: MapLibreMap, gl: WebGLRenderingContext): void {
    this.gl = gl
    this.map = map

    // Create shader programs
    try {
      this.accumulationProgram = this.createProgram(gl, vertexShaderSource, accumulationFragmentShaderSource)
      this.finalProgram = this.createProgram(gl, vertexShaderSource, finalFragmentShaderSource)
    } catch (error) {
      console.error('[InfluenceDiskLayer] Error creating shaders:', error)
      throw error
    }

    // Get uniform locations for accumulation pass
    this.accResLoc = gl.getUniformLocation(this.accumulationProgram!, 'u_resolution')
    this.accCenterLoc = gl.getUniformLocation(this.accumulationProgram!, 'u_center')
    this.accRadiusLoc = gl.getUniformLocation(this.accumulationProgram!, 'u_radius')
    this.accColorLoc = gl.getUniformLocation(this.accumulationProgram!, 'u_color')
    this.accWeightLoc = gl.getUniformLocation(this.accumulationProgram!, 'u_weight')
    this.accMinAlphaLoc = gl.getUniformLocation(this.accumulationProgram!, 'u_minAlpha')

    // Get uniform locations for final pass
    this.finalTexLoc = gl.getUniformLocation(this.finalProgram!, 'u_accumulationTexture')
    this.finalOpacityLoc = gl.getUniformLocation(this.finalProgram!, 'u_opacity')

    // Create full-screen quad
    const quadVertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    this.quadBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW)
  }

  onRemove(map: MapLibreMap, gl: WebGLRenderingContext): void {
    // Cleanup WebGL resources
    if (this.accumulationFramebuffer) gl.deleteFramebuffer(this.accumulationFramebuffer)
    if (this.accumulationTexture) gl.deleteTexture(this.accumulationTexture)
    if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer)
    if (this.accumulationProgram) gl.deleteProgram(this.accumulationProgram)
    if (this.finalProgram) gl.deleteProgram(this.finalProgram)
  }

  prerender(_gl: WebGLRenderingContext, _options: CustomRenderMethodInput): void {
    // Not used
  }

  render(gl: WebGLRenderingContext, _options: CustomRenderMethodInput): void {
    if (!this.gl || !this.accumulationProgram || !this.finalProgram || !this.map) {
      return
    }

    const canvas = gl.canvas as HTMLCanvasElement
    // Canvas width/height are in device pixels (for WebGL rendering)
    const width = canvas.width
    const height = canvas.height
    // Client dimensions are in CSS pixels (what map.project() uses)
    const clientWidth = canvas.clientWidth
    const clientHeight = canvas.clientHeight
    // Device pixel ratio
    const pixelRatio = width / clientWidth

    // Ensure we have valid dimensions
    if (width === 0 || height === 0) {
      return
    }

    // Get current view state
    const center = this.map.getCenter()
    const zoom = this.map.getZoom()
    const lat = center.lat

    // Convert radius from meters to pixels
    const radiusPx = metersToPixels(this.radiusMeters, lat, zoom)

    // Create or resize accumulation framebuffer
    if (!this.accumulationFramebuffer || !this.accumulationTexture) {
      this.accumulationFramebuffer = gl.createFramebuffer()
      this.accumulationTexture = gl.createTexture()

      gl.bindTexture(gl.TEXTURE_2D, this.accumulationTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.accumulationFramebuffer)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.accumulationTexture, 0)

      // Clear the framebuffer to ensure it starts with transparent black
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      this.textureWidth = width
      this.textureHeight = height
    } else if (this.textureWidth !== width || this.textureHeight !== height) {
      // Resize texture if canvas size changed
      gl.bindTexture(gl.TEXTURE_2D, this.accumulationTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      
      // Clear the resized framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.accumulationFramebuffer)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      
      this.textureWidth = width
      this.textureHeight = height
    }

    // ACCUMULATION PASS: Render each point to accumulation buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.accumulationFramebuffer)
    gl.viewport(0, 0, width, height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // Enable additive blending for accumulation
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    gl.blendEquation(gl.FUNC_ADD)

    gl.useProgram(this.accumulationProgram)

    // Set up quad
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer)
    const posLoc = gl.getAttribLocation(this.accumulationProgram, 'a_pos')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    // Render each feature
    let renderedCount = 0
    for (const feature of this.data.features) {
      const [lng, lat] = feature.geometry.coordinates
      const props = feature.properties as { value: number; weight: number }

      // Project lat/lng to screen coordinates
      // map.project() returns coordinates in CSS pixels where (0,0) is top-left
      // WebGL uses device pixels where (0,0) is bottom-left
      // So we need to: 1) convert CSS to device pixels, 2) flip Y axis
      const point = this.map.project([lng, lat])
      const screenX = point.x * pixelRatio // Convert CSS pixels to device pixels
      const screenY = height - point.y * pixelRatio // Flip Y and convert to device pixels

      // Skip if outside viewport (with margin for radius)
      if (
        screenX < -radiusPx ||
        screenX > width + radiusPx ||
        screenY < -radiusPx ||
        screenY > height + radiusPx
      ) {
        continue
      }

      renderedCount++

      // Convert value to color
      const color = valueToColor(props.value)

      // Set uniforms
      gl.uniform2f(this.accResLoc!, width, height)
      gl.uniform2f(this.accCenterLoc!, screenX, screenY)
      gl.uniform1f(this.accRadiusLoc!, radiusPx)
      gl.uniform3f(this.accColorLoc!, color[0], color[1], color[2])
      gl.uniform1f(this.accWeightLoc!, props.weight)
      gl.uniform1f(this.accMinAlphaLoc!, this.minAlpha)

      // Draw quad (will be clipped by fragment shader)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    // FINAL PASS: Render accumulation texture to screen with color mapping
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, width, height)

    // Change blend mode for final pass
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    gl.useProgram(this.finalProgram)

    // Set up quad
    const finalPosLoc = gl.getAttribLocation(this.finalProgram, 'a_pos')
    gl.enableVertexAttribArray(finalPosLoc)
    gl.vertexAttribPointer(finalPosLoc, 2, gl.FLOAT, false, 0, 0)

    // Bind accumulation texture
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.accumulationTexture)
    gl.uniform1i(this.finalTexLoc!, 0)
    gl.uniform1f(this.finalOpacityLoc!, this.opacity)

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // Check for WebGL errors
    const glError = gl.getError()
    if (glError !== gl.NO_ERROR) {
      console.error('[InfluenceDiskLayer] WebGL error after render:', glError)
    }

    // Don't disable blend - MapLibre manages its own WebGL state
    // Custom layers should not modify global WebGL state that MapLibre depends on
  }

  private createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
    const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)

    const program = gl.createProgram()
    if (!program) throw new Error('Failed to create WebGL program')

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program)
      gl.deleteProgram(program)
      throw new Error(`Failed to link shader program: ${info}`)
    }

    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    return program
  }

  private compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)
    if (!shader) throw new Error('Failed to create shader')

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader)
      gl.deleteShader(shader)
      throw new Error(`Failed to compile shader: ${info}`)
    }

    return shader
  }
}
