"use client"

import { useEffect, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"

export function useSocket(userId: string | null, role: string | null) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!userId || !role) return

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    })

    socket.on("connect", () => {
      socket.emit("register", { userId, role })
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId, role])

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data)
  }, [])

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler)
    return () => {
      socketRef.current?.off(event, handler)
    }
  }, [])

  return { socket: socketRef, emit, on }
}
