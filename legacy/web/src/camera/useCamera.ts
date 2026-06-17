import { useEffect, useRef, useState } from 'react'

export type CameraStatus = 'pending' | 'granted' | 'denied' | 'unsupported'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('pending')
  const [label, setLabel] = useState('Laptop camera')

  useEffect(() => {
    let mounted = true

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported')
        setLabel('Camera unavailable')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        })

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        const track = stream.getVideoTracks()[0]
        setLabel(track?.label || 'Laptop camera')
        setStatus('granted')

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => undefined)
        }
      } catch {
        if (mounted) {
          setStatus('denied')
          setLabel('Permission needed')
        }
      }
    }

    void startCamera()

    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return {
    label,
    status,
    videoRef,
  }
}
