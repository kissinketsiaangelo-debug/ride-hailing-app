const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
})

const connectedUsers = new Map()
const driverLocations = new Map()

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`)

  socket.on("register", ({ userId, role }) => {
    connectedUsers.set(userId, { socketId: socket.id, role })
    socket.data.userId = userId
    socket.data.role = role
    console.log(`[Socket] ${role} registered: ${userId}`)
  })

  socket.on("updateLocation", ({ userId, lat, lng, speed }) => {
    const prev = driverLocations.get(userId)
    const calculatedSpeed = speed || 0
    driverLocations.set(userId, { lat, lng, speed: calculatedSpeed })

    io.emit("driverLocationUpdate", {
      driverId: userId,
      lat,
      lng,
      speed: calculatedSpeed,
    })
  })

  socket.on("requestMatch", ({ rideId, pickupLat, pickupLng }) => {
    const nearbyDrivers = []
    driverLocations.forEach((loc, driverId) => {
      const dist = haversine(pickupLat, pickupLng, loc.lat, loc.lng)
      if (dist <= 10) nearbyDrivers.push(driverId)
    })

    nearbyDrivers.forEach((driverId) => {
      const user = connectedUsers.get(driverId)
      if (user) {
        io.to(user.socketId).emit("newRideRequest", { rideId, pickupLat, pickupLng })
      }
    })
  })

  socket.on("acceptRide", ({ rideId, driverId, riderId }) => {
    const rider = connectedUsers.get(riderId)
    if (rider) {
      io.to(rider.socketId).emit("rideAccepted", { rideId, driverId })
    }
    const driver = connectedUsers.get(driverId)
    if (driver) {
      io.to(driver.socketId).emit("rideAccepted", { rideId, driverId })
    }
  })

  socket.on("trackRide", ({ rideId, lat, lng, speed, riderId }) => {
    const rider = connectedUsers.get(riderId)
    if (rider) {
      io.to(rider.socketId).emit("rideTracking", { rideId, lat, lng, speed })
    }
  })

  socket.on("sendMessage", ({ rideId, senderId, senderName, content }) => {
    const receiverRole = socket.data.role === "DRIVER" ? "RIDER" : "DRIVER"
    const sender = connectedUsers.get(senderId)
    connectedUsers.forEach((user, userId) => {
      if (userId !== senderId && user.role === receiverRole) {
        const rideUser = connectedUsers.get(senderId)
        if (rideUser) {
          io.to(user.socketId).emit("newMessage", {
            rideId,
            senderId,
            senderName,
            content,
            createdAt: new Date().toISOString(),
          })
        }
      }
    })
  })

  socket.on("disconnect", () => {
    const userId = socket.data.userId
    if (userId) {
      connectedUsers.delete(userId)
      driverLocations.delete(userId)
      console.log(`[Socket] Disconnected: ${userId}`)
    }
  })
})

const PORT = process.env.SOCKET_PORT || 3001
server.listen(PORT, () => {
  console.log(`[Socket] Server running on port ${PORT}`)
})
