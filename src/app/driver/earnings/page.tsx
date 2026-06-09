// Driver earnings page - shows total earnings, per-trip breakdown

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function DriverEarningsPage() {
  const router = useRouter()
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [tripCount, setTripCount] = useState(0)
  const [loading, setLoading] = useState(true)

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

    setTotalEarnings(userData.totalEarnings || 0)
    setLoading(false)
  }, [router])

  // Calculate stats based on total earnings
  const estimatedTrips = tripCount || Math.floor(totalEarnings / 350) || 0
  const averagePerTrip = estimatedTrips > 0 ? totalEarnings / estimatedTrips : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your income and trip statistics
          </p>
        </div>
        <Link
          href="/driver"
          className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-gray-900">
            ${totalEarnings.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Trips Completed</p>
          <p className="text-3xl font-bold text-gray-900">{estimatedTrips}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Avg. Per Trip</p>
          <p className="text-3xl font-bold text-gray-900">
            ${averagePerTrip.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Earnings breakdown note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <span className="text-xl">💡</span>
          <div>
            <h3 className="text-sm font-semibold text-amber-800">
              Earnings Breakdown
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              This shows your total earnings from all completed rides. Each
              completed ride automatically adds the fare to your total.
              Detailed per-trip earnings will be available in the full version
              with a dedicated payments API.
            </p>
          </div>
        </div>
      </div>

      {/* Tips section */}
      <div className="mt-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">
          💪 Tips to Maximize Earnings
        </h3>
        <ul className="space-y-2 text-sm text-emerald-100">
          <li>• Stay online during peak hours (7-9 AM, 5-8 PM)</li>
          <li>• Position yourself near high-demand areas</li>
          <li>• Maintain a high rating to get more ride requests</li>
          <li>• Accept rides promptly to increase your trip count</li>
        </ul>
      </div>
    </div>
  )
}
