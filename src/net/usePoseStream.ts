import { useEffect, useRef } from 'react'
import type { TrackingAnchor, TrackingAnchors } from '../types'

// Streams MediaPipe pose anchors to a TouchDesigner Web Socket DAT (server mode)
// so TD can drive hand-controlled particles + aura. The browser is the WS client.
//
// Gated OFF by default: the laptop-only canvas demo must run clean with no TD
// present (browsers log their own noise on failed WS connects). Enable with the
// Vite env `VITE_TD_BRIDGE=1`, or at runtime via `localStorage['td-bridge']='1'`.

const DEFAULT_URL = 'ws://localhost:9980'
const SEND_INTERVAL_MS = 40 // ~25 Hz — ample for hand control, light on the socket
const RECONNECT_MS = 2000

type Vec3 = [number, number, number] | null

const round3 = (n: number) => Math.round(n * 1000) / 1000

function packAnchor(anchor?: TrackingAnchor): Vec3 {
  return anchor ? [round3(anchor.x), round3(anchor.y), round3(anchor.confidence)] : null
}

function bridgeEnabled(explicit?: boolean): boolean {
  if (explicit !== undefined) return explicit
  const env = import.meta.env.VITE_TD_BRIDGE
  if (env === '1' || env === 'true') return true
  try {
    return window.localStorage.getItem('td-bridge') === '1'
  } catch {
    return false
  }
}

export function usePoseStream(
  anchors: TrackingAnchors,
  options: { enabled?: boolean; url?: string } = {},
) {
  // Latest-ref pattern: the send timer reads current anchors without re-opening
  // the socket every frame (anchors change at the pose detection rate).
  const anchorsRef = useRef(anchors)
  anchorsRef.current = anchors

  const enabled = bridgeEnabled(options.enabled)
  const url = options.url ?? import.meta.env.VITE_TD_WS_URL ?? DEFAULT_URL

  useEffect(() => {
    if (!enabled) return undefined

    let socket: WebSocket | null = null
    let sendTimer: ReturnType<typeof setInterval> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let closed = false

    const clearSendTimer = () => {
      if (sendTimer !== null) {
        clearInterval(sendTimer)
        sendTimer = null
      }
    }

    const scheduleReconnect = () => {
      if (closed || reconnectTimer !== null) return
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connect()
      }, RECONNECT_MS)
    }

    function connect() {
      if (closed) return
      try {
        socket = new WebSocket(url)
      } catch {
        scheduleReconnect()
        return
      }

      socket.onopen = () => {
        sendTimer = setInterval(() => {
          if (!socket || socket.readyState !== WebSocket.OPEN) return
          const a = anchorsRef.current
          const payload = {
            t: Math.round(performance.now()),
            head: packAnchor(a.head),
            lShoulder: packAnchor(a.leftShoulder),
            rShoulder: packAnchor(a.rightShoulder),
            lWrist: packAnchor(a.leftWrist),
            rWrist: packAnchor(a.rightWrist),
            torso: packAnchor(a.torso),
          }
          try {
            socket.send(JSON.stringify(payload))
          } catch {
            // Drop this frame; the next tick retries.
          }
        }, SEND_INTERVAL_MS)
      }

      socket.onclose = () => {
        clearSendTimer()
        scheduleReconnect()
      }

      socket.onerror = () => {
        // onclose drives reconnect; close here so the socket settles cleanly.
        socket?.close()
      }
    }

    connect()

    return () => {
      closed = true
      clearSendTimer()
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      if (socket) {
        socket.onopen = null
        socket.onclose = null
        socket.onerror = null
        socket.close()
      }
    }
  }, [enabled, url])
}
