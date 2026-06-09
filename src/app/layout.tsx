// Root layout with Navbar integration

import type { Metadata } from "next"
import "./globals.css"
import NavbarWrapper from "./NavbarWrapper"

export const metadata: Metadata = {
  title: "RideSwift - Ride Hailing & Delivery",
  description:
    "A full-stack ride-hailing system with GPS tracking, real-time matching, payments, and delivery support.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50">
        <NavbarWrapper />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  )
}
