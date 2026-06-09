// Rider dashboard - overview of recent rides and quick actions

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

export default function RiderDashboard() {
  const router = useRouter()
  const [rides, setRides] = useState<Ride[]>([])
  const [userName, setUserName] = useState("")
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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

    setUserName(userData.name)

    // Fetch recent rides
    fetchRides(token)
  }, [router])

  const fetchRides = async (token: string) => {
    try {
      const res = await fetch("/api/rides/request", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      // Since GET /api/rides doesn't exist yet, we'll just show a message
      // In a full implementation, you'd have a GET endpoint for rides
      setRides([])
    } catch {
      // Ignore errors - rides endpoint is for POST only
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Hello, {userName} 👋
        </h1>
        <p className="text-gray-500 mt-1">Where are you headed today?</p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <Link
          href="/rider/request"
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all"
        >
          <div className="text-3xl mb-3">🚗</div>
          <h2 className="text-lg font-semibold">Request a Ride</h2>
          <p className="text-sm text-emerald-100 mt-1">
            Get picked up and dropped off anywhere in the city
          </p>
          <div className="mt-4 text-sm font-medium text-emerald-200">
            Book now →
          </div>
        </Link>

        <Link
          href="/delivery"
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          <div className="text-3xl mb-3">📦</div>
          <h2 className="text-lg font-semibold">Send a Package</h2>
          <p className="text-sm text-blue-100 mt-1">
            Fast and tracked delivery service for your packages
          </p>
          <div className="mt-4 text-sm font-medium text-blue-200">
            Send now →
          </div>
        </Link>
      </div>

      {/* Active ride (if any) */}
      {rides.filter((r) => r.status === "PENDING" || r.status === "ACCEPTED" || r.status === "STARTED").length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Ride
          </h2>
          {rides
            .filter(
              (r) =>
                r.status === "PENDING" ||
                r.status === "ACCEPTED" ||
                r.status === "STARTED"
            )
            .map((ride) => (
              <RideCard key={ride.id} ride={ride} type="ride" />
            ))}
        </div>
      )}

      {/* Recent rides */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Rides</h2>
          <Link
            href="/rider/history"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            View all
          </Link>
        </div>

        {rides.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl mb-3">🚗</div>
            <p className="text-gray-500">No rides yet</p>
            <Link
              href="/rider/request"
              className="inline-block mt-3 text-sm text-emerald-600 font-medium hover:text-emerald-700"
            >
              Request your first ride
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {rides.map((ride) => (
            <RideCard key={ride.id} ride={ride} type="ride" showActions />
          ))}
        </div>
      </div>
    </div>
  )
}
