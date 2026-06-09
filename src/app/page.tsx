// Landing page for RideSwift - ride hailing and delivery platform

"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      setIsLoggedIn(true)
      setUserRole(JSON.parse(user).role)
    }
  }, [])

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Your Ride, Your Way
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100 mb-10">
              Fast, reliable ride-hailing and delivery service with real-time GPS
              tracking and instant driver matching. Get where you need to go, or
              send packages with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                <Link
                  href={userRole === "DRIVER" ? "/driver" : "/rider"}
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors text-lg"
                >
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors text-lg"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-8 py-4 bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-800 transition-colors text-lg border border-emerald-400"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need, all in one platform
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon="📍"
              title="GPS Tracking"
              description="Real-time location tracking for both riders and drivers. Know exactly where your ride is."
            />
            <FeatureCard
              icon="⚡"
              title="Instant Matching"
              description="Smart algorithm connects you with the nearest available driver in seconds."
            />
            <FeatureCard
              icon="💳"
              title="In-App Payments"
              description="Seamless cashless payments. Pay securely through the app after each ride."
            />
            <FeatureCard
              icon="📦"
              title="Deliveries"
              description="Send packages anywhere. Track deliveries in real-time from pickup to dropoff."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <StepCard
              number="1"
              title="Request"
              description="Enter your pickup and dropoff locations on the interactive map."
            />
            <StepCard
              number="2"
              title="Match"
              description="We find the nearest available driver and notify them instantly."
            />
            <StepCard
              number="3"
              title="Ride & Rate"
              description="Track your ride in real-time, pay securely, and rate your experience."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatCard value="10K+" label="Rides Completed" />
            <StatCard value="500+" label="Active Drivers" />
            <StatCard value="4.8" label="Average Rating" />
            <StatCard value="50+" label="Cities Covered" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>© 2026 RideSwift. All rights reserved.</p>
          <p className="mt-1 text-xs">
            Built with Next.js, React, Node.js, and Socket.io
          </p>
        </div>
      </footer>
    </div>
  )
}

// Feature card component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

// Step card component
function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 max-w-xs mx-auto">{description}</p>
    </div>
  )
}

// Stat card component
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-emerald-200 mt-1">{label}</div>
    </div>
  )
}
