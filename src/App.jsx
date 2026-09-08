import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Compass,
  Building2,
  Send,
  Search,
  Clock,
  Phone,
  MapPin,
  ChevronDown,
  Sparkles,
  Settings,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";

import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsiB2z6xAYotxTu2EBtxZlWnqSrvviqQo",
  authDomain: "smartcampuss-app.firebaseapp.com",
  projectId: "smartcampuss-app",
  storageBucket: "smartcampuss-app.firebasestorage.app",
  messagingSenderId: "594628991921",
  appId: "1:594628991921:web:a52a3c1efe6a14d91b7b90",
  measurementId: "G-1W90JWQN8V"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// --- SEED DATA ---
const SEED_BUILDINGS = [
  {
    code: "A",
    name: "Main Building",
    category: "Academic",
    floors: "3 floors",
    description: "Lecture halls, Dean's office, main auditorium.",
    open: 7,
    close: 20,
    days: "Mon–Fri",
    rooms: ["A101 — Lecture Hall", "A204 — Dean's Office", "A310 — Auditorium"],
  },
  {
    code: "B",
    name: "Library & Study Center",
    category: "Academic",
    floors: "2 floors",
    description: "Book stacks, silent study rooms, group work pods.",
    open: 8,
    close: 22,
    days: "Mon–Sat",
    rooms: ["B001 — Reading Room", "B105 — Group Pods", "B110 — Archive"],
  },
  {
    code: "C",
    name: "Computer Science Labs",
    category: "Academic",
    floors: "4 floors",
    description: "Programming labs, server room, robotics workshop.",
    open: 8,
    close: 21,
    days: "Mon–Fri",
    rooms: ["C202 — Lab 2", "C315 — AI & Robotics Lab", "C401 — Server Room"],
  },
  {
    code: "D",
    name: "Student Center & Cafeteria",
    category: "Amenities",
    floors: "1 floor",
    description: "Dining hall, student lounge, vending area.",
    open: 7,
    close: 19,
    days: "Mon–Sat",
    rooms: ["D01 — Cafeteria", "D02 — Lounge"],
  },
  {
    code: "E",
    name: "Sports & Recreation Center",
    category: "Amenities",
    floors: "2 floors",
    description: "Gym, indoor court, locker rooms.",
    open: 7,
    close: 21,
    days: "Mon–Sat",
    rooms: ["E01 — Gym", "E02 — Indoor Court"],
  },
  {
    code: "F",
    name: "Administration Building",
    category: "Administrative",
    floors: "2 floors",
    description: "Registrar, finance office, thesis coordination.",
    open: 8,
    close: 16,
    days: "Mon–Fri",
    rooms: ["F110 — Registrar", "F204 — Finance Office", "F208 — Thesis Coordination"],
  },
];

const SEED_SERVICES = [
  {
    id: "registrar",
    name: "Registrar's Office",
    building: "F — Administration Building, Room 110",
    hours: "Mon–Fri, 08:00–16:00",
    phone: "+383 44 000 111",
    faqs: [
      { q: "How do I register for classes?", a: "Log in to the student portal, select your program, and add courses during the registration window each semester." },
      { q: "How do I request a transcript?", a: "Submit a request form at the Registrar's Office or through the student portal. Transcripts are ready within 3 business days." },
    ],
  },
  {
    id: "thesis",
    name: "Thesis Coordination Office",
    building: "F — Administration Building, Room 208",
    hours: "Mon–Fri, 09:00–15:00",
    phone: "+383 44 000 112",
    faqs: [
      { q: "How do I submit a thesis proposal?", a: "Complete the Thesis Proposal Form, get your mentor's signature, and submit it to the Thesis Coordinator for approval before registering for the thesis." },
      { q: "Who approves my mentor?", a: "You find and confirm a mentor yourself, then list them on the Thesis Proposal Form for sign-off." },
    ],
  },
  {
    id: "finance",
    name: "Student Finance Office",
    building: "F — Administration Building, Room 204",
    hours: "Mon–Fri, 08:30–15:30",
    phone: "+383 44 000 113",
    faqs: [
      { q: "How do I pay tuition?", a: "Pay online through the student portal or in person at the Finance Office. Installment plans are available on request." },
      { q: "How do I apply for a scholarship?", a: "Scholarship applications open each September — check the notice board in Building F or the student portal." },
    ],
  },
  {
    id: "it",
    name: "IT Help Desk",
    building: "C — Computer Science Labs, Room C110",
    hours: "Mon–Sat, 08:00–20:00",
    phone: "+383 44 000 114",
    faqs: [
      { q: "I forgot my portal password.", a: "Use the 'Forgot password' link on the login page, or visit the Help Desk with your student ID for a manual reset." },
      { q: "How do I connect to campus Wi-Fi?", a: "Select 'CampusNet', log in with your student email and portal password. Guest access is available at the front desk." },
    ],
  },
  {
    id: "library",
    name: "Library Services",
    building: "B — Library & Study Center",
    hours: "Mon–Sat, 08:00–22:00",
    phone: "+383 44 000 115",
    faqs: [
      { q: "How many books can I borrow?", a: "Students can borrow up to 5 books for 14 days, renewable once online if no one else has requested them." },
      { q: "Can I book a study room?", a: "Yes — group pods in Building B can be reserved up to 3 days in advance through the library booking board." },
    ],
  },
  {
    id: "career",
    name: "Career Services",
    building: "A — Main Building, Room A115",
    hours: "Tue–Thu, 10:00–14:00",
    phone: "+383 44 000 116",
    faqs: [{ q: "Does the office help with internships?", a: "Yes — Career Services maintains a partner-employer list and reviews CVs by appointment." }],
  },
];

const SUGGESTIONS = [
  "Where is the Thesis Coordination Office?",
  "What are the library's hours?",
  "How do I reset my portal password?",
  "Where can I find the Computer Science labs?",
];

function isOpenNow(b) {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  const daySet = dayStringToSet(b.days || "");
  return daySet.has(day) && hour >= b.open && hour < b.close;
}

function dayStringToSet(days) {
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const parts = days.split(/–|-/).map((s) => s.trim());
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

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// --- ASK TAB ---
function AskTab({ buildings, services }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi, I'm SmartCampus AI. Ask me where a building is, when an office is open, or how to get something done on campus." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError("");
    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    

      const systemPrompt = `You are SmartCampus AI, a helpful campus assistant. 
Use this live campus database to answer student questions concisely, accurately, and naturally:
Buildings: ${JSON.stringify(buildings)}
Services: ${JSON.stringify(services)}`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: systemPrompt },
            ...nextMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Failed to reach Groq API.");
      }

      const data = await response.json();
      const reply = data.choices[0]?.message?.content || "No response received.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="hero">
        <div className="hero-eyebrow"><Sparkles size={14} /><span>Campus assistant</span></div>
        <h1 className="hero-title">Where to?</h1>
        <p className="hero-sub">Ask about buildings, office hours, or how to get something done — SmartCampus AI knows the campus directory.</p>
      </div>

      <div ref={scrollRef} className="chat-scroll">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "bubble bubble-user" : "bubble bubble-assistant"}>{m.content}</div>
        ))}
        {loading && (
          <div className="bubble bubble-assistant bubble-loading">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip" onClick={() => sendMessage(s)}>{s}</button>
          ))}
        </div>
      )}

      {error && <div className="error-text">{error}</div>}

      <form className="composer" onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about a building, office, or service..." className="composer-input" />
        <button type="submit" className="composer-send" disabled={loading || !input.trim()} aria-label="Send message"><Send size={18} /></button>
      </form>
    </div>
  );
}

// --- DIRECTORY TAB ---
function DirectoryTab({ buildings }) {
  const [query, setQuery] = useState("");
  const [activeCode, setActiveCode] = useState(null);

  const filtered = buildings.filter((b) => {
    const q = query.toLowerCase();
    return (
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q)) ||
      (b.rooms && b.rooms.some((r) => r.toLowerCase().includes(q)))
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="section-header">
        <h2 className="section-title">Campus directory</h2>
        <p className="section-sub">{buildings.length} buildings, mapped by code — tap one to see what's inside.</p>
      </div>

      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a building, room, or service..." className="search-input" />
      </div>

      <div className="map-strip">
        {buildings.map((b) => (
          <button key={b.code} className={`map-node ${activeCode === b.code ? "map-node-active" : ""}`} onClick={() => setActiveCode(activeCode === b.code ? null : b.code)} aria-label={`Building ${b.code} — ${b.name}`}>
            <span className="map-code">{b.code}</span>
          </button>
        ))}
      </div>

      <div className="directory-list">
        {filtered.length === 0 && <p className="empty-text">No matches. Try a different search term.</p>}
        {filtered.map((b) => {
          const open = isOpenNow(b);
          const expanded = activeCode === b.code;
          return (
            <div key={b.code} className={`directory-card ${expanded ? "directory-card-open" : ""}`}>
              <button className="directory-card-head" onClick={() => setActiveCode(expanded ? null : b.code)}>
                <div className="directory-code">{b.code}</div>
                <div className="directory-meta">
                  <div className="directory-name">{b.name}</div>
                  <div className="directory-sub">{b.category} · {b.floors}</div>
                </div>
                <span className={`status-pill ${open ? "status-open" : "status-closed"}`}>{open ? "Open now" : "Closed"}</span>
                <ChevronDown size={18} className={`chevron ${expanded ? "chevron-open" : ""}`} />
              </button>
              {expanded && (
                <div className="directory-card-body">
                  <p className="directory-desc">{b.description}</p>
                  <div className="directory-hours"><Clock size={14} /><span>{b.open}:00–{b.close}:00, {b.days}</span></div>
                  <div className="room-list">
                    {(b.rooms || []).map((r) => (
                      <div key={r} className="room-item"><MapPin size={13} /><span>{r}</span></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- SERVICES TAB ---
function ServicesTab({ services }) {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="section-header">
        <h2 className="section-title">University services</h2>
        <p className="section-sub">Offices, hours, and answers to what students ask most.</p>
      </div>

      <div className="services-list">
        {services.map((s) => (
          <div key={s.id} className="service-card">
            <div className="service-head">
              <Building2 size={18} className="service-icon" />
              <div>
                <div className="service-name">{s.name}</div>
                <div className="service-location">{s.building}</div>
              </div>
            </div>
            <div className="service-details">
              <div className="service-detail-row"><Clock size={13} /><span>{s.hours}</span></div>
              <div className="service-detail-row"><Phone size={13} /><span>{s.phone}</span></div>
            </div>
            <div className="faq-block">
              {(s.faqs || []).map((f, idx) => {
                const key = `${s.id}-${idx}`;
                const expanded = openFaq === key;
                return (
                  <div key={key} className="faq-item">
                    <button className="faq-question" onClick={() => setOpenFaq(expanded ? null : key)}>
                      <span>{f.q}</span>
                      <ChevronDown size={15} className={`chevron ${expanded ? "chevron-open" : ""}`} />
                    </button>
                    {expanded && <p className="faq-answer">{f.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- ADMIN TAB ---
function AdminTab({ buildings, services, onSaveBuilding, onDeleteBuilding, onSaveService, onDeleteService, onReset, saveState }) {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [section, setSection] = useState("buildings");

  // REPLACE WITH YOUR EXACT ADMIN EMAIL
  const ADMIN_EMAIL = "kastriotfilipaj533@gmail.com";
  const isAdminUser = user && user.email === ADMIN_EMAIL;

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase Auth listener failed to initialize:", err);
    }
  }, []);

  async function handleSignUp(e) {
    e.preventDefault();
    setAuthError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError(err.message);
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError(err.message);
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (err) {
      setAuthError(err.message);
    }
  }

  function updateBuilding(code, patch) {
    if (!isAdminUser) return;
    const target = buildings.find((b) => b.code === code);
    if (target) {
      onSaveBuilding({ ...target, ...patch });
    }
  }

  function deleteBuilding(code) {
    if (!isAdminUser) return;
    onDeleteBuilding(code);
  }

  function addBuilding() {
    if (!isAdminUser) return;
    const code = prompt("New building code (e.g. G):");
    if (!code) return;
    const formattedCode = code.toUpperCase().trim();
    if (buildings.some((b) => b.code === formattedCode)) {
      alert("That code already exists.");
      return;
    }
    onSaveBuilding({
      code: formattedCode,
      name: "New building",
      category: "Academic",
      floors: "1 floor",
      description: "Describe this building.",
      open: 8,
      close: 18,
      days: "Mon–Fri",
      rooms: [],
    });
  }

  function updateService(id, patch) {
    if (!isAdminUser) return;
    const target = services.find((s) => s.id === id);
    if (target) {
      onSaveService({ ...target, ...patch });
    }
  }

  function deleteService(id) {
    if (!isAdminUser) return;
    onDeleteService(id);
  }

  function addService() {
    if (!isAdminUser) return;
    const name = prompt("New service name:");
    if (!name) return;
    onSaveService({ id: uid("svc"), name, building: "", hours: "", phone: "", faqs: [] });
  }

  function addFaq(serviceId) {
    if (!isAdminUser) return;
    const q = prompt("Question:");
    if (!q) return;
    const a = prompt("Answer:") || "";
    const target = services.find((s) => s.id === serviceId);
    if (target) {
      onSaveService({ ...target, faqs: [...(target.faqs || []), { q, a }] });
    }
  }

  function removeFaq(serviceId, idx) {
    if (!isAdminUser) return;
    const target = services.find((s) => s.id === serviceId);
    if (target) {
      onSaveService({ ...target, faqs: (target.faqs || []).filter((_, i) => i !== idx) });
    }
  }

  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div className="section-header">
          <h2 className="section-title">Admin Login</h2>
          <p className="section-sub">Sign in or register an account to manage campus data.</p>
        </div>
        <div style={{ maxWidth: 360, width: "100%", margin: "20px 0" }}>
          <form style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              className="admin-input"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="admin-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {authError && <div className="error-text">{authError}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                className="admin-add"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={handleSignIn}
              >
                Sign In
              </button>
              <button
                type="button"
                className="admin-toggle-btn"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={handleSignUp}
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 className="section-title">Admin</h2>
          <p className="section-sub">
            Logged in as {user.email} {isAdminUser ? "(Admin)" : "(Read-Only)"}
            {saveState === "saving" && " Saving…"}
            {saveState === "saved" && " Saved."}
          </p>
        </div>
        <button className="admin-toggle-btn" onClick={handleSignOut}>Sign Out</button>
      </div>

      <div className="admin-toggle">
        <button className={`admin-toggle-btn ${section === "buildings" ? "admin-toggle-active" : ""}`} onClick={() => setSection("buildings")}>Buildings</button>
        <button className={`admin-toggle-btn ${section === "services" ? "admin-toggle-active" : ""}`} onClick={() => setSection("services")}>Services</button>
      </div>

      {section === "buildings" && (
        <div className="admin-list">
          {buildings.map((b) => (
            <div key={b.code} className="admin-card">
              <div className="admin-row">
                <input className="admin-input admin-input-code" value={b.code} readOnly />
                <input
                  className="admin-input"
                  style={{ flex: 1 }}
                  value={b.name}
                  onChange={(e) => updateBuilding(b.code, { name: e.target.value })}
                  placeholder="Building name"
                  readOnly={!isAdminUser}
                />
                {isAdminUser && (
                  <button className="icon-btn icon-btn-danger" onClick={() => deleteBuilding(b.code)} aria-label={`Delete ${b.name}`}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <div className="admin-row">
                <input
                  className="admin-input"
                  style={{ flex: 1 }}
                  value={b.category}
                  onChange={(e) => updateBuilding(b.code, { category: e.target.value })}
                  placeholder="Category"
                  readOnly={!isAdminUser}
                />
                <input
                  className="admin-input"
                  style={{ width: 90 }}
                  type="number"
                  value={b.open}
                  onChange={(e) => updateBuilding(b.code, { open: Number(e.target.value) })}
                  placeholder="Open"
                  readOnly={!isAdminUser}
                />
                <input
                  className="admin-input"
                  style={{ width: 90 }}
                  type="number"
                  value={b.close}
                  onChange={(e) => updateBuilding(b.code, { close: Number(e.target.value) })}
                  placeholder="Close"
                  readOnly={!isAdminUser}
                />
                <input
                  className="admin-input"
                  style={{ width: 100 }}
                  value={b.days}
                  onChange={(e) => updateBuilding(b.code, { days: e.target.value })}
                  placeholder="Mon–Fri"
                  readOnly={!isAdminUser}
                />
              </div>
              <textarea
                className="admin-textarea"
                value={b.description}
                onChange={(e) => updateBuilding(b.code, { description: e.target.value })}
                placeholder="Description"
                readOnly={!isAdminUser}
              />
              <input
                className="admin-input"
                value={(b.rooms || []).join(", ")}
                onChange={(e) => updateBuilding(b.code, { rooms: e.target.value.split(",").map((r) => r.trim()).filter(Boolean) })}
                placeholder="Rooms, comma separated"
                readOnly={!isAdminUser}
              />
            </div>
          ))}
          {isAdminUser && (
            <button className="admin-add" onClick={addBuilding}><Plus size={15} /> Add building</button>
          )}
        </div>
      )}

      {section === "services" && (
        <div className="admin-list">
          {services.map((s) => (
            <div key={s.id} className="admin-card">
              <div className="admin-row">
                <input
                  className="admin-input"
                  style={{ flex: 1 }}
                  value={s.name}
                  onChange={(e) => updateService(s.id, { name: e.target.value })}
                  placeholder="Service name"
                  readOnly={!isAdminUser}
                />
                {isAdminUser && (
                  <button className="icon-btn icon-btn-danger" onClick={() => deleteService(s.id)} aria-label={`Delete ${s.name}`}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <input
                className="admin-input"
                value={s.building}
                onChange={(e) => updateService(s.id, { building: e.target.value })}
                placeholder="Location"
                readOnly={!isAdminUser}
              />
              <div className="admin-row">
                <input
                  className="admin-input"
                  style={{ flex: 1 }}
                  value={s.hours}
                  onChange={(e) => updateService(s.id, { hours: e.target.value })}
                  placeholder="Hours"
                  readOnly={!isAdminUser}
                />
                <input
                  className="admin-input"
                  style={{ flex: 1 }}
                  value={s.phone}
                  onChange={(e) => updateService(s.id, { phone: e.target.value })}
                  placeholder="Phone"
                  readOnly={!isAdminUser}
                />
              </div>
              <div className="admin-faqs">
                {(s.faqs || []).map((f, idx) => (
                  <div key={idx} className="admin-faq-row">
                    <span className="admin-faq-text">{f.q}</span>
                    {isAdminUser && (
                      <button className="icon-btn icon-btn-danger" onClick={() => removeFaq(s.id, idx)} aria-label="Remove FAQ">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
                {isAdminUser && (
                  <button className="admin-add-faq" onClick={() => addFaq(s.id)}><Plus size={13} /> Add FAQ</button>
                )}
              </div>
            </div>
          ))}
          {isAdminUser && (
            <button className="admin-add" onClick={addService}><Plus size={15} /> Add service</button>
          )}
        </div>
      )}

      {isAdminUser && (
        <button className="admin-reset" onClick={onReset}><RotateCcw size={14} /> Reset to default data</button>
      )}
    </div>
  );
}

// --- MAIN APP ---
const TABS = [
  { id: "ask", label: "Ask", icon: MessageCircle },
  { id: "directory", label: "Directory", icon: Compass },
  { id: "services", label: "Services", icon: Building2 },
  { id: "admin", label: "Admin", icon: Settings },
];

export default function App() {
  const [tab, setTab] = useState("admin");
  const [buildings, setBuildings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle");
  const saveTimer = useRef(null);

  // Firestore Real-time Listeners with Seed Fallback
  useEffect(() => {
    const unsubBuildings = onSnapshot(collection(db, "buildings"), (snapshot) => {
      if (snapshot.empty) {
        SEED_BUILDINGS.forEach((b) => setDoc(doc(db, "buildings", b.code), b));
      } else {
        const bList = snapshot.docs.map((doc) => doc.data());
        setBuildings(bList);
      }
      setLoading(false);
    }, (err) => console.error("Buildings snapshot error:", err));

    const unsubServices = onSnapshot(collection(db, "services"), (snapshot) => {
      if (snapshot.empty) {
        SEED_SERVICES.forEach((s) => setDoc(doc(db, "services", s.id), s));
      } else {
        const sList = snapshot.docs.map((doc) => doc.data());
        setServices(sList);
      }
    }, (err) => console.error("Services snapshot error:", err));

    return () => {
      unsubBuildings();
      unsubServices();
    };
  }, []);

  function flashSaved() {
    setSaveState("saved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState("idle"), 1200);
  }

  async function handleSaveBuilding(building) {
    setSaveState("saving");
    try {
      await setDoc(doc(db, "buildings", building.code), building);
      flashSaved();
    } catch (e) {
      console.error("Failed to save building:", e);
      setSaveState("idle");
    }
  }

  async function handleDeleteBuilding(code) {
    setSaveState("saving");
    try {
      await deleteDoc(doc(db, "buildings", code));
      flashSaved();
    } catch (e) {
      console.error("Failed to delete building:", e);
      setSaveState("idle");
    }
  }

  async function handleSaveService(service) {
    setSaveState("saving");
    try {
      await setDoc(doc(db, "services", service.id), service);
      flashSaved();
    } catch (e) {
      console.error("Failed to save service:", e);
      setSaveState("idle");
    }
  }

  async function handleDeleteService(id) {
    setSaveState("saving");
    try {
      await deleteDoc(doc(db, "services", id));
      flashSaved();
    } catch (e) {
      console.error("Failed to delete service:", e);
      setSaveState("idle");
    }
  }

  async function handleReset() {
    if (!confirm("Reset to default seed data?")) return;
    setSaveState("saving");
    try {
      const batch = writeBatch(db);
      buildings.forEach((b) => batch.delete(doc(db, "buildings", b.code)));
      services.forEach((s) => batch.delete(doc(db, "services", s.id)));
      SEED_BUILDINGS.forEach((b) => batch.set(doc(db, "buildings", b.code), b));
      SEED_SERVICES.forEach((s) => batch.set(doc(db, "services", s.id), s));
      await batch.commit();
      flashSaved();
    } catch (e) {
      console.error("Failed to reset collections:", e);
      setSaveState("idle");
    }
  }

  return (
    <div className="app-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .app-shell {
          --ink: #132A3A; --ink-soft: #24445B; --paper: #F6F3EC; --paper-card: #FFFFFF;
          --amber: #D98E3F; --amber-dark: #A66427; --sage: #3E6B57; --sage-bg: #E4EEE8;
          --coral: #B5482F; --coral-bg: #F6E4DF; --slate: #5B6572; --line: #DFDACD;
          font-family: 'Inter', sans-serif; background: var(--paper); color: var(--ink);
          width: 100%; height: 100vh; min-height: 640px; display: flex; overflow: hidden;
        }
        .rail { display: none; }
        @media (min-width: 860px) {
          .rail { display: flex; flex-direction: column; width: 220px; flex-shrink: 0; background: var(--ink); color: var(--paper); padding: 28px 18px; }
          .rail-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 40px; padding: 0 8px; }
          .rail-brand-mark { width: 34px; height: 34px; border-radius: 8px; background: var(--amber); display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: var(--ink); font-size: 16px; }
          .rail-brand-text { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 16px; }
          .rail-nav { display: flex; flex-direction: column; gap: 4px; }
          .rail-item { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 8px; color: rgba(246,243,236,0.65); background: transparent; border: none; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; text-align: left; }
          .rail-item:hover { background: rgba(246,243,236,0.08); color: var(--paper); }
          .rail-item-active { background: rgba(217,142,63,0.16); color: var(--amber); }
          .rail-foot { margin-top: auto; font-size: 12px; color: rgba(246,243,236,0.4); padding: 0 8px; line-height: 1.5; }
          .mobile-topbar { display: none !important; }
          .tabbar { display: none !important; }
          .content { padding: 0 !important; }
        }
        .main-col { flex: 1; display: flex; flex-direction: column; min-width: 0; height: 100%; }
        .mobile-topbar { display: flex; align-items: center; gap: 10px; padding: 16px 20px; background: var(--ink); color: var(--paper); flex-shrink: 0; }
        .mobile-topbar-mark { width: 28px; height: 28px; border-radius: 7px; background: var(--amber); display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: var(--ink); font-size: 13px; }
        .mobile-topbar-text { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 15px; }
        .content { flex: 1; overflow-y: auto; padding: 28px 32px 0; display: flex; flex-direction: column; min-height: 0; }
        .hero { padding: 8px 4px 20px; flex-shrink: 0; }
        .hero-eyebrow { display: flex; align-items: center; gap: 6px; color: var(--amber-dark); font-size: 13px; font-weight: 500; margin-bottom: 10px; }
        .hero-title { font-family: 'Space Grotesk', sans-serif; font-size: 34px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.01em; }
        .hero-sub { color: var(--slate); font-size: 14px; line-height: 1.5; margin: 0; max-width: 480px; }
        .chat-scroll { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 4px 2px 16px; min-height: 120px; }
        .bubble { max-width: 78%; padding: 11px 15px; border-radius: 14px; font-size: 14.5px; line-height: 1.5; }
        .bubble-assistant { background: var(--paper-card); border: 1px solid var(--line); align-self: flex-start; border-bottom-left-radius: 4px; }
        .bubble-user { background: var(--ink); color: var(--paper); align-self: flex-end; border-bottom-right-radius: 4px; }
        .bubble-loading { display: flex; gap: 4px; align-items: center; padding: 14px 15px; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--slate); opacity: 0.5; animation: pulse 1.2s infinite ease-in-out; }
        .dot:nth-child(2) { animation-delay: 0.15s; }
        .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes pulse { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }
        .suggestions { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 2px 14px; flex-shrink: 0; }
        .chip { border: 1px solid var(--line); background: var(--paper-card); color: var(--ink-soft); padding: 8px 13px; border-radius: 20px; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; }
        .chip:hover { border-color: var(--amber); color: var(--amber-dark); }
        .error-text { color: var(--coral); font-size: 12.5px; padding: 0 2px 8px; flex-shrink: 0; }
        .composer { display: flex; gap: 8px; padding: 12px 2px 20px; flex-shrink: 0; }
        .composer-input { flex: 1; border: 1px solid var(--line); background: var(--paper-card); padding: 12px 16px; border-radius: 24px; font-size: 14px; color: var(--ink); outline: none; font-family: 'Inter', sans-serif; }
        .composer-send { width: 42px; height: 42px; border-radius: 50%; background: var(--amber); color: var(--ink); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .composer-send:disabled { opacity: 0.4; cursor: not-allowed; }
        .section-header { margin-bottom: 20px; flex-shrink: 0; }
        .section-title { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 700; margin: 0 0 6px; }
        .section-sub { color: var(--slate); font-size: 13.5px; margin: 0; }
        .search-bar { display: flex; align-items: center; gap: 10px; background: var(--paper-card); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; flex-shrink: 0; }
        .search-icon { color: var(--slate); }
        .search-input { border: none; background: transparent; outline: none; flex: 1; font-size: 14px; color: var(--ink); font-family: 'Inter', sans-serif; }
        .map-strip { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 16px; flex-shrink: 0; }
        .map-node { width: 44px; height: 44px; border-radius: 10px; border: 1px solid var(--line); background: var(--paper-card); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .map-node-active { background: var(--ink); border-color: var(--ink); }
        .map-code { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 15px; color: var(--ink); }
        .map-node-active .map-code { color: var(--paper); }
        .directory-list, .services-list, .admin-list { display: flex; flex-direction: column; gap: 12px; padding-bottom: 24px; }
        .directory-card, .service-card, .admin-card { background: var(--paper-card); border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
        .directory-card-head { display: flex; align-items: center; gap: 12px; width: 100%; border: none; background: transparent; text-align: left; cursor: pointer; padding: 0; color: inherit; }
        .directory-code { width: 36px; height: 36px; border-radius: 8px; background: var(--paper); display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; flex-shrink: 0; }
        .directory-meta { flex: 1; min-width: 0; }
        .directory-name { font-weight: 600; font-size: 15px; }
        .directory-sub { font-size: 12.5px; color: var(--slate); margin-top: 2px; }
        .status-pill { font-size: 11.5px; font-weight: 600; padding: 3px 8px; border-radius: 12px; margin-left: auto; flex-shrink: 0; }
        .status-open { background: var(--sage-bg); color: var(--sage); }
        .status-closed { background: var(--coral-bg); color: var(--coral); }
        .chevron { color: var(--slate); transition: transform 0.2s ease; flex-shrink: 0; }
        .chevron-open { transform: rotate(180deg); }
        .directory-card-body { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); font-size: 13.5px; }
        .directory-desc { color: var(--ink-soft); margin: 0 0 10px; line-height: 1.4; }
        .directory-hours { display: flex; align-items: center; gap: 6px; color: var(--slate); margin-bottom: 12px; font-size: 12.5px; }
        .room-list { display: flex; flex-direction: column; gap: 6px; }
        .room-item { display: flex; align-items: center; gap: 8px; color: var(--ink-soft); font-size: 13px; }
        .service-head { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; }
        .service-icon { color: var(--amber-dark); flex-shrink: 0; margin-top: 2px; }
        .service-name { font-weight: 600; font-size: 15.5px; }
        .service-location { font-size: 12.5px; color: var(--slate); margin-top: 2px; }
        .service-details { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; padding: 10px; background: var(--paper); border-radius: 8px; }
        .service-detail-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--ink-soft); }
        .faq-block { display: flex; flex-direction: column; gap: 8px; }
        .faq-item { border-top: 1px solid var(--line); padding-top: 8px; }
        .faq-question { display: flex; justify-content: space-between; align-items: center; width: 100%; border: none; background: transparent; text-align: left; cursor: pointer; padding: 4px 0; font-weight: 500; font-size: 13px; color: var(--ink); font-family: 'Inter', sans-serif; }
        .faq-answer { font-size: 12.5px; color: var(--slate); margin: 6px 0 4px; line-height: 1.4; }
        .admin-toggle { display: flex; gap: 8px; margin-bottom: 16px; flex-shrink: 0; }
        .admin-toggle-btn { padding: 8px 14px; border-radius: 8px; border: 1px solid var(--line); background: var(--paper-card); font-size: 13px; font-weight: 500; cursor: pointer; color: var(--ink); font-family: 'Inter', sans-serif; }
        .admin-toggle-active { background: var(--ink); color: var(--paper); border-color: var(--ink); }
        .admin-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
        .admin-input { border: 1px solid var(--line); border-radius: 6px; padding: 8px 10px; font-size: 13px; color: var(--ink); outline: none; background: var(--paper); font-family: 'Inter', sans-serif; }
        .admin-input-code { width: 50px; font-weight: 700; text-align: center; }
        .admin-textarea { width: 100%; border: 1px solid var(--line); border-radius: 6px; padding: 8px 10px; font-size: 13px; color: var(--ink); outline: none; background: var(--paper); font-family: 'Inter', sans-serif; resize: vertical; min-height: 60px; margin-bottom: 8px; }
        .admin-add { display: flex; align-items: center; gap: 6px; padding: 10px 14px; border-radius: 8px; border: 1px dashed var(--line); background: transparent; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--amber-dark); justify-content: center; }
        .admin-add-faq { display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; border: none; background: var(--paper); font-size: 12px; cursor: pointer; color: var(--ink-soft); margin-top: 6px; }
        .admin-faqs { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--line); }
        .admin-faq-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 6px; background: var(--paper); padding: 6px 8px; border-radius: 4px; }
        .admin-reset { margin-top: auto; display: flex; align-items: center; gap: 6px; padding: 10px; border: none; background: transparent; color: var(--coral); font-size: 12.5px; cursor: pointer; justify-content: center; font-family: 'Inter', sans-serif; }
        .icon-btn { border: none; background: transparent; cursor: pointer; padding: 6px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
        .icon-btn-danger { color: var(--coral); }
        .tabbar { display: flex; border-top: 1px solid var(--line); background: var(--paper-card); padding: 8px 0; flex-shrink: 0; }
        .tab-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; border: none; background: transparent; font-size: 11px; color: var(--slate); cursor: pointer; font-family: 'Inter', sans-serif; }
        .tab-btn-active { color: var(--amber-dark); font-weight: 600; }
        .empty-text { color: var(--slate); font-size: 13.5px; text-align: center; padding: 20px 0; }
      `}</style>

      {/* Desktop Sidebar Rail */}
      <div className="rail">
        <div className="rail-brand">
          <div className="rail-brand-mark">S</div>
          <span className="rail-brand-text">SmartCampus</span>
        </div>
        <nav className="rail-nav">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} className={`rail-item ${active ? "rail-item-active" : ""}`} onClick={() => setTab(t.id)}>
                <Icon size={18} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="rail-foot">
          SmartCampus AI<br />Connected to Cloud Firestore
        </div>
      </div>

      {/* Main Column */}
      <div className="main-col">
        {/* Mobile Topbar */}
        <div className="mobile-topbar">
          <div className="mobile-topbar-mark">S</div>
          <span className="mobile-topbar-text">SmartCampus AI</span>
        </div>

        {/* Dynamic Content View */}
        <div className="content">
          {loading ? (
            <div className="empty-text">Loading campus data...</div>
          ) : (
            <>
              {tab === "ask" && <AskTab buildings={buildings} services={services} />}
              {tab === "directory" && <DirectoryTab buildings={buildings} />}
              {tab === "services" && <ServicesTab services={services} />}
              {tab === "admin" && (
                <AdminTab
                  buildings={buildings}
                  services={services}
                  onSaveBuilding={handleSaveBuilding}
                  onDeleteBuilding={handleDeleteBuilding}
                  onSaveService={handleSaveService}
                  onDeleteService={handleDeleteService}
                  onReset={handleReset}
                  saveState={saveState}
                />
              )}
            </>
          )}
        </div>

        {/* Mobile Tabbar Nav */}
        <div className="tabbar">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} className={`tab-btn ${active ? "tab-btn-active" : ""}`} onClick={() => setTab(t.id)}>
                <Icon size={18} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}