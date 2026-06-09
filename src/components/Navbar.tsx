// Navbar component - displays navigation links based on user role
// Shows different menus for riders, drivers, and unauthenticated users

"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

type User = {
  id: string
  name: string
  email: string
  role: string
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load user data from localStorage (set during login/register)
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        // Invalid user data, clear it
        localStorage.removeItem("user")
      }
    }
  }, [pathname])

  // Don't show navbar on login/register pages
  const hideNavbar = pathname === "/login" || pathname === "/register"
  if (!mounted || hideNavbar) return null

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setUser(null)
    router.push("/login")
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-bold text-xl text-gray-900">RideSwift</span>
          </Link>

          {/* Navigation links based on user role */}
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                {user.role === "RIDER" && (
                  <>
                    <NavLink href="/rider" active={pathname === "/rider"}>
                      Dashboard
                    </NavLink>
                    <NavLink href="/rider/request" active={pathname === "/rider/request"}>
                      Request Ride
                    </NavLink>
                    <NavLink href="/rider/history" active={pathname === "/rider/history"}>
                      History
                    </NavLink>
                    <NavLink href="/delivery" active={pathname.startsWith("/delivery")}>
                      Deliveries
                    </NavLink>
                  </>
                )}
                {user.role === "DRIVER" && (
                  <>
                    <NavLink href="/driver" active={pathname === "/driver"}>
                      Dashboard
                    </NavLink>
                    <NavLink href="/driver/trips" active={pathname === "/driver/trips"}>
                      Trips
                    </NavLink>
                    <NavLink href="/driver/earnings" active={pathname === "/driver/earnings"}>
                      Earnings
                    </NavLink>
                  </>
                )}
                <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                  <span className="text-sm text-gray-600">
                    {user.name}
                    <span className="ml-1 text-xs text-gray-400">
                      ({user.role === "RIDER" ? "Rider" : "Driver"})
                    </span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

// Internal NavLink component for consistent styling
function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium ${
        active
          ? "text-emerald-600 border-b-2 border-emerald-500"
          : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {children}
    </Link>
  )
}
