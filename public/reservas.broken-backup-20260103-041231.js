/* ==========================================================
   EPT / ElProfeTino - Agenda y Reservas (Vanilla JS)
   - Lun-Vie: verde disponible, gris ocupado
   - Sáb: amarillo (a confirmar, seleccionable)
   - Dom: rojo (no disponible)
   - No permite agendar pasado
   - Permite agendar hasta 1 día antes del examen
   - 1 hora = 1 clase (si elige 2 horas el mismo día = 2 clases)
   - Guarda reservas en localStorage (demo / MVP)
   ========================================================== */

(function(){
  try{ console.log('✅ EPT Reservas cargado'); }catch(e){}
  const TZ = "America/Montevideo";
  const WA_NUMBER = "59898175225";
  const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbzKl4CuqrTIKUe79R7DFACGzyXgimLUTRC24FnYyJM7i53QSEUbkqGZPtIA5iPcQH8-/exec";
  const STORAGE_KEY = "ept_reservas_v1";

  const WEEKDAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const SLOT_DEFS = [
    { start:"10:00", end:"11:00" },
    { start:"11:00", end:"12:00" },
    { start:"15:00", end:"16:00" },
    { start:"16:00", end:"17:00" },
    { start:"19:00", end:"20:00" },
    { start:"20:00", end:"21:00" },
  ];

  const CUPONERAS = {
    "APOYO": { clases: 8 },
    "NO ENTIENDO": { clases: 12 },
    "EN EL HORNO": { clases: 15 },
    "PREPARA TU EXAMEN": { clases: 12 },
  };

  function pad(n){ return String(n).padStart(2,"0"); }
  function toISODate(d){
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  function parseISODate(s){
    // yyyy-mm-dd -> Date local at 00:00
    const [y,m,dd] = s.split("-").map(Number);
    return new Date(y, m-1, dd, 0,0,0,0);
  }
  function addDays(d, days){
    const x = new Date(d.getTime());
    x.setDate(x.getDate() + days);
    return x;
  }
  function sameDay(a,b){
    return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  }
  function clampDate(d, min, max){
    if(d < min) return min;
    if(d > max) return max;
    return d;
  }

  function loadBooked(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    }catch{
      return [];
    }
  }
  function saveBooked(arr){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function slotKey(dateISO, startHHMM){
    return `${dateISO}T${startHHMM}`;
  }

  function isPastSlot(dateISO, startHHMM){
    const now = new Date();
    const d = parseISODate(dateISO);
    const [h,m] = startHHMM.split(":").map(Number);
    d.setHours(h,m,0,0);
    return d.getTime() < now.getTime();
  }

  function dayStatus(dateObj){
    // 0 Dom, 6 Sáb
    const dow = dateObj.getDay();
    if(dow === 0) return "red";
    if(dow === 6) return "yellow";
    return "green";
  }

  function googleCalendarLink({title, details, location, startDateISO, startHHMM, endHHMM}){
    // Dates format: YYYYMMDDTHHMM00 (local) + ctz
    const d = parseISODate(startDateISO);
    const [sh, sm] = startHHMM.split(":").map(Number);
    const [eh, em] = endHHMM.split(":").map(Number);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh, sm, 0, 0);
    const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em, 0, 0);

    const fmt = (x) => `${x.getFullYear()}${pad(x.getMonth()+1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;

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

  // ---------- Modal UI (injected) ----------
  function injectModal(){
    if(document.getElementById("eptReservaBackdrop")) return;

    const backdrop = document.createElement("div");
    backdrop.id = "eptReservaBackdrop";
    backdrop.className = "ept-modal-backdrop";
    backdrop.innerHTML = "";

    const modal = document.createElement("div");
    modal.id = "eptReservaModal";
    modal.className = "ept-modal";
    modal.innerHTML = `
      <div class="ept-panel" role="dialog" aria-modal="true">
        <header>
          <div class="title">
            <h3>Reserva de clases • ElProfeTino</h3>
            <small id="eptSubTitle">Elegí cuponera, cargá datos, agendá horas y confirmá por WhatsApp.</small>
          </div>
          <button type="button" class="ept-close" id="eptCloseBtn">Cerrar ✕</button>
        </header>

        <div class="ept-grid-3">
          <!-- Col 1 -->
          <section class="ept-col">
            <h4>1) Datos del estudiante</h4>
            <div class="hint">Completá lo básico. Después podés modificar.</div>

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
                <button class="ept-btn" id="eptEditDatos">Modificar</button>
                <button class="ept-btn primary" id="eptGoAgenda">Continuar →</button>
              </div>
            </div>
          </section>

          <!-- Col 2 -->
          <section class="ept-col">
            <h4>2) Agenda</h4>
            <div class="hint">Lun–Vie 🟩 disponible • Sáb 🟨 a confirmar • Dom 🟥 no disponible • Ocupado = gris</div>

            <div class="ept-step" id="eptStep2">
              <div class="ept-calendar">
                <div class="ept-cal-head">
                  <strong id="eptCalTitle">Mes</strong>
                  <div class="nav">
                    <button class="ept-btn" id="eptPrevMonth">◀</button>
                    <button class="ept-btn" id="eptNextMonth">▶</button>
                  </div>
                </div>

                <div class="ept-cal-grid" id="eptDowRow"></div>
                <div class="ept-cal-grid" id="eptCalGrid"></div>
              </div>

              <div class="ept-slots" id="eptSlots"></div>

              <div class="ept-actions">
                <button class="ept-btn ghost" id="eptClearSlots">Borrar selección</button>
                <button class="ept-btn" id="eptEditAgenda">Modificar</button>
                <button class="ept-btn primary" id="eptToStep3">Continuar →</button>
              </div>
            </div>

            <div class="ept-step" id="eptStep2Locked">
              <div class="ept-summary" id="eptAgendaResumen"></div>
              <div class="ept-actions">
                <button class="ept-btn" id="eptEditAgenda2">Modificar</button>
                <button class="ept-btn primary" id="eptGoResumen">Continuar →</button>
              </div>
            </div>
          </section>

          <!-- Col 3 -->
          <section class="ept-col">
            <h4>3) Resumen</h4>
            <div class="hint">Confirmás y se arma el mensaje a WhatsApp + link a Google Calendar.</div>

            <div class="ept-summary" id="eptFinal"></div>

            <div class="ept-actions">
              <button class="ept-btn" id="eptModDatos">Modificar datos</button>
              <button class="ept-btn" id="eptModAgenda">Modificar agenda</button>
              <button class="ept-btn primary" id="eptConfirm">Confirmar por WhatsApp →</button>
            </div>
          </section>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    return { backdrop, modal };
  }

  function openModal(){
    injectModal();
    const backdrop = document.getElementById("eptReservaBackdrop");
    const modal = document.getElementById("eptReservaModal");
    if(backdrop) backdrop.classList.add("show");
    if(modal) modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function closeModal(){
    const backdrop = document.getElementById("eptReservaBackdrop");
    const modal = document.getElementById("eptReservaModal");
    if(backdrop) backdrop.classList.remove("show");
    if(modal) modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  // ---------- State ----------
  const state = {
    cuponera: null,
    clasesMax: 0,

    nombre: "",
    apellido: "",
    wapp: "",
    email: "",
    materia: "Matemática",
    curso: "7°",
    examenISO: "",

    selectedSlots: [], // {dateISO, start, end, status}
    viewMonth: new Date(),
    selectedDateISO: ""
  };

  function setCuponera(name){
    state.cuponera = name;
    state.clasesMax = (CUPONERAS[name]?.clases || 0);
    const sub = document.getElementById("eptSubTitle");
    if(sub) sub.textContent = `Cuponera: ${name} • Máx clases: ${state.clasesMax} • Elegí horas hasta 1 día antes del examen.`;
    renderFinal();
  }

  function resetAll(){
    Object.assign(state, {
      nombre:"", apellido:"", wapp:"", email:"",
      materia:"Matemática", curso:"7°",
      examenISO:"",
      selectedSlots:[],
      selectedDateISO:"",
      viewMonth: new Date()
    });
  }

  function minMaxDates(){
    const now = new Date();
    const min = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
    let max = addDays(min, 60); // fallback
    if(state.examenISO){
      const exam = parseISODate(state.examenISO);
      max = addDays(exam, -1);
    }
    return { min, max };
  }

  function validateStep1(){
    if(!state.nombre.trim()) return "Falta nombre.";
    if(!state.apellido.trim()) return "Falta apellido.";
    if(!state.wapp.trim()) return "Falta WhatsApp.";
    if(!state.examenISO) return "Falta fecha de examen (real o estimada).";

    const { min, max } = minMaxDates();
    const exam = parseISODate(state.examenISO);
    if(exam < min) return "La fecha de examen no puede ser en el pasado.";
    if(max < min) return "La fecha de examen debe ser al menos mañana (porque no se agenda el día previo si ya pasó).";

    return "";
  }

  function validateSlots(){
    if(state.selectedSlots.length === 0) return "Elegí al menos 1 horario.";
    if(state.clasesMax && state.selectedSlots.length > state.clasesMax) return `Elegiste ${state.selectedSlots.length} clases y tu cuponera permite ${state.clasesMax}.`;
    return "";
  }

  // ---------- Rendering ----------
  function renderDow(){
    const el = document.getElementById("eptDowRow");
    if(!el) return;
    el.innerHTML = "";
    for(const d of WEEKDAYS){
      const x = document.createElement("div");
      x.className = "ept-dow";
      x.textContent = d;
      el.appendChild(x);
    }
  }

  function renderCalendar(){
    renderDow();

    const title = document.getElementById("eptCalTitle");
    const grid = document.getElementById("eptCalGrid");
    if(!grid || !title) return;

    const { min, max } = minMaxDates();

    // month to render
    const vm = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth(), 1);
    title.textContent = vm.toLocaleString("es-UY", { month:"long", year:"numeric" }).replace(/^\w/, c => c.toUpperCase());

    grid.innerHTML = "";

    const firstDow = vm.getDay(); // 0..6
    const daysInMonth = new Date(vm.getFullYear(), vm.getMonth()+1, 0).getDate();

    // fillers
    for(let i=0;i<firstDow;i++){
      const filler = document.createElement("div");
      filler.className = "ept-day disabled";
      filler.textContent = "";
      grid.appendChild(filler);
    }

    for(let day=1; day<=daysInMonth; day++){
      const d = new Date(vm.getFullYear(), vm.getMonth(), day, 0,0,0,0);
      const iso = toISODate(d);

      const status = dayStatus(d); // green/yellow/red
      const disabled = (d < min) || (d > max) || (status === "red");

      const btn = document.createElement("div");
      btn.className = `ept-day ${status} ${disabled ? "disabled":""} ${state.selectedDateISO===iso ? "selected":""}`;
      btn.textContent = String(day);

      btn.addEventListener("click", () => {
        if(disabled) return;
        state.selectedDateISO = iso;
        renderCalendar();
        renderSlotsForSelectedDate();
        renderFinal();
      });

      grid.appendChild(btn);
    }
  }

  function isBooked(dateISO, startHHMM){
    const booked = loadBooked();
    return booked.includes(slotKey(dateISO, startHHMM));
  }

  function isAlreadySelected(dateISO, startHHMM){
    return state.selectedSlots.some(s => s.dateISO===dateISO && s.start===startHHMM);
  }

  function removeSelected(dateISO, startHHMM){
    state.selectedSlots = state.selectedSlots.filter(s => !(s.dateISO===dateISO && s.start===startHHMM));
  }

  function renderSlotsForSelectedDate(){
    const slotsWrap = document.getElementById("eptSlots");
    if(!slotsWrap) return;

    slotsWrap.innerHTML = "";

    if(!state.selectedDateISO){
      const msg = document.createElement("div");
      msg.className = "ept-summary muted";
      msg.textContent = "Elegí un día en el calendario para ver horarios.";
      slotsWrap.appendChild(msg);
      return;
    }

    const d = parseISODate(state.selectedDateISO);
    const dayStat = dayStatus(d);

    for(const s of SLOT_DEFS){
      let cls = dayStat; // green/yellow/red
      let disabled = false;

      if(dayStat === "red"){
        disabled = true;
      } else {
        // occupied?
        if(isBooked(state.selectedDateISO, s.start)){
          cls = "gray";
          disabled = true;
        }
        // past?
        if(isPastSlot(state.selectedDateISO, s.start)){
          cls = "gray";
          disabled = true;
        }
      }

      const div = document.createElement("div");
      const selected = isAlreadySelected(state.selectedDateISO, s.start);
      div.className = `ept-slot ${cls} ${selected ? "selected":""}`;
      div.textContent = `${s.start}–${s.end}${dayStat==="yellow" ? " (a confirmar)" : ""}`;

      div.addEventListener("click", () => {
        if(disabled) return;

        // limit by cuponera
        if(state.clasesMax && !selected && state.selectedSlots.length >= state.clasesMax){
          alert(`Tu cuponera permite ${state.clasesMax} clases. Ya seleccionaste ${state.selectedSlots.length}.`);
          return;
        }

        if(selected){
          removeSelected(state.selectedDateISO, s.start);
        } else {
          state.selectedSlots.push({
            dateISO: state.selectedDateISO,
            start: s.start,
            end: s.end,
            status: dayStat
          });
        }

        // keep sorted
        state.selectedSlots.sort((a,b) => {
          const k1 = a.dateISO + " " + a.start;
          const k2 = b.dateISO + " " + b.start;
          return k1.localeCompare(k2);
        });

        renderSlotsForSelectedDate();
        renderAgendaResumen();
        renderFinal();
      });

      slotsWrap.appendChild(div);
    }
  }

  function renderDatosResumen(){
    const el = document.getElementById("eptDatosResumen");
    if(!el) return;
    el.innerHTML = `
      <div class="ept-badge">${state.cuponera || "Cuponera"}</div>
      <div style="margin-top:8px">
        <div><b>${escapeHTML(state.nombre)} ${escapeHTML(state.apellido)}</b></div>
        <div class="muted">${escapeHTML(state.materia)} • ${escapeHTML(state.curso)}</div>
        <div class="muted">WhatsApp: ${escapeHTML(state.wapp)} ${state.email ? " • " + escapeHTML(state.email) : ""}</div>
        <div class="muted">Examen: <b>${escapeHTML(state.examenISO)}</b> (último día para agendar: <b>${escapeHTML(toISODate(addDays(parseISODate(state.examenISO), -1)))}</b>)</div>
        <div class="muted">Clases permitidas: <b>${state.clasesMax || "-"}</b></div>
      </div>
    `;
  }

  function renderAgendaResumen(){
    const el = document.getElementById("eptAgendaResumen");
    if(!el) return;

    if(state.selectedSlots.length === 0){
      el.innerHTML = `<div class="muted">Sin horarios seleccionados.</div>`;
      return;
    }

    const lines = state.selectedSlots.map(s => {
      const d = parseISODate(s.dateISO);
      const label = `${WEEKDAYS[d.getDay()]} ${s.dateISO} • ${s.start}-${s.end}${s.status==="yellow" ? " (a confirmar)" : ""}`;
      return `<li>${escapeHTML(label)}</li>`;
    }).join("");

    el.innerHTML = `
      <div><b>Clases seleccionadas:</b> ${state.selectedSlots.length} / ${state.clasesMax || "∞"}</div>
      <ul style="margin:8px 0 0 18px;">${lines}</ul>
    `;
  }

  function renderFinal(){
    const el = document.getElementById("eptFinal");
    if(!el) return;

    const step1Err = validateStep1();
    const slotsErr = validateSlots();

    const examInfo = state.examenISO ? `Último día para agendar: <b>${escapeHTML(toISODate(addDays(parseISODate(state.examenISO), -1)))}</b>` : "";

    const slotLines = state.selectedSlots.map((s,i) => {
      const d = parseISODate(s.dateISO);
      const cal = googleCalendarLink({
        title: `Clase ${state.materia} - ElProfeTino (${state.nombre} ${state.apellido})`,
        details: `Cuponera: ${state.cuponera}\nCurso: ${state.curso}\nWhatsApp alumno: ${state.wapp}\n${s.status==="yellow" ? "SÁBADO: A CONFIRMAR EN CLASE\n" : ""}`,
        location: "Zona Cordón (presencial)",
        startDateISO: s.dateISO,
        startHHMM: s.start,
        endHHMM: s.end,
      });
      const label = `${WEEKDAYS[d.getDay()]} ${s.dateISO} • ${s.start}-${s.end}${s.status==="yellow" ? " (a confirmar)" : ""}`;
      return `<li>${escapeHTML(label)} — <a href="${cal}" target="_blank" rel="noopener">Google Calendar</a></li>`;
    }).join("");

    el.innerHTML = `
      <div class="ept-badge">${escapeHTML(state.cuponera || "Cuponera")}</div>
      <div style="margin-top:10px">
        <div><b>${escapeHTML(state.nombre || "-")} ${escapeHTML(state.apellido || "")}</b></div>
        <div class="muted">${escapeHTML(state.materia)} • ${escapeHTML(state.curso)} • ${examInfo}</div>
      </div>
      <hr style="border:0;border-top:1px solid rgba(255,255,255,.12); margin:10px 0;">
      <div><b>Clases:</b> ${state.selectedSlots.length} / ${state.clasesMax || "-"}</div>
      <ul style="margin:8px 0 0 18px;">${slotLines || "<li class='muted'>Sin horarios aún</li>"}</ul>
      ${(step1Err || slotsErr) ? `<div style="margin-top:10px" class="muted">⚠ ${escapeHTML(step1Err || slotsErr)}</div>` : `<div style="margin-top:10px" class="muted">✅ Listo para confirmar por WhatsApp.</div>`}
    `;
  }

  function escapeHTML(s){
    return String(s || "").replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }

  // ---------- Navigation steps ----------
  function showSteps(activeList){
    const s1 = document.getElementById("eptStep1");
    const s1L= document.getElementById("eptStep1Locked");
    const s2 = document.getElementById("eptStep2");
    const s2L= document.getElementById("eptStep2Locked");

    if(!s1 || !s1L || !s2 || !s2L) return;

    const set = new Set(Array.isArray(activeList) ? activeList : [activeList]);

    s1.classList.toggle("active", set.has("s1"));
    s1L.classList.toggle("active", set.has("s1L"));
    s2.classList.toggle("active", set.has("s2"));
    s2L.classList.toggle("active", set.has("s2L"));
  }

  // ---------- WhatsApp confirm ----------
  function confirmReservation(){
    const err1 = validateStep1();
    if(err1){ alert(err1); return; }
    const err2 = validateSlots();
    if(err2){ alert(err2); return; }

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

    // UI feedback
    const btn = document.getElementById("eptConfirm");
    const prevText = btn ? btn.textContent : "";
    if(btn){ btn.disabled = true; btn.textContent = "Guardando en agenda…"; }

    fetch(SHEETS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    .then(r => r.json().catch(() => ({})))
    .then(data => {
      if(!data || !data.ok){
        throw new Error((data && data.error) ? data.error : "No se pudo guardar en la agenda.");
      }

      const ids = Array.isArray(data.ids) ? data.ids : [];
      const idsTxt = ids.length ? ids.map(x => `• ${x}`).join("\n") : "(sin id)";

      // Calendar link (first slot)
      const first = state.selectedSlots[0];
      const calLink = googleCalendarLink({
        title: `Clase ${state.materia} - ElProfeTino (${state.nombre} ${state.apellido})`,
        details: `Cuponera: ${state.cuponera}\nCurso: ${state.curso}\nWhatsApp alumno: ${state.wapp}\nIDs: ${ids.join(", ")}`,
        location: "Zona Cordón (presencial)",
        startDateISO: first.dateISO,
        startHHMM: first.start,
        endHHMM: first.end,
      });

      // build message WhatsApp
      const header =
`Hola Profe! Quiero confirmar la reserva ✅

Cuponera: ${state.cuponera} (${state.selectedSlots.length}/${state.clasesMax} clases)
Alumno: ${state.nombre} ${state.apellido}
Materia: ${state.materia}
Curso: ${state.curso}
WhatsApp: ${state.wapp}${state.email ? "\nEmail: "+state.email : ""}
Examen: ${state.examenISO} (último día para agendar: ${toISODate(addDays(parseISODate(state.examenISO),-1))})

IDs de reserva:
${idsTxt}

Horarios:`;

      const lines = state.selectedSlots.map((s) => {
        const d = parseISODate(s.dateISO);
        return `- ${WEEKDAYS[d.getDay()]} ${s.dateISO} ${s.start}-${s.end}${s.status==="yellow" ? " (a confirmar)" : ""}`;
      }).join("\n");

      const tail =
`\n\nGoogle Calendar (1ra clase):
${calLink}

Gracias!`;

      const text = header + "\n" + lines + tail;
      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener");

      // Feedback
      alert("✅ Reserva guardada en la agenda (Google Sheets). Ahora confirmá por WhatsApp.");

      // (Opcional) limpiar selección para siguiente reserva
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
      if(btn){ btn.disabled = false; btn.textContent = prevText || "Confirmar por WhatsApp →"; }
    });
  }    
  saveBooked(booked);

    // build message
    const header = `Hola Profe! Quiero reservar clases.\n\nCuponera: ${state.cuponera} (${state.selectedSlots.length}/${state.clasesMax} clases)\nAlumno: ${state.nombre} ${state.apellido}\nMateria: ${state.materia}\nCurso: ${state.curso}\nWhatsApp: ${state.wapp}${state.email ? "\nEmail: "+state.email : ""}\nExamen: ${state.examenISO} (último día para agendar: ${toISODate(addDays(parseISODate(state.examenISO),-1))})\n\nHorarios elegidos:\n`;

    const lines = state.selectedSlots.map((s) => {
      const d = parseISODate(s.dateISO);
      return `- ${WEEKDAYS[d.getDay()]} ${s.dateISO} ${s.start}-${s.end}${s.status==="yellow" ? " (a confirmar)" : ""}`;
    }).join("\n");

    // calendar link (first slot)
    const first = state.selectedSlots[0];
    const calLink = googleCalendarLink({
      title: `Clase ${state.materia} - ElProfeTino (${state.nombre} ${state.apellido})`,
      details: `Cuponera: ${state.cuponera}\nCurso: ${state.curso}\nWhatsApp alumno: ${state.wapp}`,
      location: "Zona Cordón (presencial)",
      startDateISO: first.dateISO,
      startHHMM: first.start,
      endHHMM: first.end,
    });

    const tail = `\n\nGoogle Calendar (1ra clase):\n${calLink}\n\nGracias!`;

    const text = header + lines + tail;

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");

    // refresh UI
    renderCalendar();
    renderSlotsForSelectedDate();
    renderAgendaResumen();
    renderFinal();
    alert("Reserva registrada (demo) y WhatsApp listo. Si querés, seguimos con guardar esto en Google Sheets.");
  }

  // ---------- Wire up ----------
  function wire(){
    injectModal();

    // Close
    document.getElementById("eptCloseBtn")?.addEventListener("click", closeModal);
    document.getElementById("eptReservaBackdrop")?.addEventListener("click", (e)=> {
      // click outside closes
      if(e.target.id === "eptReservaBackdrop") closeModal();
    });

    // Step 1 inputs
    const setFromInputs = () => {
      state.nombre  = document.getElementById("eptNombre")?.value || "";
      state.apellido= document.getElementById("eptApellido")?.value || "";
      state.wapp    = document.getElementById("eptWapp")?.value || "";
      state.email   = document.getElementById("eptEmail")?.value || "";
      state.materia = document.getElementById("eptMateria")?.value || "Matemática";
      state.curso   = document.getElementById("eptCurso")?.value || "7°";
      state.examenISO = document.getElementById("eptExamen")?.value || "";
    };

    document.getElementById("eptResetAll")?.addEventListener("click", ()=>{
      resetAll();
      // reset inputs
      document.getElementById("eptNombre").value="";
      document.getElementById("eptApellido").value="";
      document.getElementById("eptWapp").value="";
      document.getElementById("eptEmail").value="";
      document.getElementById("eptMateria").value="Matemática";
      document.getElementById("eptCurso").value="7°";
      document.getElementById("eptExamen").value="";
      state.selectedSlots = [];
      state.selectedDateISO = "";
      state.viewMonth = new Date();
      showSteps(["s1"]);
      renderCalendar();
      renderSlotsForSelectedDate();
      renderAgendaResumen();
      renderFinal();
    });

    document.getElementById("eptToStep2")?.addEventListener("click", ()=>{
      setFromInputs();
      const err = validateStep1();
      if(err){ alert(err); return; }
      renderDatosResumen(); showSteps(["s1L","s2"]);
      // auto set calendar month to now
      state.viewMonth = new Date();
      state.selectedDateISO = "";
      renderCalendar();
      renderSlotsForSelectedDate();
      renderFinal();
    });

    document.getElementById("eptEditDatos")?.addEventListener("click", ()=>{
      showSteps(["s1"]);
    });

    document.getElementById("eptGoAgenda")?.addEventListener("click", ()=>{ showSteps(["s1L","s2"]); });

    // Calendar nav
    document.getElementById("eptPrevMonth")?.addEventListener("click", ()=>{
      state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth()-1, 1);
      renderCalendar();
    });
    document.getElementById("eptNextMonth")?.addEventListener("click", ()=>{
      state.viewMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth()+1, 1);
      renderCalendar();
    });

    document.getElementById("eptClearSlots")?.addEventListener("click", ()=>{
      state.selectedSlots = [];
      renderSlotsForSelectedDate();
      renderAgendaResumen();
      renderFinal();
    });

    document.getElementById("eptEditAgenda")?.addEventListener("click", ()=>{
      // nothing special; stays in step2
      renderCalendar();
      renderSlotsForSelectedDate();
      renderFinal();
    });

    document.getElementById("eptToStep3")?.addEventListener("click", ()=>{
      setFromInputs();
      const err1 = validateStep1();
      if(err1){ alert(err1); return; }
      const err2 = validateSlots();
      if(err2){ alert(err2); return; }

      renderAgendaResumen();
      showSteps(["s1L","s2L"]);
      renderFinal();
    });

    document.getElementById("eptEditAgenda2")?.addEventListener("click", ()=>{ showSteps(["s1L","s2"]); });

    document.getElementById("eptGoResumen")?.addEventListener("click", ()=>{
      showSteps(["s1L","s2L"]);
    });

    document.getElementById("eptModDatos")?.addEventListener("click", ()=> showSteps(["s1"]));
    document.getElementById("eptModAgenda")?.addEventListener("click", ()=> showSteps(["s1L","s2"]));
    document.getElementById("eptConfirm")?.addEventListener("click", confirmReservation);

    // Initial renders
    showSteps(["s1"]);
    renderCalendar();
    renderSlotsForSelectedDate();
    renderAgendaResumen();
    renderFinal();
  }

  // ---------- Public entry: attach to coupon buttons ----------
  function attachCouponButtons(){
    // Any element with: data-ept-reserva="1"
    const btns = document.querySelectorAll("[data-ept-reserva='1']");
    if(!btns.length){
      console.warn("EPT Reservas: no encontré botones con data-ept-reserva='1'");
    }

    btns.forEach(btn => {
      btn.addEventListener("click", (e)=>{
        e.preventDefault();
        wire();
        openModal();

        // set cuponera from dataset
        const name = (btn.getAttribute("data-cuponera") || "").trim().toUpperCase();
        setCuponera(name || "APOYO");

        // prefill classesMax if provided
        const max = parseInt(btn.getAttribute("data-clases") || "0", 10);
        if(max) state.clasesMax = max;

        // Reset flow each open (except booked slots are kept)
        showSteps(["s1"]);
        state.selectedSlots = [];
        state.selectedDateISO = "";
        state.viewMonth = new Date();
        renderCalendar();
        renderSlotsForSelectedDate();
        renderAgendaResumen();
        renderFinal();
      });
    });

    // allow ESC close
    document.addEventListener("keydown", (e)=>{
      if(e.key === "Escape") closeModal();
    });
  }

  // Boot
  document.addEventListener("DOMContentLoaded", ()=>{
    attachCouponButtons();
  });


  // ===== API GLOBAL (para asegurar el click desde index.html) =====
  try {
    window.EPT_RESERVAS_READY = true;
    // EPT_RESERVAS_READY_EVENT
    try{ window.dispatchEvent(new Event("EPT_RESERVAS_READY")); }catch(e){} 
// Abre el modal pasando el botón clickeado (lee data-cuponera / data-clases)
    window.EPT_OPEN_RESERVA = function(btn){
      try{
        wire();
        openModal();

        const name = ((btn && btn.getAttribute("data-cuponera")) || "APOYO").trim().toUpperCase();
        setCuponera(name);

        const max = parseInt((btn && btn.getAttribute("data-clases")) || "0", 10);
        if(max) state.clasesMax = max;

        // reset selección por cada apertura
        showSteps(["s1"]);
        state.selectedSlots = [];
        state.selectedDateISO = "";
        state.viewMonth = new Date();

        renderCalendar();
        renderSlotsForSelectedDate();
        renderAgendaResumen();
        renderFinal();
      }catch(err){
        console.warn("EPT_OPEN_RESERVA error:", err);
      }
    };
  } catch(e) {}

})();




