/**
 * Debug version of InfluenceDiskLayer that renders step-by-step to test WebGL rendering.
 * 
 * Stages:
 * 1. Basic colored squares (verify WebGL works)
 * 2. Circles with hard edges
 * 3. Circles with radial falloff
 * 4. Multiple overlapping circles
 * 5. Full implementation with weighted blending
 */

import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl'

// Bonn city center coordinates
const BONN_CENTER = {
  lat: 50.7374,
  lng: 7.0982,
}

// Color stops for testing
const COLOR_STOPS = [
  '#1a5f5f', // Dark Teal
  '#4a90c2', // Medium Blue
  '#87ceeb', // Pale Blue
  '#fffacd', // Pale Yellow
  '#ffd700', // Bright Yellow
  '#ffb347', // Light Orange
  '#cd853f', // Medium Orange
  '#8b4513', // Dark Brown
]

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [0, 0, 0]
}

// Convert meters to pixels at given latitude and zoom
function metersToPixels(meters: number, latitude: number, zoom: number): number {
  const R = 6378137
  const metersPerPixelAtEquator = (2 * Math.PI * R) / (256 * Math.pow(2, zoom))
  const metersPerPixel = metersPerPixelAtEquator / Math.cos((latitude * Math.PI) / 180)
  return meters / metersPerPixel
}

// Transform lng/lat to screen coordinates using map.project()
// This ensures coordinates are synchronized with the current render frame
// map.project() returns coordinates in CSS pixels (viewport coordinate system)
function projectToScreen(
  map: MapLibreMap,
  lng: number,
  lat: number,
  canvasDeviceHeight: number,
  pixelRatio: number,
): { x: number; y: number } {
  // map.project() returns screen coordinates where (0,0) is top-left in CSS pixels
  // WebGL uses (0,0) as bottom-left in device pixels, so we need to:
  // 1. Convert CSS pixels to device pixels (multiply by pixelRatio)
  // 2. Flip Y axis for WebGL coordinate system
  const point = map.project([lng, lat])
  const deviceX = point.x * pixelRatio
  const deviceY = canvasDeviceHeight - point.y * pixelRatio // Flip Y and convert to device pixels
  return {
    x: deviceX,
    y: deviceY,
  }
}

// Vertex shader for full-screen quad
const vertexShaderSource = `
attribute vec2 a_pos;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
  v_texCoord = (a_pos + 1.0) * 0.5;
}
`

// Fragment shader for basic colored square
const basicSquareFragmentShader = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_size;
uniform vec3 u_color;

varying vec2 v_texCoord;

void main() {
  vec2 coord = v_texCoord * u_resolution;
  vec2 delta = coord - u_center;
  
  // Simple square
  if (abs(delta.x) > u_size || abs(delta.y) > u_size) {
    discard;
  }
  
  gl_FragColor = vec4(u_color, 1.0);
}
`

// Fragment shader for circle with hard edge
const hardCircleFragmentShader = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_radius;
uniform vec3 u_color;

varying vec2 v_texCoord;

void main() {
  vec2 coord = v_texCoord * u_resolution;
  vec2 delta = coord - u_center;
  float dist = length(delta);
  
  if (dist > u_radius) {
    discard;
  }
  
  gl_FragColor = vec4(u_color, 1.0);
}
`

// Fragment shader for circle with radial falloff
const radialFalloffFragmentShader = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_radius;
uniform vec3 u_color;

varying vec2 v_texCoord;

void main() {
  vec2 coord = v_texCoord * u_resolution;
  vec2 delta = coord - u_center;
  float dist = length(delta);
  
  if (dist > u_radius) {
    discard;
  }
  
  // Radial falloff: 1.0 at center, 0.0 at rim
  float alpha = 1.0 - (dist / u_radius);
  
  // Use premultiplied alpha for proper blending over the map
  gl_FragColor = vec4(u_color * alpha, alpha);
}
`

export interface InfluenceDiskLayerDebugOptions {
  id: string
  stage?: number // 1-5: which debug stage to render
}

export class InfluenceDiskLayerDebug implements CustomLayerInterface {
  id: string
  type = 'custom' as const
  renderingMode = '2d' as const
  // Ensure layer renders on top
  beforeId?: string

  private stage: number
  private map: MapLibreMap | null = null
  private gl: WebGLRenderingContext | null = null

  // WebGL resources
  private basicSquareProgram: WebGLProgram | null = null
  private hardCircleProgram: WebGLProgram | null = null
  private radialFalloffProgram: WebGLProgram | null = null
  private quadBuffer: WebGLBuffer | null = null

  // Uniform locations
  private basicSquareResLoc: WebGLUniformLocation | null = null
  private basicSquareCenterLoc: WebGLUniformLocation | null = null
  private basicSquareSizeLoc: WebGLUniformLocation | null = null
  private basicSquareColorLoc: WebGLUniformLocation | null = null

  private hardCircleResLoc: WebGLUniformLocation | null = null
  private hardCircleCenterLoc: WebGLUniformLocation | null = null
  private hardCircleRadiusLoc: WebGLUniformLocation | null = null
  private hardCircleColorLoc: WebGLUniformLocation | null = null

  private radialFalloffResLoc: WebGLUniformLocation | null = null
  private radialFalloffCenterLoc: WebGLUniformLocation | null = null
  private radialFalloffRadiusLoc: WebGLUniformLocation | null = null
  private radialFalloffColorLoc: WebGLUniformLocation | null = null

  constructor(options: InfluenceDiskLayerDebugOptions) {
    this.id = options.id
    this.stage = options.stage ?? 3 // Default to radial falloff
  }

  onAdd(map: MapLibreMap, gl: WebGLRenderingContext): void {
    this.gl = gl
    this.map = map

    // Create shader programs
    try {
      this.basicSquareProgram = this.createProgram(gl, vertexShaderSource, basicSquareFragmentShader)
      this.hardCircleProgram = this.createProgram(gl, vertexShaderSource, hardCircleFragmentShader)
      this.radialFalloffProgram = this.createProgram(gl, vertexShaderSource, radialFalloffFragmentShader)
    } catch (error) {
      console.error('[InfluenceDiskLayerDebug] Error creating shaders:', error)
      throw error
    }

    // Get uniform locations
    this.basicSquareResLoc = gl.getUniformLocation(this.basicSquareProgram!, 'u_resolution')
    this.basicSquareCenterLoc = gl.getUniformLocation(this.basicSquareProgram!, 'u_center')
    this.basicSquareSizeLoc = gl.getUniformLocation(this.basicSquareProgram!, 'u_size')
    this.basicSquareColorLoc = gl.getUniformLocation(this.basicSquareProgram!, 'u_color')

    this.hardCircleResLoc = gl.getUniformLocation(this.hardCircleProgram!, 'u_resolution')
    this.hardCircleCenterLoc = gl.getUniformLocation(this.hardCircleProgram!, 'u_center')
    this.hardCircleRadiusLoc = gl.getUniformLocation(this.hardCircleProgram!, 'u_radius')
    this.hardCircleColorLoc = gl.getUniformLocation(this.hardCircleProgram!, 'u_color')

    this.radialFalloffResLoc = gl.getUniformLocation(this.radialFalloffProgram!, 'u_resolution')
    this.radialFalloffCenterLoc = gl.getUniformLocation(this.radialFalloffProgram!, 'u_center')
    this.radialFalloffRadiusLoc = gl.getUniformLocation(this.radialFalloffProgram!, 'u_radius')
    this.radialFalloffColorLoc = gl.getUniformLocation(this.radialFalloffProgram!, 'u_color')

    // Create full-screen quad
    const quadVertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    this.quadBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW)
  }

  onRemove(map: MapLibreMap, gl: WebGLRenderingContext): void {
    if (this.basicSquareProgram) gl.deleteProgram(this.basicSquareProgram)
    if (this.hardCircleProgram) gl.deleteProgram(this.hardCircleProgram)
    if (this.radialFalloffProgram) gl.deleteProgram(this.radialFalloffProgram)
    if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer)
  }

  prerender(_gl: WebGLRenderingContext, _options: CustomRenderMethodInput): void {
    // Not used
  }

  render(gl: WebGLRenderingContext, _options: CustomRenderMethodInput): void {
    if (!this.gl || !this.map) {
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

    const center = this.map.getCenter()
    const zoom = this.map.getZoom()
    const lat = center.lat

    // Set up quad
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer)

    // Enable blending - use premultiplied alpha for proper compositing over the map
    gl.enable(gl.BLEND)
    // SRC_ALPHA, ONE_MINUS_SRC_ALPHA is correct for rendering on top of the map
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.blendEquation(gl.FUNC_ADD)

    // Generate test points in a row near Bonn
    const testPoints: Array<{ lng: number; lat: number; color: [number, number, number]; value: number }> = []

    // Create 8 test points in a row (east-west) centered on Bonn
    const spacing = 0.02 // degrees longitude (roughly 1.4km at this latitude)
    const startLng = BONN_CENTER.lng - spacing * 3.5 // Center the row

    for (let i = 0; i < 8; i++) {
      const lng = startLng + i * spacing
      const color = hexToRgb(COLOR_STOPS[i % COLOR_STOPS.length])
      const value = i / 7 // 0 to 1
      testPoints.push({ lng, lat: BONN_CENTER.lat, color, value })
    }

    // Always render radial falloff (stage 3) for debug
    // Render based on stage (each stage replaces previous)
    if (this.stage === 1) {
      // Stage 1: Basic colored squares
      gl.useProgram(this.basicSquareProgram)
      const posLoc = gl.getAttribLocation(this.basicSquareProgram!, 'a_pos')
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      const sizePx = metersToPixels(2000, lat, zoom) // 2000m (2km) squares

      let renderedCount = 0
      for (let i = 0; i < testPoints.length; i++) {
        const point = testPoints[i]
        // Project to screen coordinates (synchronized with current render frame)
        const screen = projectToScreen(this.map, point.lng, point.lat, height, pixelRatio)

        // Check if in viewport
        if (screen.x < -sizePx || screen.x > width + sizePx || screen.y < -sizePx || screen.y > height + sizePx) {
          continue
        }

        renderedCount++

        gl.uniform2f(this.basicSquareResLoc!, width, height)
        gl.uniform2f(this.basicSquareCenterLoc!, screen.x, screen.y)
        gl.uniform1f(this.basicSquareSizeLoc!, sizePx)
        gl.uniform3f(this.basicSquareColorLoc!, point.color[0], point.color[1], point.color[2])

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
    } else if (this.stage === 2) {
      // Stage 2: Circles with hard edges
      gl.useProgram(this.hardCircleProgram)
      const posLoc = gl.getAttribLocation(this.hardCircleProgram!, 'a_pos')
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      const radiusPx = metersToPixels(3000, lat, zoom) // 3000m (3km) radius

      let renderedCount = 0
      for (let i = 0; i < testPoints.length; i++) {
        const point = testPoints[i]
        // Project to screen coordinates (synchronized with current render frame)
        const screen = projectToScreen(this.map, point.lng, point.lat, height, pixelRatio)

        // Check if in viewport
        if (screen.x < -radiusPx || screen.x > width + radiusPx || screen.y < -radiusPx || screen.y > height + radiusPx) {
          continue
        }

        renderedCount++

        gl.uniform2f(this.hardCircleResLoc!, width, height)
        gl.uniform2f(this.hardCircleCenterLoc!, screen.x, screen.y)
        gl.uniform1f(this.hardCircleRadiusLoc!, radiusPx)
        gl.uniform3f(this.hardCircleColorLoc!, point.color[0], point.color[1], point.color[2])

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
    } else {
      // Default: Stage 3 - Circles with radial falloff
      gl.useProgram(this.radialFalloffProgram)
      const posLoc = gl.getAttribLocation(this.radialFalloffProgram!, 'a_pos')
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      const radiusPx = metersToPixels(4000, lat, zoom) // 4000m (4km) radius

      // First, render a simple test circle at screen center to verify rendering works
      if (!(this as any)._testCircleRendered) {
        gl.uniform2f(this.radialFalloffResLoc!, width, height)
        gl.uniform2f(this.radialFalloffCenterLoc!, width / 2, height / 2)
        gl.uniform1f(this.radialFalloffRadiusLoc!, 100) // 100px radius
        gl.uniform3f(this.radialFalloffColorLoc!, 1.0, 0.0, 0.0) // Red
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        ;(this as any)._testCircleRendered = true
      }

      let renderedCount = 0
      let skippedCount = 0
      for (let i = 0; i < testPoints.length; i++) {
        const point = testPoints[i]
        // Project to screen coordinates (synchronized with current render frame)
        const screen = projectToScreen(this.map, point.lng, point.lat, height, pixelRatio)

        // Check if in viewport (with generous margin)
        if (screen.x < -radiusPx || screen.x > width + radiusPx || screen.y < -radiusPx || screen.y > height + radiusPx) {
          skippedCount++
          continue
        }

        renderedCount++

        gl.uniform2f(this.radialFalloffResLoc!, width, height)
        gl.uniform2f(this.radialFalloffCenterLoc!, screen.x, screen.y)
        gl.uniform1f(this.radialFalloffRadiusLoc!, radiusPx)
        gl.uniform3f(this.radialFalloffColorLoc!, point.color[0], point.color[1], point.color[2])

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
    }

    // Check for WebGL errors
    const glError = gl.getError()
    if (glError !== gl.NO_ERROR) {
      console.error('[InfluenceDiskLayerDebug] WebGL error:', glError)
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
      const error = `Failed to compile shader: ${info}`
      console.error('[InfluenceDiskLayerDebug]', error, '\nShader source:', source)
      throw new Error(error)
    }

    return shader
  }
}
