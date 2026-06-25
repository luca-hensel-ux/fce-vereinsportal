const CONFIG = {
  webAppUrl: "https://script.google.com/macros/s/AKfycbziVax2DxYAeft7EPa8yL167IQVnhwo4xGS9hfPVRHcxUiXUfykm4zOwwioaFD29xerGQ/exec"
};

const state = {
  applications: [],
  selectedId: null
};

const views = {
  dashboard: document.getElementById("dashboard"),
  applications: document.getElementById("applications"),
  settings: document.getElementById("settings")
};

function switchView(name){
  Object.entries(views).forEach(([key, el]) => el.classList.toggle("active", key === name));
  document.querySelectorAll(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.view === name));
  document.getElementById("pageTitle").textContent =
    name === "dashboard" ? "Dashboard" : name === "applications" ? "Neue Anträge" : "Einstellungen";
}

async function loadApplications(){
  setLoading(true);
  try {
    const response = await fetch(CONFIG.webAppUrl + "?action=listApplications");
    const result = await response.json();

    if(!result.success){
      throw new Error(result.error || "Unbekannter Fehler beim Laden");
    }

    state.applications = result.applications || [];
    renderDashboard();
    renderApplications();

    if(state.selectedId){
      const stillExists = state.applications.some(a => a.antrags_id === state.selectedId);
      if(stillExists) selectApplication(state.selectedId);
    }
  } catch(error) {
    alert("Fehler beim Laden der Anträge: " + error.message);
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading){
  const btn = document.getElementById("refreshBtn");
  btn.disabled = isLoading;
  btn.textContent = isLoading ? "Lädt ..." : "Aktualisieren";
}

async function updateStatus(id, status){
  try {
    const response = await fetch(CONFIG.webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "updateStatus",
        antrags_id: id,
        status: status
      })
    });

    const result = await response.json();

    if(!result.success){
      throw new Error(result.error || "Status konnte nicht geändert werden");
    }

    const app = state.applications.find(a => a.antrags_id === id);
    if(app) app.status = status;

    renderDashboard();
    renderApplications();
    selectApplication(id);
  } catch(error) {
    alert("Fehler beim Speichern des Status: " + error.message);
  }
}

function renderDashboard(){
  const apps = state.applications;
  document.getElementById("kpiNew").textContent = apps.filter(a => a.status === "Neu").length;
  document.getElementById("kpiQuestions").textContent = apps.filter(a => a.status === "Rückfrage").length;
  document.getElementById("kpiImported").textContent = apps.filter(a => a.status === "Importiert").length;
  document.getElementById("kpiTotal").textContent = apps.length;

  const latest = [...apps].sort((a,b) => String(b.timestamp).localeCompare(String(a.timestamp))).slice(0,5);
  renderApplicationCards(document.getElementById("latestList"), latest);
}

function renderApplications(){
  const search = document.getElementById("searchInput").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;

  const filtered = state.applications.filter(app => {
    const haystack = `${app.antrags_id} ${app.vorname} ${app.nachname} ${app.email}`.toLowerCase();
    return (!search || haystack.includes(search)) && (!status || app.status === status);
  });

  renderApplicationCards(document.getElementById("applicationList"), filtered);
}

function renderApplicationCards(container, apps){
  container.innerHTML = "";

  if(!apps.length){
    container.innerHTML = `<div class="application-card"><p>Keine passenden Anträge gefunden.</p></div>`;
    return;
  }

  apps.forEach(app => {
    const card = document.createElement("article");
    card.className = "application-card" + (state.selectedId === app.antrags_id ? " active" : "");
    card.innerHTML = `
      <div class="application-card-head">
        <div>
          <h3>${escapeHtml(app.vorname)} ${escapeHtml(app.nachname)}</h3>
          <p>${escapeHtml(app.antrags_id)} · ${escapeHtml(app.mitgliedschaft)} · ${formatDateTime(app.timestamp)}</p>
        </div>
        <span class="badge ${escapeHtml(app.status)}">${escapeHtml(app.status || "Neu")}</span>
      </div>
    `;
    card.addEventListener("click", () => selectApplication(app.antrags_id));
    container.appendChild(card);
  });
}

function selectApplication(id){
  state.selectedId = id;
  const app = state.applications.find(a => a.antrags_id === id);
  if(!app) return;

  switchView("applications");
  renderApplications();

  const pdfButton = app.pdf_url
    ? `<button class="ghost" onclick="window.open('${escapeAttr(app.pdf_url)}', '_blank')">PDF öffnen</button>`
    : `<button class="ghost" disabled>Kein PDF-Link</button>`;

  const detail = document.getElementById("detailPanel");
  detail.innerHTML = `
    <div class="detail-header">
      <div>
        <h2>${escapeHtml(app.vorname)} ${escapeHtml(app.nachname)}</h2>
        <div class="detail-meta">${escapeHtml(app.antrags_id)} · Eingang ${formatDateTime(app.timestamp)}</div>
      </div>
      <span class="badge ${escapeHtml(app.status)}">${escapeHtml(app.status || "Neu")}</span>
    </div>

    <div class="detail-grid">
      <div class="detail-item"><span>Geburtsdatum</span>${formatDate(app.geburtsdatum)}</div>
      <div class="detail-item"><span>Mitgliedschaft</span>${escapeHtml(app.mitgliedschaft)} (${escapeHtml(app.jahresbeitrag)} €)</div>
      <div class="detail-item"><span>E-Mail</span>${escapeHtml(app.email)}</div>
      <div class="detail-item"><span>Mobil</span>${escapeHtml(app.mobil || "-")}</div>
      <div class="detail-item"><span>Adresse</span>${escapeHtml(app.strasse)} ${escapeHtml(app.hausnummer)}<br>${escapeHtml(app.plz)} ${escapeHtml(app.ort)}</div>
      <div class="detail-item"><span>verein.cloud Mitgliedsnummer</span>${escapeHtml(app.vereincloud_mitgliedsnummer || "-")}</div>
      <div class="detail-item"><span>SEPA</span>${escapeHtml(app.sepa_unterschrift_vorhanden || "-")}</div>
      <div class="detail-item"><span>CSV exportiert</span>${escapeHtml(app.csv_exportiert || "-")}</div>
    </div>

    ${renderFamilyMembers(app.familienmitglieder || [])}

    <div class="action-row">
      ${pdfButton}
      <button class="primary" onclick="downloadCsv('${escapeAttr(app.antrags_id)}')">CSV herunterladen</button>
      <button class="success" onclick="updateStatus('${escapeAttr(app.antrags_id)}', 'Importiert')">Als importiert markieren</button>
      <button class="ghost" onclick="updateStatus('${escapeAttr(app.antrags_id)}', 'Rückfrage')">Rückfrage</button>
      <button class="danger" onclick="updateStatus('${escapeAttr(app.antrags_id)}', 'Neu')">Zurück auf Neu</button>
    </div>
  `;
}

function formatDate(value){
  if(!value) return "-";
  const d = new Date(value);
  if(Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE");
}

function formatDateTime(value){
  if(!value) return "-";
  const d = new Date(value);
  if(Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("de-DE");
}

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function escapeAttr(value){
  return escapeHtml(value).replaceAll("`", "&#096;");
}

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

document.querySelector("[data-open-applications]").addEventListener("click", () => switchView("applications"));
document.getElementById("searchInput").addEventListener("input", renderApplications);
document.getElementById("statusFilter").addEventListener("change", renderApplications);
document.getElementById("refreshBtn").addEventListener("click", loadApplications);

window.updateStatus = updateStatus;

loadApplications();


function downloadCsv(antragsId){
  const url = CONFIG.webAppUrl + "?action=exportCsv&antrags_id=" + encodeURIComponent(antragsId);
  window.open(url, "_blank");
}

window.downloadCsv = downloadCsv;


function renderFamilyMembers(members){
  if(!members || !members.length){
    return "";
  }

  const rows = members.map(m => `
    <div class="detail-item">
      <span>Familienmitglied</span>
      ${escapeHtml(m.vorname || "")} ${escapeHtml(m.nachname || "")}<br>
      ${formatDate(m.geburtsdatum)}
    </div>
  `).join("");

  return `
    <h3 style="margin:4px 0 12px">Familienmitglieder</h3>
    <div class="detail-grid">${rows}</div>
  `;
}
