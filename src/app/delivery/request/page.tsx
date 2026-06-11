"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { calculateDeliveryFee } from "@/lib/fare"

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-400">Loading map...</p>
    </div>
  ),
})

const DEFAULT_LOCATION = { lat: 5.6037, lng: -0.1870 }

export default function RequestDeliveryPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [pickup, setPickup] = useState<{ lat: number; lng: number } | null>(null)
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number } | null>(null)
  const [pickupAddr, setPickupAddr] = useState("")
  const [dropoffAddr, setDropoffAddr] = useState("")
  const [setting, setSetting] = useState<"pickup" | "dropoff">("pickup")
  const [packageDesc, setPackageDesc] = useState("")
  const [packageWeight, setPackageWeight] = useState("")
  const [step, setStep] = useState<"select" | "confirm" | "submitting" | "done">("select")
  const [fee, setFee] = useState<number | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    if (!storedToken || !storedUser) {
      router.push("/login")
      return
    }
    setToken(storedToken)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPickup({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setPickupAddr(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`)
        },
        () => setPickup(DEFAULT_LOCATION)
      )
    } else {
      setPickup(DEFAULT_LOCATION)
    }
  }, [router])

  useEffect(() => {
    if (pickup && dropoff) {
      const w = parseFloat(packageWeight) || 0
      const estimatedFee = calculateDeliveryFee(pickup, dropoff, w)
      setFee(Math.round(estimatedFee * 100) / 100)
    } else {
      setFee(null)
    }
  }, [pickup, dropoff, packageWeight])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (step !== "select") return
    if (setting === "pickup") {
      setPickup({ lat, lng })
      setPickupAddr(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    } else {
      setDropoff({ lat, lng })
      setDropoffAddr(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }
  }, [step, setting])

  const resetLocations = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPickup({ lat: position.coords.latitude, lng: position.coords.longitude })
          setPickupAddr(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`)
        },
        () => setPickup(DEFAULT_LOCATION)
      )
    } else {
      setPickup(DEFAULT_LOCATION)
    }
    setDropoff(null)
    setDropoffAddr("")
    setSetting("pickup")
  }

  const handleSubmit = async () => {
    if (!pickup || !dropoff || !token) return

    setStep("submitting")
    setError("")

    try {
      const res = await fetch("/api/deliveries", {
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
          packageDesc: packageDesc || null,
          packageWeight: packageWeight ? parseFloat(packageWeight) : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create delivery")
        setStep("confirm")
        return
      }

      setFee(data.data.fee)
      setStep("done")
    } catch {
      setError("An error occurred. Please try again.")
      setStep("confirm")
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Send a Package
      </h1>

      {step === "select" && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Click on the map to set locations. Toggle between pickup and dropoff.
          </p>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2.5 flex-shrink-0" />
              <div className="flex-1">
                <label className="text-xs text-gray-400">PICKUP</label>
                <input
                  type="text"
                  value={pickupAddr}
                  onChange={(e) => setPickupAddr(e.target.value)}
                  placeholder={pickup ? "Pickup address" : "Click map to set pickup"}
                  className="w-full text-sm text-gray-700 bg-transparent border-b border-gray-200 py-1 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={() => setSetting("pickup")}
                className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${
                  setting === "pickup"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {setting === "pickup" ? "Setting..." : "Set"}
              </button>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2.5 flex-shrink-0" />
              <div className="flex-1">
                <label className="text-xs text-gray-400">DROPOFF</label>
                <input
                  type="text"
                  value={dropoffAddr}
                  onChange={(e) => setDropoffAddr(e.target.value)}
                  placeholder={dropoff ? "Dropoff address" : "Click map to set dropoff"}
                  className="w-full text-sm text-gray-700 bg-transparent border-b border-gray-200 py-1 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={() => setSetting("dropoff")}
                className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${
                  setting === "dropoff"
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {setting === "dropoff" ? "Setting..." : "Set"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Package Details</h3>
            <input
              type="text"
              value={packageDesc}
              onChange={(e) => setPackageDesc(e.target.value)}
              placeholder="What are you sending? (e.g., Documents, Food, Electronics)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              value={packageWeight}
              onChange={(e) => setPackageWeight(e.target.value)}
              placeholder="Weight (kg) - optional"
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <Map
            pickup={pickup}
            dropoff={dropoff}
            onClick={handleMapClick}
            height="350px"
          />

          {pickup && dropoff && fee && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">ESTIMATED FEE</p>
                <p className="text-xs text-blue-500">
                  Distance + weight surcharge
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-700">₵{fee.toFixed(2)}</p>
            </div>
          )}

          {pickup && dropoff && (
            <button
              onClick={() => setStep("confirm")}
              className="mt-4 w-full py-3 text-sm font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-600"
            >
              Continue
            </button>
          )}
        </>
      )}

      {step === "confirm" && pickup && dropoff && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Confirm Delivery
          </h2>

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
            {packageDesc && (
              <div className="flex items-start space-x-3">
                <span className="text-sm">📦</span>
                <div>
                  <p className="text-sm text-gray-400">Package</p>
                  <p className="text-sm text-gray-700">
                    {packageDesc}
                    {packageWeight && ` (${packageWeight} kg)`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Estimated Fee</span>
              <span className="text-xl font-bold text-gray-900">
                ₵{fee?.toFixed(2) || "---"}
              </span>
            </div>
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
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Send Package
            </button>
          </div>
        </div>
      )}

      {step === "submitting" && (
        <div className="text-center py-20">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Submitting your delivery...
          </h2>
          <p className="text-sm text-gray-500">
            Finding a driver to pick up your package
          </p>
        </div>
      )}

      {step === "done" && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Delivery Created!
          </h2>
          <p className="text-sm text-gray-500 mb-2">
            Your package will be picked up soon
          </p>
          {fee && (
            <p className="text-lg font-bold text-gray-900 mb-6">
              Fee: ₵{fee.toFixed(2)}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setStep("select")
                resetLocations()
                setPackageDesc("")
                setPackageWeight("")
                setFee(null)
              }}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Send Another Package
            </button>
            <button
              onClick={() => router.push("/delivery")}
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              View Deliveries
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
