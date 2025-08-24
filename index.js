const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

// Route for frontend
app.get("/", (req, res) => {
  res.render("index");
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("✅ Client connected");

  socket.on("sendLocation", async ({ lat, lon }) => {
    try {
      const url = `http://localhost:5000/nearest/v1/driving/${lon},${lat}`;
      console.log("📡 Request:", lat, lon);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`OSRM returned ${response.status}`);
      const data = await response.json();

      if (data && data.waypoints && data.waypoints.length > 0) {
        const snapped = data.waypoints[0].location; // [lon, lat]
        const [snappedLon, snappedLat] = snapped;

        socket.emit("locationResponse", {
          status: "success",
          lat: snappedLat,
          lon: snappedLon,
        });
      } else {
        socket.emit("locationResponse", {
          status: "error",
          message: "No waypoints returned from server",
        });
      }
    } catch (err) {
      console.error("❌ Snap error:", err);
      socket.emit("locationResponse", {
        status: "error",
        message: err.message,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
