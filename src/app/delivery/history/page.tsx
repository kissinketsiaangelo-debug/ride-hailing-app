// Delivery history page - shows past deliveries

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function DeliveryHistoryPage() {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")

    if (!token || !user) {
      router.push("/login")
      return
    }

    fetchDeliveries(token)
  }, [router])

  const fetchDeliveries = async (token: string) => {
    try {
      const res = await fetch("/api/deliveries", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setDeliveries(data.data || [])
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Delivery History</h1>
        <Link
          href="/delivery"
          className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
        >
          ← Back
        </Link>
      </div>

      {deliveries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No delivery history
          </h3>
          <p className="text-sm text-gray-500">
            Your past deliveries will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery: any) => (
            <div
              key={delivery.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <p className="text-xs text-gray-500">
                #{delivery.id.slice(0, 8)} - {delivery.status}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {delivery.pickupAddr || "N/A"} → {delivery.dropoffAddr || "N/A"}
              </p>
              {delivery.fee && (
                <p className="text-sm font-semibold mt-1">
                  ₦{delivery.fee.toFixed(2)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
