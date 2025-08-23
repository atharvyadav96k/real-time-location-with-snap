const express = require("express");
const fetch = require("node-fetch");
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

// API to snap location
app.post("/snap", async (req, res) => {
  try {
    const { lat, lon } = req.body;

    const response = await fetch("http://localhost:5000/snap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coordinates: [[lon, lat]], // ORS expects [lon, lat]
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Snap error:", err);
    res.status(500).json({ error: "Snap failed" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
