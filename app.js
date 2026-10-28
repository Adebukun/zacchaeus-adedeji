/**
 * Zacchaeus Adedeji, GMNSE - Mechanical & HVAC Engineering Portfolio
 * Interactive 3D Canvas, Dynamic Load Estimator, Project Modals & Real Data
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Current Year
  const yearElem = document.getElementById('currentYear');
  if (yearElem) {
    yearElem.textContent = new Date().getFullYear();
  }

  // 2. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // 3. Initialize Interactive 3D Mechanical Canvas
  initMechanicalCanvas();

  // 4. Initialize Interactive HVAC Sizing Calculator
  initHvacCalculator();

  // 5. Initialize Project Filter System
  initProjectFilters();
});

/* ==========================================================================
   1. PURE HTML5 3D WIREFRAME MECHANICAL TURBINE / IMPELLER VISUALIZER
   ========================================================================== */
function initMechanicalCanvas() {
  const canvas = document.getElementById('mechanicalCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = canvas.width = rect.width * (window.devicePixelRatio || 1);
    height = canvas.height = rect.height * (window.devicePixelRatio || 1);
  }
  resize();
  window.addEventListener('resize', resize);

  // Generate 3D Geometry: An Aerodynamic Impeller / Rotor with Curved Blades
  const points = [];
  const edges = [];

  const rings = 3;
  const ringRadii = [60, 110, 140];
  const segments = 16;
  const depthLevels = [-40, 0, 40];

  // Hub and Shroud nodes
  depthLevels.forEach(z => {
    ringRadii.forEach(r => {
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push({
          x: Math.cos(theta) * r,
          y: Math.sin(theta) * r,
          z: z + (r === 60 ? 15 : 0) // aerodynamic curvature
        });
      }
    });
  });

  // Concentric ring connections
  const ptsPerLevel = rings * segments;
  depthLevels.forEach((_, lvl) => {
    ringRadii.forEach((_, ringIdx) => {
      const start = lvl * ptsPerLevel + ringIdx * segments;
      for (let i = 0; i < segments; i++) {
        const next = start + ((i + 1) % segments);
        edges.push([start + i, next, 'ring']);
      }
    });
  });

  // Curved Blade connections between inner hub and outer shroud
  depthLevels.forEach((_, lvl) => {
    const lvlStart = lvl * ptsPerLevel;
    for (let i = 0; i < segments; i += 2) {
      const inner = lvlStart + i;
      const mid = lvlStart + segments + ((i + 1) % segments);
      const outer = lvlStart + segments * 2 + ((i + 2) % segments);
      edges.push([inner, mid, 'blade']);
      edges.push([mid, outer, 'blade']);
    }
  });

  // Longitudinal structural rib connections across depth
  for (let lvl = 0; lvl < depthLevels.length - 1; lvl++) {
    const curLevelStart = lvl * ptsPerLevel;
    const nextLevelStart = (lvl + 1) * ptsPerLevel;
    for (let i = 0; i < ptsPerLevel; i += 4) {
      edges.push([curLevelStart + i, nextLevelStart + i, 'rib']);
    }
  }

  // Rotation angles & interaction states
  let rotX = 0.45;
  let rotY = 0.6;
  let rotZ = 0.15;
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - prevMouseX;
    const deltaY = e.clientY - prevMouseY;
    rotY += deltaX * 0.008;
    rotX += deltaY * 0.008;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  // Mobile Touch Support
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      isDragging = true;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length === 0) return;
    const deltaX = e.touches[0].clientX - prevMouseX;
    const deltaY = e.touches[0].clientY - prevMouseY;
    rotY += deltaX * 0.008;
    rotX += deltaY * 0.008;
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
  }, { passive: true });

  // Render Loop
  function render() {
    if (!isDragging) {
      rotY += 0.006;
      rotZ += 0.002;
    }

    ctx.clearRect(0, 0, width, height);

    const fov = 420;
    const centerX = width / 2;
    const centerY = height / 2;

    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

    // Transform points
    const projected = points.map(p => {
      let x1 = p.x * cosY + p.z * sinY;
      let y1 = p.y;
      let z1 = -p.x * sinY + p.z * cosY;

      let x2 = x1;
      let y2 = y1 * cosX - z1 * sinX;
      let z2 = y1 * sinX + z1 * cosX;

      let x3 = x2 * cosZ - y2 * sinZ;
      let y3 = x2 * sinZ + y2 * cosZ;
      let z3 = z2;

      const scale = fov / (fov + z3 + 180);
      return {
        x: centerX + x3 * scale,
        y: centerY + y3 * scale,
        z: z3,
        scale: scale
      };
    });

    // Draw Edges
    edges.forEach(([i, j, type]) => {
      const p1 = projected[i];
      const p2 = projected[j];

      const avgZ = (p1.z + p2.z) / 2;
      const alpha = Math.max(0.15, Math.min(0.9, (avgZ + 150) / 300));

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      if (type === 'blade') {
        ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 0.95})`; // Amber
        ctx.lineWidth = 1.6;
      } else if (type === 'ring') {
        ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.8})`; // Cyan
        ctx.lineWidth = 1.0;
      } else {
        ctx.strokeStyle = `rgba(148, 163, 184, ${alpha * 0.5})`; // Slate
        ctx.lineWidth = 0.8;
      }

      ctx.stroke();
    });

    // Draw Nodes
    projected.forEach(p => {
      const radius = Math.max(1, p.scale * 2.2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
    });

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

/* ==========================================================================
   2. INTERACTIVE HVAC & VRV SIZING ESTIMATOR (PURE SI UNITS)
   ========================================================================== */
function initHvacCalculator() {
  const calcArea = document.getElementById('calcArea');
  const areaVal = document.getElementById('areaVal');
  const calcType = document.getElementById('calcType');
  const calcClimate = document.getElementById('calcClimate');
  const calcRecovery = document.getElementById('calcRecovery');

  const resKw = document.getElementById('resKw');
  const resWatts = document.getElementById('resWatts');
  const resM3h = document.getElementById('resM3h');
  const resLs = document.getElementById('resLs');
  const resSavings = document.getElementById('resSavings');
  const resOpex = document.getElementById('resOpex');

  // Fallback references for backwards compatibility
  const resTons = document.getElementById('resTons');
  const resCfm = document.getElementById('resCfm');

  if (!calcArea) return;

  function recalculate() {
    const area = parseFloat(calcArea.value);
    areaVal.textContent = `${area.toLocaleString()} m²`;

    // SI Unit Standards: Specific cooling load in W/m² and volumetric airflow in m³/h per m²
    const typeFactors = {
      office: { wPerSqm: 140, m3hPerSqm: 28.56, costPerKw: 119.4 },
      residential: { wPerSqm: 110, m3hPerSqm: 20.39, costPerKw: 102.4 },
      hospitality: { wPerSqm: 210, m3hPerSqm: 44.17, costPerKw: 164.9 },
      industrial: { wPerSqm: 175, m3hPerSqm: 33.98, costPerKw: 136.5 }
    };

    const climateFactors = {
      tropical: 1.28,
      temperate: 0.95,
      arid: 1.15
    };

    const recoveryBenefits = {
      erv: { energyCutPercent: 28.5, opexMultiplier: 0.28 },
      hrv: { energyCutPercent: 18.0, opexMultiplier: 0.18 },
      none: { energyCutPercent: 0.0, opexMultiplier: 0.0 }
    };

    const typeConfig = typeFactors[calcType.value] || typeFactors.office;
    const climateMult = climateFactors[calcClimate.value] || 1.0;
    const recovConfig = recoveryBenefits[calcRecovery.value] || recoveryBenefits.erv;

    const totalWatts = area * typeConfig.wPerSqm * climateMult;
    const totalKw = totalWatts / 1000;

    const totalM3h = area * typeConfig.m3hPerSqm;
    const totalLs = totalM3h / 3.6;
    const baseAnnualEnergyExpense = totalKw * typeConfig.costPerKw;
    const annualSavingsDollars = baseAnnualEnergyExpense * recovConfig.opexMultiplier;

    if (resKw) resKw.textContent = `${totalKw.toFixed(1)} kW`;
    if (resWatts) resWatts.textContent = `${Math.round(totalWatts).toLocaleString()} W (Thermal Flow)`;
    if (resM3h) resM3h.textContent = `${Math.round(totalM3h).toLocaleString()} m³/h`;
    if (resLs) resLs.textContent = `~${Math.round(totalLs).toLocaleString()} L/s Flow`;
    if (resSavings) resSavings.textContent = `${recovConfig.energyCutPercent.toFixed(1)}%`;
    if (resOpex) resOpex.textContent = `$${Math.round(annualSavingsDollars).toLocaleString()}`;

    // Graceful backward compatibility if old element IDs are present
    if (resTons) resTons.textContent = `${totalKw.toFixed(1)} kW`;
    if (resCfm) resCfm.textContent = `${Math.round(totalM3h).toLocaleString()} m³/h`;
  }

  calcArea.addEventListener('input', recalculate);
  calcType.addEventListener('change', recalculate);
  calcClimate.addEventListener('change', recalculate);
  calcRecovery.addEventListener('change', recalculate);

  recalculate();
}

/* ==========================================================================
   3. VERIFIED PROJECT CASE STUDY MODAL DEEP DIVES
   ========================================================================== */
const projectData = {
  proj_plancheck: {
    title: "PlanCheck NG — Automated NBC 2006 Floor Plan Compliance",
    subtitle: "AI Builders Global Conference Challenge Winner • SSOJet License Awardee",
    badge: "AI Product Development & Regulatory Tech",
    stats: [
      { label: "Building Code", val: "NBC 2006 (15 Rules)" },
      { label: "Audit Outputs", val: "Pass / Violation / Unknown" },
      { label: "Target Layouts", val: "2–3 Bedroom Plans" },
      { label: "Distinction", val: "SSOJet License Award" }
    ],
    problem: "Manual architectural floor plan reviews against the National Building Code of Nigeria (2006) are tedious, inconsistent, and often delay municipal planning approvals. Overlooked regulatory violations result in post-construction demolition risks, poor natural cross-ventilation, and costly architectural rework.",
    solution: "Engineered PlanCheck NG, an AI compliance platform that parses 2–3 bedroom residential floor plans and validates them against 15 core NBC 2006 provisions (minimum room dimensions, ceiling heights, natural cross-ventilation, window-to-floor ratios, egress clearance, and sanitation zones). Returns deterministic Pass, Violation, or Cannot Determine statuses with exact code clause citations and remediation guidance.",
    deliverables: "Live web application, regulatory clause database, AI prompt validation framework, and automated compliance summary reports. Selected for an SSOJet license during the AI Builders Global Conference challenge.",
    liveUrl: "https://space-analyzer-pro.lovable.app/"
  },
  proj_ai: {
    title: "AI-Driven HVAC & MEP Design Automation",
    subtitle: "Final Year Capstone Research — Obafemi Awolowo University (Team of 2)",
    badge: "AI / LLM & MEP Systems Innovation",
    stats: [
      { label: "Time Savings", val: "60–70% Cut" },
      { label: "Target Profile", val: "1–2 Bed Residential" },
      { label: "Methodology", val: "CLTD / CLF Analysis" },
      { label: "Output", val: "Automated BOQ" }
    ],
    problem: "Manual MEP engineering for residential buildings in Nigeria requires tedious extraction of room geometry, repeated lookup tables, and manual compilation of Bills of Quantities (BOQs)—consuming days of costly engineering time with high human error risk.",
    solution: "Co-architected an end-to-end automated workflow. Led LLM prompt engineering directing automated equipment sizing (compressors, AHUs, refrigerant runs) from environmental inputs. Built a drawing-parsing pipeline converting architectural PDFs/images directly into cooling load inputs tailored to Nigerian building codes.",
    deliverables: "Validated pipeline architecture, benchmarking study against manual Carrier HAP calculation, prompt library, and automated Excel/PDF BOQ generation engine."
  },
  proj_commercial: {
    title: "Commercial Office Building Energy-Efficient HVAC System",
    subtitle: "View Scope Engineering Services Limited — Lagos, Nigeria",
    badge: "Commercial High-Density Infrastructure",
    stats: [
      { label: "Units Modeled", val: "800+ Indoor Units" },
      { label: "System Types", val: "DX & VRV/VRF" },
      { label: "Primary Tools", val: "HAP & Autodesk Revit" },
      { label: "Focus", val: "Energy Optimization" }
    ],
    problem: "A major commercial office facility required an optimized cooling design for 800+ indoor terminals while balancing high ambient Lagos coastal humidity and variable tenant load densities without surging operational electrical demand.",
    solution: "Designed and modeled complete DX and VRV multi-zone systems. Utilized Carrier HAP to simulate hourly thermal shifts, window shading coefficients, and equipment staging. Specified energy-efficient equipment profiles maintaining indoor comfort and air quality.",
    deliverables: "Comprehensive Carrier HAP hourly simulation reports, equipment selection schedules, mechanical duct and piping layout drawings, and stakeholder proposals."
  },
  proj_retrofit: {
    title: "Fast-Track 36 DX Indoor Unit Retrofit & Commissioning",
    subtitle: "View Scope Engineering Services Limited — Lagos, Nigeria",
    badge: "On-Site Supervision & Commissioning",
    stats: [
      { label: "Units Supervised", val: "36 DX Units" },
      { label: "Turnaround", val: "5 Weeks Total" },
      { label: "Configuration", val: "Highwall, Cassette, Concealed" },
      { label: "Startup Faults", val: "0 System Faults" }
    ],
    problem: "A 2-floor commercial tenant required rapid replacement and modernization of their existing cooling infrastructure within an aggressive 5-week timeframe without shutting down core business operations.",
    solution: "Supervised on-site installation, refrigerant pipe brazing, nitrogen pressure testing, and final electrical controls commissioning. Maintained daily contractor coordination and on-site engineering issue resolution to prevent critical path delays.",
    deliverables: "TAB airflow balancing sign-offs, refrigerant charge logs, electrical commissioning certificates, and handover documentation delivered on-time."
  },
  proj_bim: {
    title: "Parametric Revit MEP Family Library & BIM Coordination",
    subtitle: "View Scope Engineering Services Limited — Lagos, Nigeria",
    badge: "BIM Coordination & Digital Workflows",
    stats: [
      { label: "Drafting Speedup", val: "+40% Efficiency" },
      { label: "On-Site Rework", val: "-30% Reduction" },
      { label: "Disciplines", val: "Arch, Struct, Elec, Mech" },
      { label: "Format", val: "Autodesk Revit MEP" }
    ],
    problem: "Redundant manual modeling of standard HVAC equipment and duct transitions across recurring commercial projects led to project delays and frequent on-site clashes with structural beams and cable trays.",
    solution: "Developed an internal standardized library of intelligent parametric Revit MEP families with embedded connector parameters, airflow schedules, and manufacturer geometry. Spearheaded multidisciplinary coordination meetings to resolve clashes before physical installation.",
    deliverables: "Standardized Revit project templates, shared parameter files, clash detection reports, and multidisciplinary coordination guidelines."
  },
  proj_slicer: {
    title: "Rotary Plantain Slicing Machine Design & Fabrication",
    subtitle: "Central Technological and Laboratory Workshops — Ile-Ife, Nigeria",
    badge: "Machine Design & Workshop Fabrication",
    stats: [
      { label: "Assembly Speed", val: "40% Faster" },
      { label: "Operation", val: "High-Throughput Rotary" },
      { label: "Machining", val: "Lathe, Milling & MIG" },
      { label: "Capacity", val: "Commercial Agro" }
    ],
    problem: "Traditional manual slicing in food processing was labor-intensive, nonuniform, and created severe bottlenecks for local commercial agro-processing enterprises.",
    solution: "Contributed to the mechanical design, parts machining, shaft alignment, and chassis welding of an automated plantain slicing machine. Optimized blade angle and feeding chute geometry to ensure consistent slice thickness while operating safely.",
    deliverables: "Fabricated operational prototype, mechanical assembly drawings in SolidWorks, workshop fabrication process sheet, and operator safety manuals."
  },
  proj_belt: {
    title: "Belt Drive Geometry Optimization & Powertrain Servicing",
    subtitle: "Division of Works and Maintenance Service — Ile-Ife, Nigeria",
    badge: "Mechanical Diagnostics & Powertrain",
    stats: [
      { label: "Belt Slippage", val: "-25% Reduction" },
      { label: "Recurring Faults", val: "-60% Cut" },
      { label: "Systems Serviced", val: "5+ Commercial HVAC & Autos" },
      { label: "Focus", val: "Preventive Maintenance" }
    ],
    problem: "Excessive mechanical transmission slippage and recurring powertrain failures across institutional equipment caused frequent operational downtime and high spare-parts replacement costs.",
    solution: "Re-engineered belt wrap angles, pulley alignment, and proper tensioning protocols. Performed comprehensive engine, clutch, and brake overhauls with systematic cooling load and airflow diagnostics to eliminate recurring thermal and mechanical stresses.",
    deliverables: "Preventive maintenance schedules, mechanical diagnostic inspection reports, and pulley alignment guidelines."
  }
};

window.openProjectModal = function(projId) {
  const data = projectData[projId];
  if (!data) return;

  const modal = document.getElementById('projectModal');
  const container = document.getElementById('projectModalContent');

  let statsHtml = data.stats.map(s => `
    <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
      <div class="text-[10px] font-mono text-slate-400 uppercase">${s.label}</div>
      <div class="font-mono text-base font-bold text-amber-400 mt-0.5">${s.val}</div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="space-y-1">
      <div class="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">${data.badge}</div>
      <h3 class="text-2xl font-extrabold text-white">${data.title}</h3>
      <p class="text-xs font-mono text-slate-400">${data.subtitle}</p>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
      ${statsHtml}
    </div>

    <div class="space-y-3 pt-2 text-sm text-slate-300">
      <div>
        <div class="font-mono text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <i class="fa-solid fa-triangle-exclamation text-amber-400"></i> The Engineering Challenge
        </div>
        <p class="text-slate-400 text-xs sm:text-sm leading-relaxed">${data.problem}</p>
      </div>

      <div>
        <div class="font-mono text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <i class="fa-solid fa-wrench text-cyan-400"></i> Technical Implementation
        </div>
        <p class="text-slate-400 text-xs sm:text-sm leading-relaxed">${data.solution}</p>
      </div>

      <div class="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
        <div class="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Delivered Documentation & Impact</div>
        <p class="text-slate-400 text-xs font-mono leading-relaxed">${data.deliverables}</p>
      </div>
    </div>

    <div class="pt-3 border-t border-slate-800 flex flex-wrap justify-end gap-3">
      ${data.liveUrl ? `
        <a href="${data.liveUrl}" target="_blank" rel="noopener noreferrer" class="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs font-mono transition-colors flex items-center gap-2">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Launch Live App &rarr;
        </a>
      ` : ''}
      <a href="#contact" onclick="closeProjectModal()" class="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs font-mono transition-colors">
        Inquire About Similar Engineering Scope &rarr;
      </a>
    </div>
  `;

  modal.classList.remove('hidden');
};

window.closeProjectModal = function() {
  const modal = document.getElementById('projectModal');
  if (modal) modal.classList.add('hidden');
};

window.addEventListener('click', (e) => {
  const pModal = document.getElementById('projectModal');
  const rModal = document.getElementById('resumeModal');
  if (e.target === pModal) closeProjectModal();
  if (e.target === rModal) closeResumeModal();
});

/* ==========================================================================
   4. PROJECT FILTERING LOGIC
   ========================================================================== */
function initProjectFilters() {
  const buttons = document.querySelectorAll('#projectFilters .filter-btn');
  const cards = document.querySelectorAll('.project-card');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('active', 'bg-amber-400', 'text-slate-950', 'font-bold');
        b.classList.add('bg-slate-800', 'text-slate-300');
      });

      btn.classList.add('active', 'bg-amber-400', 'text-slate-950', 'font-bold');
      btn.classList.remove('bg-slate-800', 'text-slate-300');

      const filter = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   5. RESUME MODAL & DOWNLOAD
   ========================================================================== */
window.downloadResumeModal = function() {
  const modal = document.getElementById('resumeModal');
  if (modal) modal.classList.remove('hidden');
};

window.closeResumeModal = function() {
  const modal = document.getElementById('resumeModal');
  if (modal) modal.classList.add('hidden');
};

window.simulateResumeDownload = function() {
  const resumeUrl = 'Zacchaeus_Adedeji_Resume.pdf';
  const link = document.createElement('a');
  link.href = resumeUrl;
  link.download = 'Zacchaeus_Adedeji_GMNSE_Mechanical_HVAC_Resume.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  closeResumeModal();
};

/* ==========================================================================
   6. FORM SUBMISSION HANDLER (Dual Delivery: Email API + WhatsApp Fallback)
   ========================================================================== */
window.handleFormSubmit = async function(e) {
  e.preventDefault();
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const successMsg = document.getElementById('formSuccessMessage');

  const name = document.getElementById('formName')?.value.trim() || 'Client';
  const email = document.getElementById('formEmail')?.value.trim() || '';
  const service = document.getElementById('formService')?.value || 'Engineering Inquiry';
  const timeline = document.getElementById('formTimeline')?.value || 'Immediate';
  const message = document.getElementById('formMessage')?.value.trim() || '';

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Transmitting your inquiry...`;
  }

  const actionUrl = form ? form.getAttribute('action') : null;

  // 1. If an action endpoint is configured (e.g. Formspree or Web3Forms), send as valid JSON
  if (actionUrl && actionUrl.trim() !== '' && actionUrl.startsWith('http')) {
    try {
      const payload = {
        name: name,
        email: email,
        service: service,
        timeline: timeline,
        message: message,
        _subject: `New Engineering Inquiry from ${name}`
      };

      const response = await fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (submitBtn) submitBtn.classList.add('hidden');
        if (successMsg) {
          successMsg.innerHTML = `
            <i class="fa-solid fa-circle-check text-emerald-400 text-base mb-1 block"></i>
            <span>Thank you, <strong>${name}</strong>! Your inquiry has been sent directly to Zacchaeus's email. He will respond within 24 hours.</span>
          `;
          successMsg.classList.remove('hidden');
        }
        form.reset();
        return;
      }
    } catch (err) {
      console.warn('API submission failed, falling back to WhatsApp:', err);
    }
  }

  // 2. Direct WhatsApp Delivery
  const waText = `*New Engineering Inquiry via Portfolio*\n\n` +
    `*From:* ${name}\n` +
    `*Email:* ${email}\n` +
    `*Scope:* ${service}\n` +
    `*Timeline:* ${timeline}\n` +
    `*Details:*\n${message}`;

  const waUrl = `https://wa.me/2349074699233?text=${encodeURIComponent(waText)}`;

  setTimeout(() => {
    window.open(waUrl, '_blank');

    if (submitBtn) {
      submitBtn.classList.add('hidden');
    }
    if (successMsg) {
      successMsg.innerHTML = `
        <i class="fa-solid fa-circle-check text-emerald-400 text-base mb-1 block"></i>
        <span>Thank you, <strong>${name}</strong>! Your inquiry is being sent directly to Zacchaeus on WhatsApp. You can also reach him at <a href="mailto:adedejizacchaeus@gmail.com" class="underline text-amber-400 font-bold">adedejizacchaeus@gmail.com</a>.</span>
      `;
      successMsg.classList.remove('hidden');
    }
  }, 400);
};
