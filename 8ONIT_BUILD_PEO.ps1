# ================================
# ONIT_BUILD_PEO.ps1
# Construye/actualiza la landing + docs + estructura base PEO
# Autor: Onit (para Tino)
# ================================

$ErrorActionPreference = "Stop"

function Write-Title($t) {
  Write-Host ""
  Write-Host "===============================" -ForegroundColor Cyan
  Write-Host $t -ForegroundColor Cyan
  Write-Host "===============================" -ForegroundColor Cyan
}

function Assert-Path($p, $msg) {
  if (!(Test-Path $p)) { throw $msg }
}

Write-Title "PEO Builder - ElProfeTino"

# --- Verificar que estamos en un repo con carpeta public ---
Assert-Path ".\public" "No encuentro .\public. Ejecutá este script en la raíz del repo."
Assert-Path ".\public\assets" "No encuentro .\public\assets. Verificá tu estructura."

# --- Verificar assets básicos ---
$need = @(
  ".\public\assets\logo_EPT.png",
  ".\public\assets\portada_EPT.png",
  ".\public\assets\EPT_explosivo.mp4"
)
foreach ($f in $need) {
  Assert-Path $f "Falta el asset requerido: $f"
}

# --- Backup del index actual ---
$indexPath = ".\public\index.html"
if (Test-Path $indexPath) {
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $backup = ".\public\index.backup-$stamp.html"
  Copy-Item -Force $indexPath $backup
  Write-Host "✅ Backup creado: $backup" -ForegroundColor Green
} else {
  Write-Host "ℹ️ No existía public\index.html, lo vamos a crear." -ForegroundColor Yellow
}

# --- Configuración ---
$WHATSAPP_NUMBER = "59898175225"   # sin +
$PRIMARY_DOMAIN  = "https://www.tuplataformaeducativa.online"

# --- HTML completo (landing) ---
# Notas:
# - Rutas ABSOLUTAS: /assets/... (más robusto en Vercel)
# - Botón flotante abre modal FAQ (no WhatsApp)
# - Cuponeras 2026 + cuponera especial Prepara Tu Examen
# - WhatsApp en botones de compra con mensaje pre-armado
$html = @"
<!doctype html>
<html lang="es-UY">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <!-- ============================
       SEO + Social
       ============================ -->
  <title>ElProfeTino | Clases particulares de Matemática y Física</title>
  <meta name="description" content="Clases presenciales, individuales y personalizadas de Matemática y Física (7º a 9º y Bachillerato). Aprender es Entender. Herramientas: TizaIA, GeneraTusEjercicios, TuExamenPersonal." />
  <meta property="og:title" content="ElProfeTino | Aprender es Entender" />
  <meta property="og:description" content="Clases presenciales, individuales y personalizadas de Matemática y Física (7º a 9º y Bachillerato). Cuponeras 2026 y plan especial Prepara Tu Examen." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="$PRIMARY_DOMAIN/" />
  <meta property="og:image" content="/assets/portada_EPT.png" />

  <!-- Favicon (usamos el logo) -->
  <link rel="icon" type="image/png" href="/assets/logo_EPT.png" />

  <style>
    :root{
      --bg0:#070b18;
      --bg1:#0b1230;
      --card:rgba(255,255,255,.06);
      --stroke:rgba(255,255,255,.12);
      --text:rgba(255,255,255,.92);
      --muted:rgba(255,255,255,.72);
      --brand:#15c6ff;
      --accent:#ffb000;
      --ok:#34d399;
      --shadow: 0 18px 60px rgba(0,0,0,.45);
      --radius: 18px;
      --max: 1120px;
    }

    *{box-sizing:border-box}
    body{
      margin:0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif;
      color:var(--text);
      background:
        radial-gradient(1200px 600px at 20% 10%, rgba(21,198,255,.22), transparent 55%),
        radial-gradient(900px 500px at 80% 20%, rgba(255,176,0,.18), transparent 55%),
        radial-gradient(900px 700px at 50% 100%, rgba(124,58,237,.12), transparent 60%),
        linear-gradient(180deg, var(--bg0), var(--bg1));
      overflow-x:hidden;
    }
    body:before{
      content:"";
      position:fixed; inset:0;
      background-image:
        radial-gradient(2px 2px at 10% 20%, rgba(255,255,255,.35) 50%, transparent 52%),
        radial-gradient(2px 2px at 70% 30%, rgba(255,255,255,.25) 50%, transparent 52%),
        radial-gradient(1px 1px at 40% 60%, rgba(255,255,255,.18) 50%, transparent 52%),
        radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,.14) 50%, transparent 52%),
        radial-gradient(2px 2px at 25% 80%, rgba(255,255,255,.22) 50%, transparent 52%);
      opacity:.45;
      pointer-events:none;
      filter: blur(.2px);
    }
    a{color:inherit;text-decoration:none}

    .wrap{
      max-width: var(--max);
      margin: 0 auto;
      padding: 22px 18px 110px;
      position:relative;
      z-index:1;
    }

    /* ============================
       Header / Brand
       ============================ */
    header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:14px;
      padding: 10px 0 18px;
    }
    .brand{
      display:flex;
      align-items:center;
      gap:12px;
      min-width: 0;
    }
    .brand img.logo{
      width:52px;height:52px;
      border-radius: 16px;
      object-fit: cover;
      border: 1px solid rgba(255,255,255,.22);
      background: rgba(0,0,0,.35);
      box-shadow: 0 18px 60px rgba(0,0,0,.55);
      flex:0 0 auto;
      display:block;
    }
    .brand-title{
      font-weight: 900;
      letter-spacing: .2px;
      font-size: 18px;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .brand-title .elprofe{ color: rgba(255,255,255,.95); }
    .brand-title .tino{ color: var(--brand); }
    .brand-sub{
      font-size:12px;color:var(--muted);
      margin-top: 2px;
    }

    .pill{
      display:inline-flex;
      align-items:center;
      gap:10px;
      padding: 10px 12px;
      border: 1px solid var(--stroke);
      background: rgba(255,255,255,.05);
      border-radius: 999px;
      box-shadow: 0 12px 40px rgba(0,0,0,.25);
      color: var(--muted);
      font-size: 13px;
      white-space:nowrap;
    }
    .dot{
      width:10px;height:10px;border-radius:99px;
      background: var(--ok);
      box-shadow: 0 0 0 6px rgba(52,211,153,.15);
    }

    /* ============================
       Cards / Layout
       ============================ */
    .card{
      border:1px solid var(--stroke);
      background: var(--card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow:hidden;
      position:relative;
    }
    .hero{
      display:grid;
      grid-template-columns: 1.08fr .92fr;
      gap: 18px;
      align-items: stretch;
    }
    @media (max-width: 920px){
      .hero{grid-template-columns: 1fr;}
      .pill{white-space: normal;}
    }

    /* ============================
       Hero Left
       ============================ */
    .hero-left{padding: 22px 22px 18px;}
    h1{
      margin: 8px 0 8px;
      font-size: clamp(30px, 3.6vw, 46px);
      line-height: 1.05;
      letter-spacing: .2px;
    }
    .subtitle{
      color: var(--muted);
      font-size: 16px;
      line-height: 1.45;
      margin: 10px 0 16px;
    }
    .kpis{
      display:flex;flex-wrap:wrap;gap:10px;
      margin: 14px 0 18px;
    }
    .kpi{
      border: 1px solid var(--stroke);
      background: rgba(0,0,0,.18);
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 13px;
      color: var(--muted);
    }
    .kpi b{color:var(--text)}

    .cta-row{
      display:flex;
      flex-wrap:wrap;
      gap:12px;
      margin: 14px 0 10px;
    }
    .btn{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:10px;
      border-radius: 14px;
      padding: 12px 14px;
      border: 1px solid var(--stroke);
      background: rgba(0,0,0,.18);
      color: var(--text);
      font-weight: 800;
      cursor:pointer;
      transition: transform .12s ease, background .12s ease;
      user-select:none;
      min-width: 190px;
    }
    .btn:hover{transform: translateY(-1px); background: rgba(0,0,0,.26);}
    .btn.primary{
      background: linear-gradient(135deg, rgba(21,198,255,.95), rgba(21,198,255,.55));
      border-color: rgba(21,198,255,.6);
      color: #041018;
    }
    .btn.primary:hover{background: linear-gradient(135deg, rgba(21,198,255,1), rgba(21,198,255,.6));}
    .btn.accent{
      background: linear-gradient(135deg, rgba(255,176,0,.95), rgba(255,176,0,.6));
      border-color: rgba(255,176,0,.65);
      color:#1a1203;
    }

    .tiny{
      font-size: 12px;
      color: var(--muted);
      margin-top: 10px;
    }

    /* ============================
       Hero Right (Video) - más chico
       ============================ */
    .hero-right{
      padding: 16px;
      display:flex;
      flex-direction:column;
      gap: 12px;
      align-items:center;
      justify-content:flex-start;
    }
    .video-wrap{
      width: 100%;
      max-width: 460px;
      border-radius: 18px;
      overflow:hidden;
      border: 1px solid rgba(21,198,255,.35);
      box-shadow: 0 18px 70px rgba(0,0,0,.5);
      background: rgba(0,0,0,.35);
      position:relative;
      margin-top: 6px;

      /* Clave: limitamos altura para que no “se coma” el box */
      height: 240px;
    }
    @media (max-width: 920px){
      .video-wrap{ height: 220px; }
    }
    video{
      width:100%;
      height:100%;
      object-fit: cover;
      display:block;
      background: rgba(0,0,0,.35);
    }
    .video-badge{
      position:absolute;
      left: 12px; top: 12px;
      padding: 8px 10px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(0,0,0,.45);
      backdrop-filter: blur(6px);
      font-size: 12px;
      color: rgba(255,255,255,.85);
      z-index: 2;
    }
    .video-fallback{
      display:none;
      position:absolute; inset:0;
      align-items:center; justify-content:center;
      text-align:center;
      padding: 16px;
      color: rgba(255,255,255,.85);
      background: radial-gradient(900px 500px at 50% 50%, rgba(21,198,255,.12), rgba(0,0,0,.55));
      z-index: 1;
    }
    .video-fallback b{color:#fff}

    /* ============================
       Secciones
       ============================ */
    .section{
      margin-top: 16px;
      padding: 18px 18px 16px;
    }
    .section h2{
      margin:0 0 12px;
      font-size:18px;
    }
    .grid3{
      display:grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    @media (max-width: 920px){
      .grid3{grid-template-columns: 1fr;}
    }
    .mini{
      padding: 14px;
      border-radius: 16px;
      border: 1px solid var(--stroke);
      background: rgba(0,0,0,.16);
    }
    .mini h3{ margin:0 0 6px; font-size: 15px; }
    .mini p{ margin:0; color: var(--muted); line-height: 1.35; font-size: 13px; }

    /* ============================
       Cuponeras
       ============================ */
    .plans{
      display:grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    @media (max-width: 1120px){
      .plans{grid-template-columns: repeat(2, 1fr);}
    }
    @media (max-width: 640px){
      .plans{grid-template-columns: 1fr;}
    }

    .plan{
      padding: 16px;
      border-radius: 18px;
      border: 1px solid var(--stroke);
      background: rgba(0,0,0,.14);
      position:relative;
      min-height: 210px;
      display:flex;
      flex-direction:column;
      gap: 10px;
    }
    .plan .tag{
      display:inline-flex;
      align-items:center;
      gap:8px;
      font-size: 12px;
      color: rgba(255,255,255,.8);
      border: 1px solid rgba(255,255,255,.14);
      padding: 6px 10px;
      border-radius: 999px;
      width: fit-content;
      background: rgba(255,255,255,.05);
    }
    .plan .name{
      font-weight: 900;
      letter-spacing:.2px;
      font-size: 16px;
      display:flex;
      align-items:center;
      gap:8px;
    }
    .plan .price{
      font-size: 34px;
      font-weight: 900;
      letter-spacing:.2px;
      line-height: 1;
    }
    .plan .small{
      color: var(--muted);
      font-size: 13px;
      line-height: 1.3;
      margin-top: -4px;
    }

    .plan.highlight{
      border: 2px solid rgba(255,176,0,.9);
      box-shadow: 0 18px 80px rgba(255,176,0,.08);
    }

    .plan.exam{
      border: 2px solid rgba(21,198,255,.85);
      box-shadow: 0 18px 80px rgba(21,198,255,.10);
      background: rgba(21,198,255,.06);
    }

    .plan .buy{
      margin-top:auto;
      display:flex;
      gap:10px;
      align-items:center;
    }
    .plan .buy a{
      width:100%;
    }
    .btn.buybtn{
      width:100%;
      min-width: unset;
      padding: 12px 14px;
    }

    /* ============================
       Footer
       ============================ */
    footer{
      margin-top: 14px;
      padding: 14px 2px 0;
      color: rgba(255,255,255,.55);
      font-size: 12px;
      text-align:center;
    }

    /* ============================
       Floating button: FAQ (no WhatsApp)
       ============================ */
    .fab{
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 20;
      display:flex;
      align-items:center;
      gap:10px;
      padding: 12px 14px;
      border-radius: 999px;
      background: rgba(0,0,0,.55);
      border: 1px solid rgba(255,255,255,.16);
      backdrop-filter: blur(8px);
      box-shadow: 0 18px 60px rgba(0,0,0,.45);
      cursor:pointer;
      transition: transform .12s ease;
      user-select:none;
    }
    .fab:hover{transform: translateY(-1px)}
    .fab strong{font-size: 13px}
    .fab span{font-size:12px;color:rgba(255,255,255,.7)}

    /* ============================
       Modal FAQ
       ============================ */
    .modal-backdrop{
      position: fixed; inset:0;
      background: rgba(0,0,0,.55);
      backdrop-filter: blur(6px);
      display:none;
      align-items:center;
      justify-content:center;
      z-index: 50;
      padding: 18px;
    }
    .modal{
      width: min(920px, 100%);
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,.16);
      background: rgba(10,14,28,.92);
      box-shadow: 0 22px 120px rgba(0,0,0,.6);
      overflow:hidden;
    }
    .modal-head{
      padding: 14px 16px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      border-bottom: 1px solid rgba(255,255,255,.10);
    }
    .modal-head .title{
      display:flex; align-items:center; gap:10px;
      font-weight: 900;
    }
    .modal-head .x{
      border:1px solid rgba(255,255,255,.16);
      background: rgba(0,0,0,.25);
      color: rgba(255,255,255,.9);
      border-radius: 12px;
      padding: 8px 10px;
      cursor:pointer;
      font-weight: 900;
    }
    .modal-body{
      padding: 16px;
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    @media (max-width: 920px){
      .modal-body{grid-template-columns: 1fr;}
    }
    .faqbox{
      border:1px solid rgba(255,255,255,.12);
      background: rgba(0,0,0,.16);
      border-radius: 18px;
      padding: 14px;
    }
    .faqbox h3{
      margin:0 0 8px;
      font-size: 15px;
    }
    .faqbox p, .faqbox li{
      color: var(--muted);
      font-size: 13px;
      line-height: 1.4;
      margin:0;
    }
    .faqbox ul{margin:8px 0 0 18px; padding:0;}
    .faqbox b{color: var(--text);}

  </style>
</head>

<body>
  <div class="wrap">
    <!-- ============================
         HEADER
         ============================ -->
    <header>
      <div class="brand">
        <img class="logo" src="/assets/logo_EPT.png" alt="Logo ElProfeTino" />
        <div>
          <div class="brand-title" aria-label="ElProfeTino">
            <span class="elprofe">ElProfe</span><span class="tino">Tino</span>
          </div>
          <div class="brand-sub">Educación inteligente • PEO</div>
        </div>
      </div>

      <div class="pill">
        <span class="dot"></span>
        <span>Clases presenciales • Individuales • Personalizadas</span>
      </div>
    </header>

    <!-- ============================
         HERO
         ============================ -->
    <main class="hero">
      <section class="card hero-left">
        <div class="pill" style="display:inline-flex;margin-bottom:10px;">
          <span style="color:var(--accent);font-weight:900;">Experiencia ≥ 20 años</span>
          <span style="opacity:.6">•</span>
          <span>Matemática & Física (7º a 9º + Bachillerato)</span>
        </div>

        <h1>Aprender es Entender</h1>

        <p class="subtitle">
          Clases particulares presenciales, uno a uno, con un método simple:
          llevar la teoría a la realidad para que el alumno <b>comprenda</b>, gane confianza y rinda mejor.
        </p>

        <div class="kpis">
          <div class="kpi">📍 Zona <b>Cordón</b></div>
          <div class="kpi">🧠 Explicación clara + práctica</div>
          <div class="kpi">🤖 Herramientas propias (TizaIA / Ejercicios / Examen)</div>
        </div>

        <div class="cta-row">
          <a class="btn accent" id="btnWhats" href="#" target="_blank" rel="noopener">💬 WhatsApp</a>
          <button class="btn primary" id="btnFaq" type="button">❓ Preguntas frecuentes</button>
        </div>

        <div class="tiny">
          *La plataforma PEO incluye 3 herramientas creadas por mí para que el alumno no se quede con dudas y practique con criterio.
        </div>
      </section>

      <aside class="card hero-right">
        <div class="video-wrap">
          <div class="video-badge">ElProfeTino • intro</div>

          <video
            id="introVideo"
            autoplay
            muted
            loop
            playsinline
            preload="auto"
            poster="/assets/portada_EPT.png"
          >
            <source src="/assets/EPT_explosivo.mp4" type="video/mp4" />
            Tu navegador no soporta video HTML5.
          </video>

          <div class="video-fallback" id="videoFallback">
            <div>
              <b>Video no disponible</b><br/>
              Verificá que exista <code>/assets/EPT_explosivo.mp4</code>
            </div>
          </div>
        </div>

        <div style="text-align:center;color:var(--muted);font-size:13px;max-width:520px;">
          <b style="color:var(--text)">Matemática y Física</b> con ejemplos de la vida real (sí: fútbol, cocina, skate, mate… lo que sea).
        </div>
      </aside>
    </main>

    <!-- ============================
         HERRAMIENTAS PEO
         ============================ -->
    <section class="card section">
      <h2>Herramientas PEO (incluidas para mis alumnos)</h2>

      <div class="grid3">
        <div class="mini">
          <h3>🧩 TizaIA</h3>
          <p>Responde dudas y explica temas, fórmulas y procedimientos con lenguaje claro y ejemplos reales.</p>
        </div>
        <div class="mini">
          <h3>✏️ GeneraTusEjercicios</h3>
          <p>Genera práctica con ejercicios similares, adaptados al nivel del alumno. Más práctica = más seguridad.</p>
        </div>
        <div class="mini">
          <h3>📝 TuExamenPersonal</h3>
          <p>Simula un examen real: lo resolvés online, con tiempo y corrección. Llegás con cancha al examen.</p>
        </div>
      </div>
    </section>

    <!-- ============================
         CUPONERAS 2026
         ============================ -->
    <section class="card section">
      <h2>Cuponeras 2026</h2>
      <div style="color:var(--muted);font-size:13px;margin-top:-6px;margin-bottom:12px;">
        Elegí la cuponera según la situación del alumno. Todas las clases son <b>presenciales</b>, <b>individuales</b> y <b>personalizadas</b>.
      </div>

      <div class="plans">
        <!-- APOYO -->
        <div class="plan">
          <div class="tag">🟦 APOYO</div>
          <div class="name">8 clases</div>
          <div class="price">UYU 3.800</div>
          <div class="small">Ideal para apoyo de tu curso mes a mes.</div>
          <div class="buy">
            <a class="btn buybtn" data-plan="APOYO (8 clases) - UYU 3.800" href="#" target="_blank" rel="noopener">🟩 Comprar por WhatsApp</a>
          </div>
        </div>

        <!-- NO ENTIENDO (destacada) -->
        <div class="plan highlight">
          <div class="tag">⭐ NO ENTIENDO</div>
          <div class="name">12 clases</div>
          <div class="price">UYU 5.400</div>
          <div class="small">Cuando necesitás algo más para entender todo.</div>
          <div class="buy">
            <a class="btn buybtn accent" data-plan="NO ENTIENDO (12 clases) - UYU 5.400" href="#" target="_blank" rel="noopener">⭐ ¡La quiero!</a>
          </div>
        </div>

        <!-- EN EL HORNO -->
        <div class="plan">
          <div class="tag">🔥 EN EL HORNO</div>
          <div class="name">15 clases</div>
          <div class="price">UYU 6.375</div>
          <div class="small">Si sentís que estás “en el horno”, esta es tu cuponera.</div>
          <div class="buy">
            <a class="btn buybtn" data-plan="EN EL HORNO (15 clases) - UYU 6.375" href="#" target="_blank" rel="noopener">🟩 Comprar por WhatsApp</a>
          </div>
        </div>

        <!-- PREPARA TU EXAMEN -->
        <div class="plan exam">
          <div class="tag">🎓 PREPARA TU EXAMEN</div>
          <div class="name">12 clases • Febrero 2026</div>
          <div class="price">UYU 4.800</div>
          <div class="small"><b>Solo</b> para exámenes de Febrero 2026. Para llegar seguro y aprobar sí o sí.</div>
          <div class="buy">
            <a class="btn buybtn primary" data-plan="PREPARA TU EXAMEN (12 clases Feb/2026) - UYU 4.800" href="#" target="_blank" rel="noopener">🎯 Quiero preparar el examen</a>
          </div>
        </div>
      </div>
    </section>

    <footer>
      © <span id="year"></span>
      <span style="color:#fff;font-weight:800;">ElProfe</span><span style="color:var(--brand);font-weight:800;">Tino</span>
      • <span style="opacity:.85;">PEO - Plataforma Educativa Online</span>
    </footer>
  </div>

  <!-- ============================
       FAB (FAQ)
       ============================ -->
  <div class="fab" id="fabFaq" role="button" aria-label="Preguntas frecuentes" tabindex="0">
    <div style="font-size:18px;">❓</div>
    <div style="display:flex;flex-direction:column;line-height:1.1">
      <strong>¿Cómo son las clases?</strong>
      <span>FAQ + método + herramientas</span>
    </div>
  </div>

  <!-- ============================
       MODAL FAQ
       ============================ -->
  <div class="modal-backdrop" id="modalBackdrop" aria-hidden="true">
    <div class="modal" role="dialog" aria-modal="true" aria-label="Preguntas frecuentes">
      <div class="modal-head">
        <div class="title">
          <span style="font-size:18px;">📘</span>
          <span>Preguntas frecuentes</span>
        </div>
        <button class="x" id="modalClose" type="button">✕</button>
      </div>

      <div class="modal-body">
        <div class="faqbox">
          <h3>👤 ¿Cómo son las clases?</h3>
          <p>
            Son <b>presenciales</b>, <b>individuales</b> y <b>personalizadas</b>.
            Se adaptan al curso, al liceo y al ritmo del estudiante.
          </p>
          <ul>
            <li>📚 Matemática y Física (7º a 9º + Bachillerato)</li>
            <li>📍 Zona Cordón</li>
            <li>🎯 Objetivo: entender + practicar + rendir con confianza</li>
          </ul>
        </div>

        <div class="faqbox">
          <h3>🧠 “Aprender es Entender”</h3>
          <p>
            No memorizamos fórmulas “como loro”. Construimos el significado:
            <b>qué representa</b>, <b>cuándo se usa</b>, y <b>por qué funciona</b>.
          </p>
          <ul>
            <li>Ejemplos reales (fútbol, movimiento, fuerzas, trayectorias…)</li>
            <li>Razonamiento paso a paso</li>
            <li>Autoestima: “sí puedo”</li>
          </ul>
        </div>

        <div class="faqbox">
          <h3>🤖 ¿Qué es PEO y qué incluye?</h3>
          <p>
            Es una plataforma educativa creada por mí, pensada para que el alumno
            <b>no se quede con dudas</b> fuera de clase y practique con criterio.
          </p>
          <ul>
            <li><b>TizaIA</b>: explica temas, fórmulas y procedimientos</li>
            <li><b>GeneraTusEjercicios</b>: práctica similar y adaptativa</li>
            <li><b>TuExamenPersonal</b>: simulacro con tiempo y corrección</li>
          </ul>
        </div>

        <div class="faqbox">
          <h3>💬 ¿Cómo consulto o reservo?</h3>
          <p>
            Por WhatsApp coordinamos disponibilidad y objetivos.
            Si ya sabés la cuponera que querés, tocá “Comprar” y te llega el mensaje armado.
          </p>
          <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">
            <a class="btn accent" id="btnWhats2" href="#" target="_blank" rel="noopener">💬 Abrir WhatsApp</a>
            <button class="btn" id="btnClose2" type="button">👌 Entendido</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // ============================
    // CONFIG
    // ============================
    const WHATSAPP_NUMBER = "$WHATSAPP_NUMBER";

    function waLink(message){
      const txt = encodeURIComponent(message);
      return `https://wa.me/${WHATSAPP_NUMBER}?text=${txt}`;
    }

    // Footer year
    document.getElementById("year").textContent = new Date().getFullYear();

    // WhatsApp general
    const msgGeneral = "Hola ElProfeTino, quiero consultar por clases presenciales de Matemática/Física (7º a 9º o Bachillerato).";
    const waGeneral = waLink(msgGeneral);
    document.getElementById("btnWhats").href = waGeneral;
    document.getElementById("btnWhats2").href = waGeneral;

    // Botones de compra por WhatsApp (cuponeras)
    document.querySelectorAll("[data-plan]").forEach(a => {
      const plan = a.getAttribute("data-plan");
      const msg = `Hola ElProfeTino, quiero la cuponera: ${plan}. ¿Cómo coordinamos horarios?`;
      a.href = waLink(msg);
    });

    // ============================
    // Modal FAQ
    // ============================
    const backdrop = document.getElementById("modalBackdrop");
    const openBtns = [document.getElementById("btnFaq"), document.getElementById("fabFaq")];
    const closeBtns = [document.getElementById("modalClose"), document.getElementById("btnClose2")];

    function openModal(){
      backdrop.style.display = "flex";
      backdrop.setAttribute("aria-hidden","false");
    }
    function closeModal(){
      backdrop.style.display = "none";
      backdrop.setAttribute("aria-hidden","true");
    }

    openBtns.forEach(b => b && b.addEventListener("click", openModal));
    closeBtns.forEach(b => b && b.addEventListener("click", closeModal));

    // Click fuera del modal
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });

    // Escape
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // Accesibilidad teclado para FAB
    document.getElementById("fabFaq").addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(); }
    });

    // ============================
    // Video fallback / autoplay
    // ============================
    const video = document.getElementById("introVideo");
    const fb = document.getElementById("videoFallback");

    function showVideoFallback(){
      fb.style.display = "flex";
      video.setAttribute("controls","controls");
    }

    video.addEventListener("error", showVideoFallback);

    setTimeout(() => {
      const notReady = video.readyState <= 1;
      const paused = video.paused;
      if(notReady || paused){
        video.play().catch(() => showVideoFallback());
      }
    }, 1200);
  </script>
</body>
</html>
"@

# --- Escribir index.html ---
Set-Content -Path $indexPath -Value $html -Encoding UTF8
Write-Host "✅ public\index.html actualizado" -ForegroundColor Green

# --- Crear docs (Paso 2, 3, 4) ---
Write-Title "Creando docs + estructura base PEO"

New-Item -ItemType Directory -Force ".\docs" | Out-Null
New-Item -ItemType Directory -Force ".\apps" | Out-Null
New-Item -ItemType Directory -Force ".\apps\tizaia" | Out-Null
New-Item -ItemType Directory -Force ".\apps\genera-tus-ejercicios" | Out-Null
New-Item -ItemType Directory -Force ".\apps\tu-examen-personal" | Out-Null
New-Item -ItemType Directory -Force ".\shared" | Out-Null

# Paso 2: Prompt base TizaIA
$promptMd = @"
# TizaIA — Prompt base (estilo ElProfeTino)

## Objetivo
Ayudar al estudiante a **entender** Matemática/Física (7º a 9º y Bachillerato) sin memorizar vacío.
Prioridad: **comprensión + aplicación + confianza**.

## Principios
1. **No dar la respuesta final sin proceso**. Primero guiar: preguntas cortas, pasos claros.
2. **Lenguaje simple**. Evitar jerga. Si hay jerga, explicarla.
3. **Conectar con la realidad**: fútbol, movimiento, fuerza, trayectorias, vida cotidiana.
4. **Validar la duda** sin juzgar. “No entender” es normal.
5. **Detectar nivel** con 1–2 preguntas (“¿qué curso sos?” / “¿qué parte se te tranca?”).
6. **Estructura**: resumen → paso a paso → ejemplo → mini práctica → chequeo final.
7. **Accesibilidad**: frases cortas, listas, emojis moderados, sin paredes de texto.

## Formato recomendado de respuesta
- **Título**
- **Idea clave (1–2 líneas)**
- **Paso a paso**
- **Ejemplo real**
- **Mini práctica (1 ejercicio)**
- **Chequeo**: “¿Te quedó claro? ¿Querés que lo hagamos con un ejemplo tuyo?”

## Reglas anti-trampa (alineación educativa)
- No hacer “tarea lista” sin explicar.
- Si el usuario pide “solo resultado”: dar resultado **pero** con explicación mínima obligatoria.
- Promover razonamiento y verificación.

## Plantilla de inicio (saludo corto)
“Dale, lo vemos juntos. Decime: ¿qué curso sos y en qué parte exacta te trabaste?”

"@
Set-Content ".\docs\tizaia-prompt-base.md" $promptMd -Encoding UTF8

# Paso 3: Arquitectura PEO (borrador técnico)
$archMd = @"
# PEO — Arquitectura (borrador 2026 → 2027)

## Objetivo 2026
Sistema educativo práctico para clases presenciales con 3 módulos:
1) TizaIA (dudas + explicación)
2) GeneraTusEjercicios (práctica adaptada)
3) TuExamenPersonal (simulacros)

## Objetivo 2027
Alineación institucional (ANEP / Plan Ceibal): IA como apoyo al aprendizaje, no sustituto.
- Transparencia, explicabilidad, supervisión docente
- Enfoque en razonamiento y competencias

## Estructura propuesta (monorepo simple)
/public                -> landing estática
/apps
  /tizaia              -> app chat (UI + reglas + logging educativo)
  /genera-tus-ejercicios -> generador de práctica (por tema/nivel)
  /tu-examen-personal  -> simulador (tiempo + corrección)
/shared
  /content             -> contenidos/temarios por curso (ANEP)
  /rules               -> políticas IA responsable
  /ui                  -> componentes reutilizables
/docs
  prompt base, manifiesto, decisiones

## Decisiones clave
- Mobile-first
- Accesibilidad: contraste, tamaños, teclado, lectores
- Telemetría educativa ética (sin invadir): mejoras del sistema

## Próximo entregable técnico
- Definir stack (Next.js o Vite) para apps, manteniendo landing estática aparte.
- Definir “perfil alumno” (curso, objetivo, ritmo).
"@
Set-Content ".\docs\arquitectura-peo.md" $archMd -Encoding UTF8

# Paso 4: Manifiesto (marca + pedagogía)
$manifMd = @"
# Manifiesto ElProfeTino — Aprender es Entender

En esta plataforma no venimos a memorizar fórmulas como loros.
Venimos a entender qué significan, cuándo se usan y por qué funcionan.

## 1) Entender antes que repetir
Si el alumno entiende, puede aplicar. Si repite sin entender, se tranca cuando cambia el problema.

## 2) Ciencia pegada a la realidad
El mundo ya es Matemática y Física: una pelota, una parábola, un rebote, una fuerza, una aceleración.
La teoría se aprende cuando se conecta con lo cotidiano.

## 3) Acompañamiento humano + herramientas inteligentes
La IA no reemplaza al profe. Potencia el aprendizaje:
- explica
- propone práctica
- simula evaluación
Pero el centro es el estudiante entendiendo.

## 4) Inclusión real
Aprender tiene que ser posible para todos:
- lenguaje claro
- ritmo personal
- accesibilidad tecnológica
- respeto y paciencia
No hay vergüenza en preguntar.

## 5) Responsabilidad educativa
La IA se usa para aprender, no para “zafar”.
La meta es formar pensamiento crítico, no copiar resultados.

Aprender es Entender.
Y entender es libertad.
"@
Set-Content ".\docs\manifiesto-elprofetino.md" $manifMd -Encoding UTF8

# Readmes mínimos
Set-Content ".\apps\tizaia\README.md" "# App TizaIA (placeholder)`n" -Encoding UTF8
Set-Content ".\apps\genera-tus-ejercicios\README.md" "# App GeneraTusEjercicios (placeholder)`n" -Encoding UTF8
Set-Content ".\apps\tu-examen-personal\README.md" "# App TuExamenPersonal (placeholder)`n" -Encoding UTF8
Set-Content ".\shared\README.md" "# Shared (contenido, reglas, UI)`n" -Encoding UTF8

Write-Host "✅ Docs + estructura creada" -ForegroundColor Green

Write-Title "Listo"
Write-Host "👉 Revisá la landing en local:  cd public ; python -m http.server 8000" -ForegroundColor Yellow
Write-Host "👉 Luego commit/push a GitHub y Vercel deploya solo." -ForegroundColor Yellow
