const express = require("express");
// ✅ In Node.js v18+, fetch is built-in, no need for node-fetch
// const fetch = require("node-fetch");  // ❌ remove this line
const path = require("path");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.static("public"));

// Route for frontend
app.get("/", (req, res) => {
  res.render("index");
});

// API to snap location with OSRM
app.post("/snap", async (req, res) => {
  try {
    const { lat, lon } = req.body;

    // OSRM Match API (snap to road)
    const url = `http://localhost:5000/match/v1/driving/${lon},${lat}?geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error("Snap error:", err);
    res.status(500).json({ error: "Snap failed" });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
