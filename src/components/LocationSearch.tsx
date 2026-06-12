"use client"

import { useState, useRef, useEffect } from "react"
import { ghanaTowns, searchTowns } from "@/data/ghana-towns"
import type { Town } from "@/data/ghana-towns"

type LocationSearchProps = {
  value: string
  onChange: (value: string) => void
  onSelect: (town: Town) => void
  placeholder?: string
  label?: string
  color?: "emerald" | "red" | "blue"
}

export default function LocationSearch({
  value,
  onChange,
  onSelect,
  placeholder = "Search for a town or city",
  label,
  color = "emerald",
}: LocationSearchProps) {
  const [suggestions, setSuggestions] = useState<Town[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const colorMap = {
    emerald: { dot: "bg-emerald-500", focus: "focus:border-emerald-500" },
    red: { dot: "bg-red-500", focus: "focus:border-red-500" },
    blue: { dot: "bg-blue-500", focus: "focus:border-blue-500" },
  }

  const colors = colorMap[color]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleInputChange(val: string) {
    onChange(val)
    const results = searchTowns(val)
    setSuggestions(results)
    setShowDropdown(results.length > 0)
    setActiveIndex(-1)
  }

  function handleSelect(town: Town) {
    onChange(town.name)
    onSelect(town)
    setShowDropdown(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      )
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    } else if (e.key === "Escape") {
      setShowDropdown(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 ${colors.dot} rounded-full mt-2.5 flex-shrink-0`} />
        <div className="flex-1">
          {label && <label className="text-xs text-gray-400">{label}</label>}
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full text-sm text-gray-700 bg-transparent border-b border-gray-200 py-1 focus:outline-none ${colors.focus}`}
          />
        </div>
      </div>

      {showDropdown && (
        <div className="absolute z-50 left-7 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((town, index) => (
            <button
              key={`${town.name}-${town.lat}`}
              type="button"
              onClick={() => handleSelect(town)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between ${
                index === activeIndex
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div>
                <span className="font-medium">{town.name}</span>
                <span className="text-gray-400 ml-2 text-xs">{town.region}</span>
              </div>
              <span className="text-xs text-gray-400">
                {town.lat.toFixed(2)}, {town.lng.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
