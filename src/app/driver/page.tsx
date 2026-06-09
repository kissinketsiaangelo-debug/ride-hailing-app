// Driver dashboard - online/offline toggle, incoming ride requests, active trips

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
}

export default function DriverDashboard() {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(false)
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState("")
  const [token, setToken] = useState<string | null>(null)
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([])
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null)
  const [currentLat, setCurrentLat] = useState(6.5244)
  const [currentLng, setCurrentLng] = useState(3.3792)
  const [mounted, setMounted] = useState(false)

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

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLat(position.coords.latitude)
          setCurrentLng(position.coords.longitude)
        },
        () => {
          // Use default
        }
      )
    }
  }, [router])

  // Toggle online/offline status
  const toggleOnline = async () => {
    if (!token) return

    const newStatus = !isOnline

    try {
      const res = await fetch("/api/drivers/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isOnline: newStatus,
          lat: currentLat,
          lng: currentLng,
        }),
      })

      if (res.ok) {
        setIsOnline(newStatus)
      }
    } catch {
      // Ignore errors
    }
  }

  // Simulate accepting a ride request
  const acceptRide = async (rideId: string) => {
    if (!token || !userId) return

    try {
      const res = await fetch(`/api/rides/${rideId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "ACCEPTED",
          driverId: userId,
        }),
      })

      if (res.ok) {
        const request = rideRequests.find((r) => r.id === rideId)
        if (request) {
          setActiveRide(request)
          setRideRequests([])
        }
      }
    } catch {
      // Ignore errors
    }
  }

  // Complete the active ride
  const completeRide = async () => {
    if (!activeRide || !token) return

    try {
      await fetch(`/api/rides/${activeRide.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "COMPLETED" }),
      })

      setActiveRide(null)
    } catch {
      // Ignore errors
    }
  }

  if (!mounted) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Driver Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {userName}
          </p>
        </div>

        {/* Online/Offline toggle */}
        <button
          onClick={toggleOnline}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
            isOnline
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <span>{isOnline ? "Online" : "Offline"}</span>
        </button>
      </div>

      {/* Status card */}
      <div
        className={`rounded-xl p-6 mb-8 ${
          isOnline
            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
            : "bg-gray-200 text-gray-500"
        }`}
      >
        <p className="text-sm opacity-80">Status</p>
        <p className="text-2xl font-bold">
          {isOnline ? "You are online and available for rides" : "Go online to receive ride requests"}
        </p>
        {isOnline && (
          <p className="text-sm opacity-80 mt-2">
            Location: {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Active ride */}
      {activeRide && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🚗 Active Ride
          </h2>
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-500">
              Pickup: {activeRide.pickupAddr || `${activeRide.pickupLat.toFixed(4)}, ${activeRide.pickupLng.toFixed(4)}`}
            </p>
            <p className="text-sm text-gray-500">
              Dropoff: {activeRide.dropoffAddr || `${activeRide.dropoffLat.toFixed(4)}, ${activeRide.dropoffLng.toFixed(4)}`}
            </p>
            <p className="text-sm font-semibold text-gray-900">
              Fare: ₦{activeRide.fare.toFixed(2)}
            </p>
          </div>
          <button
            onClick={completeRide}
            className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
          >
            Complete Ride
          </button>
        </div>
      )}

      {/* Incoming ride requests */}
      {isOnline && rideRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Incoming Requests
          </h2>
          <div className="space-y-4">
            {rideRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <p className="text-sm font-medium text-gray-700">
                  Ride #{request.id.slice(0, 8)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Fare: ₦{request.fare.toFixed(2)}
                </p>
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

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/driver/trips"
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <span className="text-2xl">📋</span>
          <h3 className="text-sm font-semibold text-gray-900 mt-2">
            Trip History
          </h3>
          <p className="text-xs text-gray-500">View completed trips</p>
        </Link>
        <Link
          href="/driver/earnings"
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <span className="text-2xl">💰</span>
          <h3 className="text-sm font-semibold text-gray-900 mt-2">
            Earnings
          </h3>
          <p className="text-xs text-gray-500">Track your earnings</p>
        </Link>
      </div>
    </div>
  )
}
