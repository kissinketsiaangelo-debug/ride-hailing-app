// Rider trip history page

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import RideCard from "@/components/RideCard"

type Ride = {
  id: string
  pickupAddr: string | null
  dropoffAddr: string | null
  pickupLat: number
  pickupLng: number
  dropoffLat: number
  dropoffLng: number
  status: string
  fare: number | null
  createdAt: string
  driver?: { id: string; name: string } | null
}

export default function RiderHistoryPage() {
  const router = useRouter()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    const user = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (!user || !token) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(user)
    if (userData.role !== "RIDER") {
      router.push("/driver")
      return
    }

    fetchRides(token)
  }, [router])

  const fetchRides = async (token: string) => {
    try {
      // In a real app, we'd have a GET /api/rides endpoint
      // For now, we show a demo empty state
      setRides([])
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }

  const filteredRides =
    filter === "all"
      ? rides
      : rides.filter((r) => r.status === filter.toUpperCase())

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip History</h1>
          <p className="text-sm text-gray-500 mt-1">
            View all your past rides and deliveries
          </p>
        </div>
        <Link
          href="/rider/request"
          className="text-sm bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600"
        >
          New Ride
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {["all", "COMPLETED", "CANCELLED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm rounded-full whitespace-nowrap ${
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
      ) : filteredRides.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No trips yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            When you take a ride, it will appear here
          </p>
          <Link
            href="/rider/request"
            className="inline-block px-6 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
          >
            Request a Ride
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRides.map((ride) => (
            <RideCard key={ride.id} ride={ride} type="ride" showActions />
          ))}
        </div>
      )}
    </div>
  )
}
