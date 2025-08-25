const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const { storeLocationById } = require('./redis/storeVehicleLocation')


const app = express();
const server = http.createServer(app);
const io = new Server(server);
const client = require('./redis/redisClient');


client.connect();



app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

// Route for frontend
app.get("/", (req, res) => {
  res.render("index");
});

app.get('/gps', (req, res) => {
  res.render("sendlocation");
})

// Handle socket connections
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("joinBus", async () => {
    const vechId = socket.handshake.query.vechId;
    console.log(await client.get(vechId))
    if (await client.get(vechId)) {
      socket.join(vechId);
      console.log(`Client joined bus: ${vechId}`);
      socket.emit("joinedBus", { vechId });
    } else {
      console.log(`Bus not found: ${vechId}`);
      socket.emit("joinError", { message: "Room does not exist" });
    }
  });

  socket.on("gpslocation", async (vechId, location) => {
    try {
      if (!location || isNaN(location.lat) || isNaN(location.lon)) {
        console.error("❌ Invalid location:", location);
        return socket.emit("error", { message: "Invalid location data" });
      }

      client.set(vechId, "true");

      const url = `http://localhost:5000/nearest/v1/driving/${location.lon},${location.lat}`;
      console.log("📡 OSRM request:", url);

      const response = await fetch(url);
      if (!response.ok) {
        console.error("❌ OSRM error:", response.status, response.statusText);
        return socket.emit("error", { message: `OSRM returned ${response.status}` });
      }

      const data = await response.json();
      if (!data.waypoints || !data.waypoints[0]) {
        return socket.emit("error", { message: "No waypoints returned" });
      }

      const snapped = data.waypoints[0].location;
      const [snappedLon, snappedLat] = snapped;

      storeLocationById(vechId, { lat: snappedLat, lng: snappedLon });

      socket.to(vechId).emit("location", { lat: snappedLat, lon: snappedLon });
    } catch (err) {
      console.error("❌ GPS Handler error:", err);
      socket.emit("error", { message: err.message });
    }

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
