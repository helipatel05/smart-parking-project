


const locations = [
  { id: "ahmedabad-pvr-acropolis", city: "Ahmedabad", name: "PVR Acropolis Mall", area: "Thaltej", address: "Acropolis Mall, SG Highway, Ahmedabad", mapQuery: "PVR Acropolis Mall Ahmedabad parking" },
  { id: "ahmedabad-alpha-one", city: "Ahmedabad", name: "Nexus Ahmedabad One Mall", area: "Vastrapur", address: "Vastrapur, Ahmedabad", mapQuery: "Nexus Ahmedabad One Mall parking" },
  { id: "surat-pvr-rahulraj", city: "Surat", name: "PVR RahulRaj Mall", area: "Dumas Road", address: "RahulRaj Mall, Dumas Road, Surat", mapQuery: "PVR RahulRaj Mall Surat parking" },
  { id: "vadodara-pvr-transcube", city: "Vadodara", name: "PVR Transcube Plaza", area: "Sayajiganj", address: "Transcube Plaza, Vadodara", mapQuery: "PVR Transcube Plaza Vadodara parking" },
  { id: "mumbai-pvr-phoenix", city: "Mumbai", name: "PVR Phoenix Palladium", area: "Lower Parel", address: "Phoenix Palladium, Lower Parel, Mumbai", mapQuery: "PVR Phoenix Palladium Mumbai parking" },
  { id: "pune-pvr-phoenix", city: "Pune", name: "PVR Phoenix Marketcity", area: "Viman Nagar", address: "Phoenix Marketcity, Pune", mapQuery: "PVR Phoenix Marketcity Pune parking" }
];

const app = document.getElementById("app");
const rows = ["A", "B", "C", "D"];
let state = {
  screen: document.body.dataset.page === "login" ? "login" : "home",
  userName: "Guest Driver",
  selectedLocation: locations[0],
  slots: [],
  bookings: [],
  timers: {},
  gateLog: [],
  alerts: [],
  revenue: 0,
  activeTab: "map",
  suggestion: null,
  predictions: [],
  isPeak: false
};

function seedSlots(locationId) {
  const seed = locationId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  state.slots = [];
  rows.forEach((row) => {
    for (let c = 0; c < 10; c += 1) {
      const id = `${row}${c + 1}`;
      const rand = (Math.sin(seed + row.charCodeAt(0) * 17 + c * 31) + 1) / 2;
      state.slots.push({
        id,
        row,
        col: c,
        status: rand < 0.5 ? "available" : rand < 0.8 ? "occupied" : "available",
        vehicle: null,
        type: c < 5 ? "4w" : "2w"
      });
    }
  });
}

function cities() {
  return [...new Set(locations.map((location) => location.city))];
}

function locationOptions(city) {
  return locations.filter((location) => location.city === city);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function showToast(title, message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<strong>${escapeHtml(title)}</strong><div class="small-muted">${escapeHtml(message)}</div>`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function setScreen(screen) {
  state.screen = screen;
  render();
}

function selectLocation(locationId) {
  const location = locations.find((item) => item.id === locationId);
  if (!location) return;
  state.selectedLocation = location;
  state.bookings = [];
  state.timers = {};
  state.gateLog = [`Location changed to ${location.name}, ${location.city}`];
  state.alerts = [];
  state.suggestion = null;
  seedSlots(location.id);
  render();
}

function renderHeader() {
  return `
    <nav class="topbar">
      <div class="brand">
        <div class="brand-mark">P</div>
        <div>
          <div class="brand-title">Smart Parking</div>
          <div class="brand-sub">AI parking for malls and cinemas</div>
        </div>
      </div>
      <div class="nav-actions">
        <button class="btn" data-action="login">Login</button>
        <button class="btn primary" data-action="book-parking">Book Parking</button>
      </div>
    </nav>
  `;
}

function renderLocationSelector() {
  const selectedCity = state.selectedLocation.city;
  const citySelect = cities().map((city) => `<option value="${escapeHtml(city)}" ${city === selectedCity ? "selected" : ""}>${escapeHtml(city)}</option>`).join("");
  const mallSelect = locationOptions(selectedCity).map((location) => `<option value="${escapeHtml(location.id)}" ${location.id === state.selectedLocation.id ? "selected" : ""}>${escapeHtml(location.name)}</option>`).join("");
  return `
    <div class="form-grid">
      <div class="field">
        <label>City</label>
        <select data-input="city">${citySelect}</select>
      </div>
      <div class="field">
        <label>Mall / PVR</label>
        <select data-input="location">${mallSelect}</select>
      </div>
    </div>
  `;
}

function renderSelectedLocation() {
  const location = state.selectedLocation;
  return `
    <div class="selected-location">
      <div class="selected-location-head">
        <div>
          <h2>${escapeHtml(location.name)}</h2>
          <div class="small-muted">${escapeHtml(location.area)}, ${escapeHtml(location.city)}</div>
        </div>
        <span class="badge">40 slots</span>
      </div>
      <p class="small-muted">${escapeHtml(location.address)}</p>
      <div class="metric-row">
        <div class="mini-metric"><strong>AI</strong><span class="small-muted">suggestion</span></div>
        <div class="mini-metric"><strong>ANPR</strong><span class="small-muted">gate</span></div>
        <div class="mini-metric"><strong>₹30</strong><span class="small-muted">per hour</span></div>
      </div>
    </div>
  `;
}

function renderHome() {
  app.innerHTML = `
    <main class="page">
      <div class="container">
        ${renderHeader()}
        <section class="hero">
          <div>
            <div class="eyebrow">Live slots, pre-booking, ANPR gate access</div>
            <h1>Find parking before you reach the mall.</h1>
            <p class="lead">Choose your city, select a PVR or mall parking location, reserve a slot, and verify your vehicle at the smart entry gate.</p>
            <div class="feature-grid">
              <div class="feature-card"><div class="feature-icon">⌖</div><strong>City based search</strong><p>Pick where you want to park.</p></div>
              <div class="feature-card"><div class="feature-icon">◷</div><strong>Reserve ahead</strong><p>Avoid last minute parking stress.</p></div>
              <div class="feature-card"><div class="feature-icon">◇</div><strong>Smart entry</strong><p>Number plate verification at gate.</p></div>
            </div>
          </div>
          <div class="card">
            <div class="card-title">Select parking destination</div>
            <p class="small-muted">Choose city and mall/PVR before opening the live map.</p>
            ${renderLocationSelector()}
            ${renderSelectedLocation()}
            <div class="page-actions">
              <button class="btn primary" data-action="open-dashboard">Open Live Parking</button>
              <button class="btn secondary" data-action="login">Login First</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  `;
}

function renderLogin() {
  app.innerHTML = `
    <main class="login-page">
      <section class="login-art">
        <div>
          <div class="brand-mark">P</div>
          <h1>Reserve. Arrive. Park.</h1>
          <p class="lead">Login to access smart parking bookings, AI gate verification, active timers, and indoor navigation.</p>
        </div>
      </section>
      <section class="login-form-wrap">
        <div class="card login-card">
          <button class="btn" data-action="home">Back to Home</button>
          <h2>Login</h2>
          <p class="small-muted">Use any email and password for this demo app.</p>
          <form data-form="login" class="list">
            <div class="field">
              <label>Email</label>
              <input name="email" type="email" placeholder="driver@example.com" required>
            </div>
            <div class="field">
              <label>Password</label>
              <input name="password" type="password" placeholder="Enter password" required>
            </div>
            <button class="btn primary" type="submit">Login & Continue</button>
          </form>
        </div>
      </section>
    </main>
  `;
}

function renderDashboard() {
  app.innerHTML = `
    <main class="dashboard">
      <div class="container">
        <section class="dashboard-head">
          <div>
            <h1>Smart Parking System</h1>
            <p class="small-muted">AI-powered real-time parking with pre-booking & ANPR</p>
            <div class="chips">
              <span class="badge">${escapeHtml(state.selectedLocation.name)}, ${escapeHtml(state.selectedLocation.city)}</span>
              <span class="badge">Logged in as ${escapeHtml(state.userName)}</span>
            </div>
          </div>
          <div class="nav-actions">
            <button class="btn secondary" data-action="home">Home</button>
            <button class="btn" data-action="logout">Logout</button>
          </div>
        </section>
        ${renderTabs()}
        ${renderPanel()}
      </div>
    </main>
  `;
}

function renderTabs() {
  const tabs = [
    ["map", "Live Map"],
    ["book", "Pre-Book"],
    ["gate", "AI Gate"],
    ["predict", "Predictions"],
    ["timers", "Timers"],
    ["nav", "Navigation"],
    ["admin", "Admin"]
  ];
  return `<div class="tabs">${tabs.map(([id, label]) => `<button class="tab-btn ${state.activeTab === id ? "active" : ""}" data-tab="${id}">${label}</button>`).join("")}</div>`;
}

function renderPanel() {
  const content = {
    map: renderLiveMap(),
    book: renderPreBook(),
    gate: renderGate(),
    predict: renderPredictions(),
    timers: renderTimers(),
    nav: renderNavigation(),
    admin: renderAdmin()
  }[state.activeTab];
  return `<section class="tab-panel active">${content}</section>`;
}

function counts() {
  return {
    available: state.slots.filter((slot) => slot.status === "available").length,
    occupied: state.slots.filter((slot) => slot.status === "occupied").length,
    reserved: state.slots.filter((slot) => slot.status === "reserved").length
  };
}

function rate() {
  const current = counts();
  const total = current.available + current.occupied + current.reserved;
  return 30 + (total && current.occupied / total > 0.7 ? 20 : 0);
}

function renderLiveMap() {
  const current = counts();
  return `
    <div class="panel-card">
      <h2>Current parking location</h2>
      <p class="small-muted">${escapeHtml(state.selectedLocation.name)} — ${escapeHtml(state.selectedLocation.address)}</p>
    </div>
    <div class="stats">
      <div class="stat"><strong>${current.available}</strong><span class="small-muted">Available</span></div>
      <div class="stat danger"><strong>${current.occupied}</strong><span class="small-muted">Occupied</span></div>
      <div class="stat warning"><strong>${current.reserved}</strong><span class="small-muted">Reserved</span></div>
      <div class="stat"><strong>₹${rate()}</strong><span class="small-muted">Current Rate/hr</span></div>
    </div>
    <div class="legend">
      <span><i class="dot available"></i>Available</span>
      <span><i class="dot occupied"></i>Occupied</span>
      <span><i class="dot reserved"></i>Reserved</span>
    </div>
    <div class="parking-grid">
      ${state.slots.map((slot) => `<div class="slot ${slot.status}"><span>${slot.id}</span><small>${slot.type === "2w" ? "2W" : "4W"}</small></div>`).join("")}
    </div>
    <div class="page-actions">
      <button class="btn" data-action="iot">Simulate IoT Update</button>
      <button class="btn primary" data-action="go-book">Pre-Book a Slot</button>
      <button class="btn secondary" data-action="maps">Navigate in Maps</button>
    </div>
  `;
}

function renderPreBook() {
  const citySelect = cities().map((city) => `<option value="${escapeHtml(city)}" ${city === state.selectedLocation.city ? "selected" : ""}>${escapeHtml(city)}</option>`).join("");
  const mallSelect = locationOptions(state.selectedLocation.city).map((location) => `<option value="${escapeHtml(location.id)}" ${location.id === state.selectedLocation.id ? "selected" : ""}>${escapeHtml(location.name)}</option>`).join("");
  return `
    <div class="panel-card">
      <h2>Pre-Book Your Parking Slot</h2>
      <div class="notice">
        <strong>Where do you want to park?</strong>
        <div class="small-muted">Select city and mall/PVR location before booking.</div>
        <div class="form-grid">
          <div class="field">
            <label>City</label>
            <select data-input="city">${citySelect}</select>
          </div>
          <div class="field">
            <label>Mall / PVR</label>
            <select data-input="location">${mallSelect}</select>
          </div>
        </div>
        Booking at <strong>${escapeHtml(state.selectedLocation.name)}</strong>, ${escapeHtml(state.selectedLocation.area)}, ${escapeHtml(state.selectedLocation.city)}
      </div>
      <form data-form="booking">
        <div class="form-grid">
          <div class="field">
            <label>Vehicle Type</label>
            <select name="vehicle"><option value="4w">Four-Wheeler</option><option value="2w">Two-Wheeler</option></select>
          </div>
          <div class="field">
            <label>Number Plate</label>
            <input name="plate" maxlength="12" placeholder="GJ01AB1234" class="plate">
          </div>
          <div class="field">
            <label>Duration (hours)</label>
            <select name="duration"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>6</option></select>
          </div>
          <div class="field">
            <label>Slot Preference</label>
            <select name="pref"><option value="auto">Auto-assign (AI recommendation)</option><option value="near">Nearest to entrance</option><option value="min">Least congested zone</option></select>
          </div>
        </div>
        ${state.suggestion ? `<div class="suggestion">${escapeHtml(state.suggestion.msg)}</div>` : ""}
        <div class="page-actions">
          <button type="button" class="btn secondary" data-action="suggest">AI Suggest Slot</button>
          <button type="submit" class="btn primary">Confirm Booking</button>
        </div>
      </form>
    </div>
    <div class="panel-card">
      <h3>Active Bookings</h3>
      ${renderBookings()}
    </div>
  `;
}

function renderBookings() {
  if (!state.bookings.length) return `<p class="small-muted">No active bookings.</p>`;
  return `<div class="list">${state.bookings.map((booking) => `
    <div class="list-item">
      <div>
        <div class="plate">${escapeHtml(booking.plate)}</div>
        <div class="small-muted">${escapeHtml(state.selectedLocation.name)} • Slot ${escapeHtml(booking.slot)} • ${booking.vtype === "4w" ? "4-wheeler" : "2-wheeler"} • ${booking.duration}h</div>
      </div>
      <div class="nav-actions">
        <span class="badge">${booking.active ? "Reserved" : "Active"}</span>
        ${booking.active ? `<button class="btn danger" data-cancel="${booking.id}">Cancel</button>` : ""}
      </div>
    </div>
  `).join("")}</div>`;
}

function renderGate() {
  return `
    <div class="panel-card">
      <h2>AI Entry Gate Verification</h2>
      <div class="gate-box ${state.gateState || ""}">
        <div class="gate-symbol">${state.gateState === "open" ? "✓" : state.gateState === "deny" ? "×" : "◇"}</div>
        <h2>${state.gateState === "open" ? "Gate Open — Welcome!" : state.gateState === "deny" ? "Access Denied" : "Gate Closed"}</h2>
        <p class="small-muted">${escapeHtml(state.gateMessage || "Enter vehicle number plate below")}</p>
        <input class="plate-input" data-input="gate-plate" maxlength="12" placeholder="GJ01AB1234">
      </div>
      <div class="page-actions">
        <button class="btn primary" data-action="verify">Verify Plate</button>
        <button class="btn secondary" data-action="demo-scan">Demo Webcam Scan</button>
      </div>
    </div>
    <div class="panel-card">
      <h3>Detection Log</h3>
      ${state.gateLog.length ? `<div class="list">${state.gateLog.map((log) => `<div class="list-item">${escapeHtml(log)}</div>`).join("")}</div>` : `<p class="small-muted">No activity today.</p>`}
    </div>
  `;
}

function renderPredictions() {
  if (!state.predictions.length) refreshPredictions(false);
  return `
    <div class="panel-card">
      <h2>AI Availability Predictions</h2>
      <p class="small-muted">Based on historical IoT sensor data, time-series patterns, and current occupancy.</p>
      <div class="list" style="margin-top:18px">
        ${state.predictions.map((prediction) => `
          <div class="prediction">
            <span class="prediction-dot" style="background:${prediction.color}"></span>
            <div>
              <strong>${escapeHtml(prediction.title)}</strong> <span class="badge">${prediction.conf}% conf</span>
              <div class="small-muted">${escapeHtml(prediction.sub)}</div>
            </div>
          </div>
        `).join("")}
      </div>
      <div class="page-actions"><button class="btn secondary" data-action="refresh-predictions">Refresh Predictions</button></div>
    </div>
    <div class="panel-card">
      <h3>Dynamic Pricing Model</h3>
      <div class="prediction">
        <span class="prediction-dot" style="background:${state.isPeak ? "var(--danger)" : "var(--primary)"}"></span>
        <div>
          <strong>${state.isPeak ? "Peak pricing active" : "Standard pricing active"}: ₹${state.isPeak ? 50 : 30}/hr</strong>
          <div class="small-muted">${state.isPeak ? "High demand 5–8 PM. Rate adjusted automatically." : "Off-peak. Reduced rate applied."}</div>
        </div>
      </div>
    </div>
  `;
}

function renderTimers() {
  const activeTimers = Object.values(state.timers).filter((timer) => timer.end > Date.now());
  if (!activeTimers.length) {
    return `<div class="panel-card"><h2>Active Parking Sessions</h2><p class="small-muted">No active sessions.</p></div>`;
  }
  return `<div class="panel-card"><h2>Active Parking Sessions</h2><div class="list">${activeTimers.map((timer) => renderTimer(timer)).join("")}</div></div>`;
}

function renderTimer(timer) {
  const left = Math.max(0, Math.round((timer.end - Date.now()) / 1000));
  const pct = Math.round((left / timer.duration) * 100);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return `
    <div class="list-item" style="display:block">
      <div class="selected-location-head">
        <div><span class="plate">${escapeHtml(timer.plate)}</span><span class="small-muted"> • Slot ${escapeHtml(timer.slotId)}</span></div>
        <strong style="color:${pct <= 20 ? "var(--danger)" : "var(--primary)"}">${mm}:${ss}</strong>
      </div>
      <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%;background:${pct <= 20 ? "var(--danger)" : "var(--primary)"}"></div></div>
    </div>
  `;
}

function renderNavigation() {
  const reserved = state.bookings.filter((booking) => booking.active).map((booking) => booking.slot);
  return `
    <div class="panel-card">
      <h2>Indoor Navigation</h2>
      <div class="field" style="max-width:360px">
        <label>Your reserved slot</label>
        <select data-input="nav-slot">
          <option value="">Select slot...</option>
          ${reserved.map((slot) => `<option value="${escapeHtml(slot)}">Slot ${escapeHtml(slot)}</option>`).join("")}
        </select>
      </div>
      <div class="page-actions"><button class="btn primary" data-action="directions" ${reserved.length ? "" : "disabled"}>Get Directions</button></div>
      <div class="nav-steps">${(state.navSteps || []).map((step) => `<div class="nav-step">${escapeHtml(step)}</div>`).join("")}</div>
    </div>
  `;
}

function renderAdmin() {
  const current = counts();
  const occupancy = Math.round((current.occupied / state.slots.length) * 100);
  return `
    <div class="stats">
      <div class="stat"><strong>${occupancy}%</strong><span class="small-muted">Occupancy</span></div>
      <div class="stat"><strong>₹${state.revenue}</strong><span class="small-muted">Revenue Today</span></div>
      <div class="stat warning"><strong>${state.alerts.length}</strong><span class="small-muted">Security Alerts</span></div>
      <div class="stat"><strong>${state.bookings.length}</strong><span class="small-muted">Total Bookings</span></div>
    </div>
    <div class="panel-card">
      <h2>Peak Hour Demand</h2>
      ${[
        ["10 AM", 42],
        ["1 PM", 58],
        ["4 PM", 70],
        ["7 PM", 94],
        ["10 PM", 61]
      ].map(([label, value]) => `<div class="peak-bar" style="width:${value}%">${label} — ${value}%</div>`).join("")}
    </div>
    <div class="panel-card">
      <h3>Admin Controls</h3>
      <div class="page-actions">
        <button class="btn secondary" data-action="iot">Refresh Sensor Data</button>
        <button class="btn secondary" data-action="reset-location">Reset Selected Location</button>
      </div>
    </div>
  `;
}

function simulateIoT() {
  state.slots = state.slots.map((slot) => {
    if (slot.status === "available" && Math.random() < 0.12) return { ...slot, status: "occupied" };
    if (slot.status === "occupied" && Math.random() < 0.08 && !state.bookings.find((booking) => booking.slot === slot.id && booking.active)) return { ...slot, status: "available", vehicle: null };
    return slot;
  });
  showToast("IoT Updated", "Sensor data refreshed successfully.");
  render();
}

function suggestSlot(form) {
  const vehicle = form?.vehicle?.value || "4w";
  const pref = form?.pref?.value || "auto";
  const available = state.slots.filter((slot) => slot.status === "available" && slot.type === vehicle);
  if (!available.length) {
    showToast("No slots", `No ${vehicle === "4w" ? "4-wheeler" : "2-wheeler"} slots available.`);
    return;
  }
  const pick = pref === "min" ? available[Math.floor(Math.random() * available.length)] : [...available].sort((a, b) => a.col - b.col)[0];
  state.suggestion = {
    id: pick.id,
    msg: `AI recommends ${pick.id} — ${pick.type === "4w" ? "Four-wheeler" : "Two-wheeler"} zone, Row ${pick.row}, Position ${pick.col + 1}. Nearest exit. Confidence: 92%`
  };
  render();
}

function bookSlot(form) {
  const plate = form.plate.value.trim().toUpperCase();
  const vehicle = form.vehicle.value;
  const duration = Number(form.duration.value);
  const pref = form.pref.value;
  if (!plate || plate.length < 6) {
    showToast("Invalid Plate", "Enter a valid number plate.");
    return;
  }
  const slotId = state.suggestion?.id || state.slots.find((slot) => slot.status === "available" && slot.type === vehicle)?.id;
  if (!slotId) {
    showToast("Parking Full", "No available slots for this vehicle type.");
    return;
  }
  state.slots = state.slots.map((slot) => slot.id === slotId ? { ...slot, status: "reserved", vehicle: plate } : slot);
  state.bookings.push({ id: `BK${Date.now()}`, slot: slotId, plate, vtype: vehicle, duration, active: true, bookedAt: new Date(), pref });
  state.suggestion = null;
  showToast("Booked Successfully", `Slot ${slotId} reserved at ${state.selectedLocation.name} for ${plate}.`);
  render();
}

function verifyPlate(plateInput) {
  const plate = (plateInput?.value || "").trim().toUpperCase();
  if (!plate) {
    showToast("Error", "Enter plate number.");
    return;
  }
  const booking = state.bookings.find((item) => item.plate === plate && item.active);
  const time = new Date().toLocaleTimeString();
  if (booking) {
    state.gateState = "open";
    state.gateMessage = `Welcome! Please proceed to Slot ${booking.slot}`;
    state.slots = state.slots.map((slot) => slot.id === booking.slot ? { ...slot, status: "occupied" } : slot);
    state.bookings = state.bookings.map((item) => item.id === booking.id ? { ...item, active: false } : item);
    state.revenue += booking.duration * 30;
    state.gateLog.unshift(`${time} — ${plate} AUTHORIZED — Slot ${booking.slot}`);
    state.timers[booking.slot] = { slotId: booking.slot, plate, end: Date.now() + booking.duration * 3600 * 1000, duration: booking.duration * 3600 };
    showToast("Access Granted", `Welcome ${plate}`);
  } else {
    state.gateState = "deny";
    state.gateMessage = `${plate} has no active reservation.`;
    state.gateLog.unshift(`${time} — ${plate} DENIED`);
    state.alerts.unshift({ time, plate, reason: "No booking found" });
    showToast("Access Denied", "No booking found.");
  }
  render();
  setTimeout(() => {
    state.gateState = "";
    state.gateMessage = "";
    render();
  }, 5000);
}

function refreshPredictions(shouldRender = true) {
  const hour = new Date().getHours();
  state.isPeak = hour >= 17 && hour <= 20;
  state.predictions = [
    { color: "#5be5a0", title: "Slot A3 will be available in 12 min", sub: "Current occupant's timer expires soon.", conf: 89 },
    { color: state.isPeak ? "#f1567b" : "#5be5a0", title: state.isPeak ? "Parking will be 90% full in 20 min" : "Occupancy expected to drop to 40% in 30 min", sub: state.isPeak ? "Peak hours: 5 PM – 8 PM. Pre-book now." : "Off-peak period detected.", conf: 82 },
    { color: "#f0b83e", title: "Zone B will fill up in about 35 min", sub: "Based on last 7-day patterns.", conf: 74 },
    { color: "#58a7ff", title: "Best window: Next 2 hours — moderate demand", sub: "Optimal slot: B5 near exit and least congested.", conf: 91 }
  ];
  if (shouldRender) {
    showToast("Predictions Refreshed", "AI availability predictions updated.");
    render();
  }
}

function getDirections(slot) {
  if (!slot) {
    showToast("Select Slot", "Choose your reserved slot first.");
    return;
  }
  const row = slot[0];
  const col = Number(slot.slice(1)) - 1;
  const steps = ["Enter through Main Gate A", "Proceed straight for 50 meters"];
  if (row === "A") steps.push("Turn right into Zone A");
  else if (row === "B") steps.push("Pass Zone A, turn right into Zone B");
  else steps.push("Proceed to lower basement level 2");
  steps.push(col > 5 ? "Go to the end of the aisle" : "Slot is in the first half of the aisle");
  steps.push(`Arrive at Slot ${slot}`);
  state.navSteps = steps;
  render();
}

function render() {
  if (state.screen === "login") renderLogin();
  else if (state.screen === "dashboard") renderDashboard();
  else renderHome();
}

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "login") setScreen("login");
  if (action === "home") setScreen("home");
  if (action === "book-parking") setScreen("login");
  if (action === "open-dashboard") setScreen("dashboard");
  if (action === "logout") {
    state.userName = "Guest Driver";
    setScreen("home");
  }
  if (action === "iot") simulateIoT();
  if (action === "go-book") {
    state.activeTab = "book";
    render();
  }
  if (action === "maps") {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(state.selectedLocation.mapQuery)}`, "_blank");
  }
  if (action === "suggest") suggestSlot(event.target.closest("form"));
  if (action === "verify") verifyPlate(document.querySelector("[data-input='gate-plate']"));
  if (action === "demo-scan") {
    const booking = state.bookings.find((item) => item.active);
    if (!booking) {
      showToast("Demo Mode", "Book a slot first to simulate a successful match.");
    } else {
      verifyPlate({ value: booking.plate });
    }
  }
  if (action === "refresh-predictions") refreshPredictions(true);
  if (action === "directions") getDirections(document.querySelector("[data-input='nav-slot']")?.value);
  if (action === "reset-location") selectLocation(state.selectedLocation.id);
});

document.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]")?.dataset.tab;
  if (tab) {
    state.activeTab = tab;
    render();
  }
  const cancelId = event.target.closest("[data-cancel]")?.dataset.cancel;
  if (cancelId) {
    const booking = state.bookings.find((item) => item.id === cancelId);
    if (booking) {
      state.slots = state.slots.map((slot) => slot.id === booking.slot ? { ...slot, status: "available", vehicle: null } : slot);
      state.bookings = state.bookings.filter((item) => item.id !== cancelId);
      showToast("Booking Cancelled", `Slot ${booking.slot} is now available.`);
      render();
    }
  }
});

document.addEventListener("change", (event) => {
  if (event.target.dataset.input === "city") {
    const first = locations.find((location) => location.city === event.target.value);
    if (first) selectLocation(first.id);
  }
  if (event.target.dataset.input === "location") selectLocation(event.target.value);
});

document.addEventListener("input", (event) => {
  if (event.target.name === "plate" || event.target.dataset.input === "gate-plate") {
    event.target.value = event.target.value.toUpperCase();
  }
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.target.dataset.form === "login") {
    const email = event.target.email.value.trim();
    const password = event.target.password.value;
    if (!email.includes("@") || password.length < 4) {
      showToast("Login details required", "Enter an email and at least 4 characters password for demo login.");
      return;
    }
    state.userName = email.split("@")[0].replace(/[._-]/g, " ") || "Driver";
    showToast("Login successful", "You can now select a parking location and book a slot.");
    setScreen("dashboard");
  }
  if (event.target.dataset.form === "booking") bookSlot(event.target);
});

setInterval(() => {
  if (state.screen === "dashboard" && state.activeTab === "timers") render();
}, 1000);

seedSlots(state.selectedLocation.id);
refreshPredictions(false);
render();
