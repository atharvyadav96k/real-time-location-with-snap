<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Live Snapped Location</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  <script src="/socket.io/socket.io.js"></script>
  <style>
    body { margin: 0; display: flex; height: 100vh; font-family: monospace; }
    #map { flex: 2; height: 100%; }
    #logs {
      flex: 1; height: 100%; overflow-y: auto;
      background: #111; color: #0f0;
      padding: 10px;
    }
    .log-entry { border-bottom: 1px solid #333; padding: 5px 0; }
    .success { color: #0f0; }
    .error { color: #f33; }
    .request { color: #0ff; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="logs"><strong>📜 Request/Response Logs:</strong><br/></div>

  <script>
    const map = L.map('map').setView([20.5937, 78.9629], 5); // India center default
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    const socket = io();
    let marker;

    function logMessage(msg, type = "success") {
      const logsDiv = document.getElementById("logs");
      const time = new Date().toLocaleTimeString();
      const entry = document.createElement("div");
      entry.classList.add("log-entry", type);
      entry.textContent = `[${time}] ${msg}`;
      logsDiv.prepend(entry);
    }

    // Receive snapped location from server
    socket.on("locationResponse", (data) => {
      if (data.status === "success") {
        const { lat, lon } = data;

        if (!marker) {
          marker = L.marker([lat, lon]).addTo(map);
          map.setView([lat, lon], 17);
        } else {
          marker.setLatLng([lat, lon]);
          map.setView([lat, lon]);
        }

        logMessage(`✅ Response: Snapped → Lat=${lat.toFixed(6)}, Lon=${lon.toFixed(6)}`, "success");
      } else {
        logMessage(`❌ Response Error: ${data.message}`, "error");
      }
    });

    // Watch user location
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;

          // Log request
          logMessage(`📡 Request: Raw → Lat=${latitude.toFixed(6)}, Lon=${longitude.toFixed(6)}`, "request");

          // Send to backend
          socket.emit("sendLocation", { lat: latitude, lon: longitude });
        },
        (err) => {
          logMessage(`Geolocation error: ${err.message}`, "error");
        },
        { enableHighAccuracy: true }
      );
    } else {
      logMessage("Geolocation not supported", "error");
    }
  </script>
</body>
</html>
