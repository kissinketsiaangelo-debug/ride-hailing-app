// Map component using Leaflet for displaying locations and tracking
// Supports: pickup/dropoff markers, nearby drivers, real-time tracking

"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = defaultIcon

const pickupIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#10b981;color:white;padding:4px 8px;border-radius:8px;font-size:12px;font-weight:bold;white-space:nowrap;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">PICKUP</div>`,
  iconSize: [0, 0],
  iconAnchor: [30, 15],
})

const dropoffIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#ef4444;color:white;padding:4px 8px;border-radius:8px;font-size:12px;font-weight:bold;white-space:nowrap;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">DROPOFF</div>`,
  iconSize: [0, 0],
  iconAnchor: [35, 15],
})

const driverIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#3b82f6;color:white;padding:4px 8px;border-radius:8px;font-size:12px;font-weight:bold;white-space:nowrap;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">🚗 DRIVER</div>`,
  iconSize: [0, 0],
  iconAnchor: [35, 15],
})

function nearbyDriverIcon(name: string, speed: number) {
  return L.divIcon({
    className: "nearby-driver",
    html: `<div style="background:#3b82f6;color:white;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:bold;white-space:nowrap;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">🚗 ${name.split(" ")[0]}${speed > 0 ? ` ${speed}km/h` : ""}</div>`,
    iconSize: [0, 0],
    iconAnchor: [40, 15],
  })
}

type NearbyDriver = {
  id: string
  name: string
  lat: number
  lng: number
  speed?: number
  vehicle?: { make: string; model: string; color: string; plate: string; type: string }
}

type MapProps = {
  center?: [number, number]
  zoom?: number
  height?: string
  pickup?: { lat: number; lng: number } | null
  dropoff?: { lat: number; lng: number } | null
  driverLocation?: { lat: number; lng: number; speed?: number } | null
  nearbyDrivers?: NearbyDriver[]
  onClick?: (lat: number, lng: number) => void
  className?: string
}

export default function Map({
  center = [5.6037, -0.1870],
  zoom = 12,
  height = "400px",
  pickup,
  dropoff,
  driverLocation,
  nearbyDrivers = [],
  onClick,
  className = "",
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    // Initialize the map only once
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
    })

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    // Handle map clicks for selecting locations
    if (onClick) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        onClick(e.latlng.lat, e.latlng.lng)
      })
    }

    mapRef.current = map

    // Cleanup on unmount
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers when props change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    if (pickup) {
      const marker = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup("Pickup Location")
      markersRef.current.push(marker)
    }

    if (dropoff) {
      const marker = L.marker([dropoff.lat, dropoff.lng], { icon: dropoffIcon })
        .addTo(map)
        .bindPopup("Dropoff Location")
      markersRef.current.push(marker)
    }

    // Nearby available drivers
    nearbyDrivers.forEach((driver) => {
      const marker = L.marker([driver.lat, driver.lng], {
        icon: nearbyDriverIcon(driver.name, driver.speed || 0),
      })
        .addTo(map)
        .bindPopup(
          `<div><b>${driver.name}</b><br/>${
            driver.vehicle
              ? `${driver.vehicle.color} ${driver.vehicle.make} ${driver.vehicle.model}<br/>${driver.vehicle.plate}`
              : "Driver"
          }</div>`
        )
      markersRef.current.push(marker)
    })

    if (driverLocation) {
      const marker = L.marker([driverLocation.lat, driverLocation.lng], {
        icon: driverIcon,
      })
        .addTo(map)
        .bindPopup(
          `Driver${driverLocation.speed ? `<br/>⚡ ${driverLocation.speed} km/h` : ""}`
        )
      markersRef.current.push(marker)
    }

    if (pickup && dropoff) {
      const bounds = L.latLngBounds(
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng]
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    } else if (pickup && driverLocation) {
      const bounds = L.latLngBounds(
        [pickup.lat, pickup.lng],
        [driverLocation.lat, driverLocation.lng]
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    } else if (nearbyDrivers.length > 0 && pickup) {
      const allPoints = nearbyDrivers.map((d) => [d.lat, d.lng] as [number, number])
      allPoints.push([pickup.lat, pickup.lng])
      const bounds = L.latLngBounds(allPoints)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [pickup, dropoff, driverLocation, nearbyDrivers])

  return (
    <div
      ref={mapContainerRef}
      className={`rounded-lg overflow-hidden border border-gray-200 ${className}`}
      style={{ height, width: "100%" }}
    />
  )
}
