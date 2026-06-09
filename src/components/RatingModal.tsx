// RatingModal component - allows users to rate their ride experience
// Shows star selection and optional comment field

"use client"

import { useState } from "react"

type RatingModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (score: number, comment: string) => void
  driverName?: string
}

export default function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  driverName = "the driver",
}: RatingModalProps) {
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState("")
  const [hoveredStar, setHoveredStar] = useState(0)

  if (!isOpen) return null

  const handleSubmit = () => {
    if (score === 0) return // Require at least 1 star
    onSubmit(score, comment)
    // Reset state
    setScore(0)
    setComment("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Rate your ride
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          How was your experience with {driverName}?
        </p>

        {/* Star rating */}
        <div className="flex justify-center space-x-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setScore(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="text-3xl transition-colors focus:outline-none"
            >
              {star <= (hoveredStar || score) ? (
                <span className="text-amber-400">★</span>
              ) : (
                <span className="text-gray-300">★</span>
              )}
            </button>
          ))}
        </div>

        {/* Comment field */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your feedback (optional)..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          rows={3}
        />

        {/* Action buttons */}
        <div className="flex space-x-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={score === 0}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg ${
              score === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  )
}
