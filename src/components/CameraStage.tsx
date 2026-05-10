import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import type { CameraStatus } from '../camera/useCamera'
import type { TrackingAnchors, TrackingStatus } from '../types'

type CameraStageProps = {
  anchors: TrackingAnchors
  bars: number[]
  cameraStatus: CameraStatus
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

const auroraPalette = ['#00f5ff', '#35ffb2', '#ff4fd8', '#ffe56d', '#8f7cff']
const auraGlows = ['#00f5ff', '#35ffb2', '#ff4fd8', '#ffe56d']

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
  const gradient = context.createRadialGradient(width * 0.5, height * 0.42, 20, width * 0.5, height * 0.5, height * 0.45)
  gradient.addColorStop(0, 'rgba(255,255,255,0.2)')
  gradient.addColorStop(0.35, 'rgba(54,68,78,0.58)')
  gradient.addColorStop(1, 'rgba(12,17,21,0.88)')
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  context.fillStyle = 'rgba(10, 14, 18, 0.72)'
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
  reduceMotion: boolean,
) {
  const motion = reduceMotion ? 0 : time * 0.00042
  const intensity = 0.3 + energy * 0.7

  context.save()
  context.globalCompositeOperation = 'source-over'
  context.filter = `blur(${12 + energy * 14}px)`

  for (let ribbon = 0; ribbon < 4; ribbon += 1) {
    const baseY = height * (0.18 + ribbon * 0.16)
    const amplitude = height * (0.09 + energy * 0.1 + ribbon * 0.012)
    const depth = height * (0.12 + ribbon * 0.035)
    const phase = motion * (1 + ribbon * 0.22) + ribbon * 1.7
    const gradient = context.createLinearGradient(width * 0.08, baseY - depth, width * 0.94, baseY + depth)

    gradient.addColorStop(0, colorWithAlpha(auroraPalette[ribbon % auroraPalette.length], 0))
    gradient.addColorStop(0.16, colorWithAlpha(auroraPalette[ribbon % auroraPalette.length], 0.16 * intensity))
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
  reduceMotion: boolean,
  auraAnchors: AuraAnchor[],
) {
  const motion = reduceMotion ? 0 : time * 0.001

  context.save()
  context.globalCompositeOperation = 'source-over'

  auraAnchors.forEach((aura, index) => {
    const point = getAnchorPoint(anchors, aura.anchor, width, height)
    const driftX = Math.sin(motion * (0.72 + index * 0.08) + index) * (12 + energy * 20)
    const driftY = Math.cos(motion * (0.64 + index * 0.1) + index * 1.4) * (10 + energy * 16)
    const radius = aura.radius * (1.1 + energy * 1.55)
    const glow = context.createRadialGradient(point.x + driftX, point.y + driftY, radius * 0.08, point.x, point.y, radius)

    glow.addColorStop(0, colorWithAlpha(aura.color, 0.18 + energy * 0.1))
    glow.addColorStop(0.34, colorWithAlpha(aura.color, 0.12 + energy * 0.08))
    glow.addColorStop(0.72, colorWithAlpha(aura.color, 0.03))
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')

    context.fillStyle = glow
    context.beginPath()
    context.ellipse(point.x, point.y, radius * (1.05 + index * 0.12), radius * (0.62 + index * 0.08), Math.sin(motion + index) * 0.38, 0, Math.PI * 2)
    context.fill()
  })

  const torso = getAnchorPoint(anchors, 'torso', width, height)
  const halo = context.createRadialGradient(torso.x, torso.y, 20, torso.x, torso.y, Math.max(width, height) * (0.42 + energy * 0.08))
  halo.addColorStop(0, `rgba(0, 245, 255, ${0.04 + energy * 0.04})`)
  halo.addColorStop(0.26, `rgba(53, 255, 178, ${0.1 + energy * 0.08})`)
  halo.addColorStop(0.54, `rgba(255, 79, 216, ${0.08 + energy * 0.08})`)
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
  context.fillStyle = halo
  context.fillRect(0, 0, width, height)

  context.restore()
}

export function CameraStage(props: CameraStageProps) {
  const { anchors, bars, cameraStatus, isPlaying, liveEnergy, personDetected, trackingStatus, videoRef } = props
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
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

      const wash = context.createLinearGradient(0, 0, cssWidth, cssHeight)
      wash.addColorStop(0, 'rgba(5, 8, 14, 0.34)')
      wash.addColorStop(0.46, 'rgba(0, 245, 255, 0.04)')
      wash.addColorStop(1, 'rgba(4, 5, 18, 0.5)')
      context.fillStyle = wash
      context.fillRect(0, 0, cssWidth, cssHeight)

      const effectsActive = isPlaying && personDetected
      const energy = isPlaying ? Math.max(liveEnergy, 0.08) : 0.08

      if (isPlaying) {
        drawAuroraCurtain(context, cssWidth, cssHeight, time, energy, reduceMotion)
      }

      if (effectsActive) {
        drawBodyAura(context, anchors, cssWidth, cssHeight, time, energy, reduceMotion, auraAnchors)

        const waveBase = cssHeight - 42
        const waveStart = cssWidth * 0.18
        const waveWidth = cssWidth * 0.64
        context.save()
        context.globalCompositeOperation = 'screen'
        context.filter = 'blur(10px)'
        bars.forEach((bar, index) => {
          const x = waveStart + (index / Math.max(1, bars.length - 1)) * waveWidth
          const height = 8 + bar * 46
          const gradient = context.createRadialGradient(x, waveBase, 2, x, waveBase, height * 1.8)
          gradient.addColorStop(0, colorWithAlpha(auroraPalette[index % auroraPalette.length], 0.32 + bar * 0.22))
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
          context.fillStyle = gradient
          context.beginPath()
          context.ellipse(x, waveBase, 10 + bar * 22, height, 0, 0, Math.PI * 2)
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
  }, [anchors, auraAnchors, bars, cameraStatus, isPlaying, liveEnergy, personDetected, videoRef])

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
              ? 'Listening'
              : trackingStatus === 'tracking'
                ? 'Person detected'
                : 'Finding person'}
        </span>
      </div>
    </section>
  )
}
