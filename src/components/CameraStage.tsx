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
  poemLines: string[]
  trackingStatus: TrackingStatus
  videoRef: RefObject<HTMLVideoElement | null>
}

type Particle = {
  anchor: keyof TrackingAnchors
  angle: number
  orbit: number
  speed: number
  tint: string
}

const palette = ['rgba(142, 232, 255, 0.86)', 'rgba(244, 201, 121, 0.82)', 'rgba(210, 190, 255, 0.78)', 'rgba(255, 255, 246, 0.86)']

const defaultPoem = [
  'a quiet bloom',
  'behind the noise',
  'your breath teaches',
  'the night to soften',
  'light learns your name',
]

const getAnchorPoint = (anchors: TrackingAnchors, name: Particle['anchor'], width: number, height: number) => {
  const anchor = anchors[name] ?? anchors.torso ?? anchors.head
  return {
    x: (anchor?.x ?? 0.5) * width,
    y: (anchor?.y ?? 0.48) * height,
  }
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

export function CameraStage({
  anchors,
  bars,
  cameraStatus,
  isPlaying,
  liveEnergy,
  personDetected,
  poemLines,
  trackingStatus,
  videoRef,
}: CameraStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 84 }, (_item, index) => ({
        anchor: index % 4 === 0 ? 'leftShoulder' : index % 4 === 1 ? 'rightShoulder' : index % 4 === 2 ? 'torso' : 'head',
        angle: (Math.PI * 2 * index) / 84,
        orbit: 44 + (index % 12) * 10,
        speed: 0.0018 + (index % 7) * 0.00028,
        tint: palette[index % palette.length],
      })),
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

    let frame = 0
    let animationId = 0
    const lines = poemLines.length > 0 ? poemLines : defaultPoem

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
      wash.addColorStop(0, 'rgba(10, 14, 18, 0.42)')
      wash.addColorStop(0.46, 'rgba(255, 255, 246, 0.04)')
      wash.addColorStop(1, 'rgba(5, 9, 13, 0.5)')
      context.fillStyle = wash
      context.fillRect(0, 0, cssWidth, cssHeight)

      const effectsActive = isPlaying && personDetected
      const energy = isPlaying ? Math.max(liveEnergy, 0.08) : 0.08
      const pulse = 1 + energy * 1.8

      if (effectsActive) {
        particles.forEach((particle, index) => {
          const anchor = getAnchorPoint(anchors, particle.anchor, cssWidth, cssHeight)
          const angle = particle.angle + time * particle.speed
          const radius = particle.orbit * pulse + Math.sin(time * 0.001 + index) * 18
          const x = anchor.x + Math.cos(angle) * radius * (particle.anchor === 'torso' ? 2.1 : 1.3)
          const y = anchor.y + Math.sin(angle * 1.4) * radius * 0.72

          context.strokeStyle = particle.tint.replace('0.', '0.2')
          context.lineWidth = 0.7 + energy * 2.5
          context.beginPath()
          context.moveTo(anchor.x, anchor.y)
          context.quadraticCurveTo((anchor.x + x) / 2, y - 28 * Math.sin(angle), x, y)
          context.stroke()

          context.fillStyle = particle.tint
          context.shadowColor = particle.tint
          context.shadowBlur = 12 + energy * 24
          context.beginPath()
          context.arc(x, y, 1.1 + ((index % 5) + energy * 8) * 0.55, 0, Math.PI * 2)
          context.fill()
          context.shadowBlur = 0
        })

        const torso = getAnchorPoint(anchors, 'torso', cssWidth, cssHeight)
        const head = getAnchorPoint(anchors, 'head', cssWidth, cssHeight)
        const leftShoulder = getAnchorPoint(anchors, 'leftShoulder', cssWidth, cssHeight)
        const rightShoulder = getAnchorPoint(anchors, 'rightShoulder', cssWidth, cssHeight)
        const textPositions = [
          { x: leftShoulder.x - 110, y: leftShoulder.y - 90 },
          { x: rightShoulder.x + 40, y: rightShoulder.y - 56 },
          { x: torso.x - 130, y: torso.y + 92 },
          { x: head.x + 82, y: head.y + 10 },
        ]
        context.font = 'italic 18px "Inter", "Segoe UI", sans-serif'
        context.fillStyle = 'rgba(255, 255, 246, 0.78)'
        context.textBaseline = 'middle'

        textPositions.forEach((position, index) => {
          const line = lines[(index + Math.floor(frame / 180)) % lines.length]
          context.fillText(line, Math.max(24, Math.min(cssWidth - 240, position.x)), Math.max(42, Math.min(cssHeight - 62, position.y)))
        })

        const waveBase = cssHeight - 34
        const waveStart = cssWidth * 0.18
        const waveWidth = cssWidth * 0.64
        bars.forEach((bar, index) => {
          const x = waveStart + (index / Math.max(1, bars.length - 1)) * waveWidth
          const height = 4 + bar * 28
          context.strokeStyle = palette[index % palette.length]
          context.lineWidth = 2
          context.beginPath()
          context.moveTo(x, waveBase - height / 2)
          context.lineTo(x, waveBase + height / 2)
          context.stroke()
        })
      }

      context.restore()
      frame += 1
      animationId = window.requestAnimationFrame(render)
    }

    animationId = window.requestAnimationFrame(render)
    return () => window.cancelAnimationFrame(animationId)
  }, [anchors, bars, cameraStatus, isPlaying, liveEnergy, particles, personDetected, poemLines, videoRef])

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
