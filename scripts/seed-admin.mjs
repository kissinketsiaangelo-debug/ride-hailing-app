// Script to create an admin account in the database
// Run with: node scripts/seed-admin.mjs

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Check if admin already exists
  const existing = await prisma.user.findUnique({
    where: { email: "admin@rideswift.app" },
  })

  if (existing) {
    console.log("Admin account already exists:")
    console.log("  Email: admin@rideswift.app")
    console.log("  Password: admin123")
    await prisma.$disconnect()
    return
  }

  // Hash the password
  const password = await bcrypt.hash("admin123", 12)

  // Create the admin user
  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@rideswift.app",
      password: password,
      role: "RIDER",
      phone: "+233000000000",
    },
  })

  console.log("Admin account created successfully!")
  console.log("  Email: admin@rideswift.app")
  console.log("  Password: admin123")
  console.log("  ID: " + admin.id)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error("Error:", e.message)
  process.exit(1)
})
