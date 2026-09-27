// Shared API + auth layer. Include on every page.
const API_URL = "http://127.0.0.1:8000";

function getToken() { return localStorage.getItem("token"); }
function setToken(t) { localStorage.setItem("token", t); }
function clearToken() { localStorage.removeItem("token"); }

// Redirect to login if not authenticated. Call at the top of every protected page.
function requireAuth() {
  if (!getToken()) window.location.href = "index.html";
}

function logout() {
  clearToken();
  window.location.href = "index.html";
}

// Core request wrapper: adds auth header, parses JSON, handles 401 globally.
async function apiFetch(path, { method = "GET", body = null, form = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  let payload = null;
  if (body !== null) {
    if (form) {
      payload = body; // URLSearchParams
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  let res;
  try {
    res = await fetch(API_URL + path, { method, headers, body: payload });
  } catch (e) {
    throw new Error("Can't reach the backend at " + API_URL + ". Is the server running?");
  }

  if (res.status === 401) {
    clearToken();
    window.location.href = "index.html";
    return null;
  }

  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body */ }

  if (!res.ok) {
    const msg = (data && data.detail) ? data.detail : ("Request failed (" + res.status + ")");
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

// Convenience wrappers used by every module page.
const api = {
  list: (resource) => apiFetch(`/${resource}/`),
  get: (resource, id) => apiFetch(`/${resource}/${id}`),
  create: (resource, body) => apiFetch(`/${resource}/`, { method: "POST", body }),
  update: (resource, id, body) => apiFetch(`/${resource}/${id}`, { method: "PUT", body }),
  remove: (resource, id) => apiFetch(`/${resource}/${id}`, { method: "DELETE" }),
  me: () => apiFetch("/me"),
};

// Small DOM helpers reused across module pages.
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c === null || c === undefined) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
}

function badge(text) {
  const cls = (text || "").toString().toLowerCase().replace(/\s+/g, "-");
  return `<span class="badge ${cls}">${text || "—"}</span>`;
}

function fmtDate(d) {
  if (!d) return "—";
  return d;
}

// Renders the shared app shell (sidebar + topbar) into #appShell, then calls onReady(contentEl).
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "dashboard.html" },
  { key: "departments", label: "Departments", href: "departments.html" },
  { key: "doctors", label: "Doctors", href: "doctors.html" },
  { key: "patients", label: "Patients", href: "patients.html" },
  { key: "rooms", label: "Rooms", href: "rooms.html" },
  { key: "appointments", label: "Appointments", href: "appointments.html" },
  { key: "admissions", label: "Admissions", href: "admissions.html" },
  { key: "medicines", label: "Medicines", href: "medicines.html" },
  { key: "prescriptions", label: "Prescriptions", href: "prescriptions.html" },
  { key: "bills", label: "Bills", href: "bills.html" },
];

async function renderShell(activeKey, pageTitle, pageSub) {
  requireAuth();
  const root = document.getElementById("appShell");
  const navHtml = NAV_ITEMS.map(
    (n) => `<a class="nav-link ${n.key === activeKey ? "active" : ""}" href="${n.href}">${n.label}</a>`
  ).join("");
  root.innerHTML = `
    <div class="app-shell">
      <div class="sidebar">
        <div class="brand">MediBase</div>
        ${navHtml}
        <div class="spacer"></div>
        <button class="logout" id="logoutBtn">Sign out</button>
      </div>
      <div class="main">
        <div class="topbar">
          <div class="page-head" style="margin:0;align-items:center">
            <h1 style="font-size:17px">${pageTitle}</h1>
          </div>
          <div class="who">Signed in as <strong id="whoName">…</strong></div>
        </div>
        <div class="content" id="pageContent">
          ${pageSub ? `<p style="color:var(--muted);margin:-14px 0 20px">${pageSub}</p>` : ""}
        </div>
      </div>
    </div>`;
  document.getElementById("logoutBtn").onclick = logout;
  try {
    const me = await api.me();
    document.getElementById("whoName").textContent = `${me.username} (${me.role})`;
  } catch (e) { /* handled by 401 redirect already */ }
  return document.getElementById("pageContent");
}

function showToast(msg, isError = false) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.style.cssText = "position:fixed;bottom:24px;right:24px;padding:12px 18px;border-radius:8px;font:14px 'IBM Plex Sans',sans-serif;z-index:100;box-shadow:0 4px 14px rgba(0,0,0,.15)";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = isError ? "#B3261E" : "#0F6B5C";
  t.style.color = "#fff";
  t.style.display = "block";
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.style.display = "none"), 3200);
}