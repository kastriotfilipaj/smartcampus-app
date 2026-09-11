import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Create custom pin icon
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function CampusMap({ buildings = [] }) {
  // Exact campus coordinates provided by you
  const mainCampusCoords = [42.560744, 21.136093];

  return (
    <MapContainer center={mainCampusCoords} zoom={17} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* FIXED MARKER FOR MAIN CAMPUS */}
      <Marker position={mainCampusCoords} icon={customIcon}>
        <Popup>
          <div style={{ padding: "4px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "bold" }}>
              UNI - Universum International College
            </h3>
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#555" }}>
              Main Campus (Prishtinë–Ferizaj Hwy)
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${mainCampusCoords[0]},${mainCampusCoords[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="directions-link"
            >
              Get directions
            </a>
          </div>
        </Popup>
      </Marker>

      {/* DYNAMIC FIRESTORE MARKERS */}
      {buildings.map((b) => {
        if (b.lat === null || b.lng === null || isNaN(b.lat) || isNaN(b.lng)) {
          return null;
        }

        return (
          <Marker key={b.code} position={[b.lat, b.lng]} icon={customIcon}>
            <Popup>
              <div style={{ padding: "4px" }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "bold" }}>
                  [{b.code}] {b.name}
                </h3>
                {b.category && (
                  <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#666" }}>
                    Category: {b.category}
                  </p>
                )}
                {b.description && (
                  <p style={{ margin: "0 0 8px 0", fontSize: "13px" }}>{b.description}</p>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="directions-link"
                >
                  Get directions
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}