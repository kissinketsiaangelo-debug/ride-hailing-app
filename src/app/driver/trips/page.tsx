// Driver trip history page

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Trip = {
  id: string
  pickupAddr: string | null
  dropoffAddr: string | null
  status: string
  fare: number | null
  createdAt: string
  rider?: { name: string }
}

export default function DriverTripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const user = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (!user || !token) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(user)
    if (userData.role !== "DRIVER") {
      router.push("/rider")
      return
    }

    setLoading(false)
  }, [router])

  const filteredTrips =
    filter === "all"
      ? trips
      : trips.filter((t) => t.status === filter.toUpperCase())

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip History</h1>
          <p className="text-sm text-gray-500 mt-1">
            View all your completed and cancelled trips
          </p>
        </div>
        <Link
          href="/driver"
          className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-2 mb-6">
        {["all", "COMPLETED", "CANCELLED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm rounded-full ${
              filter === f
                ? "bg-emerald-100 text-emerald-700 font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">🚗</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No trips yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Go online to start receiving ride requests
          </p>
          <Link
            href="/driver"
            className="inline-block px-6 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500">
                  Trip #{trip.id.slice(0, 8)}
                </span>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    trip.status === "COMPLETED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {trip.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {trip.pickupAddr || "N/A"} → {trip.dropoffAddr || "N/A"}
              </p>
              {trip.fare && (
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  Fare: ${trip.fare.toFixed(2)}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(trip.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
