/**
 * Custom MapLibre WebGL layer for rendering grid tiles with physical size.
 *
 * Each tile is a square with:
 * - Fixed physical size in meters (from CMS / API)
 * - Solid fill with constant transparency (no opacity falloff)
 * - Thin light gray border
 * - Color from average problem_index (value 0-1) via COLOR_STOPS
 */

import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from 'maplibre-gl'

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

const COLOR_STOPS = [
  '#1a5f5f',
  '#1e3a5f',
  '#2e5a8a',
  '#4a90c2',
  '#87ceeb',
  '#fffacd',
  '#ffd700',
  '#ffb347',
  '#cd853f',
  '#8b4513',
]

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [0, 0, 0]
}

function valueToColor(value: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, value))
  const index = clamped * (COLOR_STOPS.length - 1)
  const lowerIndex = Math.floor(index)
  const upperIndex = Math.min(Math.ceil(index), COLOR_STOPS.length - 1)
  const t = index - lowerIndex
  if (lowerIndex === upperIndex) return hexToRgb(COLOR_STOPS[lowerIndex])
  const lo = hexToRgb(COLOR_STOPS[lowerIndex])
  const hi = hexToRgb(COLOR_STOPS[upperIndex])
  return [lo[0] * (1 - t) + hi[0] * t, lo[1] * (1 - t) + hi[1] * t, lo[2] * (1 - t) + hi[2] * t]
}

const EARTH_RADIUS = 6378137
const MAX_LAT = 85.05112878

function clampLat(lat: number): number {
  return Math.max(-MAX_LAT, Math.min(MAX_LAT, lat))
}

function mercatorToLngLat(x: number, y: number): { lng: number; lat: number } {
  const lng = (x / EARTH_RADIUS) * (180 / Math.PI)
  const lat = (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) * (180 / Math.PI)
  return { lng, lat: clampLat(lat) }
}

const vertexShaderSource = `
attribute vec2 a_pos;
varying vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
  v_texCoord = (a_pos + 1.0) * 0.5;
}
`

const fragmentShaderSource = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_tileMin;
uniform vec2 u_tileMax;
uniform float u_borderWidthPx;
uniform vec3 u_color;
uniform float u_opacity;
uniform vec3 u_borderColor;
varying vec2 v_texCoord;
void main() {
  vec2 coord = v_texCoord * u_resolution;
  if (coord.x < u_tileMin.x || coord.x > u_tileMax.x || coord.y < u_tileMin.y || coord.y > u_tileMax.y) discard;
  float distToEdge = min(
    min(coord.x - u_tileMin.x, u_tileMax.x - coord.x),
    min(coord.y - u_tileMin.y, u_tileMax.y - coord.y)
  );
  if (distToEdge < u_borderWidthPx)
    gl_FragColor = vec4(u_borderColor, 1.0);
  else
    gl_FragColor = vec4(u_color, u_opacity);
}
`

export interface GridTileLayerOptions {
  id: string
  data: GeoJSONFeatureCollection
  tileSizeMeters: number
  opacity?: number
  /** When true, draw a thick magenta outline at the tile limits (matches the colored square). Use ?debugTileBounds=1 in URL to enable. */
  debugBounds?: boolean
}

export class GridTileLayer implements CustomLayerInterface {
  id: string
  type = 'custom' as const
  renderingMode = '2d' as const

  private data: GeoJSONFeatureCollection
  private tileSizeMeters: number
  private opacity: number
  private debugBounds: boolean

  private gl: WebGLRenderingContext | null = null
  private map: MapLibreMap | null = null
  private program: WebGLProgram | null = null
  private quadBuffer: WebGLBuffer | null = null

  private uRes: WebGLUniformLocation | null = null
  private uTileMin: WebGLUniformLocation | null = null
  private uTileMax: WebGLUniformLocation | null = null
  private uBorderWidth: WebGLUniformLocation | null = null
  private uColor: WebGLUniformLocation | null = null
  private uOpacity: WebGLUniformLocation | null = null
  private uBorderColor: WebGLUniformLocation | null = null

  constructor(options: GridTileLayerOptions) {
    this.id = options.id
    this.data = options.data
    this.tileSizeMeters = options.tileSizeMeters
    this.opacity = options.opacity ?? 0.5
    this.debugBounds = options.debugBounds ?? false
  }

  onAdd(map: MapLibreMap, gl: WebGLRenderingContext): void {
    this.gl = gl
    this.map = map
    this.program = this.createProgram(gl, vertexShaderSource, fragmentShaderSource)

    this.uRes = gl.getUniformLocation(this.program!, 'u_resolution')
    this.uTileMin = gl.getUniformLocation(this.program!, 'u_tileMin')
    this.uTileMax = gl.getUniformLocation(this.program!, 'u_tileMax')
    this.uBorderWidth = gl.getUniformLocation(this.program!, 'u_borderWidthPx')
    this.uColor = gl.getUniformLocation(this.program!, 'u_color')
    this.uOpacity = gl.getUniformLocation(this.program!, 'u_opacity')
    this.uBorderColor = gl.getUniformLocation(this.program!, 'u_borderColor')

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    this.quadBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)
  }

  onRemove(_map: MapLibreMap, gl: WebGLRenderingContext): void {
    if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer)
    if (this.program) gl.deleteProgram(this.program)
  }

  prerender(_gl: WebGLRenderingContext, _o: CustomRenderMethodInput): void {}

  render(gl: WebGLRenderingContext, _o: CustomRenderMethodInput): void {
    if (!this.map || !this.program) return

    const canvas = gl.canvas as HTMLCanvasElement
    const w = canvas.width
    const h = canvas.height
    const ratio = w / (canvas.clientWidth || 1)
    if (w === 0 || h === 0) return

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(this.program)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer)
    const posLoc = gl.getAttribLocation(this.program!, 'a_pos')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    for (const f of this.data.features) {
      const props = f.properties as {
        value?: number
        tileSizeMeters?: number
        tileX?: number
        tileY?: number
      }
      const val = typeof props.value === 'number' ? props.value : 0
      const tileM =
        typeof props.tileSizeMeters === 'number' ? props.tileSizeMeters : this.tileSizeMeters
      const tileX = props.tileX ?? 0
      const tileY = props.tileY ?? 0

      const minX = tileX * tileM
      const minY = tileY * tileM
      const maxX = minX + tileM
      const maxY = minY + tileM

      const sw = mercatorToLngLat(minX, minY)
      const nw = mercatorToLngLat(minX, maxY)
      const ne = mercatorToLngLat(maxX, maxY)
      const se = mercatorToLngLat(maxX, minY)

      const pts = [sw, nw, ne, se].map((p) => this.map!.project([p.lng, p.lat]))
      const xs = pts.map((p) => p.x * ratio)
      const ys = pts.map((p) => h - p.y * ratio)

      const minPxX = Math.min(...xs)
      const maxPxX = Math.max(...xs)
      const minPxY = Math.min(...ys)
      const maxPxY = Math.max(...ys)

      if (maxPxX < 0 || minPxX > w || maxPxY < 0 || minPxY > h) continue

      const color = valueToColor(val)
      gl.uniform2f(this.uRes!, w, h)
      gl.uniform2f(this.uTileMin!, minPxX, minPxY)
      gl.uniform2f(this.uTileMax!, maxPxX, maxPxY)
      gl.uniform1f(this.uBorderWidth!, 1.0)
      gl.uniform3f(this.uColor!, color[0], color[1], color[2])
      gl.uniform1f(this.uOpacity!, this.opacity)
      gl.uniform3f(this.uBorderColor!, 0.88, 0.88, 0.88)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
  }

  private createProgram(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram {
    const v = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(v, vs)
    gl.compileShader(v)
    if (!gl.getShaderParameter(v, gl.COMPILE_STATUS))
      throw new Error(String(gl.getShaderInfoLog(v)))
    const f = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(f, fs)
    gl.compileShader(f)
    if (!gl.getShaderParameter(f, gl.COMPILE_STATUS))
      throw new Error(String(gl.getShaderInfoLog(f)))
    const p = gl.createProgram()!
    gl.attachShader(p, v)
    gl.attachShader(p, f)
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(String(gl.getProgramInfoLog(p)))
    gl.deleteShader(v)
    gl.deleteShader(f)
    return p
  }
}
