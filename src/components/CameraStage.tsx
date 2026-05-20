import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import type { CameraStatus } from '../camera/useCamera'
import type { TrackingAnchors, TrackingStatus } from '../types'

type CameraStageProps = {
  anchors: TrackingAnchors
  bars: number[]
  bpm?: number
  cameraStatus: CameraStatus
  chakraColor?: string
  heartbeatPulse?: boolean
  isPlaying: boolean
  liveEnergy: number
  personDetected: boolean
  poemLines: string[]
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

const getAnchorPoint = (anchors: TrackingAnchors, name: AuraAnchor['anchor'], width: number, height: number) => {
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

function drawFallbackFigure(context: CanvasRenderingContext2D, width: number, height: number) {
  // Dark void background
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
  const intensity = 0.3 + energy * 0.7

  context.save()
  context.globalCompositeOperation = 'source-over'
  context.filter = `blur(${12 + energy * 14}px)`

  // Beat-peak tint: shift toward violet on strong pulse
  const beatTint = Math.min(1, beatOpacity / 0.75)
  const ribbonColors = [
    beatTint > 0.5 ? '#B53DFF' : '#2BE6C8',
    '#B8FFF3',
    beatTint > 0.3 ? '#B53DFF' : '#32C4E3',
    '#FFE56D',
  ]

  for (let ribbon = 0; ribbon < 4; ribbon += 1) {
    const baseY = height * (0.18 + ribbon * 0.16)
    const amplitude = height * (0.09 + energy * 0.1 + ribbon * 0.012)
    const depth = height * (0.12 + ribbon * 0.035)
    const phase = motion * (1 + ribbon * 0.22) + ribbon * 1.7
    const gradient = context.createLinearGradient(width * 0.08, baseY - depth, width * 0.94, baseY + depth)

    gradient.addColorStop(0, colorWithAlpha(ribbonColors[ribbon % ribbonColors.length], 0))
    gradient.addColorStop(0.16, colorWithAlpha(ribbonColors[ribbon % ribbonColors.length], 0.16 * intensity))
    gradient.addColorStop(0.44, colorWithAlpha(auroraPalette[(ribbon + 1) % auroraPalette.length], 0.32 * intensity))
    gradient.addColorStop(0.72, colorWithAlpha(auroraPalette[(ribbon + 2) % auroraPalette.length], 0.24 * intensity))
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

  context.filter = 'none'
  context.restore()
}

function drawBodyAura(
  context: CanvasRenderingContext2D,
  anchors: TrackingAnchors,
  width: number,
  height: number,
  time: number,
  energy: number,
  bpmColor: string,
  reduceMotion: boolean,
  auraAnchors: AuraAnchor[],
) {
  const motion = reduceMotion ? 0 : time * 0.001

  context.save()
  context.globalCompositeOperation = 'source-over'

  auraAnchors.forEach((aura, index) => {
    // Use BPM color for the aura, blending with the anchor's default color
    const effectiveColor = index === 0 ? bpmColor : aura.color
    const point = getAnchorPoint(anchors, aura.anchor, width, height)
    const driftX = Math.sin(motion * (0.72 + index * 0.08) + index) * (12 + energy * 20)
    const driftY = Math.cos(motion * (0.64 + index * 0.1) + index * 1.4) * (10 + energy * 16)
    const radius = aura.radius * (1.1 + energy * 1.55)
    const glow = context.createRadialGradient(point.x + driftX, point.y + driftY, radius * 0.08, point.x, point.y, radius)

    glow.addColorStop(0, colorWithAlpha(effectiveColor, 0.18 + energy * 0.1))
    glow.addColorStop(0.34, colorWithAlpha(effectiveColor, 0.12 + energy * 0.08))
    glow.addColorStop(0.72, colorWithAlpha(effectiveColor, 0.03))
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')

    context.fillStyle = glow
    context.beginPath()
    context.ellipse(point.x, point.y, radius * (1.05 + index * 0.12), radius * (0.62 + index * 0.08), Math.sin(motion + index) * 0.38, 0, Math.PI * 2)
    context.fill()
  })

  const torso = getAnchorPoint(anchors, 'torso', width, height)
  const halo = context.createRadialGradient(torso.x, torso.y, 20, torso.x, torso.y, Math.max(width, height) * (0.42 + energy * 0.08))

  // Use BPM-driven color for the halo core
  const [bR, bG, bB] = parseCssColor(bpmColor)
  halo.addColorStop(0, `rgba(${bR}, ${bG}, ${bB}, ${0.06 + energy * 0.06})`)
  halo.addColorStop(0.26, `rgba(43, 230, 200, ${0.1 + energy * 0.08})`)
  halo.addColorStop(0.54, `rgba(181, 61, 255, ${0.08 + energy * 0.08})`)
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
  context.fillStyle = halo
  context.fillRect(0, 0, width, height)

  context.restore()
}

function drawAuraPoetry(
  context: CanvasRenderingContext2D,
  _anchors: TrackingAnchors,
  poemLines: string[],
  width: number,
  height: number,
  time: number,
  energy: number,
  reduceMotion: boolean,
) {
  if (poemLines.length === 0) {
    return
  }

  const motion = reduceMotion ? 0 : time * 0.00055

  // Font size: clamp between 18 and 28 px, scaling with canvas width
  const fontSize = Math.max(18, Math.min(28, width * 0.022))
  const lineHeight = fontSize * 1.8
  const maxWidth = width * 0.45
  const visibleLines = poemLines.slice(0, 7)

  context.save()
  context.font = `300 ${fontSize}px 'Cormorant Garamond', Georgia, serif`
  context.textBaseline = 'middle'
  context.textAlign = 'center'

  // Try to set letter-spacing (supported in modern browsers)
  if ('letterSpacing' in context) {
    (context as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0.08em'
  }

  // Measure total block height and position vertically centered
  const totalHeight = visibleLines.length * lineHeight
  const cx = width * 0.5
  // Offset the block slightly upward from center
  const blockTop = Math.max(40, height * 0.5 - totalHeight * 0.5 - 20)
  const pad = 24
  const blockX = cx - maxWidth / 2
  const blockY = blockTop - pad
  const blockW = maxWidth + pad * 2
  const blockH = totalHeight + pad * 2

  // Scrim behind text
  context.save()
  context.globalCompositeOperation = 'source-over'
  context.fillStyle = 'rgba(5, 5, 20, 0.42)'
  if (context.roundRect) {
    context.beginPath()
    context.roundRect(blockX, blockY, blockW, blockH, 16)
    context.fill()
  } else {
    context.fillRect(blockX, blockY, blockW, blockH)
  }
  context.restore()

  // Draw each line with glow stack
  visibleLines.forEach((line, index) => {
    const x = cx + Math.sin(motion * (0.4 + index * 0.06) + index) * (reduceMotion ? 0 : energy * 6)
    const y = blockTop + index * lineHeight + lineHeight / 2

    // Outer glow
    context.globalCompositeOperation = 'screen'
    context.shadowBlur = 40
    context.shadowColor = 'rgba(177,121,210,0.9)'
    context.fillStyle = '#F0EDE8'
    context.fillText(line, x, y, maxWidth)

    // Mid glow
    context.shadowBlur = 15
    context.shadowColor = 'rgba(177,121,210,0.7)'
    context.fillText(line, x, y, maxWidth)

    // Crisp layer
    context.shadowBlur = 4
    context.shadowColor = 'rgba(255,255,255,0.9)'
    context.fillStyle = '#F0EDE8'
    context.fillText(line, x, y, maxWidth)
  })

  context.shadowBlur = 0
  context.restore()
}

function parseCssColor(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ]
}

function getChakraColors(chakraColor: string): { line: string; glow: string; fill: string } {
  // Try to match by frequency suffix (e.g. the prop might be '#396hz' or '396' or a hex)
  // The chakraColor prop is expected to be a hex color — look up by matching palette keys
  // against known hex colors, or fall back to default
  for (const [freq, colors] of Object.entries(CHAKRA_COLORS)) {
    if (chakraColor === freq || chakraColor === colors.line) {
      return colors
    }
  }
  // If it's a raw hex, use it directly as the line color with a derived glow
  if (/^#[0-9a-fA-F]{6}$/.test(chakraColor)) {
    return { line: chakraColor, glow: chakraColor, fill: `${chakraColor}14` }
  }
  return DEFAULT_CHAKRA
}

function drawCymaticsPattern(
  context: CanvasRenderingContext2D,
  offscreen: HTMLCanvasElement,
  bars: number[],
  chakraColor: string,
  cssWidth: number,
  cssHeight: number,
) {
  const res = offscreen.width
  const ctx = offscreen.getContext('2d')
  if (!ctx || typeof ctx.createImageData !== 'function') return

  const chakraColors = getChakraColors(chakraColor)
  const [cr, cg, cb] = parseCssColor(chakraColors.line)

  // Pick top 8 bars by magnitude, use their index as the wave number k
  const indexed = bars.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v).slice(0, 8)
  const imageData = ctx.createImageData(res, res)
  const data = imageData.data

  // Precompute sin tables per frequency to avoid redundant calls
  for (const { v, i } of indexed) {
    if (v < 0.06) continue
    const k = (i + 1) * 1.4
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
        const contribution = Math.abs(sinX[col] * sinY[row]) * v
        data[px] = Math.min(255, data[px] + cr * contribution)
        data[px + 1] = Math.min(255, data[px + 1] + cg * contribution)
        data[px + 2] = Math.min(255, data[px + 2] + cb * contribution)
        data[px + 3] = Math.min(255, data[px + 3] + contribution * 200)
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)

  // First pass: glow
  context.save()
  context.globalCompositeOperation = 'screen'
  context.globalAlpha = 0.18
  context.shadowBlur = 6
  context.shadowColor = chakraColors.glow
  context.imageSmoothingEnabled = true
  context.drawImage(offscreen, 0, 0, cssWidth, cssHeight)
  context.restore()

  // Second pass: clean (sharper)
  context.save()
  context.globalCompositeOperation = 'screen'
  context.globalAlpha = 0.18
  context.imageSmoothingEnabled = true
  context.drawImage(offscreen, 0, 0, cssWidth, cssHeight)
  context.restore()
}

export function CameraStage(props: CameraStageProps) {
  const { anchors, bars, bpm = 70, cameraStatus, chakraColor = '#C8933A', heartbeatPulse = false, isPlaying, liveEnergy, personDetected, poemLines, trackingStatus, videoRef } = props
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const lastBeatTimeRef = useRef(0)

  useEffect(() => {
    if (heartbeatPulse) {
      lastBeatTimeRef.current = performance.now()
    }
  }, [heartbeatPulse])

  const auraAnchors = useMemo<AuraAnchor[]>(
    () => [
      { anchor: 'head', radius: 190, color: auraGlows[0] },
      { anchor: 'leftShoulder', radius: 230, color: auraGlows[1] },
      { anchor: 'rightShoulder', radius: 230, color: auraGlows[2] },
      { anchor: 'torso', radius: 330, color: auraGlows[3] },
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
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    const render = (time: number) => {
      const rect = canvas.getBoundingClientRect()
      const width = Math.max(1, Math.round(rect.width * window.devicePixelRatio))
      const height = Math.max(1, Math.round(rect.height * window.devicePixelRatio))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      context.save()
      context.scale(window.devicePixelRatio, window.devicePixelRatio)
      const cssWidth = width / window.devicePixelRatio
      const cssHeight = height / window.devicePixelRatio

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
      const baseEnergy = isPlaying ? Math.max(liveEnergy, 0.08) : 0.08

      // Two-phase attack/decay beat pulse
      const beatAge = time - lastBeatTimeRef.current
      const beatOpacity = getBeatOpacity(beatAge)
      const beatBoost = beatOpacity * 0.6
      const energy = Math.min(1, baseEnergy + beatBoost)

      // BPM-driven aura color
      const bpmColor = getBpmColor(bpm)

      if (isPlaying && offscreenRef.current) {
        drawCymaticsPattern(context, offscreenRef.current, bars, chakraColor, cssWidth, cssHeight)
        drawAuroraCurtain(context, cssWidth, cssHeight, time, energy, beatOpacity, reduceMotion)
      }

      if (effectsActive) {
        drawBodyAura(context, anchors, cssWidth, cssHeight, time, energy, bpmColor, reduceMotion, auraAnchors)
        drawAuraPoetry(context, anchors, poemLines, cssWidth, cssHeight, time, energy, reduceMotion)

        const waveBase = cssHeight - 42
        const waveStart = cssWidth * 0.18
        const waveWidth = cssWidth * 0.64
        context.save()
        context.globalCompositeOperation = 'screen'
        context.filter = 'blur(10px)'
        bars.forEach((bar, index) => {
          const x = waveStart + (index / Math.max(1, bars.length - 1)) * waveWidth
          const barHeight = 8 + bar * 46
          const gradient = context.createRadialGradient(x, waveBase, 2, x, waveBase, barHeight * 1.8)
          gradient.addColorStop(0, colorWithAlpha(auroraPalette[index % auroraPalette.length], 0.32 + bar * 0.22))
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
          context.fillStyle = gradient
          context.beginPath()
          context.ellipse(x, waveBase, 10 + bar * 22, barHeight, 0, 0, Math.PI * 2)
          context.fill()
        })
        context.filter = 'none'
        context.restore()
      }

      context.restore()
      animationId = window.requestAnimationFrame(render)
    }

    animationId = window.requestAnimationFrame(render)
    return () => window.cancelAnimationFrame(animationId)
  }, [anchors, auraAnchors, bars, bpm, cameraStatus, chakraColor, isPlaying, liveEnergy, personDetected, poemLines, videoRef])

  return (
    <section className="stage" aria-label="Camera visual effects stage">
      <video ref={videoRef} className="camera-video" muted playsInline aria-hidden="true" />
      <canvas ref={canvasRef} className="effects-canvas" data-testid="effects-canvas" />
      <div className="stage-status">
        <span className={`status-dot ${isPlaying && personDetected ? 'active' : ''}`} />
        <span>
          {cameraStatus !== 'granted'
            ? 'Camera fallback'
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
