// Delivery page - overview of deliveries (both send and receive)

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Delivery = {
  id: string
  pickupAddr: string | null
  dropoffAddr: string | null
  packageDesc: string | null
  packageWeight: number | null
  status: string
  fee: number | null
  createdAt: string
  driverId?: string | null
}

export default function DeliveryPage() {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [userRole, setUserRole] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (!storedUser || !token) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(storedUser)
    setUserRole(userData.role)
    fetchDeliveries(token)
  }, [router])

  const fetchDeliveries = async (token: string) => {
    try {
      const res = await fetch("/api/deliveries", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  if (!mounted) return null

  const activeDeliveries = deliveries.filter(
    (d) =>
      d.status !== "DELIVERED" &&
      d.status !== "CANCELLED"
  )

  const completedDeliveries = deliveries.filter(
    (d) => d.status === "DELIVERED" || d.status === "CANCELLED"
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-sm text-gray-500 mt-1">
            Send packages or track incoming deliveries
          </p>
        </div>
        {userRole === "RIDER" && (
          <Link
            href="/delivery/request"
            className="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            New Delivery
          </Link>
        )}
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm text-blue-600 font-medium">
            Active Deliveries
          </p>
          <p className="text-2xl font-bold text-blue-800">
            {activeDeliveries.length}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-sm text-green-600 font-medium">
            Completed
          </p>
          <p className="text-2xl font-bold text-green-800">
            {completedDeliveries.length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No deliveries yet
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {userRole === "RIDER"
              ? "Send a package anywhere in the city"
              : "Deliveries will appear here when assigned"}
          </p>
          {userRole === "RIDER" && (
            <Link
              href="/delivery/request"
              className="inline-block px-6 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Send a Package
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => {
            const statusColors: Record<string, string> = {
              PENDING: "bg-yellow-100 text-yellow-700",
              ACCEPTED: "bg-blue-100 text-blue-700",
              PICKED_UP: "bg-purple-100 text-purple-700",
              IN_TRANSIT: "bg-indigo-100 text-indigo-700",
              DELIVERED: "bg-green-100 text-green-700",
              CANCELLED: "bg-red-100 text-red-700",
            }
            const statusLabel: Record<string, string> = {
              PENDING: "Pending",
              ACCEPTED: "Accepted",
              PICKED_UP: "Picked Up",
              IN_TRANSIT: "In Transit",
              DELIVERED: "Delivered",
              CANCELLED: "Cancelled",
            }

            return (
              <div
                key={delivery.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500">
                    Delivery #{delivery.id.slice(0, 8)}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      statusColors[delivery.status] || "bg-gray-100"
                    }`}
                  >
                    {statusLabel[delivery.status] || delivery.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    📍 From: {delivery.pickupAddr || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    📍 To: {delivery.dropoffAddr || "N/A"}
                  </p>
                  {delivery.packageDesc && (
                    <p className="text-gray-600">
                      📦 {delivery.packageDesc}
                      {delivery.packageWeight && ` (${delivery.packageWeight} kg)`}
                    </p>
                  )}
                </div>
                {delivery.fee && (
                  <p className="text-sm font-semibold text-gray-900 mt-2">
                    Fee: ${delivery.fee.toFixed(2)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
