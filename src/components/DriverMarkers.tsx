"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

type DriverData = {
  id: string
  name: string
  lat: number
  lng: number
  speed: number
  vehicle?: {
    make: string
    model: string
    color: string
    plate: string
    type: string
  }
}

type DriverMarkersProps = {
  map: L.Map | null
  drivers: DriverData[]
  pickup?: { lat: number; lng: number } | null
  dropoff?: { lat: number; lng: number } | null
}

function createDriverIcon(driver: DriverData) {
  const vehicleStr = driver.vehicle
    ? `${driver.vehicle.color} ${driver.vehicle.make} ${driver.vehicle.model}`
    : ""

  return L.divIcon({
    className: "driver-marker",
    html: `
      <div style="
        background:#3b82f6; color:white; padding:6px 10px; border-radius:12px;
        font-size:11px; font-weight:bold; white-space:nowrap;
        border:2px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.3);
        display:flex; align-items:center; gap:4px;
      ">
        🚗 ${driver.name.split(" ")[0]}
        ${driver.speed ? `<span style="font-size:10px;opacity:0.8">${driver.speed} km/h</span>` : ""}
      </div>
      ${vehicleStr ? `<div style="font-size:9px;color:#3b82f6;text-align:center;margin-top:2px;font-weight:500;background:white;padding:1px 6px;border-radius:4px;display:inline-block">${vehicleStr}</div>` : ""}
    `,
    iconSize: [0, 0],
    iconAnchor: [60, 20],
  })
}

export default function DriverMarkers({ map, drivers, pickup, dropoff }: DriverMarkersProps) {
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    drivers.forEach((driver) => {
      const icon = createDriverIcon(driver)
      const marker = L.marker([driver.lat, driver.lng], { icon }).addTo(map)
      marker.bindPopup(`
        <div style="font-size:13px;min-width:150px">
          <b>${driver.name}</b><br/>
          ${driver.vehicle ? `<span style="color:#666">${driver.vehicle.color} ${driver.vehicle.make} ${driver.vehicle.model}</span><br/><span style="color:#999;font-size:11px">${driver.vehicle.plate}</span><br/>` : ""}
          <span style="color:#3b82f6">⚡ ${driver.speed || 0} km/h</span>
        </div>
      `)
      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [map, drivers])

  return null
}
