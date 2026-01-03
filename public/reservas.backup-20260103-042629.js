/* ==========================================================
   ElProfeTino / EPT - Reservas (versión limpia y estable)
   - Modal 3 columnas + pasos
   - Lun-Vie: verde, Sáb: amarillo (a confirmar), Dom: rojo (bloqueado)
   - No permite pasado
   - Permite agendar hasta 1 día antes del examen
   - 1 hora = 1 clase
   - Confirmar: guarda en Google Sheets (Apps Script) + abre WhatsApp + link Calendar
   - API global: window.EPT_OPEN_RESERVA(btn)
   ========================================================== */

(function () {
  "use strict";

  const TZ = "America/Montevideo";
  const WA_NUMBER = "59898175225";
  const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbzKl4CuqrTIKUe79R7DFACGzyXgimLUTRC24FnYyJM7i53QSEUbkqGZPtIA5iPcQH8-/exec";

  const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const SLOT_DEFS = [
    { start: "10:00", end: "11:00" },
    { start: "11:00", end: "12:00" },
    { start: "15:00", end: "16:00" },
    { start: "16:00", end: "17:00" },
    { start: "19:00", end: "20:00" },
    { start: "20:00", end: "21:00" },
  ];

  const CUPONERAS = {
    "APOYO": { clases: 8 },
    "NO ENTIENDO": { clases: 12 },
    "EN EL HORNO": { clases: 15 },
    "PREPARA TU EXAMEN": { clases: 12 },
  };

  function pad(n) { return String(n).padStart(2, "0"); }
  function toISODate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function parseISODate(s) {
    const [y, m, dd] = (s || "").split("-").map(Number);
    return new Date(y, (m || 1) - 1, dd || 1, 0, 0, 0, 0);
  }
  function addDays(d, days) { const x = new Date(d.getTime()); x.setDate(x.getDate() + days); return x; }
  function escapeHTML(s) {
    return String(s || "").replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  function dayStatus(dateObj) {
    const dow = dateObj.getDay();
    if (dow === 0) return "red";      // domingo
    if (dow === 6) return "yellow";   // sábado
    return "green";                  // lun-vie
  }

  function isPastSlot(dateISO, startHHMM) {
    const now = new Date();
    const d = parseISODate(dateISO);
    const [h, m] = startHHMM.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d.getTime() < now.getTime();
  }

  function googleCalendarLink({ title, details, location, startDateISO, startHHMM, endHHMM }) {
    const d = parseISODate(startDateISO);
    const [sh, sm] = startHHMM.split(":").map(Number);
    const [eh, em] = endHHMM.split(":").map(Number);

    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh, sm, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em, 0, 0);

    const fmt = (x) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      details: details || "",
      location: location || "",
      dates: `${fmt(start)}/${fmt(end)}`,
      ctz: TZ
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // ---------- UI injection ----------
  function injectModal() {
    if (document.getElementById("eptReservaBackdrop")) return;

    const backdrop = document.createElement("div");
    backdrop.id = "eptReservaBackdrop";
    backdrop.className = "ept-modal-backdrop";

    const modal = document.createElement("div");
    modal.id = "eptReservaModal";
    modal.className = "ept-modal";

    modal.innerHTML = `
      <div class="ept-panel" role="dialog" aria-modal="true">
        <header>
          <div class="title">
            <h3>Reserva de clases • ElProfeTino</h3>
            <small id="eptSubTitle">Elegí cuponera, cargá datos, agendá horas y confirmá.</small>
          </div>
          <button type="button" class="ept-close" id="eptCloseBtn">Cerrar ✕</button>
        </header>

        <div class="ept-grid-3">
          <!-- Col 1 -->
          <section class="ept-col">
            <h4>1) Datos del estudiante</h4>
            <div class="hint">Completá lo básico. Podés modificar cuando quieras.</div>

            <div class="ept-step active" id="eptStep1">
              <div class="ept-row">
                <div class="ept-field">
                  <label>Nombre</label>
                  <input id="eptNombre" placeholder="Ej: Sofía" autocomplete="given-name" />
                </div>
                <div class="ept-field">
                  <label>Apellido</label>
                  <input id="eptApellido" placeholder="Ej: Pérez" autocomplete="family-name" />
                </div>
                <div class="ept-field">
                  <label>WhatsApp</label>
                  <input id="eptWapp" placeholder="Ej: 098123456" inputmode="tel" />
                </div>
                <div class="ept-field">
                  <label>Email (opcional)</label>
                  <input id="eptEmail" placeholder="Ej: alumna@mail.com" inputmode="email" />
                </div>

                <div class="ept-field">
                  <label>Materia</label>
                  <select id="eptMateria">
                    <option>Matemática</option>
                    <option>Física</option>
                  </select>
                </div>
                <div class="ept-field">
                  <label>Curso</label>
                  <select id="eptCurso">
                    <option>7°</option><option>8°</option><option>9°</option>
                    <option>1° Bachillerato</option><option>2° Bachillerato</option><option>3° Bachillerato</option>
                  </select>
                </div>

                <div class="ept-field" style="grid-column: 1 / -1;">
                  <label>Fecha de examen (real o estimada)</label>
                  <input id="eptExamen" type="date" />
                </div>
              </div>

              <div class="ept-actions">
                <button type="button" class="ept-btn ghost" id="eptResetAll">Borrar</button>
                <button type="button" class="ept-btn" id="eptSaveDatos">Modificar</button>
                <button type="button" class="ept-btn primary" id="eptToStep2">Continuar →</button>
              </div>
            </div>

            <div class="ept-step" id="eptStep1Locked">
              <div class="ept-summary" id="eptDatosResumen"></div>
              <div class="ept-actions">
                <button type="button" class="ept-btn" id="eptEditDatos">Modificar</button>
                <button type="button" class="ept-btn primary" id="eptGoAgenda">Continuar →</button>
              </div>
            </div>
          </section>

          <!-- Col 2 -->
          <section class="ept-col">
            <h4>2) Agenda</h4>
            <div class="hint">Lun–Vie 🟩 • Sáb 🟨 a confirmar • Dom 🟥 no disponible • Pasado bloqueado</div>

            <div class="ept-step" id="eptStep2">
              <div class="ept-calendar">
                <div class="ept-cal-head">
                  <strong id="eptCalTitle">Mes</strong>
                  <div class="nav">
                    <button type="button" class="ept-btn" id="eptPrevMonth">◀</button>
                    <button type="button" class="ept-btn" id="eptNextMonth">▶</button>
                  </div>
                </div>
                <div class="ept-cal-grid" id="eptDowRow"></div>
                <div class="ept-cal-grid" id="eptCalGrid"></div>
              </div>

              <div class="ept-slots" id="eptSlots"></div>

              <div class="ept-actions">
                <button type="button" class="ept-btn ghost" id="eptClearSlots">Borrar selección</button>
                <button type="button" class="ept-btn primary" id="eptToStep3">Continuar →</button>
              </div>
            </div>

            <div class="ept-step" id="eptStep2Locked">
              <div class="ept-summary" id="eptAgendaResumen"></div>
              <div class="ept-actions">
                <button type="button" class="ept-btn" id="eptEditAgenda2">Modificar</button>
                <button type="button" class="ept-btn primary" id="eptGoResumen">Continuar →</button>
              </div>
            </div>
          </section>

          <!-- Col 3 -->
          <section class="ept-col">
            <h4>3) Resumen</h4>
            <div class="hint">Confirmás → se guarda en Google Sheets y se abre WhatsApp.</div>

            <div class="ept-summary" id="eptFinal"></div>

            <div class="ept-actions">
              <button type="button" class="ept-btn" id="eptModDatos">Modificar datos</button>
              <button type="button" class="ept-btn" id="eptModAgenda">Modificar agenda</button>
              <button type="button" class="ept-btn primary" id="eptConfirm">Confirmar por WhatsApp →</button>
            </div>
          </section>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
  }

  function openModal() {
    injectModal();
    const backdrop = document.getElementById("eptReservaBackdrop");
    const modal = document.getElementById("eptReservaModal");
    if (backdrop) backdrop.classList.add("show");
    if (modal) modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    const backdrop = document.getElementById("eptReservaBackdrop");
    const modal = document.getElementById("eptReservaModal");
    if (backdrop) backdrop.classList.remove("show");
    if (modal) modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  // ---------- State ----------
  const state = {
    cuponera: "APOYO",
    clasesMax: 8,
    nombre: "", apellido: "", wapp: "", email: "",
    materia: "Matemática", curso: "7°",
    examenISO: "",
    selectedSlots: [],
    viewMonth: new Date(),
    selectedDateISO: ""
  };

  function setCuponera(name) {
    const upper = (name || "APOYO").toUpperCase();
    state.cuponera = upper;
    state.clasesMax = (CUPONERAS[upper]?.clases || state.clasesMax || 0);

    const sub = document.getElementById("eptSubTitle");
    if (sub) {
      sub.textContent = `Cuponera: ${state.cuponera} • Máx clases: ${state.clasesMax} • Agendá hasta 1 día antes del examen.`;
    }
    renderFinal();
  }

  function minMaxDates() {
    const now = new Date();
    const min = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    let max = addDays(min, 60); // fallback
    if (state.examenISO) {
      max = addDays(parseISODate(state.examenISO), -1);
    }
    return { min, max };
  }

  function validateStep1() {
    if (!state.nombre.trim()) return "Falta nombre.";
    if (!state.apellido.trim()) return "Falta apellido.";
    if (!state.wapp.trim()) return "Falta WhatsApp.";
    if (!state.examenISO) return "Falta fecha de examen.";

    const { min, max } = minMaxDates();
    const exam = parseISODate(state.examenISO);

    if (exam < min) return "La fecha de examen no puede ser en el pasado.";
    if (max < min) return "El último día para agendar ya pasó. Ajustá la fecha del examen.";
    return "";
  }

  function validateSlots() {
    if (state.selectedSlots.length === 0) return "Elegí al menos 1 horario.";
    if (state.clasesMax && state.selectedSlots.length > state.clasesMax) {
      return `Elegiste ${state.selectedSlots.length} clases y tu cuponera permite ${state.clasesMax}.`;
    }
    return "";
  }

  // ---------- Steps (multi active) ----------
  function showSteps(list) {
    const s1 = document.getElementById("eptStep1");
    const s1L = document.getElementById("eptStep1Locked");
    const s2 = document.getElementById("eptStep2");
    const s2L = document.getElementById("eptStep2Locked");
    if (!s1 || !s1L || !s2 || !s2L) return;

    const set = new Set(Array.isArray(list) ? list : [list]);
    s1.classList.toggle("active", set.has("s1"));
    s1L.classList.toggle("active", set.has("s1L"));
    s2.classList.toggle("active", set.has("s2"));
    s2L.classList.toggle("active", set.has("s2L"));
  }

  // ---------- Calendar render ----------
  function renderDow() {
    const el = document.getElementById("eptDowRow");
    if (!el) return;
    el.innerHTML = "";
    for (const d of WEEKDAYS) {
      const x = document.createElement("div");
      x.className = "ept-dow";
      x.textContent = d;
      el.appendChild(x);
    }
  }

  function renderCalendar() {
    renderDow();

    const title = document.getElementById("eptCalTitle");
    const grid = document.getElementById("eptCalGrid");
    if (!grid || !title) return;

    const { min, max } = minMaxDates();

    const vm = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth(), 1);
    title.textContent = vm.toLocaleString("es-UY", { month: "long", year: "numeric" }).replace(/^\w/, c => c.toUpperCase());

    grid.innerHTML = "";

    const firstDow = vm.getDay();
    const daysInMonth = new Date(vm.getFullYear(), vm.getMonth() + 1, 0).getDate();

    for (let i = 0; i < firstDow; i++) {
      const filler = document.createElement("div");
      filler.className = "ept-day disabled";
      grid.appendChild(filler);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(vm.getFullYear(), vm.getMonth(), day, 0, 0, 0, 0);
      const iso = toISODate(d);

      const status = dayStatus(d);
      const disabled = (d < min) || (d > max) || (status === "red");

      const btn = document.createElement("div");
      btn.className = `ept-day ${status} ${disabled ? "disabled" : ""} ${state.selectedDateISO === iso ? "selected" : ""}`;
      btn.textContent = String(day);

      btn.addEventListener("click", () => {
        if (disabled) return;
        state.selectedDateISO = iso;
        renderCalendar();
        renderSlotsForSelectedDate();
        renderFinal();
      });

      grid.appendChild(btn);
    }
  }

  function isAlreadySelected(dateISO, startHHMM) {
    return state.selectedSlots.some(s => s.dateISO === dateISO && s.start === startHHMM);
  }
  function removeSelected(dateISO, startHHMM) {
    state.selectedSlots = state.selectedSlots.filter(s => !(s.dateISO === dateISO && s.start === startHHMM));
  }

  function renderSlotsForSelectedDate() {
    const wrap = document.getElementById("eptSlots");
    if (!wrap) return;
    wrap.innerHTML = "";

    if (!state.selectedDateISO) {
      const msg = document.createElement("div");
      msg.className = "ept-summary muted";
      msg.textContent = "Elegí un día en el calendario para ver horarios.";
      wrap.appendChild(msg);
      return;
    }

    const d = parseISODate(state.selectedDateISO);
    const dayStat = dayStatus(d);

    for (const s of SLOT_DEFS) {
      let cls = dayStat;
      let disabled = false;

      if (dayStat === "red") {
        disabled = true;
      } else {
        if (isPastSlot(state.selectedDateISO, s.start)) {
          cls = "gray";
          disabled = true;
        }
      }

      const selected = isAlreadySelected(state.selectedDateISO, s.start);

      const div = document.createElement("div");
      div.className = `ept-slot ${cls} ${selected ? "selected" : ""}`;
      div.textContent = `${s.start}–${s.end}${dayStat === "yellow" ? " (a confirmar)" : ""}`;

      div.addEventListener("click", () => {
        if (disabled) return;

        if (state.clasesMax && !selected && state.selectedSlots.length >= state.clasesMax) {
          alert(`Tu cuponera permite ${state.clasesMax} clases. Ya seleccionaste ${state.selectedSlots.length}.`);
          return;
        }

        if (selected) {
          removeSelected(state.selectedDateISO, s.start);
        } else {
          state.selectedSlots.push({ dateISO: state.selectedDateISO, start: s.start, end: s.end, status: dayStat });
        }

        state.selectedSlots.sort((a, b) => (a.dateISO + a.start).localeCompare(b.dateISO + b.start));

        renderSlotsForSelectedDate();
        renderAgendaResumen();
        renderFinal();
      });

      wrap.appendChild(div);
    }
  }

  // ---------- Resumen renders ----------
  function renderDatosResumen() {
    const el = document.getElementById("eptDatosResumen");
    if (!el) return;
    const lastDay = state.examenISO ? toISODate(addDays(parseISODate(state.examenISO), -1)) : "-";
    el.innerHTML = `
      <div class="ept-badge">${escapeHTML(state.cuponera)}</div>
      <div style="margin-top:8px">
        <div><b>${escapeHTML(state.nombre)} ${escapeHTML(state.apellido)}</b></div>
        <div class="muted">${escapeHTML(state.materia)} • ${escapeHTML(state.curso)}</div>
        <div class="muted">WhatsApp: ${escapeHTML(state.wapp)}${state.email ? " • " + escapeHTML(state.email) : ""}</div>
        <div class="muted">Examen: <b>${escapeHTML(state.examenISO)}</b> (último día para agendar: <b>${escapeHTML(lastDay)}</b>)</div>
        <div class="muted">Clases permitidas: <b>${state.clasesMax}</b></div>
      </div>
    `;
  }

  function renderAgendaResumen() {
    const el = document.getElementById("eptAgendaResumen");
    if (!el) return;

    if (state.selectedSlots.length === 0) {
      el.innerHTML = `<div class="muted">Sin horarios seleccionados.</div>`;
      return;
    }

    const lines = state.selectedSlots.map(s => {
      const d = parseISODate(s.dateISO);
      const label = `${WEEKDAYS[d.getDay()]} ${s.dateISO} • ${s.start}-${s.end}${s.status === "yellow" ? " (a confirmar)" : ""}`;
      return `<li>${escapeHTML(label)}</li>`;
    }).join("");

    el.innerHTML = `
      <div><b>Clases seleccionadas:</b> ${state.selectedSlots.length} / ${state.clasesMax}</div>
      <ul style="margin:8px 0 0 18px;">${lines}</ul>
    `;
  }

  function renderFinal() {
    const el = document.getElementById("eptFinal");
    if (!el) return;

    const err1 = validateStep1();
    const err2 = validateSlots();
    const lastDay = state.examenISO ? toISODate(addDays(parseISODate(state.examenISO), -1)) : "-";

    const slotLines = state.selectedSlots.map(s => {
      const d = parseISODate(s.dateISO);
      const label = `${WEEKDAYS[d.getDay()]} ${s.dateISO} • ${s.start}-${s.end}${s.status === "yellow" ? " (a confirmar)" : ""}`;
      return `<li>${escapeHTML(label)}</li>`;
    }).join("");

    el.innerHTML = `
      <div class="ept-badge">${escapeHTML(state.cuponera)}</div>
      <div style="margin-top:10px">
        <div><b>${escapeHTML(state.nombre || "-")} ${escapeHTML(state.apellido || "")}</b></div>
        <div class="muted">${escapeHTML(state.materia)} • ${escapeHTML(state.curso)} • Último día para agendar: <b>${escapeHTML(lastDay)}</b></div>
      </div>
      <hr style="border:0;border-top:1px solid rgba(255,255,255,.12); margin:10px 0;">
      <div><b>Clases:</b> ${state.selectedSlots.length} / ${state.clasesMax}</div>
      <ul style="margin:8px 0 0 18px;">${slotLines || "<li class='muted'>Sin horarios aún</li>"}</ul>
      ${(err1 || err2) ? `<div style="margin-top:10px" class="muted">⚠ ${escapeHTML(err1 || err2)}</div>`
        : `<div style="margin-top:10px" class="muted">✅ Listo para confirmar.</div>`}
    `;
  }

  // ---------- Confirmar: POST a Sheets + WhatsApp ----------
  function confirmReservation() {
    const err1 = validateStep1();
    if (err1) { alert(err1); return; }
    const err2 = validateSlots();
    if (err2) { alert(err2); return; }

    const payload = {
      cuponera: state.cuponera,
      nombre: state.nombre,
      apellido: state.apellido,
      wapp: state.wapp,
      email: state.email,
      materia: state.materia,
      curso: state.curso,
      examenISO: state.examenISO,
      slots: state.selectedSlots
    };

    const btn = document.getElementById("eptConfirm");
    const prevText = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Guardando en agenda…"; }

    fetch(SHEETS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(r => r.json().catch(() => ({})))
      .then(data => {
        if (!data || !data.ok) throw new Error((data && data.error) ? data.error : "No se pudo guardar en la agenda.");

        const ids = Array.isArray(data.ids) ? data.ids : [];
        const idsTxt = ids.length ? ids.map(x => `• ${x}`).join("\n") : "(sin id)";

        const first = state.selectedSlots[0];
        const calLink = googleCalendarLink({
          title: `Clase ${state.materia} - ElProfeTino (${state.nombre} ${state.apellido})`,
          details: `Cuponera: ${state.cuponera}\nCurso: ${state.curso}\nWhatsApp alumno: ${state.wapp}\nIDs: ${ids.join(", ")}`,
          location: "Zona Cordón (presencial)",
          startDateISO: first.dateISO,
          startHHMM: first.start,
          endHHMM: first.end,
        });

        const lastDay = toISODate(addDays(parseISODate(state.examenISO), -1));

        const header =
`Hola Profe! Confirmo reserva ✅

Cuponera: ${state.cuponera} (${state.selectedSlots.length}/${state.clasesMax} clases)
Alumno: ${state.nombre} ${state.apellido}
Materia: ${state.materia}
Curso: ${state.curso}
WhatsApp: ${state.wapp}${state.email ? "\nEmail: " + state.email : ""}
Examen: ${state.examenISO} (último día para agendar: ${lastDay})

IDs de reserva:
${idsTxt}

Horarios:`;

        const lines = state.selectedSlots.map(s => {
          const d = parseISODate(s.dateISO);
          return `- ${WEEKDAYS[d.getDay()]} ${s.dateISO} ${s.start}-${s.end}${s.status === "yellow" ? " (a confirmar)" : ""}`;
        }).join("\n");

        const tail =
`\n\nGoogle Calendar (1ra clase):
${calLink}

Gracias!`;

        const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(header + "\n" + lines + tail)}`;
        window.open(url, "_blank", "noopener");

        alert("✅ Reserva guardada en Google Sheets. Se abrió WhatsApp para confirmar.");
        state.selectedSlots = [];
        state.selectedDateISO = "";
        renderCalendar();
        renderSlotsForSelectedDate();
        renderAgendaResumen();
        renderFinal();
      })
      .catch(err => {
        console.warn("Error guardando reserva:", err);
        alert("⚠️ No pude guardar en la agenda.\n\nDetalle: " + (err && err.message ? err.message : err));
      })
      .finally(() => {
        if (btn) { btn.disabled = false; btn.textContent = prevText || "Confirmar por WhatsApp →"; }
      });
  }

  // ---------- wiring (once) ----------
  let wired = false;

  function setFromInputs() {
    state.nombre = document.getElementById("eptNombre")?.value || "";
    state.apellido = document.getElementById("eptApellido")?.value || "";
    state.wapp = document.getElementById("eptWapp")?.value || "";
    state.email = document.getElementById("eptEmail")?.value || "";
    state.materia = document.getElementById("eptMateria")?.value || "Matemática";
    state.curso = document.getElementById("eptCurso")?.value || "7°";
    state.examenISO = document.getElementById("eptExamen")?.value || "";
  }

  function wireOnce() {
    injectModal();
    if (wired) return;
    wired = true;

    console.log("✅ EPT Reservas cargado");

    document.getElementById("eptCloseBtn")?.addEventListener("click", closeModal);
    document.getElementById("eptReservaBackdrop")?.addEventListener("click", (e) => {
      if (e.target && e.target.id === "eptReservaBackdrop") closeModal();
    });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    document.getElementById("eptResetAll")?.addEventListener("click", () => {
      state.nombre = ""; state.apellido = ""; state.wapp = ""; state.email = "";
      state.materia = "Matemática"; state.curso = "7°"; state.examenISO = "";
      state.selectedSlots = []; state.selectedDateISO = ""; state.viewMonth = new Date();

      document.getElementById("eptNombre").value = "";
      document.getElementById("eptApellido").value = "";
      document.getElementById("eptWapp").value = "";
      document.getElementById("eptEmail").value = "";
      document.getElementById("eptMateria").value = "Matemática";
      document.getElementById("eptCurso").value = "7°";
      document.getElementById("eptExamen").value = "";

      showSteps(["s1"]);
      renderCalendar();
      renderSlotsForSelectedDate();
      renderAgendaResumen();
      renderFinal();
    });

    document.getElementById("eptSaveDatos")?.addEventListener("click", () => {
      setFromInputs();
      const err = validateStep1();
      if (err) { alert(err); return; }
      renderDatosResumen();
      renderFinal();
      alert("✅ Datos guardados.");
    });

    document.getElementById("eptToStep2")?.addEventListener("click", () => {
      setFromInputs();
      const err = validateStep1();
      if (err) { alert(err); return; }
      renderDatosResumen();
      showSteps(["s1L", "s2"]);
      state.viewMonth = new Date();
      state.selectedDateISO = "";
      renderCalendar();
      renderSlotsForSelectedDate();
      renderAgendaResumen();
      renderFinal();
    });

    document.getElementById("eptEditDatos")?.addEventListener("click", () => showSteps(["s1"]));
    document.getElementById("eptGoAgenda")?.addEventListener("click", () => showSteps(["s1L", "s2"]));

    document.getElementById("eptPrevMonth")?.addEventListener("click", () => {
      state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() - 1, 1);
      renderCalendar();
    });
    document.getElementById("eptNextMonth")?.addEventListener("click", () => {
      state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() + 1, 1);
      renderCalendar();
    });

    document.getElementById("eptClearSlots")?.addEventListener("click", () => {
      state.selectedSlots = [];
      renderSlotsForSelectedDate();
      renderAgendaResumen();
      renderFinal();
    });

    document.getElementById("eptToStep3")?.addEventListener("click", () => {
      setFromInputs();
      const err1 = validateStep1();
      if (err1) { alert(err1); return; }
      const err2 = validateSlots();
      if (err2) { alert(err2); return; }
      renderAgendaResumen();
      showSteps(["s1L", "s2L"]);
      renderFinal();
    });

    document.getElementById("eptEditAgenda2")?.addEventListener("click", () => showSteps(["s1L", "s2"]));
    document.getElementById("eptGoResumen")?.addEventListener("click", () => showSteps(["s1L", "s2L"]));

    document.getElementById("eptModDatos")?.addEventListener("click", () => showSteps(["s1"]));
    document.getElementById("eptModAgenda")?.addEventListener("click", () => showSteps(["s1L", "s2"]));

    document.getElementById("eptConfirm")?.addEventListener("click", confirmReservation);

    // init
    showSteps(["s1"]);
    renderCalendar();
    renderSlotsForSelectedDate();
    renderAgendaResumen();
    renderFinal();
  }

  // ---------- API global ----------
  window.EPT_OPEN_RESERVA = function (btn) {
    wireOnce();
    openModal();

    const name = ((btn && btn.getAttribute("data-cuponera")) || "APOYO").trim().toUpperCase();
    setCuponera(name);

    const max = parseInt((btn && btn.getAttribute("data-clases")) || "0", 10);
    if (max) state.clasesMax = max;

    // reset selección cada vez que abre
    state.selectedSlots = [];
    state.selectedDateISO = "";
    state.viewMonth = new Date();
    showSteps(["s1"]);
    renderCalendar();
    renderSlotsForSelectedDate();
    renderAgendaResumen();
    renderFinal();
  };

  // READY event para tu delegación con cola
  try {
    window.EPT_RESERVAS_READY = true;
    window.dispatchEvent(new Event("EPT_RESERVAS_READY"));
  } catch (e) { }

})();
