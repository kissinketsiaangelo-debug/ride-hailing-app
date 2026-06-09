// RideCard component - displays ride or delivery information in a card format
// Used in history lists, active ride tracking, and driver dashboards

"use client"

type Ride = {
  id: string
  pickupAddr?: string | null
  dropoffAddr?: string | null
  pickupLat: number
  pickupLng: number
  dropoffLat: number
  dropoffLng: number
  status: string
  fare?: number | null
  createdAt: string | Date
  driver?: { id: string; name: string } | null
  rider?: { id: string; name: string } | null
}

type Delivery = {
  id: string
  pickupAddr?: string | null
  dropoffAddr?: string | null
  packageDesc?: string | null
  packageWeight?: number | null
  status: string
  fee?: number | null
  createdAt: string | Date
  driver?: { id: string; name: string } | null
}

type RideCardProps = {
  ride?: Ride
  delivery?: Delivery
  type: "ride" | "delivery"
  showActions?: boolean
  onStatusChange?: (id: string, newStatus: string) => void
  onRate?: (rideId: string, driverId: string) => void
}

// Map statuses to human-readable labels and colors
const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  ACCEPTED: { label: "Accepted", color: "bg-blue-100 text-blue-800" },
  STARTED: { label: "In Progress", color: "bg-indigo-100 text-indigo-800" },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  PICKED_UP: { label: "Picked Up", color: "bg-purple-100 text-purple-800" },
  IN_TRANSIT: { label: "In Transit", color: "bg-indigo-100 text-indigo-800" },
  DELIVERED: { label: "Delivered", color: "bg-green-100 text-green-800" },
}

export default function RideCard({
  ride,
  delivery,
  type,
  showActions = false,
  onStatusChange,
  onRate,
}: RideCardProps) {
  const data = type === "ride" ? ride : delivery
  if (!data) return null

  const statusInfo = statusConfig[data.status] || {
    label: data.status,
    color: "bg-gray-100 text-gray-800",
  }

  const formattedDate = new Date(data.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const amount = type === "ride"
    ? (ride?.fare ?? 0)
    : (delivery?.fee ?? 0)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {type === "ride" ? "Ride" : "Delivery"} #{data.id.slice(0, 8)}
          </span>
          <span
            className={`ml-2 inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>
        </div>
        <span className="text-sm text-gray-500">{formattedDate}</span>
      </div>

      <div className="space-y-2">
        {/* Pickup address */}
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-gray-400">Pickup</span>
            <p className="text-sm text-gray-700">
              {data.pickupAddr || `${data.pickupLat.toFixed(4)}, ${data.pickupLng.toFixed(4)}`}
            </p>
          </div>
        </div>

        {/* Dropoff address */}
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-gray-400">Dropoff</span>
            <p className="text-sm text-gray-700">
              {data.dropoffAddr || `${data.dropoffLat.toFixed(4)}, ${data.dropoffLng.toFixed(4)}`}
            </p>
          </div>
        </div>

        {/* Package info for deliveries */}
        {type === "delivery" && delivery?.packageDesc && (
          <div className="flex items-start space-x-2">
            <span className="text-sm text-gray-400">📦</span>
            <div>
              <span className="text-xs text-gray-400">Package</span>
              <p className="text-sm text-gray-700">
                {delivery.packageDesc}
                {delivery.packageWeight && ` (${delivery.packageWeight} kg)`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Driver/Rider info */}
      {(ride?.driver || delivery?.driver) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Driver:</span>
            <span className="text-sm font-medium text-gray-700">
              {ride?.driver?.name || delivery?.driver?.name}
            </span>
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-900">
          {type === "ride" ? "Fare" : "Fee"}: ${amount.toFixed(2)}
        </span>

        {/* Action buttons */}
        {showActions && (
          <div className="space-x-2">
            {/* Rating button for completed rides */}
            {data.status === "COMPLETED" && type === "ride" && ride?.driver && onRate && (
              <button
                onClick={() => onRate(ride.id, ride.driver.id)}
                className="text-sm bg-amber-50 text-amber-700 px-3 py-1 rounded-lg hover:bg-amber-100"
              >
                ★ Rate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
