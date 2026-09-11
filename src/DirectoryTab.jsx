import React, { useState } from "react";
import { Search, ChevronDown, MapPin, Clock, Sparkles, Navigation } from "lucide-react";

function directionsUrl(b) {
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  if (b.lat != null && b.lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  const query = encodeURIComponent(`Universum International College ${b.name || ""}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

function dayStringToSet(days) {
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const parts = (days || "").split(/–|-/).map((s) => s.trim());
  if (parts.length !== 2 || !(parts[0] in map) || !(parts[1] in map)) return new Set([1, 2, 3, 4, 5]);
  const start = map[parts[0]];
  const end = map[parts[1]];
  const set = new Set();
  let d = start;
  while (true) {
    set.add(d);
    if (d === end) break;
    d = (d + 1) % 7;
  }
  return set;
}

function isOpenNow(b) {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  const daySet = dayStringToSet(b.days);
  return daySet.has(day) && hour >= b.open && hour < b.close;
}

const CATEGORY_CLASS = {
  Academic: "directory-code-academic",
  Amenities: "directory-code-amenities",
  Administrative: "directory-code-administrative",
};

export default function DirectoryTab({ buildings = [], services = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedBuilding, setExpandedBuilding] = useState(null);

  // Filter buildings based on search input
  const filteredBuildings = buildings.filter((b) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = b.name?.toLowerCase().includes(term);
    const codeMatch = b.code?.toLowerCase().includes(term);
    const descMatch = b.description?.toLowerCase().includes(term);
    return nameMatch || codeMatch || descMatch;
  });

  const toggleBuilding = (code) => {
    setExpandedBuilding(expandedBuilding === code ? null : code);
  };

  return (
    <div>
      {/* SEARCH BAR */}
      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search buildings, codes, or services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* BUILDING CARDS LIST */}
      <div className="directory-list">
        {filteredBuildings.length > 0 ? (
          filteredBuildings.map((b) => {
            const isExpanded = expandedBuilding === b.code;
            const open = isOpenNow(b);

            // Match services to this specific building (service.building is a
            // free-text location like "F — Administration Building, Room 110")
            const matchingServices = services.filter(
              (s) =>
                s.buildingCode === b.code ||
                s.building === b.name ||
                s.building?.startsWith(`${b.code} `) ||
                (b.name && s.building?.includes(b.name))
            );

            return (
              <div key={b.code} className={`directory-card ${isExpanded ? "directory-card-open" : ""}`}>
                <button
                  className="directory-card-head"
                  onClick={() => toggleBuilding(b.code)}
                >
                  <div className={`directory-code ${CATEGORY_CLASS[b.category] || ""}`}>{b.code}</div>
                  <div className="directory-meta">
                    <div className="directory-name">{b.name}</div>
                    <div className="directory-sub">
                      {b.description || "Click to view rooms & office hours"}
                    </div>
                  </div>
                  <span className={`status-pill ${open ? "status-open" : "status-closed"}`}>
                    {open ? "Open now" : "Closed"}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`chevron ${isExpanded ? "chevron-open" : ""}`}
                  />
                </button>

                {/* EXPANDABLE DETAILS PANEL */}
                {isExpanded && (
                  <div className="directory-card-body">
                    <div className="directory-body-head">
                      <p className="directory-desc" style={{ fontWeight: 600, margin: 0 }}>
                        Services & departments inside
                      </p>
                      <a
                        href={directionsUrl(b)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="directions-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Navigation size={12} /> Get directions
                      </a>
                    </div>
                    {matchingServices.length > 0 ? (
                      <div className="room-list">
                        {matchingServices.map((s, idx) => (
                          <div key={idx} className="room-item" style={{ flexWrap: "wrap" }}>
                            <MapPin size={13} />
                            <span>
                              <strong>{s.name}</strong>
                              {s.room && ` — Room/Floor: ${s.room}`}
                            </span>
                            {s.hours && (
                              <div
                                className="directory-hours"
                                style={{ marginTop: 2, marginBottom: 0 }}
                              >
                                <Clock size={12} />
                                <span>{s.hours}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="directory-empty-services">
                        <Sparkles size={14} />
                        <span>No specific services listed for this building yet — try asking SmartCampus AI, or check the Services tab for campus-wide offices.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="empty-text">No buildings match "{searchTerm}"</p>
        )}
      </div>
    </div>
  );
}