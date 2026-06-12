// Request Ride page - interactive map to select pickup/dropoff and request a ride

"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import RatingModal from "@/components/RatingModal"
import LocationSearch from "@/components/LocationSearch"
import ChatBox from "@/components/ChatBox"
import Toast from "@/components/Toast"
import { calculateRideFare } from "@/lib/fare"
import { useSocket } from "@/lib/useSocket"
import { haversineDistance } from "@/lib/matching"
import type { Town } from "@/data/ghana-towns"

// Dynamically import the map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-400">Loading map...</p>
    </div>
  ),
})

// Default location: Accra, Ghana
const DEFAULT_LOCATION = { lat: 5.6037, lng: -0.1870 }

export default function RequestRidePage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState("")
  const [pickup, setPickup] = useState<{ lat: number; lng: number } | null>(null)
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number } | null>(null)
  const [pickupAddr, setPickupAddr] = useState("")
  const [dropoffAddr, setDropoffAddr] = useState("")
  const [step, setStep] = useState<"select" | "confirm" | "matching" | "active" | "complete">("select")
  const [fare, setFare] = useState<number | null>(null)
  const [rideId, setRideId] = useState<string | null>(null)
  const [matchedDriver, setMatchedDriver] = useState<{ id: string; name: string; phone: string | null; distance: number; speed?: number } | null>(null)
  const [error, setError] = useState("")
  const [showRating, setShowRating] = useState(false)
  const [currentRideId, setCurrentRideId] = useState("")
  const [currentDriverId, setCurrentDriverId] = useState("")
  const [nearbyDrivers, setNearbyDrivers] = useState<{ id: string; name: string; lat: number; lng: number; distance: number; vehicle?: { make: string; model: string; color: string; plate: string; type: string } }[]>([])
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number; speed?: number } | null>(null)
  const [driverEta, setDriverEta] = useState<{ toPickup: string; toDropoff: string } | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ rideId: string; senderId: string; senderName: string; content: string; createdAt: string }[]>([])
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    if (!storedToken || !storedUser) {
      router.push("/login")
      return
    }
    const user = JSON.parse(storedUser)
    if (user.role !== "RIDER") {
      router.push("/driver")
      return
    }
    setToken(storedToken)
    setUserId(user.id)
    setUserName(user.name)

    // Get current location from browser
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPickup({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // Fallback to default location
          setPickup(DEFAULT_LOCATION)
        }
      )
    } else {
      setPickup(DEFAULT_LOCATION)
    }
  }, [router])

  // Calculate fare estimate whenever pickup and dropoff change
  useEffect(() => {
    if (pickup && dropoff) {
      const estimatedFare = calculateRideFare(pickup, dropoff)
      setFare(Math.round(estimatedFare * 100) / 100)
    } else {
      setFare(null)
    }
  }, [pickup, dropoff])

  // Socket connection
  const { emit, on } = useSocket(userId, "RIDER")

  // Fetch nearby drivers when pickup changes
  useEffect(() => {
    if (!pickup || !token || step !== "select") return

    fetch(`/api/drivers/nearby?lat=${pickup.lat}&lng=${pickup.lng}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setNearbyDrivers(data.data.drivers)
      })
      .catch(() => {})
  }, [pickup, token, step])

  // Listen for real-time driver location updates
  useEffect(() => {
    if (step !== "active" || !rideId) return

    const unsub = on("rideTracking", (data: unknown) => {
      const d = data as { rideId: string; lat: number; lng: number; speed?: number }
      if (d.rideId === rideId) {
        setDriverLocation({ lat: d.lat, lng: d.lng, speed: d.speed })
      }
    })

    const unsubAccepted = on("rideAccepted", (data: unknown) => {
      const d = data as { rideId: string; driverId: string }
      if (d.rideId === rideId) {
        setNotification({ message: "🎉 Driver has accepted your ride!", type: "success" })
      }
    })

    const unsubMsg = on("newMessage", (data: unknown) => {
      const m = data as { rideId: string; senderId: string; senderName: string; content: string; createdAt: string }
      if (m.rideId === rideId) {
        setChatMessages((prev) => [...prev, m])
      }
    })

    return () => {
      unsub?.()
      unsubAccepted?.()
      unsubMsg?.()
    }
  }, [step, rideId, on])

  // Calculate ETA based on driver speed
  useEffect(() => {
    if (!driverLocation || !pickup || !dropoff) {
      setDriverEta(null)
      return
    }

    const distToPickup = haversineDistance(
      { lat: driverLocation.lat, lng: driverLocation.lng },
      { lat: pickup.lat, lng: pickup.lng }
    )
    const distToDropoff = haversineDistance(
      { lat: pickup.lat, lng: pickup.lng },
      { lat: dropoff.lat, lng: dropoff.lng }
    )

    const speed = driverLocation.speed || 30
    const minsToPickup = speed > 0 ? (distToPickup / speed) * 60 : 0
    const minsToDropoff = speed > 0 ? ((distToPickup + distToDropoff) / speed) * 60 : 0

    setDriverEta({
      toPickup: minsToPickup < 1 ? "Arriving" : `${Math.round(minsToPickup)} min`,
      toDropoff: `${Math.round(minsToDropoff)} min`,
    })
  }, [driverLocation, pickup, dropoff])

  // Handle map click to set dropoff location
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (step === "select") {
      setDropoff({ lat, lng })
      setDropoffAddr(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }
  }, [step])

  // Request the ride
  const handleRequestRide = async () => {
    if (!pickup || !dropoff || !token) return

    setStep("matching")
    setError("")

    try {
      const res = await fetch("/api/rides/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          pickupAddr: pickupAddr || `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`,
          dropoffLat: dropoff.lat,
          dropoffLng: dropoff.lng,
          dropoffAddr: dropoffAddr || `${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to request ride")
        setStep("confirm")
        return
      }

      setRideId(data.data.ride.id)
      setFare(data.data.ride.fare)

      if (data.data.matchedDriver) {
        setMatchedDriver(data.data.matchedDriver)
        emit("requestMatch", {
          rideId: data.data.ride.id,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
        })
        setNotification({ message: `🚗 ${data.data.matchedDriver.name} is heading to you!`, type: "success" })
        setStep("active")
      } else {
        // No driver found - still create the ride but let the user know
        setMatchedDriver(null)
        setStep("active")
      }
    } catch {
      setError("An error occurred. Please try again.")
      setStep("confirm")
    }
  }

  // Complete the ride
  const handleCompleteRide = async () => {
    if (!rideId || !token) return

    try {
      await fetch(`/api/rides/${rideId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "COMPLETED" }),
      })

      setStep("complete")
    } catch {
      setError("An error occurred completing the ride")
    }
  }

  // Submit rating
  const handleSubmitRating = async (score: number, comment: string) => {
    if (!currentRideId || !currentDriverId || !token) return

    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rideId: currentRideId,
          toUserId: currentDriverId,
          score,
          comment,
        }),
      })
      setShowRating(false)
    } catch {
      // Ignore rating errors
    }
  }

  if (!pickup) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading location...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Request a Ride</h1>

      {step === "select" && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Click on the map to set your dropoff location. Your current location
            is used as the pickup point.
          </p>

          {/* Location inputs */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
            <LocationSearch
              value={pickupAddr}
              onChange={(val) => { setPickupAddr(val); if (!val.trim()) setPickup(null) }}
              onSelect={(town: Town) => {
                setPickup({ lat: town.lat, lng: town.lng })
                setPickupAddr(town.name)
              }}
              placeholder="Search pickup town or city"
              label="PICKUP"
              color="emerald"
            />
            <LocationSearch
              value={dropoffAddr}
              onChange={(val) => { setDropoffAddr(val); if (!val.trim()) setDropoff(null) }}
              onSelect={(town: Town) => {
                setDropoff({ lat: town.lat, lng: town.lng })
                setDropoffAddr(town.name)
              }}
              placeholder="Search dropoff town or city"
              label="DROPOFF"
              color="red"
            />
          </div>

          {/* Map */}
          <Map
            pickup={pickup}
            dropoff={dropoff}
            nearbyDrivers={nearbyDrivers}
            driverLocation={driverLocation}
            onClick={handleMapClick}
            height="400px"
          />

          {/* Fare estimate banner - shows as soon as both locations are set */}
          {pickup && dropoff && fare && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 font-medium">ESTIMATED FARE</p>
                <p className="text-xs text-emerald-500">
                  Base + distance + time
                </p>
              </div>
              <p className="text-2xl font-bold text-emerald-700">₵{fare.toFixed(2)}</p>
            </div>
          )}

          {/* Request ride button */}
          <button
            onClick={() => setStep("confirm")}
            disabled={!dropoff}
            className={`mt-4 w-full py-3 text-sm font-semibold text-white rounded-xl ${
              dropoff
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {dropoff ? "Confirm & Request Ride" : "Select a dropoff location on the map"}
          </button>
        </>
      )}

      {step === "confirm" && pickup && dropoff && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Confirm Your Ride
          </h2>

          {/* Route summary */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-400">Pickup</p>
                <p className="text-sm text-gray-700">
                  {pickupAddr || `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-400">Dropoff</p>
                <p className="text-sm text-gray-700">
                  {dropoffAddr || `${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Estimated fare */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Estimated Fare</span>
              <span className="text-xl font-bold text-gray-900">
                ₵{fare ? fare.toFixed(2) : "---"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Base fare + distance + time. Final fare may vary slightly.
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => setStep("select")}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Edit
            </button>
            <button
              onClick={handleRequestRide}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
            >
              Request Ride
            </button>
          </div>
        </div>
      )}

      {step === "matching" && (
        <div className="text-center py-20">
          <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Finding your driver...
          </h2>
          <p className="text-sm text-gray-500">
            Searching for available drivers near your location
          </p>
        </div>
      )}

      {step === "active" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {matchedDriver ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🚗</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Driver Found!
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {matchedDriver.name} is heading to your location
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {matchedDriver.distance.toFixed(1)} km away
                </p>
              </div>

              {/* Driver speed & ETA */}
              {driverLocation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] text-blue-500 font-medium uppercase">Speed</p>
                      <p className="text-lg font-bold text-blue-700">{driverLocation.speed || 0} <span className="text-xs font-normal">km/h</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-blue-500 font-medium uppercase">ETA to You</p>
                      <p className="text-lg font-bold text-blue-700">{driverEta?.toPickup || "---"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-blue-500 font-medium uppercase">ETA to Dropoff</p>
                      <p className="text-lg font-bold text-blue-700">{driverEta?.toDropoff || "---"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ride info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fare</span>
                  <span className="text-lg font-semibold">
                    ₵{fare?.toFixed(2) || "---"}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">Ride ID</span>
                  <span className="text-sm text-gray-500">
                    {rideId?.slice(0, 8)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowChat(true)}
                  className="flex-1 py-3 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                >
                  💬 Chat
                </button>
                {matchedDriver.phone && (
                  <a
                    href={`tel:${matchedDriver.phone}`}
                    className="flex-1 py-3 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 text-center block"
                  >
                    📞 Call
                  </a>
                )}
              </div>
              <button
                onClick={handleCompleteRide}
                className="w-full mt-3 py-3 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
              >
                Complete Ride
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">😕</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                No drivers available
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                There are no drivers online near you right now. Please try again later.
              </p>
              <button
                onClick={() => setStep("select")}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chat box */}
      {showChat && rideId && userId && (
        <ChatBox
          rideId={rideId}
          userId={userId}
          userName={userName}
          otherName={matchedDriver?.name || "Driver"}
          onSendMessage={(content) => {
            emit("sendMessage", {
              rideId,
              senderId: userId,
              senderName: userName,
              content,
              receiverId: matchedDriver?.id,
            })
          }}
          onClose={() => setShowChat(false)}
          initialMessages={chatMessages}
        />
      )}

      {step === "complete" && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Ride Complete!
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Thank you for riding with RideSwift
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setCurrentRideId(rideId || "")
                setCurrentDriverId(matchedDriver?.id || "")
                setShowRating(true)
              }}
              className="px-6 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100"
            >
              ★ Rate Your Driver
            </button>
            <button
              onClick={() => {
                setStep("select")
                setDropoff(null)
                setDropoffAddr("")
                setFare(null)
                setRideId(null)
                setMatchedDriver(null)
              }}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
            >
              Request Another Ride
            </button>
          </div>
        </div>
      )}

      {/* Rating modal */}
      <RatingModal
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        onSubmit={handleSubmitRating}
        driverName={matchedDriver?.name}
      />

      {/* Notifications */}
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
