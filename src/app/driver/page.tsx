// Driver dashboard - online/offline toggle, incoming ride requests, active trips with real-time tracking & chat

"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ChatBox from "@/components/ChatBox"
import Toast from "@/components/Toast"
import { useSocket } from "@/lib/useSocket"

type RideRequest = {
  id: string
  pickupLat: number
  pickupLng: number
  pickupAddr?: string
  dropoffLat: number
  dropoffLng: number
  dropoffAddr?: string
  fare: number
  riderName?: string
  riderId?: string
}

export default function DriverDashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([])
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null)
  const [currentLat, setCurrentLat] = useState(5.6037)
  const [currentLng, setCurrentLng] = useState(-0.1870)
  const [speed, setSpeed] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ rideId: string; senderId: string; senderName: string; content: string; createdAt: string }[]>([])
  const [activeRideId, setActiveRideId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  const prevPosRef = useRef<{ lat: number; lng: number; time: number } | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const onlineLatRef = useRef(currentLat)
  const onlineLngRef = useRef(currentLng)

  const { emit, on } = useSocket(userId, "DRIVER")

  useEffect(() => {
    setMounted(true)
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")

    if (!storedUser || !storedToken) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(storedUser)
    if (userData.role !== "DRIVER") {
      router.push("/rider")
      return
    }

    setUserName(userData.name)
    setUserId(userData.id)
    setToken(storedToken)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLat(position.coords.latitude)
          setCurrentLng(position.coords.longitude)
        },
        () => {}
      )
    }
  }, [router])

  // Start/stop location watching when online
  useEffect(() => {
    if (!isOnline || !userId) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const prev = prevPosRef.current
        let calculatedSpeed = 0

        if (prev) {
          const timeDiff = (Date.now() - prev.time) / 1000 / 3600
          if (timeDiff > 0) {
            const dist = haversine(prev.lat, prev.lng, lat, lng)
            calculatedSpeed = Math.round(dist / timeDiff)
          }
        }

        prevPosRef.current = { lat, lng, time: Date.now() }
        setCurrentLat(lat)
        setCurrentLng(lng)
        setSpeed(calculatedSpeed)

        emit("updateLocation", { userId, lat, lng, speed: calculatedSpeed })

        if (activeRide && activeRideId && activeRide.riderId) {
          emit("trackRide", { rideId: activeRideId, lat, lng, speed: calculatedSpeed, riderId: activeRide.riderId })
        }
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    )

    watchIdRef.current = watchId
    return () => {
      navigator.geolocation.clearWatch(watchId)
      watchIdRef.current = null
    }
  }, [isOnline, userId, activeRide, activeRideId, emit])

  // Poll for pending rides as fallback
  useEffect(() => {
    if (!isOnline || !token || activeRide) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/rides/pending", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success && data.data) {
          data.data.forEach((ride: { id: string; pickupLat: number; pickupLng: number; pickupAddr?: string; dropoffLat: number; dropoffLng: number; dropoffAddr?: string; fare: number; rider?: { id: string; name: string } }) => {
            if (!rideRequests.find((r) => r.id === ride.id) && !activeRide) {
              setRideRequests((prev) => [...prev, {
                id: ride.id,
                pickupLat: ride.pickupLat,
                pickupLng: ride.pickupLng,
                pickupAddr: ride.pickupAddr,
                dropoffLat: ride.dropoffLat,
                dropoffLng: ride.dropoffLng,
                dropoffAddr: ride.dropoffAddr,
                fare: ride.fare,
                riderName: ride.rider?.name,
                riderId: ride.rider?.id,
              }])
              setNotification({ message: "New ride request available!", type: "info" })
            }
          })
        }
      } catch {}
    }, 8000)

    return () => clearInterval(interval)
  }, [isOnline, token, activeRide, rideRequests])

  // Listen for socket events
  useEffect(() => {
    if (!userId) return

    const unsubRequest = on("newRideRequest", (data: unknown) => {
      const d = data as { rideId: string; pickupLat: number; pickupLng: number }
      // Fetch ride details
      if (token) {
        fetch(`/api/rides/${d.rideId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.success) {
              const ride = res.data
              setRideRequests((prev) => [
                ...prev,
                {
                  id: ride.id,
                  pickupLat: ride.pickupLat,
                  pickupLng: ride.pickupLng,
                  pickupAddr: ride.pickupAddr,
                  dropoffLat: ride.dropoffLat,
                  dropoffLng: ride.dropoffLng,
                  dropoffAddr: ride.dropoffAddr,
                  fare: ride.fare,
                  riderName: ride.rider?.name,
                  riderId: ride.rider?.id,
                },
              ])
            }
          })
          .catch(() => {})
      }
    })

    const unsubAccepted = on("rideAccepted", (data: unknown) => {
      const d = data as { rideId: string; driverId: string }
      if (d.driverId === userId) {
        setNotification({ message: "🎉 Ride accepted! Head to pickup.", type: "success" })
      }
    })

    const unsubMsg = on("newMessage", (data: unknown) => {
      const m = data as { rideId: string; senderId: string; senderName: string; content: string; createdAt: string }
      setChatMessages((prev) => [...prev, m])
    })

    return () => {
      unsubRequest?.()
      unsubAccepted?.()
      unsubMsg?.()
    }
  }, [userId, token, on])

  const toggleOnline = async () => {
    if (!token) return
    const newStatus = !isOnline

    try {
      const res = await fetch("/api/drivers/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isOnline: newStatus, lat: currentLat, lng: currentLng }),
      })
      if (res.ok) {
        setIsOnline(newStatus)
        if (newStatus) {
          emit("updateLocation", { userId, lat: currentLat, lng: currentLng, speed: 0 })
          setNotification({ message: "You are now online and receiving ride requests", type: "success" })
        } else {
          setNotification({ message: "You are now offline", type: "info" })
        }
      }
    } catch {}
  }

  const acceptRide = async (rideId: string) => {
    if (!token || !userId) return

    try {
      const res = await fetch(`/api/rides/${rideId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "ACCEPTED", driverId: userId }),
      })

      if (res.ok) {
        const request = rideRequests.find((r) => r.id === rideId)
        if (request) {
          setActiveRide(request)
          setActiveRideId(rideId)
          setRideRequests([])
        }
      }
    } catch {}
  }

  const completeRide = async () => {
    if (!activeRide || !token) return

    try {
      await fetch(`/api/rides/${activeRide.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "COMPLETED" }),
      })
      setActiveRide(null)
      setActiveRideId(null)
      setShowChat(false)
    } catch {}
  }

  if (!mounted) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {userName}</p>
        </div>
        <button
          onClick={toggleOnline}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
            isOnline ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
          <span>{isOnline ? "Online" : "Offline"}</span>
        </button>
      </div>

      <div
        className={`rounded-xl p-6 mb-8 ${isOnline ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : "bg-gray-200 text-gray-500"}`}
      >
        <p className="text-sm opacity-80">Status</p>
        <p className="text-2xl font-bold">
          {isOnline ? "You are online and available for rides" : "Go online to receive ride requests"}
        </p>
        {isOnline && (
          <div className="flex gap-4 mt-2 text-sm opacity-80">
            <span>📍 {currentLat.toFixed(4)}, {currentLng.toFixed(4)}</span>
            <span>⚡ {speed} km/h</span>
          </div>
        )}
      </div>

      {activeRide && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🚗 Active Ride</h2>
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-500">
              Pickup: {activeRide.pickupAddr || `${activeRide.pickupLat.toFixed(4)}, ${activeRide.pickupLng.toFixed(4)}`}
            </p>
            <p className="text-sm text-gray-500">
              Dropoff: {activeRide.dropoffAddr || `${activeRide.dropoffLat.toFixed(4)}, ${activeRide.dropoffLng.toFixed(4)}`}
            </p>
            <p className="text-sm font-semibold text-gray-900">Fare: ₵{activeRide.fare.toFixed(2)}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowChat(true)}
              className="flex-1 py-2.5 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
            >
              💬 Chat with Rider
            </button>
            <button
              onClick={completeRide}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
            >
              Complete Ride
            </button>
          </div>
        </div>
      )}

      {isOnline && rideRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Incoming Requests</h2>
          <div className="space-y-4">
            {rideRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-medium text-gray-700">Ride #{request.id.slice(0, 8)}</p>
                <p className="text-sm text-gray-500 mt-1">Fare: ₵{request.fare.toFixed(2)}</p>
                {request.riderName && <p className="text-xs text-gray-400">Rider: {request.riderName}</p>}
                <button
                  onClick={() => acceptRide(request.id)}
                  className="mt-3 px-4 py-2 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
                >
                  Accept Ride
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/driver/trips" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <span className="text-2xl">📋</span>
          <h3 className="text-sm font-semibold text-gray-900 mt-2">Trip History</h3>
          <p className="text-xs text-gray-500">View completed trips</p>
        </Link>
        <Link href="/driver/earnings" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <span className="text-2xl">💰</span>
          <h3 className="text-sm font-semibold text-gray-900 mt-2">Earnings</h3>
          <p className="text-xs text-gray-500">Track your earnings</p>
        </Link>
      </div>

      {showChat && activeRide && userId && (
        <ChatBox
          rideId={activeRide.id}
          userId={userId}
          userName={userName}
          otherName={activeRide.riderName || "Rider"}
          onSendMessage={(content) => {
            emit("sendMessage", {
              rideId: activeRide.id,
              senderId: userId,
              senderName: userName,
              content,
              receiverId: activeRide.riderId,
            })
          }}
          onClose={() => setShowChat(false)}
          initialMessages={chatMessages}
        />
      )}

      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
