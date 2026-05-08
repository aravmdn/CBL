import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { CameraStatus } from './useCamera'
import type { TrackingAnchors, TrackingStatus } from '../types'

type PoseLandmarkerInstance = {
  detectForVideo: (video: HTMLVideoElement, timeMs: number) => {
    landmarks?: Array<Array<{ x: number; y: number; visibility?: number }>>
  }
  close?: () => void
}

const mirroredAnchor = (point: { x: number; y: number; visibility?: number }) => ({
  x: 1 - point.x,
  y: point.y,
  confidence: point.visibility ?? 1,
})

const hasUsefulVisibility = (point: { visibility?: number } | undefined) => (point?.visibility ?? 1) > 0.35

const waitForVideoDimensions = async (videoRef: RefObject<HTMLVideoElement | null>, isCancelled: () => boolean) => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const video = videoRef.current
    if (isCancelled()) {
      return null
    }

    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      return video
    }

    await new Promise((resolve) => window.setTimeout(resolve, 50))
  }

  return null
}

export function usePoseTracking(videoRef: RefObject<HTMLVideoElement | null>, cameraStatus: CameraStatus) {
  const landmarkerRef = useRef<PoseLandmarkerInstance | null>(null)
  const frameRef = useRef<number | null>(null)
  const [anchors, setAnchors] = useState<TrackingAnchors>({})
  const [personDetected, setPersonDetected] = useState(false)
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('loading')

  useEffect(() => {
    let cancelled = false

    function detect() {
      const video = videoRef.current
      const landmarker = landmarkerRef.current

      if (cancelled) {
        return
      }

      try {
        if (!video || !landmarker || video.readyState < 2) {
          frameRef.current = window.requestAnimationFrame(detect)
          return
        }

        const result = landmarker.detectForVideo(video, performance.now())
        const landmarks = result.landmarks?.[0]
        const head = landmarks?.[0]
        const leftShoulder = landmarks?.[11]
        const rightShoulder = landmarks?.[12]
        const leftHip = landmarks?.[23]
        const rightHip = landmarks?.[24]
        const visibleBodyPoints = [head, leftShoulder, rightShoulder].filter(hasUsefulVisibility)

        if (landmarks && visibleBodyPoints.length >= 2 && leftShoulder && rightShoulder) {
          const torsoX = (leftShoulder.x + rightShoulder.x) / 2
          const torsoY =
            leftHip && rightHip && hasUsefulVisibility(leftHip) && hasUsefulVisibility(rightHip)
              ? (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4
              : (leftShoulder.y + rightShoulder.y) / 2 + 0.2

          setAnchors({
            head: head && hasUsefulVisibility(head) ? mirroredAnchor(head) : undefined,
            leftShoulder: mirroredAnchor(leftShoulder),
            rightShoulder: mirroredAnchor(rightShoulder),
            torso: { x: 1 - torsoX, y: torsoY, confidence: 0.8 },
          })
          setPersonDetected(true)
          setTrackingStatus('tracking')
        } else {
          setAnchors({})
          setPersonDetected(false)
          setTrackingStatus('seeking')
        }
      } catch {
        setAnchors({})
        setPersonDetected(false)
        setTrackingStatus('fallback')
      }

      frameRef.current = window.requestAnimationFrame(detect)
    }

    async function loadLandmarker() {
      setAnchors({})
      setPersonDetected(false)

      if (cameraStatus !== 'granted') {
        setTrackingStatus('loading')
        return
      }

      const video = await waitForVideoDimensions(videoRef, () => cancelled)
      if (!video) {
        setTrackingStatus('fallback')
        return
      }

      try {
        const vision = await import('@mediapipe/tasks-vision')
        const fileset = await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm')
        const landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55,
        })

        if (cancelled) {
          landmarker.close()
          return
        }

        landmarkerRef.current = landmarker
        setTrackingStatus('seeking')
        frameRef.current = window.requestAnimationFrame(detect)
      } catch {
        setTrackingStatus('fallback')
      }
    }

    void loadLandmarker()

    return () => {
      cancelled = true
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
      landmarkerRef.current?.close?.()
      landmarkerRef.current = null
    }
  }, [cameraStatus, videoRef])

  return { anchors, personDetected, trackingStatus }
}
