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
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatKm(km) {
    if (km == null) return "—";
    return Number(km).toLocaleString("es-MX") + " km";
  }

  function formatCosto(costo) {
    if (costo == null || costo === "") return "";
    return Number(costo).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  }

  function daysUntil(iso) {
    if (!iso) return null;
    const target = new Date(iso + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  }

  function renderEmpty(title, msg) {
    contentEl.innerHTML = `
      <div class="center-box">
        <h2>${esc(title)}</h2>
        <p>${esc(msg)}</p>
      </div>`;
  }

  function renderAttachments(s) {
    const fotos = s.fotos || [];
    const docs = s.documentos || [];
    if (!fotos.length && !docs.length) return "";

    let html = "";
    if (fotos.length) {
      const group = JSON.stringify(fotos).replace(/"/g, "&quot;");
      html += `<div class="attach-gallery">` + fotos.map((path, i) => `
        <div class="attach-thumb" data-lightbox-group="${group}" data-lightbox-index="${i}">
          <img src="${esc(path)}" alt="Foto del servicio" loading="lazy">
        </div>
      `).join("") + `</div>`;
    }
    if (docs.length) {
      html += docs.map((path) => {
        const name = decodeURIComponent(path.split("/").pop());
        return `<a class="doc-chip" href="${esc(path)}" target="_blank" rel="noopener">📄 ${esc(name)}</a>`;
      }).join("");
    }
    return html;
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
    lightboxImg.src = lightboxPhotos[lightboxIndex];
    const multi = lightboxPhotos.length > 1;
    document.getElementById("lightbox-prev").style.display = multi ? "flex" : "none";
    document.getElementById("lightbox-next").style.display = multi ? "flex" : "none";
    lightboxCounter.style.display = multi ? "block" : "none";
    lightboxCounter.textContent = `${lightboxIndex + 1} / ${lightboxPhotos.length}`;
  }

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
    const thumb = e.target.closest("[data-lightbox-group]");
    if (!thumb) return;
    const photos = JSON.parse(thumb.dataset.lightboxGroup.replace(/&quot;/g, '"'));
    openLightbox(photos, Number(thumb.dataset.lightboxIndex));
  });

  const ESTADOS = {
    recibido: { label: "Recibido", corto: "Recién llegado" },
    en_proceso: { label: "En proceso", corto: "En proceso" },
    listo: { label: "Listo para recoger", corto: "Listo" },
    finalizado: { label: "Finalizado", corto: "Finalizado" },
  };
  const ORDEN_ESTADOS = ["recibido", "en_proceso", "listo", "finalizado"];

  function renderStepper(estadoValor) {
    const current = ORDEN_ESTADOS.includes(estadoValor) ? estadoValor : "recibido";
    const currentIdx = ORDEN_ESTADOS.indexOf(current);
    let html = `<div class="status-stepper">`;
    ORDEN_ESTADOS.forEach((key, i) => {
      const cls = i < currentIdx ? "done" : (i === currentIdx ? "current" : "");
      html += `
        <div class="status-step ${cls}">
          <div class="status-step-dot">${i < currentIdx ? "✓" : i + 1}</div>
          <div class="status-step-label">${esc(ESTADOS[key].corto)}</div>
        </div>`;
      if (i < ORDEN_ESTADOS.length - 1) {
        html += `<div class="status-step-line ${i < currentIdx ? "done" : ""}"></div>`;
      }
    });
    html += `</div>`;
    return html;
  }

  function renderVehicle(v, taller) {
    const servicios = (v.servicios || []).slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    const ultimo = servicios[0];
    const ficha = v.ficha_tecnica || {};
    const prox = v.proximo_servicio;

    let proximoAlertHtml = "";
    if (prox && prox.fecha_estimada) {
      const dias = daysUntil(prox.fecha_estimada);
      if (dias !== null && dias <= 30) {
        const cuando = dias < 0 ? "Vencido" : dias === 0 ? "Hoy" : `En ${dias} días`;
        proximoAlertHtml = `
          <div class="alert">
            <span>⚠️</span>
            <span><strong>${cuando}:</strong> ${esc(prox.descripcion)} (${formatFecha(prox.fecha_estimada)}${prox.km_estimado ? ", ~" + formatKm(prox.km_estimado) : ""})</span>
          </div>`;
      }
    }

    let timelineHtml = "";
    if (servicios.length) {
      timelineHtml = `<ul class="timeline">` + servicios.map((s, i) => `
        <li class="timeline-item ${i === 0 ? "latest" : ""}">
          <div class="timeline-date">${formatFecha(s.fecha)}</div>
          <div class="timeline-title">${esc(s.tipo)}${i === 0 ? '<span class="badge-latest">Más reciente</span>' : ""}</div>
          <div class="timeline-desc">${esc(s.descripcion || "")}</div>
          <div class="timeline-meta">${formatKm(s.km)}${s.tecnico ? " · " + esc(s.tecnico) : ""}${formatCosto(s.costo) ? " · " + esc(formatCosto(s.costo)) : ""}</div>
          ${renderAttachments(s)}
        </li>`).join("") + `</ul>`;
    } else {
      timelineHtml = `<p style="color:var(--text-faint);font-size:13px;">Aún no hay servicios registrados.</p>`;
    }

    const estadoValor = (v.estado && v.estado.valor) || "recibido";
    const estadoInfo = ESTADOS[estadoValor] || ESTADOS.recibido;

    const waNum = (taller.whatsapp || "").replace(/\D/g, "");
    const waHref = waNum
      ? `https://wa.me/${waNum}?text=${encodeURIComponent("Hola, tengo una duda sobre mi vehículo " + (v.placas || ""))}`
      : null;

    contentEl.innerHTML = `
      <div class="ticket">
        <div class="ticket-head">
          <div>
            <span class="plate">${esc(v.placas || "SIN PLACA")}</span>
            <div class="vehicle-title">${esc(v.marca)} ${esc(v.modelo)}</div>
            <div class="vehicle-sub">${esc(v.anio || "")} ${v.version ? "· " + esc(v.version) : ""} ${v.color ? "· " + esc(v.color) : ""}</div>
          </div>
          <span class="status-chip st-${esc(estadoValor)}">${esc(estadoInfo.label)}</span>
        </div>
        ${renderStepper(estadoValor)}
        ${v.estado && v.estado.actualizado ? `<div class="status-updated">Actualizado: ${formatFecha(v.estado.actualizado)}</div>` : ""}
        <div class="grid-2" style="margin-top:16px;">
          <div class="field">
            <div class="field-label">Kilometraje actual</div>
            <div class="field-value">${formatKm(v.km_actual)}</div>
          </div>
          <div class="field">
            <div class="field-label">Combustible</div>
            <div class="field-value">${esc(v.combustible || "—")}</div>
          </div>
        </div>
        <div class="vin-row">VIN: ${esc(v.vin || "No registrado")}</div>
      </div>

      ${proximoAlertHtml}

      <div class="card">
        <div class="card-title">Último servicio</div>
        ${ultimo ? `
          <div class="timeline-title" style="margin-bottom:2px;">${esc(ultimo.tipo)}</div>
          <div class="timeline-desc" style="margin-bottom:6px;">${esc(ultimo.descripcion || "")}</div>
          <div class="timeline-meta">${formatFecha(ultimo.fecha)} · ${formatKm(ultimo.km)}${ultimo.tecnico ? " · " + esc(ultimo.tecnico) : ""}${formatCosto(ultimo.costo) ? " · " + esc(formatCosto(ultimo.costo)) : ""}</div>
          ${renderAttachments(ultimo)}
        ` : `<p style="color:var(--text-faint);font-size:13px;">Sin registros aún.</p>`}
      </div>

      <div class="card">
        <div class="card-title">Historial de servicio</div>
        ${timelineHtml}
      </div>

      <div class="card">
        <div class="card-title">Ficha técnica</div>
        <div class="grid-2">
          <div class="field"><div class="field-label">Aceite</div><div class="field-value">${esc(ficha.aceite_tipo || "—")}</div></div>
          <div class="field"><div class="field-label">Capacidad</div><div class="field-value">${esc(ficha.aceite_capacidad || "—")}</div></div>
          <div class="field"><div class="field-label">Presión de llantas</div><div class="field-value">${esc(ficha.presion_llantas || "—")}</div></div>
          <div class="field"><div class="field-label">Batería</div><div class="field-value">${esc(ficha.bateria || "—")}</div></div>
          <div class="field"><div class="field-label">Filtro de aire</div><div class="field-value">${esc(ficha.filtro_aire || "—")}</div></div>
          <div class="field"><div class="field-label">Filtro de aceite</div><div class="field-value">${esc(ficha.filtro_aceite || "—")}</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Contacto del taller</div>
        <p style="color:var(--text-dim);font-size:13px;margin:0 0 12px;">${esc(taller.nombre || "")} · ${esc(taller.direccion || "")}</p>
        <div class="actions-row">
          ${waHref ? `<a class="btn" href="${waHref}" target="_blank" rel="noopener">Escribir por WhatsApp</a>` : ""}
          ${taller.telefono ? `<a class="btn btn-outline" href="tel:${esc(taller.telefono)}">Llamar</a>` : ""}
          ${taller.mapa_url ? `<a class="btn btn-outline" href="${esc(taller.mapa_url)}" target="_blank" rel="noopener">Ver mapa</a>` : ""}
        </div>
      </div>
    `;
  }

  async function init() {
    const id = getVehicleId();

    if (!id) {
      renderEmpty("Sin vehículo especificado", "Esta página se abre a través de la etiqueta NFC colocada en el vehículo.");
      return;
    }

    try {
      const res = await fetch("data/vehicles.json", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar la base de datos");
      const data = await res.json();
      const taller = data.taller || {};
      tallerNombreEl.textContent = taller.nombre || "Taller Mecánico";
      footerEl.textContent = taller.nombre ? `${taller.nombre} · Ficha digital de servicio` : "";

      const vehicle = (data.vehicles || {})[id];
      if (!vehicle) {
        renderEmpty("Vehículo no encontrado", "El identificador de esta etiqueta no coincide con ningún registro. Contacta al taller para verificar.");
        return;
      }
      renderVehicle(vehicle, taller);
    } catch (err) {
      renderEmpty("Error al cargar la información", "Intenta de nuevo más tarde o contacta directamente al taller.");
      console.error(err);
    }
  }

  init();
})();
