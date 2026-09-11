import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Compass,
  Building2,
  Send,
  Search,
  Clock,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Sparkles,
  Settings,
  Plus,
  Trash2,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
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

import CampusMap from "./CampusMap";
import DirectoryTab from "./DirectoryTab";
import "./App.css";
import campusHero from "./assets/campus/directory-hero.jpg";
import loginPhoto from "./assets/campus/login-photo.jpg";
import uniMark from "./assets/uni-mark.png";

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
    id: "shkenca-kompjuterike",
    name: "Departamenti Shkenca Kompjuterike",
    email: "shkenca.kompjuterike@universum-ks.org",
    building: "",
    hours: "",
    phone: "",
    faqs: [],
  },
  {
    id: "kozmetologjii",
    name: "Departamenti Kozmetologjii",
    email: "kozmetologjii@universum-ks.org",
    building: "",
    hours: "",
    phone: "",
    faqs: [],
  },
  {
    id: "biomjekesilaboratorike",
    name: "Departamenti Biomjekesi Laboratorike",
    email: "biomjekesilaboratorike@universum-ks.org",
    building: "",
    hours: "",
    phone: "",
    faqs: [],
  },
  {
    id: "biznes-menaxhment",
    name: "Departamenti Biznes dhe Menaxhment",
    email: "biznes.menaxhment@universum-ks.org",
    building: "",
    hours: "",
    phone: "",
    faqs: [],
  },
  {
    id: "datascience",
    name: "Departamenti Data Science",
    email: "datascience@universum-ks.org",
    building: "",
    hours: "",
    phone: "",
    faqs: [],
  },
  {
    id: "dentistri",
    name: "Departamenti Dentistri",
    email: "dentistri@universum-ks.org",
    building: "",
    hours: "",
    phone: "",
    faqs: [],
  },
  {
    id: "dizajn",
    name: "Departamenti Dizajn",
    email: "dizajn@universum-ks.org",
    building: "",
    hours: "",
    phone: "",
    faqs: [],
  },
  {
    id: "fizioterapi",
    name: "Departamenti Fizioterapi",
    email: "fizioterapi@universum-ks.org",
    building: "",
    hours: "",
    phone: "",
    faqs: [],
  },
];

const SUGGESTIONS = [
  "Where is the Thesis Coordination Office?",
  "What are the library's hours?",
  "How do I reset my portal password?",
  "Where can I find the Computer Science labs?",
];

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
  const [feedback, setFeedback] = useState({});
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  function rateFeedback(i, value) {
    setFeedback((prev) => ({ ...prev, [i]: prev[i] === value ? null : value }));
  }

  function resetChat() {
    setMessages([
      { role: "assistant", content: "Hi, I'm SmartCampus AI. Ask me where a building is, when an office is open, or how to get something done on campus." },
    ]);
    setInput("");
    setError("");
    setFeedback({});
  }

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
      <div className="hero" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div className="hero-eyebrow"><Sparkles size={14} /><span>Campus assistant</span></div>
          <h1 className="hero-title">Where to?</h1>
          <p className="hero-sub">Ask about buildings, office hours, or how to get something done — SmartCampus AI knows the campus directory.</p>
        </div>
        {messages.length > 1 && (
          <button className="icon-btn" onClick={resetChat} aria-label="Start a new conversation" title="New conversation">
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="chat-scroll">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="bubble bubble-user">{m.content}</div>
          ) : (
            <div key={i} className="bubble-group">
              <div className="bubble-row">
                <div className="bubble-avatar"><img src={uniMark} alt="" /></div>
                <div className="bubble bubble-assistant">{m.content}</div>
              </div>
              {i > 0 && (
                <div className="feedback-row">
                  <button
                    className={`feedback-btn ${feedback[i] === "up" ? "feedback-btn-active-up" : ""}`}
                    onClick={() => rateFeedback(i, "up")}
                    aria-label="Helpful response"
                    title="Helpful"
                  >
                    <ThumbsUp size={13} />
                  </button>
                  <button
                    className={`feedback-btn ${feedback[i] === "down" ? "feedback-btn-active-down" : ""}`}
                    onClick={() => rateFeedback(i, "down")}
                    aria-label="Not helpful"
                    title="Not helpful"
                  >
                    <ThumbsDown size={13} />
                  </button>
                  {feedback[i] && <span className="feedback-thanks">Thanks for the feedback!</span>}
                </div>
              )}
            </div>
          )
        )}
        {loading && (
          <div className="bubble-group">
            <div className="bubble-row">
              <div className="bubble-avatar"><img src={uniMark} alt="" /></div>
              <div className="bubble bubble-assistant bubble-loading">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
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

// --- SERVICES TAB ---
function ServicesTab({ services }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [query, setQuery] = useState("");

  const filteredServices = services.filter((s) => {
    const term = query.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.building?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="section-header">
        <h2 className="section-title">University services</h2>
        <p className="section-sub">Offices, hours, and answers to what students ask most.</p>
      </div>

      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a service or office..."
          className="search-input"
        />
      </div>

      {filteredServices.length === 0 && (
        <p className="empty-text">No services match "{query}".</p>
      )}

      <div className="services-list">
        {filteredServices.map((s) => (
          <div key={s.id} className="service-card">
            <div className="service-head">
              <Building2 size={18} className="service-icon" />
              <div>
                <div className="service-name">{s.name}</div>
                {s.building && <div className="service-location">{s.building}</div>}
              </div>
            </div>
            {(s.hours || s.phone || s.email) && (
              <div className="service-details">
                {s.email && (
                  <div className="service-detail-row">
                    <Mail size={13} />
                    <a href={`mailto:${s.email}`} className="service-email-link">{s.email}</a>
                  </div>
                )}
                {s.hours && <div className="service-detail-row"><Clock size={13} /><span>{s.hours}</span></div>}
                {s.phone && <div className="service-detail-row"><Phone size={13} /><span>{s.phone}</span></div>}
              </div>
            )}
            {(s.faqs || []).length > 0 && (
              <div className="faq-block">
                {s.faqs.map((f, idx) => {
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const ADMIN_CATEGORY_CLASS = {
  Academic: "directory-code-academic",
  Amenities: "directory-code-amenities",
  Administrative: "directory-code-administrative",
};

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
      lat: null,
      lng: null,
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
    onSaveService({ id: uid("svc"), name: "New department", email: "", building: "", hours: "", phone: "", faqs: [] });
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
          <h2 className="section-title">Sign In</h2>
          <p className="section-sub">Sign in with your student email, or create a new account.</p>
        </div>
        <div className="login-wrap">
          <div className="login-photo-side">
            <img src={loginPhoto} alt="Universum International College campus interior" />
            <div className="login-photo-overlay">
              <p className="login-photo-quote">Manage the campus your students rely on.</p>
              <p className="login-photo-caption">Universum International College — Prishtina Campus</p>
            </div>
          </div>
          <div className="login-form-side">
            <div className="login-form-title">Welcome back</div>
            <p className="login-form-sub">Students and staff can sign in here, or create a new account.</p>
            <form style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="field">
                <label className="field-label">Email</label>
                <input
                  type="email"
                  className="admin-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Password</label>
                <input
                  type="password"
                  className="admin-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
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
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 className="section-title">{isAdminUser ? "Admin" : "My Account"}</h2>
          <p className="section-sub" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <span>Logged in as {user.email}</span>
            <span className={`role-pill ${isAdminUser ? "role-pill-admin" : ""}`}>
              {isAdminUser ? "Admin" : "Student"}
            </span>
            {saveState === "saving" && <span>Saving…</span>}
            {saveState === "saved" && <span>Saved.</span>}
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
              <div className="admin-card-header">
                <div className={`directory-code ${ADMIN_CATEGORY_CLASS[b.category] || ""}`}>{b.code}</div>
                <input
                  className="admin-input admin-input-name"
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
                <div className="field" style={{ flex: 1 }}>
                  <label className="field-label">Category</label>
                  <input
                    className="admin-input"
                    value={b.category}
                    onChange={(e) => updateBuilding(b.code, { category: e.target.value })}
                    placeholder="Category"
                    readOnly={!isAdminUser}
                  />
                </div>
                <div className="field" style={{ width: 90 }}>
                  <label className="field-label">Opens</label>
                  <input
                    className="admin-input"
                    type="number"
                    value={b.open}
                    onChange={(e) => updateBuilding(b.code, { open: Number(e.target.value) })}
                    placeholder="Open"
                    readOnly={!isAdminUser}
                  />
                </div>
                <div className="field" style={{ width: 90 }}>
                  <label className="field-label">Closes</label>
                  <input
                    className="admin-input"
                    type="number"
                    value={b.close}
                    onChange={(e) => updateBuilding(b.code, { close: Number(e.target.value) })}
                    placeholder="Close"
                    readOnly={!isAdminUser}
                  />
                </div>
                <div className="field" style={{ width: 100 }}>
                  <label className="field-label">Days</label>
                  <input
                    className="admin-input"
                    value={b.days}
                    onChange={(e) => updateBuilding(b.code, { days: e.target.value })}
                    placeholder="Mon–Fri"
                    readOnly={!isAdminUser}
                  />
                </div>
              </div>
              <div className="admin-row">
                <div className="field" style={{ flex: 1 }}>
                  <label className="field-label">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="admin-input"
                    value={b.lat ?? ""}
                    onChange={(e) =>
                      updateBuilding(b.code, {
                        lat: e.target.value !== "" ? parseFloat(e.target.value) : null,
                      })
                    }
                    placeholder="e.g. 42.6629"
                    readOnly={!isAdminUser}
                  />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label className="field-label">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="admin-input"
                    value={b.lng ?? ""}
                    onChange={(e) =>
                      updateBuilding(b.code, {
                        lng: e.target.value !== "" ? parseFloat(e.target.value) : null,
                      })
                    }
                    placeholder="e.g. 21.1655"
                    readOnly={!isAdminUser}
                  />
                </div>
              </div>
              <div className="field" style={{ marginBottom: 8 }}>
                <label className="field-label">Description</label>
                <textarea
                  className="admin-textarea"
                  style={{ marginBottom: 0 }}
                  value={b.description}
                  onChange={(e) => updateBuilding(b.code, { description: e.target.value })}
                  placeholder="Description"
                  readOnly={!isAdminUser}
                />
              </div>
              <div className="field">
                <label className="field-label">Rooms</label>
                <input
                  className="admin-input"
                  value={(b.rooms || []).join(", ")}
                  onChange={(e) => updateBuilding(b.code, { rooms: e.target.value.split(",").map((r) => r.trim()).filter(Boolean) })}
                  placeholder="Rooms, comma separated"
                  readOnly={!isAdminUser}
                />
              </div>
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
              <div className="admin-card-header">
                <div className="admin-service-icon"><Building2 size={16} /></div>
                <input
                  className="admin-input admin-input-name"
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
              <div className="field" style={{ marginBottom: 8 }}>
                <label className="field-label">Email</label>
                <input
                  type="email"
                  className="admin-input"
                  value={s.email ?? ""}
                  onChange={(e) => updateService(s.id, { email: e.target.value })}
                  placeholder="e.g. department@universum-ks.org"
                  readOnly={!isAdminUser}
                />
              </div>
              <div className="field" style={{ marginBottom: 8 }}>
                <label className="field-label">Location</label>
                <input
                  className="admin-input"
                  value={s.building}
                  onChange={(e) => updateService(s.id, { building: e.target.value })}
                  placeholder="Location (optional)"
                  readOnly={!isAdminUser}
                />
              </div>
              <div className="admin-row">
                <div className="field" style={{ flex: 1 }}>
                  <label className="field-label">Hours</label>
                  <input
                    className="admin-input"
                    value={s.hours}
                    onChange={(e) => updateService(s.id, { hours: e.target.value })}
                    placeholder="Hours"
                    readOnly={!isAdminUser}
                  />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label className="field-label">Phone</label>
                  <input
                    className="admin-input"
                    value={s.phone}
                    onChange={(e) => updateService(s.id, { phone: e.target.value })}
                    placeholder="Phone"
                    readOnly={!isAdminUser}
                  />
                </div>
              </div>
              <div className="admin-faqs">
                <label className="field-label" style={{ display: "block", marginBottom: 8 }}>FAQs</label>
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
  const [tab, setTab] = useState("ask");
  const [user, setUser] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle");
  const [selectedBuildingCode, setSelectedBuildingCode] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []); 
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
      {/* Desktop Sidebar Rail */}
      <div className="rail">
        <div className="rail-brand">
          <div className="rail-brand-mark">
            <img src={uniMark} alt="Universum International College" />
          </div>
          <div>
            <span className="rail-brand-text">SmartCampus</span>
            <div className="rail-brand-sub">Universum International College</div>
          </div>
        </div>
    <nav className="rail-nav">
  {TABS.map((t) => {
    const Icon = t.icon;
    const active = tab === t.id;
    
    // Check if user is logged in AND is an admin
    const isAdmin = user && user.email === "kastriotfilipaj533@gmail.com";
    const label = t.id === "admin" ? (isAdmin ? "Admin" : user ? "Account" : "Login / Register") : t.label;

    return (
      <button key={t.id} className={`rail-item ${active ? "rail-item-active" : ""}`} onClick={() => setTab(t.id)}>
        <Icon size={18} />
        <span>{label}</span>
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
          <div className="mobile-topbar-mark">
            <img src={uniMark} alt="Universum International College" />
          </div>
          <span className="mobile-topbar-text">
            {TABS.find((t) => t.id === tab)?.label || "SmartCampus"}
          </span>
        </div>

        {/* Dynamic Content View */}
        <div className="content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>Loading campus data…</span>
            </div>
          ) : (
            <div key={tab} className="tab-fade" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              {tab === "ask" && <AskTab buildings={buildings} services={services} />}
              {tab === "directory" && (
                <div>
                  {/* CAMPUS HERO BANNER */}
                  <div className="directory-hero">
                    <img src={campusHero} alt="Students on the Universum International College campus" />
                    <div className="directory-hero-overlay">
                      <span className="directory-hero-eyebrow">
                        <MapPin size={12} /> Prishtina Campus
                      </span>
                      <h3 className="directory-hero-title">Universum International College</h3>
                      <p className="directory-hero-sub">Find your way around every building, office, and room — {buildings.length} buildings tracked live.</p>
                    </div>
                  </div>

                  {/* MAP BOX */}
                  <div className="map-box">
                    <CampusMap buildings={buildings} selectedCode={selectedBuildingCode} />
                  </div>

                  {/* DIRECTORY LIST */}
                  <DirectoryTab
                    buildings={buildings}
                    services={services}
                    selectedCode={selectedBuildingCode}
                    onSelectBuilding={setSelectedBuildingCode}
                  />
                </div>
              )}
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
            </div>
          )}
        </div>

        {/* Mobile Tabbar Nav */}
       <div className="tabbar">
  {TABS.map((t) => {
    const Icon = t.icon;
    const active = tab === t.id;

    // Check if user is logged in AND is an admin
    const isAdmin = user && user.email === "kastriotfilipaj533@gmail.com";
    const label = t.id === "admin" ? (isAdmin ? "Admin" : user ? "Account" : "Login / Register") : t.label;

    return (
      <button key={t.id} className={`tab-btn ${active ? "tab-btn-active" : ""}`} onClick={() => setTab(t.id)}>
        <Icon size={18} />
        <span>{label}</span>
      </button>
    );
  })}
</div>
      </div>
    </div>
  );
}
