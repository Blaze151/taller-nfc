/* ==========================================================
   Página pública del cliente
   Lee ?v=ID (o #ID) de la URL, busca el vehículo en data/vehicles.json
   y renderiza su ficha. No requiere backend ni login.
   ========================================================== */

(function () {
  "use strict";

  const contentEl = document.getElementById("content");
  const footerEl = document.getElementById("footer-note");
  const tallerNombreEl = document.getElementById("taller-nombre");
  const eyebrowEl = document.getElementById("eyebrow-text");

  /* ---------------- Idioma (ES/EN) ---------------- */

  const LANG_KEY = "taller_nfc_lang";
  const STR = {
    es: {
      eyebrow: "Ficha NFC",
      sin_vehiculo_titulo: "Sin vehículo especificado",
      sin_vehiculo_msg: "Esta página se abre a través de la etiqueta NFC colocada en el vehículo.",
      vehiculo_no_encontrado_titulo: "Vehículo no encontrado",
      vehiculo_no_encontrado_msg: "El identificador de esta etiqueta no coincide con ningún registro. Contacta al taller para verificar.",
      error_carga_titulo: "Error al cargar la información",
      error_carga_msg: "Intenta de nuevo más tarde o contacta directamente al taller.",
      taller_generico: "Taller Mecánico",
      ficha_digital_servicio: "Ficha digital de servicio",
      estado_recibido_label: "Recibido", estado_recibido_corto: "Recién llegado",
      estado_en_proceso_label: "En proceso", estado_en_proceso_corto: "En proceso",
      estado_listo_label: "Listo para recoger", estado_listo_corto: "Listo",
      estado_recogido_label: "Entregado", estado_recogido_corto: "Entregado",
      pago_comprobante: "Comprobante de pago",
      pago_no_pagado: "No pagado", pago_pagado: "Pagado", pago_a_deber: "A deber",
      metodo_efectivo: "Efectivo", metodo_transferencia: "Transferencia",
      servicio_en_proceso: "Servicio en proceso",
      actualizado: "Actualizado",
      kilometraje: "Kilometraje",
      tecnico: "Técnico",
      costo: "Costo",
      pago_label: "Pago",
      ultimo_servicio: "Último servicio finalizado",
      sin_registros: "Sin registros aún.",
      historial_servicio: "Historial de servicio",
      aun_no_hay_servicios: "Aún no hay servicios finalizados.",
      mas_reciente: "Más reciente",
      ficha_tecnica: "Ficha técnica",
      aceite: "Aceite", capacidad: "Capacidad", presion_llantas: "Presión de llantas",
      bateria: "Batería", filtro_aire: "Filtro de aire", filtro_aceite: "Filtro de aceite",
      contacto_taller: "Contacto del taller",
      escribir_whatsapp: "Escribir por WhatsApp",
      llamar: "Llamar",
      ver_mapa: "Ver mapa",
      whatsapp_duda_msg: "Hola, tengo una duda sobre mi vehículo ",
      documentos_vehiculo: "Documentos del vehículo",
      en_taller: "En taller",
      kilometraje_actual: "Kilometraje actual",
      combustible: "Combustible",
      combustible_gasolina: "Gasolina",
      combustible_diesel: "Diesel",
      combustible_electrico: "Eléctrico",
      combustible_gas: "Gas",
      sin_placa: "SIN PLACA",
      unidad_prefix: "Unidad",
      orden_pendiente_titulo: "⚠️ Necesitamos que aceptes la hoja de recepción",
      orden_pendiente_intro: "Antes de comenzar el servicio, por favor revisa lo siguiente y confírmanos que estás de acuerdo:",
      orden_trabajo_label: "Trabajo solicitado",
      orden_gasolina_label: "Nivel de gasolina al recibir",
      orden_danos_label: "Notas de daños/observaciones",
      orden_faltantes_label: "Marcado como faltante o dañado",
      orden_sin_novedades: "Sin observaciones adicionales.",
      orden_aceptar_btn: "✅ Acepto, enviar confirmación por WhatsApp",
      orden_aceptada_nota: "✅ Hoja de recepción aceptada",
      orden_recepcion_titulo_corto: "Hoja de recepción",
      orden_fotos_recibido_label: "Fotos al recibir el vehículo",
      antena_item: "Antena", espejo_lateral_item: "Espejo lateral", cristales_item: "Cristales",
      emblema_item: "Emblema", tapon_ruedas_item: "Tapón de ruedas (4)", molduras_completas_item: "Molduras completas",
      tapon_gasolina_item: "Tapón de gasolina",
      gato_item: "Gato", maneral_gato_item: "Maneral de gato", llave_ruedas_item: "Llave de ruedas",
      estuche_herramientas_item: "Estuche de herramientas", triangulo_seguridad_item: "Triángulo de seguridad",
      llanta_refaccion_item: "Llanta de refacción", extinguidor_item: "Extinguidor",
      gasolina_vacio: "Vacío", gasolina_1_4: "1/4", gasolina_1_2: "1/2", gasolina_3_4: "3/4", gasolina_lleno: "Lleno",
      no_registrado: "No registrado",
      cambiar_tema: "Cambiar tema",
    },
    en: {
      eyebrow: "NFC Record",
      sin_vehiculo_titulo: "No vehicle specified",
      sin_vehiculo_msg: "This page opens through the NFC tag placed on the vehicle.",
      vehiculo_no_encontrado_titulo: "Vehicle not found",
      vehiculo_no_encontrado_msg: "This tag's ID doesn't match any record. Contact the shop to verify.",
      error_carga_titulo: "Error loading information",
      error_carga_msg: "Try again later or contact the shop directly.",
      taller_generico: "Auto Repair Shop",
      ficha_digital_servicio: "Digital service record",
      estado_recibido_label: "Received", estado_recibido_corto: "Just arrived",
      estado_en_proceso_label: "In progress", estado_en_proceso_corto: "In progress",
      estado_listo_label: "Ready for pickup", estado_listo_corto: "Ready",
      estado_recogido_label: "Delivered", estado_recogido_corto: "Delivered",
      pago_comprobante: "Payment receipt",
      pago_no_pagado: "Not paid", pago_pagado: "Paid", pago_a_deber: "Balance due",
      metodo_efectivo: "Cash", metodo_transferencia: "Bank transfer",
      servicio_en_proceso: "Service in progress",
      actualizado: "Updated",
      kilometraje: "Mileage",
      tecnico: "Technician",
      costo: "Cost",
      pago_label: "Payment",
      ultimo_servicio: "Last completed service",
      sin_registros: "No records yet.",
      historial_servicio: "Service history",
      aun_no_hay_servicios: "No completed services yet.",
      mas_reciente: "Most recent",
      ficha_tecnica: "Technical specs",
      aceite: "Oil", capacidad: "Capacity", presion_llantas: "Tire pressure",
      bateria: "Battery", filtro_aire: "Air filter", filtro_aceite: "Oil filter",
      contacto_taller: "Shop contact",
      escribir_whatsapp: "Message on WhatsApp",
      llamar: "Call",
      ver_mapa: "View map",
      whatsapp_duda_msg: "Hi, I have a question about my vehicle ",
      documentos_vehiculo: "Vehicle documents",
      en_taller: "At the shop",
      kilometraje_actual: "Current mileage",
      combustible: "Fuel",
      combustible_gasolina: "Gasoline",
      combustible_diesel: "Diesel",
      combustible_electrico: "Electric",
      combustible_gas: "Gas",
      sin_placa: "NO PLATE",
      unidad_prefix: "Unit",
      orden_pendiente_titulo: "⚠️ We need you to accept the reception checklist",
      orden_pendiente_intro: "Before we start the service, please review the following and confirm you agree:",
      orden_trabajo_label: "Requested work",
      orden_gasolina_label: "Fuel level at reception",
      orden_danos_label: "Damage notes / remarks",
      orden_faltantes_label: "Marked as missing or damaged",
      orden_sin_novedades: "No additional remarks.",
      orden_aceptar_btn: "✅ I accept, send confirmation via WhatsApp",
      orden_aceptada_nota: "✅ Reception checklist accepted",
      orden_recepcion_titulo_corto: "Reception checklist",
      orden_fotos_recibido_label: "Photos at drop-off",
      antena_item: "Antenna", espejo_lateral_item: "Side mirror", cristales_item: "Windows",
      emblema_item: "Emblem", tapon_ruedas_item: "Wheel caps (4)", molduras_completas_item: "Trim complete",
      tapon_gasolina_item: "Fuel cap",
      gato_item: "Jack", maneral_gato_item: "Jack handle", llave_ruedas_item: "Lug wrench",
      estuche_herramientas_item: "Tool kit", triangulo_seguridad_item: "Warning triangle",
      llanta_refaccion_item: "Spare tire", extinguidor_item: "Fire extinguisher",
      gasolina_vacio: "Empty", gasolina_1_4: "1/4", gasolina_1_2: "1/2", gasolina_3_4: "3/4", gasolina_lleno: "Full",
      no_registrado: "Not registered",
      cambiar_tema: "Toggle theme",
    },
  };

  let currentLang = "es";
  try { currentLang = localStorage.getItem(LANG_KEY) || "es"; } catch (e) {}

  function t(key) {
    return (STR[currentLang] && STR[currentLang][key]) || STR.es[key] || key;
  }

  function dateLocale() { return currentLang === "en" ? "en-US" : "es-MX"; }

  const COMBUSTIBLE_KEYS = { Gasolina: "combustible_gasolina", Diesel: "combustible_diesel", "Eléctrico": "combustible_electrico", Gas: "combustible_gas" };
  function combustibleLabel(val) {
    if (!val) return "—";
    const key = COMBUSTIBLE_KEYS[val];
    return key ? t(key) : val; // valores antiguos en texto libre se muestran tal cual
  }

  // Apuntar directo al contenido crudo del repositorio (en vez de la ruta publicada
  // por GitHub Pages) para que las fotos recién subidas aparezcan casi al instante:
  // GitHub Pages publica el sitio completo (con retraso), mientras que este contenido
  // crudo refleja el repositorio apenas se guarda el commit.
  const REPO_OWNER = "Blaze151", REPO_NAME = "taller-nfc", REPO_BRANCH = "main";
  function rawUrl(path) {
    if (!path) return "";
    return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${path}`;
  }

  // GitHub Pages a veces sirve un 404 en caché para un archivo recién subido
  // (mientras su CDN termina de publicarlo), y ese error puede quedar "atorado"
  // varios minutos en un dispositivo concreto. Reintentamos con pausas cada vez
  // más largas durante varios minutos antes de rendirnos definitivamente.
  const IMG_RETRY_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];
  window.__imgRetry = function (el) {
    const n = Number(el.dataset.retryN) || 0;
    if (n >= IMG_RETRY_DELAYS.length) {
      const fallback = document.createElement("div");
      fallback.className = "img-fallback";
      fallback.textContent = "🚗";
      if (el.parentElement) el.parentElement.classList.remove("img-retrying");
      el.replaceWith(fallback);
      return;
    }
    el.dataset.retryN = String(n + 1);
    if (el.parentElement) el.parentElement.classList.add("img-retrying");
    const base = el.dataset.baseSrc || el.src.split("?")[0];
    el.dataset.baseSrc = base;
    setTimeout(() => { el.src = base + "?r=" + n + "-" + Date.now(); }, IMG_RETRY_DELAYS[n]);
  };
  window.__imgLoaded = function (el) {
    if (el.parentElement) el.parentElement.classList.remove("img-retrying");
  };

  // Datos del último render, para poder re-pintar la ficha al cambiar de idioma
  let lastRender = null; // { type: "vehicle", vehicle, taller } | { type: "empty", key: "sin_vehiculo" | "no_encontrado" | "error" }

  function applyStaticTranslations() {
    if (eyebrowEl) eyebrowEl.textContent = t("eyebrow");
    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === currentLang);
    });
    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) themeBtn.title = t("cambiar_tema");
  }

  function setLang(lang) {
    if (lang !== "es" && lang !== "en") return;
    currentLang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    applyStaticTranslations();
    rerender();
  }

  function rerender() {
    if (!lastRender) return;
    if (lastRender.type === "vehicle") {
      renderVehicle(lastRender.vehicle, lastRender.taller);
    } else {
      const map = {
        sin_vehiculo: ["sin_vehiculo_titulo", "sin_vehiculo_msg"],
        no_encontrado: ["vehiculo_no_encontrado_titulo", "vehiculo_no_encontrado_msg"],
        error: ["error_carga_titulo", "error_carga_msg"],
      };
      const [tk, mk] = map[lastRender.key];
      renderEmpty(t(tk), t(mk), false);
    }
  }

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });

  /* ---------------- Tema claro/oscuro ---------------- */

  const THEME_KEY = "taller_nfc_theme";

  function updateThemeIcon() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    btn.textContent = isLight ? "☀️" : "🌙";
  }

  function toggleTheme() {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) {
      document.documentElement.removeAttribute("data-theme");
      try { localStorage.setItem(THEME_KEY, "dark"); } catch (e) {}
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      try { localStorage.setItem(THEME_KEY, "light"); } catch (e) {}
    }
    updateThemeIcon();
  }

  const themeToggleBtn = document.getElementById("theme-toggle");
  if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);
  updateThemeIcon();
  applyStaticTranslations();

  /* ---------------- Utilidades ---------------- */

  function getVehicleId() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("v")) return params.get("v").trim();
    if (window.location.hash) return decodeURIComponent(window.location.hash.slice(1)).trim();
    return null;
  }

  function esc(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function formatFecha(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString(dateLocale(), { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatKm(km) {
    if (km == null) return "—";
    return Number(km).toLocaleString(dateLocale()) + " km";
  }

  function formatCosto(costo) {
    if (costo == null || costo === "") return "";
    return Number(costo).toLocaleString(dateLocale(), { style: "currency", currency: "MXN" });
  }

  function renderEmpty(title, msg, remember) {
    contentEl.innerHTML = `
      <div class="center-box">
        <h2>${esc(title)}</h2>
        <p>${esc(msg)}</p>
      </div>`;
    if (remember !== false) lastRender = { type: "empty", key: remember };
  }

  /* ---------------- Galería de fotos + documentos ---------------- */

  function renderAttachmentsGroup(fotos, docs) {
    fotos = fotos || [];
    docs = docs || [];
    if (!fotos.length && !docs.length) return "";

    let html = "";
    if (fotos.length) {
      const group = JSON.stringify(fotos.map(rawUrl)).replace(/"/g, "&quot;");
      html += `<div class="attach-gallery">` + fotos.map((path, i) => `
        <div class="attach-thumb" data-lightbox-group="${group}" data-lightbox-index="${i}">
          <img src="${esc(rawUrl(path))}" alt="Foto del servicio" loading="lazy" onerror="__imgRetry(this)" onload="__imgLoaded(this)">
        </div>
      `).join("") + `</div>`;
    }
    if (docs.length) {
      html += docs.map((path) => {
        const name = decodeURIComponent(path.split("/").pop());
        return `<a class="doc-chip" href="${esc(rawUrl(path))}" target="_blank" rel="noopener">📄 ${esc(name)}</a>`;
      }).join("");
    }
    return html;
  }

  function renderAttachments(s) {
    return renderAttachmentsGroup(s.fotos, s.documentos);
  }

  /* ---------------- Lightbox ---------------- */

  const lightboxEl = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCounter = document.getElementById("lightbox-counter");
  let lightboxPhotos = [];
  let lightboxIndex = 0;

  function openLightbox(photos, index) {
    lightboxPhotos = photos;
    lightboxIndex = index;
    updateLightbox();
    lightboxEl.classList.remove("hidden");
  }

  function updateLightbox() {
    delete lightboxImg.dataset.retryN;
    delete lightboxImg.dataset.baseSrc;
    lightboxEl.classList.remove("img-retrying");
    lightboxImg.src = lightboxPhotos[lightboxIndex];
    const multi = lightboxPhotos.length > 1;
    document.getElementById("lightbox-prev").style.display = multi ? "flex" : "none";
    document.getElementById("lightbox-next").style.display = multi ? "flex" : "none";
    lightboxCounter.style.display = multi ? "block" : "none";
    lightboxCounter.textContent = `${lightboxIndex + 1} / ${lightboxPhotos.length}`;
  }
  lightboxImg.addEventListener("error", () => {
    const n = Number(lightboxImg.dataset.retryN) || 0;
    if (n >= IMG_RETRY_DELAYS.length) return;
    lightboxImg.dataset.retryN = String(n + 1);
    lightboxEl.classList.add("img-retrying");
    const base = lightboxImg.dataset.baseSrc || lightboxImg.src.split("?")[0];
    lightboxImg.dataset.baseSrc = base;
    setTimeout(() => { lightboxImg.src = base + "?r=" + n + "-" + Date.now(); }, IMG_RETRY_DELAYS[n]);
  });
  lightboxImg.addEventListener("load", () => { lightboxEl.classList.remove("img-retrying"); });

  function closeLightbox() {
    lightboxEl.classList.add("hidden");
    lightboxImg.src = "";
  }

  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  document.getElementById("lightbox-prev").addEventListener("click", () => {
    lightboxIndex = (lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length;
    updateLightbox();
  });
  document.getElementById("lightbox-next").addEventListener("click", () => {
    lightboxIndex = (lightboxIndex + 1) % lightboxPhotos.length;
    updateLightbox();
  });
  lightboxEl.addEventListener("click", (e) => {
    if (e.target === lightboxEl) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (lightboxEl.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") document.getElementById("lightbox-prev").click();
    if (e.key === "ArrowRight") document.getElementById("lightbox-next").click();
  });
  contentEl.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    const thumb = e.target.closest("[data-lightbox-group]");
    if (!thumb) return;
    const photos = JSON.parse(thumb.dataset.lightboxGroup.replace(/&quot;/g, '"'));
    openLightbox(photos, Number(thumb.dataset.lightboxIndex));
  });

  /* ---------------- Estado del servicio en proceso ---------------- */

  const APP_VERSION = "1.0.0";

  function ESTADOS_SERVICIO() {
    return {
      recibido: { label: t("estado_recibido_label"), corto: t("estado_recibido_corto"), icon: "📥" },
      en_proceso: { label: t("estado_en_proceso_label"), corto: t("estado_en_proceso_corto"), icon: "🔧" },
      listo: { label: t("estado_listo_label"), corto: t("estado_listo_corto"), icon: "✅" },
      recogido: { label: t("estado_recogido_label"), corto: t("estado_recogido_corto"), icon: "🚗" },
    };
  }
  const ORDEN_ESTADOS_SERVICIO = ["recibido", "en_proceso", "listo", "recogido"];

  function PAGO_INFO() { return { icon: "💳", label: t("pago_comprobante") }; }
  function PAGO_ESTADOS() {
    return {
      no_pagado: { label: t("pago_no_pagado"), icon: "🕓" },
      pagado: { label: t("pago_pagado"), icon: "✅" },
      a_deber: { label: t("pago_a_deber"), icon: "⚠️" },
    };
  }
  const ATTACH_STAGES = [...ORDEN_ESTADOS_SERVICIO, "pago"];

  function metodoPagoLabel(metodo) {
    if (metodo === "efectivo") return t("metodo_efectivo");
    if (metodo === "transferencia") return t("metodo_transferencia");
    return "";
  }

  function formatPagoInline(s) {
    if (!s.pago) return "";
    const info = PAGO_ESTADOS()[s.pago.estado];
    if (!info) return "";
    return ` · ${info.icon} ${info.label}${s.pago.metodo ? " (" + metodoPagoLabel(s.pago.metodo) + ")" : ""}`;
  }

  function renderStepper(estadoValor) {
    const estados = ESTADOS_SERVICIO();
    const current = ORDEN_ESTADOS_SERVICIO.includes(estadoValor) ? estadoValor : "recibido";
    const currentIdx = ORDEN_ESTADOS_SERVICIO.indexOf(current);
    let html = `<div class="status-stepper">`;
    ORDEN_ESTADOS_SERVICIO.forEach((key, i) => {
      const cls = i < currentIdx ? "done" : (i === currentIdx ? "current" : "");
      html += `
        <div class="status-step ${cls}">
          <div class="status-step-dot">${i < currentIdx ? "✓" : i + 1}</div>
          <div class="status-step-label">${esc(estados[key].corto)}</div>
        </div>`;
      if (i < ORDEN_ESTADOS_SERVICIO.length - 1) {
        html += `<div class="status-step-line ${i < currentIdx ? "done" : ""}"></div>`;
      }
    });
    html += `</div>`;
    return html;
  }

  function renderStageSection(activo, stage) {
    const g = (activo.adjuntos && activo.adjuntos[stage]) || { fotos: [], documentos: [] };
    const attachHtml = renderAttachmentsGroup(g.fotos, g.documentos);
    if (!attachHtml) return "";
    const info = ESTADOS_SERVICIO()[stage] || PAGO_INFO();
    const count = (g.fotos || []).length + (g.documentos || []).length;
    return `
      <details class="doc-dropdown" style="margin-top:12px;">
        <summary>${info.icon} ${esc(info.label)} (${count})</summary>
        <div class="doc-dropdown-body">${attachHtml}</div>
      </details>`;
  }

  // Adjuntos de un servicio (activo o del historial): si tiene "adjuntos" por
  // etapa, se muestran divididos; si es un registro antiguo sin esa
  // estructura, se muestra como galería única (compatibilidad).
  function renderServiceAttachments(service) {
    if (service.adjuntos) {
      return ATTACH_STAGES.map((stage) => renderStageSection(service, stage)).join("");
    }
    return renderAttachments(service);
  }

  const INV_LABELS_EXT = { antena: "antena_item", espejo_lateral: "espejo_lateral_item", cristales: "cristales_item", emblema: "emblema_item", tapon_ruedas: "tapon_ruedas_item", molduras_completas: "molduras_completas_item", tapon_gasolina: "tapon_gasolina_item" };
  const INV_LABELS_ACC = { gato: "gato_item", maneral_gato: "maneral_gato_item", llave_ruedas: "llave_ruedas_item", estuche_herramientas: "estuche_herramientas_item", triangulo_seguridad: "triangulo_seguridad_item", llanta_refaccion: "llanta_refaccion_item", extinguidor: "extinguidor_item" };
  const GAS_KEYS = { "vacio": "gasolina_vacio", "1/4": "gasolina_1_4", "1/2": "gasolina_1_2", "3/4": "gasolina_3_4", "lleno": "gasolina_lleno" };

  function fuelPct(gasolina) {
    if (typeof gasolina === "number") return Math.max(0, Math.min(100, gasolina));
    if (typeof gasolina === "string" && GAS_KEYS[gasolina]) {
      return { vacio: 0, "1/4": 25, "1/2": 50, "3/4": 75, lleno: 100 }[gasolina];
    }
    return null;
  }
  function fuelColor(pct) {
    if (pct <= 25) return "#b3504f";
    if (pct <= 74) return "#c99a1f";
    return "var(--green-bright)";
  }
  function renderFuelBarReadonly(gasolina) {
    const pct = fuelPct(gasolina);
    if (pct === null) return "";
    return `
      <div class="fuel-gauge">
        <div class="fuel-track" style="cursor:default;">
          <div class="fuel-fill" style="width:${pct}%;background:${fuelColor(pct)};"></div>
        </div>
        <div class="fuel-value-label">${pct}%</div>
      </div>`;
  }

  function renderOrdenRecepcionResumen(or, adjuntosRecibido) {
    if (!or) return "";
    const inv = or.inventario || {};
    const faltantes = [];
    Object.entries(INV_LABELS_EXT).forEach(([k, lk]) => { if (inv.exteriores && inv.exteriores[k] === "no") faltantes.push(t(lk)); });
    Object.entries(INV_LABELS_ACC).forEach(([k, lk]) => { if (inv.accesorios && inv.accesorios[k] === "no") faltantes.push(t(lk)); });
    const fotos = (adjuntosRecibido && adjuntosRecibido.fotos) || [];
    const docs = (adjuntosRecibido && adjuntosRecibido.documentos) || [];
    const hayContenido = inv.gasolina != null || faltantes.length || inv.danos_notas || fotos.length || docs.length;
    if (!hayContenido && !or.enviado) return "";
    return `
      <details class="doc-dropdown" open>
        <summary>📋 ${esc(t("orden_recepcion_titulo_corto"))}${or.aceptado ? ` <span class="badge-latest" style="margin-left:6px;">${esc(t("orden_aceptada_nota"))}</span>` : ""}</summary>
        <div class="doc-dropdown-body">
          ${inv.gasolina != null ? `<div class="field"><div class="field-label">${esc(t("orden_gasolina_label"))}</div>${renderFuelBarReadonly(inv.gasolina)}</div>` : ""}
          ${faltantes.length ? `<div class="field"><div class="field-label">${esc(t("orden_faltantes_label"))}</div><div class="field-value">${faltantes.map(esc).join(", ")}</div></div>` : ""}
          ${inv.danos_notas ? `<div class="field"><div class="field-label">${esc(t("orden_danos_label"))}</div><div class="field-value">${esc(inv.danos_notas)}</div></div>` : ""}
          ${(fotos.length || docs.length) ? `<div class="field-label" style="margin-top:10px;">${esc(t("orden_fotos_recibido_label"))}</div>${renderAttachmentsGroup(fotos, docs)}` : ""}
        </div>
      </details>`;
  }

  function renderOrdenPendienteBanner(activo, v, taller) {
    if (!activo || !activo.orden_recepcion || !activo.orden_recepcion.enviado || activo.orden_recepcion.aceptado) return "";
    const inv = activo.orden_recepcion.inventario || {};
    const faltantes = [];
    Object.entries(INV_LABELS_EXT).forEach(([k, lk]) => { if (inv.exteriores && inv.exteriores[k] === "no") faltantes.push(t(lk)); });
    Object.entries(INV_LABELS_ACC).forEach(([k, lk]) => { if (inv.accesorios && inv.accesorios[k] === "no") faltantes.push(t(lk)); });

    const waNum = (taller.whatsapp || "").replace(/\D/g, "");
    const msg = `Acepto la hoja de recepción de mi vehículo (placas ${v.placas || ""}).`;
    const waHref = waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}` : null;
    const hayContenido = activo.tipo || inv.gasolina != null || faltantes.length || inv.danos_notas;

    return `
      <div class="orden-pendiente-banner">
        <div class="orden-pendiente-titulo">${esc(t("orden_pendiente_titulo"))}</div>
        <p class="orden-pendiente-intro">${esc(t("orden_pendiente_intro"))}</p>
        ${activo.tipo ? `<div class="field"><div class="field-label">${esc(t("orden_trabajo_label"))}</div><div class="field-value">${esc(activo.tipo)}</div></div>` : ""}
        ${inv.gasolina != null ? `<div class="field"><div class="field-label">${esc(t("orden_gasolina_label"))}</div>${renderFuelBarReadonly(inv.gasolina)}</div>` : ""}
        ${faltantes.length ? `<div class="field"><div class="field-label">${esc(t("orden_faltantes_label"))}</div><div class="field-value">${faltantes.map(esc).join(", ")}</div></div>` : ""}
        ${inv.danos_notas ? `<div class="field"><div class="field-label">${esc(t("orden_danos_label"))}</div><div class="field-value">${esc(inv.danos_notas)}</div></div>` : ""}
        ${!hayContenido ? `<p style="color:var(--text-faint);font-size:12px;margin:0 0 12px;">${esc(t("orden_sin_novedades"))}</p>` : ""}
        ${waHref ? `<a class="btn orden-pendiente-btn" href="${waHref}" target="_blank" rel="noopener">${esc(t("orden_aceptar_btn"))}</a>` : ""}
      </div>`;
  }

  function renderActiveServiceCard(activo) {
    if (!activo) return "";
    const estadoValor = ORDEN_ESTADOS_SERVICIO.includes(activo.estado) ? activo.estado : "recibido";
    const pagoInfo = activo.pago ? PAGO_ESTADOS()[activo.pago.estado] : null;
    return `
      <div class="card" style="box-shadow: var(--neu-out), 0 0 0 1px rgba(111,190,68,0.35);">
        <div class="card-title">🔧 ${esc(t("servicio_en_proceso"))}</div>
        <div class="timeline-title" style="margin-bottom:2px;">${esc(activo.tipo || "Servicio")}</div>
        ${activo.descripcion ? `<div class="timeline-desc" style="margin-bottom:10px;">${esc(activo.descripcion)}</div>` : `<div style="margin-bottom:10px;"></div>`}
        ${renderStepper(estadoValor)}
        ${activo.actualizado ? `<div class="status-updated">${esc(t("actualizado"))}: ${formatFecha(activo.actualizado)}</div>` : ""}
        ${activo.orden_recepcion && activo.orden_recepcion.aceptado ? `<div class="status-updated" style="color:var(--green-bright);">${esc(t("orden_aceptada_nota"))}${activo.orden_recepcion.fecha_aceptado ? " · " + formatFecha(activo.orden_recepcion.fecha_aceptado) : ""}</div>` : ""}
        <div class="grid-2" style="margin-top:14px;">
          <div class="field"><div class="field-label">${esc(t("kilometraje"))}</div><div class="field-value">${formatKm(activo.km)}</div></div>
          <div class="field"><div class="field-label">${esc(t("tecnico"))}</div><div class="field-value">${esc(activo.tecnico || "—")}</div></div>
          ${formatCosto(activo.costo) ? `<div class="field"><div class="field-label">${esc(t("costo"))}</div><div class="field-value">${esc(formatCosto(activo.costo))}</div></div>` : ""}
          ${pagoInfo ? `<div class="field"><div class="field-label">${esc(t("pago_label"))}</div><div class="field-value">${esc(pagoInfo.icon + " " + pagoInfo.label)}${activo.pago.metodo ? esc(" · " + metodoPagoLabel(activo.pago.metodo)) : ""}</div></div>` : ""}
        </div>
        ${renderOrdenRecepcionResumen(activo.orden_recepcion, activo.adjuntos && activo.adjuntos.recibido)}
        ${ATTACH_STAGES.map((stage) => renderStageSection(activo, stage)).join("")}
      </div>`;
  }

  function renderVehicle(v, taller) {
    lastRender = { type: "vehicle", vehicle: v, taller: taller };

    const servicios = (v.servicios || []).slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    const ultimo = servicios[0];
    const ficha = v.ficha_tecnica || {};
    const activo = v.servicio_actual || null;

    let timelineHtml = "";
    if (servicios.length) {
      timelineHtml = `<ul class="timeline">` + servicios.map((s, i) => `
        <li class="timeline-item ${i === 0 ? "latest" : ""}">
          <div class="timeline-date">${formatFecha(s.fecha)}</div>
          <div class="timeline-title">${esc(s.tipo)}${i === 0 ? `<span class="badge-latest">${esc(t("mas_reciente"))}</span>` : ""}</div>
          <div class="timeline-desc">${esc(s.descripcion || "")}</div>
          <div class="timeline-meta">${formatKm(s.km)}${s.tecnico ? " · " + esc(s.tecnico) : ""}${formatCosto(s.costo) ? " · " + esc(formatCosto(s.costo)) : ""}${formatPagoInline(s)}</div>
          ${renderOrdenRecepcionResumen(s.orden_recepcion, s.adjuntos && s.adjuntos.recibido)}
          ${renderServiceAttachments(s)}
        </li>`).join("") + `</ul>`;
    } else {
      timelineHtml = `<p style="color:var(--text-faint);font-size:13px;">${esc(t("aun_no_hay_servicios"))}</p>`;
    }

    const docVeh = v.documentos_vehiculo || { fotos: [], documentos: [] };
    const docVehCount = (docVeh.fotos || []).length + (docVeh.documentos || []).length;
    const docsVehiculoHtml = docVehCount ? `
      <details class="doc-dropdown">
        <summary>📄 ${esc(t("documentos_vehiculo"))} (${docVehCount})</summary>
        <div class="doc-dropdown-body">${renderAttachmentsGroup(docVeh.fotos, docVeh.documentos)}</div>
      </details>` : "";

    const waNum = (taller.whatsapp || "").replace(/\D/g, "");
    const waHref = waNum
      ? `https://wa.me/${waNum}?text=${encodeURIComponent(t("whatsapp_duda_msg") + (v.placas || ""))}`
      : null;

    contentEl.innerHTML = `
      <div class="ticket">
        <div class="ticket-head">
          <div style="display:flex;gap:14px;align-items:flex-start;">
            ${v.foto_perfil ? `
              <div class="vehicle-photo" data-lightbox-group="${JSON.stringify([rawUrl(v.foto_perfil)]).replace(/"/g, "&quot;")}" data-lightbox-index="0">
                <img src="${esc(rawUrl(v.foto_perfil))}" alt="Foto del vehículo" onerror="__imgRetry(this)" onload="__imgLoaded(this)">
              </div>` : `
              <div class="vehicle-photo">
                <div class="vehicle-photo-placeholder">🚗</div>
              </div>`}
            <div>
              <div class="plate-row">
                <span class="plate">${esc(v.placas || t("sin_placa"))}</span>
                ${v.numero_unidad ? `<span class="unit-tag">${esc(t("unidad_prefix"))} ${esc(v.numero_unidad)}</span>` : ""}
              </div>
              <div class="vehicle-title">${esc(v.marca)} ${esc(v.modelo)}</div>
              <div class="vehicle-sub">${esc(v.anio || "")} ${v.version ? "· " + esc(v.version) : ""} ${v.color ? "· " + esc(v.color) : ""}</div>
            </div>
          </div>
          ${activo ? `<span class="status-chip st-${esc(activo.estado)}">🔧 ${esc(t("en_taller"))}</span>` : ""}
        </div>
        <div class="grid-2">
          <div class="field">
            <div class="field-label">${esc(t("kilometraje_actual"))}</div>
            <div class="field-value">${formatKm(v.km_actual)}</div>
          </div>
          <div class="field">
            <div class="field-label">${esc(t("combustible"))}</div>
            <div class="field-value">${esc(combustibleLabel(v.combustible))}</div>
          </div>
        </div>
        <div class="vin-row">VIN: ${esc(v.vin || t("no_registrado"))}</div>
        ${docsVehiculoHtml}
      </div>

      ${renderOrdenPendienteBanner(activo, v, taller)}

      ${renderActiveServiceCard(activo)}

      <div class="card">
        <div class="card-title">${esc(t("ultimo_servicio"))}</div>
        ${ultimo ? `
          <div class="timeline-title" style="margin-bottom:2px;">${esc(ultimo.tipo)}</div>
          <div class="timeline-desc" style="margin-bottom:6px;">${esc(ultimo.descripcion || "")}</div>
          <div class="timeline-meta">${formatFecha(ultimo.fecha)} · ${formatKm(ultimo.km)}${ultimo.tecnico ? " · " + esc(ultimo.tecnico) : ""}${formatCosto(ultimo.costo) ? " · " + esc(formatCosto(ultimo.costo)) : ""}${formatPagoInline(ultimo)}</div>
          ${renderServiceAttachments(ultimo)}
        ` : `<p style="color:var(--text-faint);font-size:13px;">${esc(t("sin_registros"))}</p>`}
      </div>

      <div class="card">
        <div class="card-title">${esc(t("historial_servicio"))}</div>
        ${timelineHtml}
      </div>

      <div class="card">
        <div class="card-title">${esc(t("ficha_tecnica"))}</div>
        <div class="grid-2">
          <div class="field"><div class="field-label">${esc(t("aceite"))}</div><div class="field-value">${esc(ficha.aceite_tipo || "—")}</div></div>
          <div class="field"><div class="field-label">${esc(t("capacidad"))}</div><div class="field-value">${esc(ficha.aceite_capacidad || "—")}</div></div>
          <div class="field"><div class="field-label">${esc(t("presion_llantas"))}</div><div class="field-value">${esc(ficha.presion_llantas || "—")}</div></div>
          <div class="field"><div class="field-label">${esc(t("bateria"))}</div><div class="field-value">${esc(ficha.bateria || "—")}</div></div>
          <div class="field"><div class="field-label">${esc(t("filtro_aire"))}</div><div class="field-value">${esc(ficha.filtro_aire || "—")}</div></div>
          <div class="field"><div class="field-label">${esc(t("filtro_aceite"))}</div><div class="field-value">${esc(ficha.filtro_aceite || "—")}</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">${esc(t("contacto_taller"))}</div>
        <p style="color:var(--text-dim);font-size:13px;margin:0 0 12px;">${esc(taller.nombre || "")} · ${esc(taller.direccion || "")}</p>
        <div class="actions-row">
          ${waHref ? `<a class="btn" href="${waHref}" target="_blank" rel="noopener">${esc(t("escribir_whatsapp"))}</a>` : ""}
          ${taller.telefono ? `<a class="btn btn-outline" href="tel:${esc(taller.telefono)}">${esc(t("llamar"))}</a>` : ""}
          ${taller.mapa_url ? `<a class="btn btn-outline" href="${esc(taller.mapa_url)}" target="_blank" rel="noopener">${esc(t("ver_mapa"))}</a>` : ""}
        </div>
      </div>
    `;
  }

  let cachedData = null;

  async function init() {
    const id = getVehicleId();

    if (!id) {
      renderEmpty(t("sin_vehiculo_titulo"), t("sin_vehiculo_msg"), "sin_vehiculo");
      return;
    }

    try {
      if (!cachedData) {
        const res = await fetch("data/vehicles.json", { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar la base de datos");
        cachedData = await res.json();
      }
      const data = cachedData;
      const taller = data.taller || {};
      tallerNombreEl.textContent = taller.nombre || t("taller_generico");
      footerEl.textContent = taller.nombre ? `${taller.nombre} · ${t("ficha_digital_servicio")} · v${APP_VERSION}` : `v${APP_VERSION}`;

      const vehicle = (data.vehicles || {})[id];
      if (!vehicle) {
        renderEmpty(t("vehiculo_no_encontrado_titulo"), t("vehiculo_no_encontrado_msg"), "no_encontrado");
        return;
      }
      renderVehicle(vehicle, taller);
    } catch (err) {
      renderEmpty(t("error_carga_titulo"), t("error_carga_msg"), "error");
      console.error(err);
    }
  }

  /* ---------------- Botón "Volver arriba" ---------------- */

  const scrollTopBtn = document.getElementById("scroll-top-btn");
  if (scrollTopBtn) {
    window.addEventListener("scroll", () => {
      scrollTopBtn.classList.toggle("visible", window.scrollY > 420);
    });
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  init();
})();
