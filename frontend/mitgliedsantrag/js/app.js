// FCE Mitgliedsantrag V1.1 Browser-Fix
// Läuft auch beim direkten Öffnen der index.html ohne lokalen Server.

const CONFIG = {
  webAppUrl: "https://script.google.com/macros/s/AKfycbziVax2DxYAeft7EPa8yL167IQVnhwo4xGS9hfPVRHcxUiXUfykm4zOwwioaFD29xerGQ/exec",
  totalSteps: 5,
  bankByBlz: {
    "66650085": "Sparkasse Pforzheim Calw",
    "66690000": "Volksbank pur eG",
    "60050101": "BW-Bank",
    "66010075": "Postbank",
    "66691200": "Volksbank pur eG",
    "66692300": "Volksbank pur eG",
    "66662220": "VR Bank Enz plus eG",
    "66661244": "Raiffeisenbank im Kreis Calw eG",
    "66670006": "Deutsche Bank",
    "66680013": "Commerzbank",
    "60010070": "Postbank Stuttgart",
    "60040071": "Commerzbank Stuttgart",
    "60070070": "Deutsche Bank Stuttgart",
    "60090100": "Volksbank Stuttgart eG"
  }
};

let currentStep = 1;
let hasSignature = false;

function showStep(step) {
  currentStep = step;

  document.querySelectorAll(".step").forEach(el => {
    el.classList.toggle("active", Number(el.dataset.step) === step);
  });

  document.querySelectorAll(".side-step").forEach(el => {
    const s = Number(el.dataset.jump);
    el.classList.toggle("active", s === step);
    el.classList.toggle("complete", s < step);
  });

  document.querySelectorAll(".dot").forEach(el => {
    const s = Number(el.dataset.stepDot);
    el.classList.toggle("active", s === step);
    el.classList.toggle("complete", s < step);
    el.textContent = s < step ? "✓" : s;
  });

  document.getElementById("backBtn").classList.toggle("hidden", step === 1);
  document.getElementById("nextBtn").classList.toggle("hidden", step === CONFIG.totalSteps);
  document.getElementById("submitBtn").classList.toggle("hidden", step !== CONFIG.totalSteps);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateCurrentStep() {
  const active = document.querySelector(".step.active");
  const required = active.querySelectorAll("input[required]");

  for (const input of required) {
    if (!input.checkValidity()) {
      input.reportValidity();
      return false;
    }
  }

  if (currentStep === 2 && !document.getElementById("mitgliedschaft").value) {
    alert("Bitte wähle eine Beitragsart aus.");
    return false;
  }

  return true;
}

function nextStep() {
  if (!validateCurrentStep()) return;
  showStep(Math.min(CONFIG.totalSteps, currentStep + 1));
}

function previousStep() {
  showStep(Math.max(1, currentStep - 1));
}

function initWizard() {
  document.getElementById("nextBtn").addEventListener("click", nextStep);
  document.getElementById("backBtn").addEventListener("click", previousStep);

  document.querySelectorAll(".side-step, .dot").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = Number(btn.dataset.jump || btn.dataset.stepDot);
      if (target <= currentStep || validateCurrentStep()) {
        showStep(target);
      }
    });
  });

  showStep(1);
}

function initMembershipCards() {
  document.querySelectorAll(".membership-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".membership-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      const plan = card.dataset.plan;
      document.getElementById("mitgliedschaft").value = plan;
      document.getElementById("jahresbeitrag").value = card.dataset.fee;

      const familySection = document.getElementById("familySection");
      familySection.classList.toggle("show", plan === "Familie");

      if (plan === "Familie" && document.getElementById("familyList").children.length === 0) {
        addFamilyRow();
      }
    });
  });
}

function initFamily() {
  document.getElementById("addFamily").addEventListener("click", addFamilyRow);
}

function addFamilyRow() {
  const row = document.createElement("div");
  row.className = "family-row";
  row.innerHTML = `
    <label>Vorname<input name="fam_vorname" placeholder="Vorname"></label>
    <label>Nachname<input name="fam_nachname" placeholder="Nachname"></label>
    <label>Geburtsdatum<input type="date" name="fam_geburtsdatum"></label>
    <button type="button" class="outline-btn">Entfernen</button>
  `;
  row.querySelector("button").addEventListener("click", () => row.remove());
  document.getElementById("familyList").appendChild(row);
}

function getFamilyMembers() {
  return [...document.querySelectorAll(".family-row")].map(r => ({
    vorname: r.querySelector('[name="fam_vorname"]')?.value || "",
    nachname: r.querySelector('[name="fam_nachname"]')?.value || "",
    geburtsdatum: r.querySelector('[name="fam_geburtsdatum"]')?.value || "",
    beziehung: ""
  })).filter(x => x.vorname || x.nachname || x.geburtsdatum);
}

function initIban() {
  const iban = document.getElementById("iban");
  const bankField = document.getElementById("kreditinstitut");
  const hint = document.getElementById("bankHint");
  let lookupTimer = null;

  iban.addEventListener("input", event => {
    const clean = event.target.value.replace(/\s/g, "").toUpperCase();
    event.target.value = clean.replace(/(.{4})/g, "$1 ").trim();

    bankField.dataset.autoFilled = "false";

    if (lookupTimer) {
      clearTimeout(lookupTimer);
    }

    if (!clean.startsWith("DE") || clean.length < 12) {
      hint.textContent = "Bitte IBAN vollständig eingeben. Bei deutschen IBANs wird das Kreditinstitut automatisch ermittelt, sofern möglich.";
      return;
    }

    const blz = clean.substring(4, 12);

    if (CONFIG.bankByBlz[blz]) {
      bankField.value = CONFIG.bankByBlz[blz];
      bankField.dataset.autoFilled = "true";
      hint.textContent = "Kreditinstitut automatisch anhand der BLZ erkannt.";
      return;
    }

    hint.textContent = "Bank wird geprüft ...";

    lookupTimer = setTimeout(async () => {
      const bankName = await lookupBankName(clean);

      if (bankName) {
        bankField.value = bankName;
        bankField.dataset.autoFilled = "true";
        hint.textContent = "Kreditinstitut automatisch aus der IBAN ermittelt.";
      } else {
        hint.textContent = "Bank konnte nicht automatisch ermittelt werden. Bitte Kreditinstitut manuell eintragen.";
      }
    }, 450);
  });
}

async function lookupBankName(iban) {
  // 1) Lokaler Fallback über die deutsche BLZ
  const clean = iban.replace(/\s/g, "").toUpperCase();
  if (clean.startsWith("DE") && clean.length >= 12) {
    const blz = clean.substring(4, 12);
    if (CONFIG.bankByBlz[blz]) {
      return CONFIG.bankByBlz[blz];
    }
  }

  // 2) Öffentlicher IBAN-Validator als Komfortfunktion
  // Falls der Dienst nicht erreichbar ist oder CORS blockiert, fällt die Funktion sauber auf manuelle Eingabe zurück.
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      "https://openiban.com/validate/" + encodeURIComponent(clean) + "?getBIC=true&validateBankCode=true",
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!response.ok) return "";

    const result = await response.json();
    const bankData = result.bankData || {};

    return bankData.name || bankData.bankName || bankData.bank || "";
  } catch (error) {
    return "";
  }
}

function initSignature() {
  const canvas = document.getElementById("signature");
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#111827";
  let drawing = false;

  function getPos(event) {
    const rect = canvas.getBoundingClientRect();
    const p = event.touches ? event.touches[0] : event;
    return {
      x: (p.clientX - rect.left) * (canvas.width / rect.width),
      y: (p.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function startDraw(event) {
    event.preventDefault();
    drawing = true;
    const p = getPos(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function draw(event) {
    if (!drawing) return;
    event.preventDefault();
    const p = getPos(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hasSignature = true;
  }

  function endDraw() {
    drawing = false;
  }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  window.addEventListener("mouseup", endDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  window.addEventListener("touchend", endDraw);

  document.getElementById("clearSignature").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;
  });
}

function collectFormData() {
  const form = document.getElementById("memberForm");
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());

  data.satzung = fd.has("satzung");
  data.datenschutz = fd.has("datenschutz");
  data.sepa = fd.has("sepa");
  data.foto = fd.has("foto");
  data.signature = document.getElementById("signature").toDataURL("image/png");
  data.familienmitglieder = getFamilyMembers();

  return data;
}

async function submitApplication(data) {
  const response = await fetch(CONFIG.webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(data)
  });
  return await response.json();
}

function initSubmit() {
  const form = document.getElementById("memberForm");

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!validateCurrentStep()) return;

    if (!hasSignature) {
      alert("Bitte unterschreibe den Antrag.");
      return;
    }

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Wird gesendet ...";

    try {
      const result = await submitApplication(collectFormData());

      if (result.success) {
        alert("Antrag erfolgreich übermittelt. Antrags-ID: " + result.antrags_id);
        form.reset();
        location.reload();
      } else {
        alert("Fehler beim Speichern: " + (result.error || "Unbekannter Fehler"));
      }
    } catch (error) {
      alert("Technischer Fehler beim Absenden: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Antrag absenden →";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initWizard();
  initMembershipCards();
  initFamily();
  initIban();
  initSignature();
  initSubmit();
});
