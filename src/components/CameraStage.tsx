import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import type { CameraStatus } from '../camera/useCamera'
import type { FrequencyPeak, TrackingAnchors, TrackingStatus } from '../types'

type CameraStageProps = {
  anchors: TrackingAnchors
  bars: number[]
  bpm?: number
  cameraStatus: CameraStatus
  chakraColor?: string
  chakraName?: string
  dominantFrequency?: number | null
  frequencyPeaks?: FrequencyPeak[]
  heartbeatPulse?: boolean
  isPlaying: boolean
  liveEnergy: number
  personDetected: boolean
  trackingStatus: TrackingStatus
  videoRef: RefObject<HTMLVideoElement | null>
}

type AuraAnchor = {
  anchor: keyof TrackingAnchors
  radius: number
  color: string
}

// Aurora palette — teal base, light tip, violet on beat peak
const auroraPalette = ['#2BE6C8', '#B8FFF3', '#B53DFF', '#FFE56D', '#32C4E3']
const auraGlows = ['#2BE6C8', '#B8FFF3', '#B53DFF', '#FFB347']

// Chakra frequency → color lookup (solfeggio scale)
const CHAKRA_COLORS: Record<string, { line: string; glow: string; fill: string }> = {
  '396': { line: '#CC2200', glow: '#FF4422', fill: 'rgba(204,34,0,0.08)' },
  '417': { line: '#E8660A', glow: '#FF8833', fill: 'rgba(232,102,10,0.08)' },
  '528': { line: '#F2C200', glow: '#FFE040', fill: 'rgba(242,194,0,0.08)' },
  '639': { line: '#27A83A', glow: '#44DD55', fill: 'rgba(39,168,58,0.08)' },
  '741': { line: '#1A7CC9', glow: '#44AAFF', fill: 'rgba(26,124,201,0.08)' },
  '852': { line: '#6644CC', glow: '#9966FF', fill: 'rgba(102,68,204,0.08)' },
  '963': { line: '#AA44CC', glow: '#DD88FF', fill: 'rgba(170,68,204,0.08)' },
}
const DEFAULT_CHAKRA = { line: '#C8933A', glow: '#E8B855', fill: 'rgba(200,147,58,0.08)' }

// Beat pulse — two-phase attack/decay
const ATTACK_MS = 80
const DECAY_MS = 400

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function getBeatOpacity(beatAgeMs: number): number {
  if (beatAgeMs < ATTACK_MS) {
    return (beatAgeMs / ATTACK_MS) * 0.75
  }
  return 0.75 * Math.exp(-(beatAgeMs - ATTACK_MS) / DECAY_MS)
}

// BPM → aura color
function getBpmColor(bpm: number): string {
  if (bpm >= 85) return '#FF6B35'  // active — orange
  if (bpm >= 72) return '#FFB347'  // neutral — amber
  if (bpm >= 62) return '#32C4E3'  // relaxed — cyan
  return '#9B59B6'                  // meditative — violet
}

// One Euro filter — adaptive low-pass that kills jitter when still and lag when
// moving. Smooths jittery pose landmarks so the aura glides instead of snapping.
class OneEuroFilter {
  private xPrev: number | null = null
  private dxPrev = 0
  private tPrev = 0
  private minCutoff: number
  private beta: number
  private dCutoff: number

  constructor(minCutoff = 1.1, beta = 0.018, dCutoff = 1) {
    this.minCutoff = minCutoff
    this.beta = beta
    this.dCutoff = dCutoff
  }

  private alpha(cutoff: number, dt: number) {
    const tau = 1 / (2 * Math.PI * cutoff)
    return 1 / (1 + tau / dt)
  }

  reset() {
    this.xPrev = null
    this.dxPrev = 0
  }

  filter(x: number, tSec: number): number {
    if (this.xPrev === null) {
      this.xPrev = x
      this.tPrev = tSec
      return x
    }
    const dt = Math.max(1 / 120, tSec - this.tPrev)
    const dx = (x - this.xPrev) / dt
    const aD = this.alpha(this.dCutoff, dt)
    const dxHat = aD * dx + (1 - aD) * this.dxPrev
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat)
    const a = this.alpha(cutoff, dt)
    const xHat = a * x + (1 - a) * this.xPrev
    this.xPrev = xHat
    this.dxPrev = dxHat
    this.tPrev = tSec
    return xHat
  }
}

type AnchorFilter = { x: OneEuroFilter; y: OneEuroFilter }
const ANCHOR_NAMES: Array<keyof TrackingAnchors> = ['head', 'leftShoulder', 'rightShoulder', 'leftWrist', 'rightWrist', 'torso']

const getAnchorPoint = (anchors: TrackingAnchors, name: keyof TrackingAnchors, width: number, height: number) => {
  const anchor = anchors[name] ?? anchors.torso ?? anchors.head
  return {
    x: (anchor?.x ?? 0.5) * width,
    y: (anchor?.y ?? 0.48) * height,
  }
}

const colorWithAlpha = (color: string, alpha: number) => {
  const normalized = color.replace('#', '')
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function parseCssColor(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ]
}

function drawFallbackFigure(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = '#06060C'
  context.fillRect(0, 0, width, height)

  const gradient = context.createRadialGradient(width * 0.5, height * 0.42, 20, width * 0.5, height * 0.5, height * 0.45)
  gradient.addColorStop(0, 'rgba(43,230,200,0.12)')
  gradient.addColorStop(0.35, 'rgba(30,20,50,0.58)')
  gradient.addColorStop(1, 'rgba(6,6,12,0.92)')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  context.fillStyle = 'rgba(6, 6, 12, 0.72)'
  context.beginPath()
  context.ellipse(width * 0.5, height * 0.43, width * 0.09, height * 0.14, 0, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.ellipse(width * 0.5, height * 0.75, width * 0.23, height * 0.32, 0, 0, Math.PI * 2)
  context.fill()
}

function drawAuroraCurtain(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  energy: number,
  beatOpacity: number,
  reduceMotion: boolean,
) {
  const motion = reduceMotion ? 0 : time * 0.00042
  const intensity = 0.4 + energy * 0.85

  context.save()
  // Additive blending gives soft, luminous ribbons without a per-frame blur pass.
  context.globalCompositeOperation = 'screen'

  const beatTint = Math.min(1, beatOpacity / 0.75)
  const ribbonColors = [
    beatTint > 0.5 ? '#B53DFF' : '#2BE6C8',
    '#B8FFF3',
    beatTint > 0.3 ? '#B53DFF' : '#32C4E3',
    '#FFE56D',
  ]

  for (let ribbon = 0; ribbon < 4; ribbon += 1) {
    const baseY = height * (0.16 + ribbon * 0.17)
    const amplitude = height * (0.1 + energy * 0.12 + ribbon * 0.012)
    const depth = height * (0.14 + ribbon * 0.04)
    const phase = motion * (1 + ribbon * 0.22) + ribbon * 1.7
    const gradient = context.createLinearGradient(width * 0.08, baseY - depth, width * 0.94, baseY + depth)

    gradient.addColorStop(0, colorWithAlpha(ribbonColors[ribbon % ribbonColors.length], 0))
    gradient.addColorStop(0.16, colorWithAlpha(ribbonColors[ribbon % ribbonColors.length], 0.2 * intensity))
    gradient.addColorStop(0.44, colorWithAlpha(auroraPalette[(ribbon + 1) % auroraPalette.length], 0.4 * intensity))
    gradient.addColorStop(0.72, colorWithAlpha(auroraPalette[(ribbon + 2) % auroraPalette.length], 0.3 * intensity))
    gradient.addColorStop(1, colorWithAlpha(auroraPalette[(ribbon + 3) % auroraPalette.length], 0))

    context.fillStyle = gradient
    context.beginPath()
    context.moveTo(-width * 0.08, baseY + Math.sin(phase) * amplitude)
    context.bezierCurveTo(
      width * 0.18,
      baseY - amplitude * (1.2 + Math.sin(phase + 0.8) * 0.35),
      width * 0.38,
      baseY + amplitude * (0.65 + Math.cos(phase + 0.4) * 0.3),
      width * 0.58,
      baseY - amplitude * (0.9 + Math.sin(phase + 1.4) * 0.35),
    )
    context.bezierCurveTo(
      width * 0.76,
      baseY - amplitude * (1.05 + Math.cos(phase + 0.7) * 0.25),
      width * 0.92,
      baseY + amplitude * (0.8 + Math.sin(phase + 2.4) * 0.4),
      width * 1.08,
      baseY - Math.cos(phase) * amplitude,
    )
    context.lineTo(width * 1.08, baseY + depth + amplitude)
    context.bezierCurveTo(
      width * 0.78,
      baseY + depth + amplitude * 1.4,
      width * 0.36,
      baseY + depth + amplitude * 0.5,
      -width * 0.08,
      baseY + depth + amplitude,
    )
    context.closePath()
    context.fill()
  }

  context.restore()
}

function drawBodyAura(
  context: CanvasRenderingContext2D,
  getPoint: (name: keyof TrackingAnchors) => { x: number; y: number },
  width: number,
  height: number,
  time: number,
  energy: number,
  bpmColor: string,
  beatOpacity: number,
  presence: number,
  reduceMotion: boolean,
  auraAnchors: AuraAnchor[],
) {
  const motion = reduceMotion ? 0 : time * 0.001
  const torso = getPoint('torso')

  // Ambient halo behind the body — broad, soft, BPM-tinted.
  context.save()
  context.globalCompositeOperation = 'screen'
  const [br, bg, bb] = parseCssColor(bpmColor)
  const haloR = Math.max(width, height) * (0.32 + energy * 0.14)
  const halo = context.createRadialGradient(torso.x, torso.y, 12, torso.x, torso.y, haloR)
  halo.addColorStop(0, `rgba(${br}, ${bg}, ${bb}, ${(0.1 + energy * 0.12) * presence})`)
  halo.addColorStop(0.4, `rgba(43, 230, 200, ${(0.07 + energy * 0.07) * presence})`)
  halo.addColorStop(0.72, `rgba(181, 61, 255, ${(0.06 + energy * 0.07) * presence})`)
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
  context.fillStyle = halo
  context.fillRect(0, 0, width, height)
  context.restore()

  // Per-anchor glows, additively blended so overlaps intensify into one vibrant body aura.
  context.save()
  context.globalCompositeOperation = 'lighter'
  auraAnchors.forEach((aura, index) => {
    const color = index === 0 ? bpmColor : aura.color
    const point = getPoint(aura.anchor)
    const breathe = reduceMotion ? 1 : 1 + Math.sin(motion * 1.1 + index * 0.7) * 0.09
    const beat = 1 + beatOpacity * 0.55
    const radius = aura.radius * (0.72 + energy * 0.95) * breathe * beat
    const driftX = reduceMotion ? 0 : Math.sin(motion * (0.72 + index * 0.08) + index) * (8 + energy * 18)
    const driftY = reduceMotion ? 0 : Math.cos(motion * (0.64 + index * 0.1) + index * 1.4) * (6 + energy * 14)
    const cx = point.x + driftX
    const cy = point.y + driftY
    const glow = context.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius)

    glow.addColorStop(0, colorWithAlpha(color, (0.18 + energy * 0.16) * presence))
    glow.addColorStop(0.34, colorWithAlpha(color, (0.11 + energy * 0.1) * presence))
    glow.addColorStop(0.7, colorWithAlpha(color, 0.03 * presence))
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')

    context.fillStyle = glow
    context.beginPath()
    context.ellipse(cx, cy, radius * (1.05 + index * 0.12), radius * (0.66 + index * 0.07), Math.sin(motion + index) * 0.34, 0, Math.PI * 2)
    context.fill()
  })
  context.restore()
}

function getChakraColors(chakraColor: string): { line: string; glow: string; fill: string } {
  for (const [freq, colors] of Object.entries(CHAKRA_COLORS)) {
    if (chakraColor === freq || chakraColor === colors.line) {
      return colors
    }
  }
  if (/^#[0-9a-fA-F]{6}$/.test(chakraColor)) {
    return { line: chakraColor, glow: chakraColor, fill: `${chakraColor}14` }
  }
  return DEFAULT_CHAKRA
}

function drawCymaticsPattern(
  context: CanvasRenderingContext2D,
  offscreen: HTMLCanvasElement,
  bars: number[],
  frequencyPeaks: FrequencyPeak[],
  chakraColor: string,
  cssWidth: number,
  cssHeight: number,
) {
  const res = offscreen.width
  const ctx = offscreen.getContext('2d')
  if (!ctx || typeof ctx.createImageData !== 'function') return

  const chakraColors = getChakraColors(chakraColor)
  const [cr, cg, cb] = parseCssColor(chakraColors.line)

  const peaks =
    frequencyPeaks.length > 0
      ? frequencyPeaks
      : bars.map((magnitude, index) => ({
          frequency: (index + 1) * 80,
          magnitude,
        }))
  const topPeaks = peaks
    .filter((peak) => peak.magnitude > 0.04 && peak.frequency > 0)
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 8)
  const totalMagnitude = topPeaks.reduce((sum, peak) => sum + peak.magnitude, 0) || 1
  const imageData = ctx.createImageData(res, res)
  const data = imageData.data

  for (const peak of topPeaks) {
    const weight = peak.magnitude / totalMagnitude
    const k = Math.max(0.8, Math.min(28, peak.frequency / 80))
    const sinX = new Float32Array(res)
    const sinY = new Float32Array(res)
    for (let p = 0; p < res; p += 1) {
      const coord = (p / res) * 2 - 1
      sinX[p] = Math.sin(k * coord)
      sinY[p] = Math.sin(k * coord)
    }
    for (let row = 0; row < res; row += 1) {
      for (let col = 0; col < res; col += 1) {
        const px = (row * res + col) * 4
        const contribution = Math.abs(sinX[col] * sinY[row]) * weight
        data[px] = Math.min(255, data[px] + cr * contribution)
        data[px + 1] = Math.min(255, data[px + 1] + cg * contribution)
        data[px + 2] = Math.min(255, data[px + 2] + cb * contribution)
        data[px + 3] = Math.min(255, data[px + 3] + contribution * 200)
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)

  context.save()
  context.globalCompositeOperation = 'screen'
  context.globalAlpha = 0.34
  context.imageSmoothingEnabled = true
  context.drawImage(offscreen, 0, 0, cssWidth, cssHeight)
  context.restore()
}

function drawWhiteVisualField(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  energy: number,
  beatOpacity: number,
  reduceMotion: boolean,
) {
  const motion = reduceMotion ? 0 : time * 0.0007
  const rows = 18
  const cols = 24

  context.save()
  context.globalCompositeOperation = 'screen'
  context.strokeStyle = `rgba(245, 248, 255, ${0.05 + energy * 0.11 + beatOpacity * 0.08})`
  context.lineWidth = 1
  context.shadowColor = `rgba(190, 210, 255, ${0.22 + energy * 0.28})`
  context.shadowBlur = 14

  for (let row = 0; row < rows; row += 1) {
    context.beginPath()
    for (let col = 0; col <= cols; col += 1) {
      const x = (col / cols) * width
      const yBase = (row / Math.max(1, rows - 1)) * height
      const ripple =
        Math.sin(col * 0.55 + row * 0.38 + motion * 2.1) * (10 + energy * 28) +
        Math.cos(col * 0.21 - row * 0.72 + motion * 1.3) * (5 + beatOpacity * 20)
      const y = yBase + ripple
      if (col === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.stroke()
  }

  context.restore()
}

function drawAudioBloomParticles(
  context: CanvasRenderingContext2D,
  center: { x: number; y: number },
  width: number,
  height: number,
  time: number,
  bars: number[],
  frequencyPeaks: FrequencyPeak[],
  chakraColor: string,
  energy: number,
  beatOpacity: number,
  presence: number,
  reduceMotion: boolean,
) {
  const particleCount = 96
  const motion = reduceMotion ? 0 : time * 0.001
  const chakra = getChakraColors(chakraColor)
  const radiusBase = Math.min(width, height) * (0.12 + energy * 0.28 + beatOpacity * 0.08)

  context.save()
  context.globalCompositeOperation = 'lighter'

  for (let index = 0; index < particleCount; index += 1) {
    const peak = frequencyPeaks[index % Math.max(1, frequencyPeaks.length)]
    const bar = bars[index % Math.max(1, bars.length)] ?? 0.1
    const magnitude = peak?.magnitude ?? bar
    const frequencyPhase = peak ? peak.frequency * 0.004 : index * 0.31
    const angle = index * 2.39996 + motion * (0.35 + magnitude * 0.9) + frequencyPhase
    const orbit =
      radiusBase *
      (0.35 + ((index * 37) % 100) / 110 + magnitude * 1.2 + Math.sin(motion * 1.4 + index) * 0.08)
    const x = center.x + Math.cos(angle) * orbit * (1.05 + Math.sin(index) * 0.12)
    const y = center.y + Math.sin(angle * 0.93) * orbit * 0.74
    const size = 1.4 + magnitude * 8 + beatOpacity * 4
    const alpha = presence * (0.14 + magnitude * 0.46 + beatOpacity * 0.2)

    const glow = context.createRadialGradient(x, y, 0, x, y, size * 6)
    glow.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.9, alpha)})`)
    glow.addColorStop(0.34, colorWithAlpha(chakra.glow, Math.min(0.42, alpha * 0.55)))
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    context.fillStyle = glow
    context.beginPath()
    context.arc(x, y, size * 6, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha + 0.18)})`
    context.beginPath()
    context.arc(x, y, Math.max(1.1, size * 0.36), 0, Math.PI * 2)
    context.fill()
  }

  context.restore()
}

function drawTrackingNodes(
  context: CanvasRenderingContext2D,
  getPoint: (name: keyof TrackingAnchors) => { x: number; y: number },
  anchors: TrackingAnchors,
  energy: number,
  beatOpacity: number,
  presence: number,
) {
  const nodeNames: Array<keyof TrackingAnchors> = ['leftWrist', 'rightWrist', 'leftShoulder', 'rightShoulder', 'head']
  const lines: Array<[keyof TrackingAnchors, keyof TrackingAnchors]> = [
    ['leftShoulder', 'leftWrist'],
    ['rightShoulder', 'rightWrist'],
    ['leftShoulder', 'rightShoulder'],
    ['head', 'leftShoulder'],
    ['head', 'rightShoulder'],
  ]

  context.save()
  context.globalCompositeOperation = 'screen'
  context.lineWidth = 1.2
  context.strokeStyle = `rgba(255, 255, 255, ${presence * (0.16 + energy * 0.22)})`
  context.shadowColor = `rgba(185, 205, 255, ${presence * 0.8})`
  context.shadowBlur = 14

  for (const [from, to] of lines) {
    if (!anchors[from] || !anchors[to]) continue
    const start = getPoint(from)
    const end = getPoint(to)
    context.beginPath()
    context.moveTo(start.x, start.y)
    context.lineTo(end.x, end.y)
    context.stroke()
  }

  for (const name of nodeNames) {
    if (!anchors[name]) continue
    const point = getPoint(name)
    const isWrist = name === 'leftWrist' || name === 'rightWrist'
    const radius = isWrist ? 8 + energy * 18 + beatOpacity * 10 : 4 + energy * 8
    const ringRadius = radius * (isWrist ? 2.8 : 2)

    context.strokeStyle = `rgba(255, 255, 255, ${presence * (isWrist ? 0.72 : 0.42)})`
    context.lineWidth = isWrist ? 1.8 : 1.1
    context.beginPath()
    context.arc(point.x, point.y, ringRadius, 0, Math.PI * 2)
    context.stroke()

    const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, ringRadius * 1.8)
    glow.addColorStop(0, `rgba(255, 255, 255, ${presence * 0.8})`)
    glow.addColorStop(0.42, `rgba(185, 205, 255, ${presence * 0.28})`)
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    context.fillStyle = glow
    context.beginPath()
    context.arc(point.x, point.y, ringRadius * 1.8, 0, Math.PI * 2)
    context.fill()
  }

  context.shadowBlur = 0
  context.restore()
}

export function CameraStage(props: CameraStageProps) {
  const { cameraStatus, chakraName, dominantFrequency, isPlaying, personDetected, trackingStatus, heartbeatPulse, videoRef } = props
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const lastBeatTimeRef = useRef(0)

  // Latest-ref pattern: the rAF loop reads volatile props from this ref so it
  // never re-subscribes when anchors / bars / energy change every frame.
  const propsRef = useRef(props)
  useEffect(() => {
    propsRef.current = props
  })

  useEffect(() => {
    if (heartbeatPulse) {
      lastBeatTimeRef.current = performance.now()
    }
  }, [heartbeatPulse])

  const auraAnchors = useMemo<AuraAnchor[]>(
    () => [
      { anchor: 'head', radius: 200, color: auraGlows[0] },
      { anchor: 'leftShoulder', radius: 240, color: auraGlows[1] },
      { anchor: 'rightShoulder', radius: 240, color: auraGlows[2] },
      { anchor: 'torso', radius: 350, color: auraGlows[3] },
    ],
    [],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return undefined
    }

    if (!offscreenRef.current) {
      const offscreen = document.createElement('canvas')
      offscreen.width = 64
      offscreen.height = 64
      offscreenRef.current = offscreen
    }

    let animationId = 0
    let mounted = true
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    // Smoothed scene state, advanced inside the loop only (never via React setState).
    let energy = 0.06
    let presence = 0
    const anchorFilters: Record<string, AnchorFilter> = {}
    for (const name of ANCHOR_NAMES) {
      anchorFilters[name] = { x: new OneEuroFilter(), y: new OneEuroFilter() }
    }

    const render = (time: number) => {
      if (!mounted) return

      const {
        anchors,
        bars,
        bpm = 70,
        cameraStatus,
        chakraColor = '#C8933A',
        frequencyPeaks = [],
        isPlaying,
        liveEnergy,
        personDetected,
        videoRef,
      } = propsRef.current

      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const width = Math.max(1, Math.round(rect.width * dpr))
      const height = Math.max(1, Math.round(rect.height * dpr))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      context.save()
      context.scale(dpr, dpr)
      const cssWidth = width / dpr
      const cssHeight = height / dpr
      const tSec = time / 1000

      // Deep void background
      context.fillStyle = '#06060C'
      context.fillRect(0, 0, cssWidth, cssHeight)

      const video = videoRef.current
      const canDrawVideo = cameraStatus === 'granted' && video && video.readyState >= 2 && video.videoWidth > 0
      if (canDrawVideo) {
        const videoRatio = video.videoWidth / video.videoHeight
        const canvasRatio = cssWidth / cssHeight
        let drawWidth: number
        let drawHeight: number
        let drawX = 0
        let drawY = 0

        if (videoRatio > canvasRatio) {
          drawHeight = cssHeight
          drawWidth = cssHeight * videoRatio
          drawX = (cssWidth - drawWidth) / 2
        } else {
          drawWidth = cssWidth
          drawHeight = cssWidth / videoRatio
          drawY = (cssHeight - drawHeight) / 2
        }

        context.save()
        context.translate(cssWidth, 0)
        context.scale(-1, 1)
        context.drawImage(video, drawX, drawY, drawWidth, drawHeight)
        context.restore()
      } else {
        drawFallbackFigure(context, cssWidth, cssHeight)
      }

      // Color overlay wash
      const wash = context.createLinearGradient(0, 0, cssWidth, cssHeight)
      wash.addColorStop(0, 'rgba(6, 6, 12, 0.34)')
      wash.addColorStop(0.46, 'rgba(43, 230, 200, 0.03)')
      wash.addColorStop(1, 'rgba(6, 5, 18, 0.5)')
      context.fillStyle = wash
      context.fillRect(0, 0, cssWidth, cssHeight)

      // Ambient fog gradient
      const cx = cssWidth / 2
      const cy = cssHeight / 2
      const fog = context.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cssWidth, cssHeight) * 0.7)
      fog.addColorStop(0, 'rgba(20, 15, 40, 0.25)')
      fog.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = fog
      context.fillRect(0, 0, cssWidth, cssHeight)

      const effectsActive = isPlaying && personDetected

      // Smoothly advance presence (aura/visual fade) and energy envelope — no React renders.
      presence += ((effectsActive ? 1 : 0) - presence) * 0.08

      const beatAge = time - lastBeatTimeRef.current
      const beatOpacity = getBeatOpacity(beatAge)
      const micEnergy = bars.length ? bars.reduce((sum, value) => sum + value, 0) / bars.length : 0
      const energyTarget = isPlaying
        ? clamp(0.12 + micEnergy * 0.6 + beatOpacity * 0.6 + liveEnergy * 0.15, 0, 1)
        : 0.06
      energy += (energyTarget - energy) * 0.12

      const bpmColor = getBpmColor(bpm)

      if (isPlaying && offscreenRef.current) {
        drawWhiteVisualField(context, cssWidth, cssHeight, time, energy, beatOpacity, reduceMotion)
        drawCymaticsPattern(context, offscreenRef.current, bars, frequencyPeaks, chakraColor, cssWidth, cssHeight)
        drawAuroraCurtain(context, cssWidth, cssHeight, time, energy, beatOpacity, reduceMotion)
      }

      // Smooth the jittery pose anchors with One Euro before they drive any drawing.
      const smoothed: TrackingAnchors = {}
      for (const name of ANCHOR_NAMES) {
        const raw = anchors[name]
        const filter = anchorFilters[name]
        if (raw) {
          smoothed[name] = {
            x: filter.x.filter(raw.x, tSec),
            y: filter.y.filter(raw.y, tSec),
            confidence: raw.confidence,
          }
        } else {
          filter.x.reset()
          filter.y.reset()
        }
      }
      const getPoint = (name: keyof TrackingAnchors) => getAnchorPoint(smoothed, name, cssWidth, cssHeight)

      if (presence > 0.01) {
        drawBodyAura(context, getPoint, cssWidth, cssHeight, time, energy, bpmColor, beatOpacity, presence, reduceMotion, auraAnchors)

        const head = getPoint('head')
        const torso = getPoint('torso')
        const bloomCenter = { x: torso.x, y: (head.y + torso.y) / 2 }
        drawAudioBloomParticles(
          context,
          bloomCenter,
          cssWidth,
          cssHeight,
          time,
          bars,
          frequencyPeaks,
          chakraColor,
          energy,
          beatOpacity,
          presence,
          reduceMotion,
        )
        drawTrackingNodes(context, getPoint, smoothed, energy, beatOpacity, presence)

        const waveBase = cssHeight - 42
        const waveStart = cssWidth * 0.18
        const waveWidth = cssWidth * 0.64
        context.save()
        context.globalCompositeOperation = 'screen'
        bars.forEach((bar, index) => {
          const x = waveStart + (index / Math.max(1, bars.length - 1)) * waveWidth
          const barHeight = 8 + bar * 46
          const gradient = context.createRadialGradient(x, waveBase, 2, x, waveBase, barHeight * 1.8)
          gradient.addColorStop(0, colorWithAlpha(auroraPalette[index % auroraPalette.length], (0.32 + bar * 0.22) * presence))
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
          context.fillStyle = gradient
          context.beginPath()
          context.ellipse(x, waveBase, 10 + bar * 22, barHeight, 0, 0, Math.PI * 2)
          context.fill()
        })
        context.restore()
      }

      context.restore()
      animationId = window.requestAnimationFrame(render)
    }

    animationId = window.requestAnimationFrame(render)
    return () => {
      mounted = false
      window.cancelAnimationFrame(animationId)
    }
  }, [auraAnchors])

  return (
    <section className="stage" aria-label="Camera visual effects stage">
      <video ref={videoRef} className="camera-video" muted playsInline aria-hidden="true" />
      <canvas ref={canvasRef} className="effects-canvas" data-testid="effects-canvas" />
      <div className="stage-status">
        <span className={`status-dot ${isPlaying && personDetected ? 'active' : ''}`} />
        <span>
          {cameraStatus !== 'granted'
            ? 'Camera fallback'
            : isPlaying && chakraName
              ? `${chakraName} ${dominantFrequency ? `${Math.round(dominantFrequency)} Hz` : ''}`.trim()
              : trackingStatus === 'tracking' && isPlaying
                ? 'Session active'
                : trackingStatus === 'tracking'
                  ? 'Person detected'
                  : 'Finding person'}
        </span>
      </div>
    </section>
  )
}
