/* ==========================================================
   Panel de administración
   Usa la API REST de GitHub (Contents API) para leer y escribir
   data/vehicles.json directamente como commits en el repositorio.
   El token vive únicamente en sessionStorage (se borra al cerrar la pestaña).
   ========================================================== */

(function () {
  "use strict";

  const DATA_PATH = "data/vehicles.json";
  const SESSION_KEY = "taller_nfc_admin_session";

  let cfg = null;          // { owner, repo, branch, token }
  let db = null;            // contenido completo de vehicles.json
  let dbSha = null;         // sha del archivo (necesario para actualizar)
  let currentVehicleId = null;
  let pendingServices = []; // servicios agregados en el editor antes de guardar
  let isNewVehicle = false;
  let newServiceFotos = [];      // File[] pendientes de subir para el servicio que se está armando
  let newServiceDocumentos = []; // File[] pendientes de subir para el servicio que se está armando

  const $ = (id) => document.getElementById(id);

  function showToast(msg, type) {
    const el = document.createElement("div");
    el.className = "toast " + (type || "");
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  function showView(name) {
    $("view-login").style.display = name === "login" ? "block" : "none";
    $("view-dashboard").style.display = name === "dashboard" ? "block" : "none";
    $("view-editor").style.display = name === "editor" ? "block" : "none";
    $("btn-logout").style.display = name === "login" ? "none" : "inline-flex";
  }

  /* ---------------- GitHub API helpers ---------------- */

  function apiUrl(path) {
    return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
  }

  async function githubRequest(path, options) {
    const res = await fetch(apiUrl(path), {
      ...options,
      headers: {
        "Authorization": `Bearer ${cfg.token}`,
        "Accept": "application/vnd.github+json",
        ...(options && options.headers ? options.headers : {}),
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Error de GitHub (${res.status})`);
    }
    return res.json();
  }

  function b64EncodeUnicode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function b64DecodeUnicode(str) {
    return decodeURIComponent(escape(atob(str)));
  }

  /* ---------------- Archivos: compresión, codificación y subida ---------------- */

  const MAX_PDF_MB = 8;

  function compressImage(file, maxDim, quality) {
    maxDim = maxDim || 1600;
    quality = quality || 0.75;
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) return reject(new Error("No se pudo procesar la imagen"));
          resolve(blob);
        }, "image/jpeg", quality);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("No se pudo leer la imagen")); };
      img.src = objectUrl;
    });
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function slugifyFilename(name) {
    return name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-");
  }

  function timestampSlug() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  }

  async function uploadBinaryFile(path, base64Content, message) {
    return githubRequest(path, {
      method: "PUT",
      body: JSON.stringify({ message, content: base64Content, branch: cfg.branch }),
    });
  }

  async function uploadPendingAttachments(vehicle) {
    for (const service of vehicle.servicios) {
      const fotos = service._pendingFotos || [];
      const docs = service._pendingDocumentos || [];
      if (!service.fotos) service.fotos = [];
      if (!service.documentos) service.documentos = [];

      for (let i = 0; i < fotos.length; i++) {
        showToast(`Subiendo foto ${i + 1}/${fotos.length}…`);
        const file = fotos[i];
        let blob;
        try { blob = await compressImage(file); } catch { blob = file; }
        const base64 = await blobToBase64(blob);
        const filename = `${timestampSlug()}-${i}-${slugifyFilename(file.name.replace(/\.[^.]+$/, ""))}.jpg`;
        const path = `uploads/${vehicle.id}/${filename}`;
        await uploadBinaryFile(path, base64, `Agregar foto de servicio (${vehicle.placas || vehicle.id})`);
        service.fotos.push(path);
      }

      for (let i = 0; i < docs.length; i++) {
        showToast(`Subiendo documento ${i + 1}/${docs.length}…`);
        const file = docs[i];
        const base64 = await blobToBase64(file);
        const filename = `${timestampSlug()}-${i}-${slugifyFilename(file.name)}`;
        const path = `uploads/${vehicle.id}/${filename}`;
        await uploadBinaryFile(path, base64, `Agregar documento de servicio (${vehicle.placas || vehicle.id})`);
        service.documentos.push(path);
      }

      delete service._pendingFotos;
      delete service._pendingDocumentos;
    }
  }

  async function loadDatabase() {
    const file = await githubRequest(`${DATA_PATH}?ref=${encodeURIComponent(cfg.branch)}`, { method: "GET" });
    dbSha = file.sha;
    const content = b64DecodeUnicode(file.content.replace(/\n/g, ""));
    db = JSON.parse(content);
    if (!db.vehicles) db.vehicles = {};
    if (!db.taller) db.taller = {};
  }

  async function saveDatabase(commitMessage) {
    const content = b64EncodeUnicode(JSON.stringify(db, null, 2));
    const result = await githubRequest(DATA_PATH, {
      method: "PUT",
      body: JSON.stringify({
        message: commitMessage,
        content: content,
        sha: dbSha,
        branch: cfg.branch,
      }),
    });
    dbSha = result.content.sha;
  }

  /* ---------------- Login / sesión ---------------- */

  function restoreSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    try {
      cfg = JSON.parse(raw);
      return !!(cfg.owner && cfg.repo && cfg.token);
    } catch {
      return false;
    }
  }

  async function connect() {
    const owner = $("cfg-owner").value.trim();
    const repo = $("cfg-repo").value.trim();
    const branch = $("cfg-branch").value.trim() || "main";
    const token = $("cfg-token").value.trim();
    const errEl = $("login-error");
    errEl.style.display = "none";

    if (!owner || !repo || !token) {
      errEl.textContent = "Completa usuario, repositorio y token.";
      errEl.style.display = "block";
      return;
    }

    cfg = { owner, repo, branch, token };
    const btn = $("btn-connect");
    btn.disabled = true;
    btn.textContent = "Conectando…";

    try {
      await loadDatabase();
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(cfg));
      renderDashboard();
      showView("dashboard");
    } catch (err) {
      errEl.textContent = "No se pudo conectar: " + err.message;
      errEl.style.display = "block";
    } finally {
      btn.disabled = false;
      btn.textContent = "Conectar";
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    cfg = null;
    db = null;
    showView("login");
  }

  /* ---------------- Dashboard ---------------- */

  function renderDashboard(filter) {
    const list = $("vehicle-list");
    const entries = Object.values(db.vehicles || {});
    const term = (filter || "").toLowerCase();

    const filtered = entries.filter((v) => {
      if (!term) return true;
      return [v.placas, v.marca, v.modelo, v.cliente_nombre, v.id]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(term));
    });

    if (!filtered.length) {
      list.innerHTML = `<p style="color:var(--text-faint);font-size:13px;">No hay vehículos que coincidan.</p>`;
      return;
    }

    list.innerHTML = filtered.map((v) => `
      <div class="vlist-item" data-id="${v.id}">
        <div>
          <div class="vlist-item-title">${v.marca || ""} ${v.modelo || ""} — ${v.placas || "sin placa"}</div>
          <div class="vlist-item-sub">ID: ${v.id} ${v.cliente_nombre ? "· " + v.cliente_nombre : ""}</div>
        </div>
        <span class="tag">${(v.servicios || []).length} servicios</span>
      </div>
    `).join("");

    list.querySelectorAll(".vlist-item").forEach((el) => {
      el.addEventListener("click", () => openEditor(el.dataset.id));
    });
  }

  /* ---------------- Editor de vehículo ---------------- */

  function clearEditorForm() {
    ["f-id", "f-placas", "f-marca", "f-modelo", "f-anio", "f-version", "f-color", "f-combustible",
     "f-vin", "f-km", "f-cliente-nombre", "f-cliente-tel", "f-aceite-tipo", "f-aceite-cap",
     "f-llantas", "f-bateria", "f-filtro-aire", "f-filtro-aceite", "f-prox-desc", "f-prox-km", "f-prox-fecha"
    ].forEach((id) => { $(id).value = ""; });
  }

  function openEditor(id) {
    isNewVehicle = !id;
    currentVehicleId = id || null;
    pendingServices = [];
    newServiceFotos = [];
    newServiceDocumentos = [];
    clearEditorForm();

    const v = id ? db.vehicles[id] : {};
    const ficha = (v && v.ficha_tecnica) || {};
    const prox = (v && v.proximo_servicio) || {};

    $("f-id").value = v.id || "";
    $("f-id").disabled = !isNewVehicle; // no permitir cambiar el ID de un vehículo existente
    $("f-placas").value = v.placas || "";
    $("f-marca").value = v.marca || "";
    $("f-modelo").value = v.modelo || "";
    $("f-anio").value = v.anio || "";
    $("f-version").value = v.version || "";
    $("f-color").value = v.color || "";
    $("f-combustible").value = v.combustible || "";
    $("f-vin").value = v.vin || "";
    $("f-km").value = v.km_actual || "";
    $("f-cliente-nombre").value = v.cliente_nombre || "";
    $("f-cliente-tel").value = v.cliente_telefono || "";

    $("f-aceite-tipo").value = ficha.aceite_tipo || "";
    $("f-aceite-cap").value = ficha.aceite_capacidad || "";
    $("f-llantas").value = ficha.presion_llantas || "";
    $("f-bateria").value = ficha.bateria || "";
    $("f-filtro-aire").value = ficha.filtro_aire || "";
    $("f-filtro-aceite").value = ficha.filtro_aceite || "";

    $("f-prox-desc").value = prox.descripcion || "";
    $("f-prox-km").value = prox.km_estimado || "";
    $("f-prox-fecha").value = prox.fecha_estimada || "";

    pendingServices = (v && v.servicios) ? v.servicios.slice() : [];
    renderServicesList();
    renderNewServiceAttachments();

    $("btn-delete").style.display = isNewVehicle ? "none" : "inline-flex";
    showView("editor");
  }

  function renderServicesList() {
    const list = $("services-list");
    const sorted = pendingServices.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    if (!sorted.length) {
      list.innerHTML = `<p style="color:var(--text-faint);font-size:13px;">Sin servicios registrados todavía.</p>`;
      return;
    }
    list.innerHTML = sorted.map((s, i) => {
      const nFotos = (s.fotos || []).length + (s._pendingFotos || []).length;
      const nDocs = (s.documentos || []).length + (s._pendingDocumentos || []).length;
      const chips = [];
      if (nFotos) chips.push(`<span class="tag">📷 ${nFotos}</span>`);
      if (nDocs) chips.push(`<span class="tag">📄 ${nDocs}</span>`);
      return `
      <div class="vlist-item" style="cursor:default;">
        <div>
          <div class="vlist-item-title">${s.tipo || "Servicio"} — ${s.fecha || ""}</div>
          <div class="vlist-item-sub">${s.km ? s.km + " km · " : ""}${s.tecnico || ""} ${chips.join(" ")}</div>
        </div>
        <button class="btn btn-outline btn-sm" data-remove="${i}">Quitar</button>
      </div>
    `;
    }).join("");

    list.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sortedIdx = Number(btn.dataset.remove);
        const target = sorted[sortedIdx];
        pendingServices = pendingServices.filter((s) => s !== target);
        renderServicesList();
      });
    });
  }

  function addServiceFromForm() {
    const tipo = $("s-tipo").value.trim();
    const fecha = $("s-fecha").value;
    if (!tipo || !fecha) {
      showToast("Indica al menos la fecha y el tipo de servicio", "error");
      return;
    }
    pendingServices.push({
      fecha,
      tipo,
      descripcion: $("s-desc").value.trim(),
      km: $("s-km").value ? Number($("s-km").value) : null,
      costo: $("s-costo").value ? Number($("s-costo").value) : null,
      tecnico: $("s-tecnico").value.trim(),
      fotos: [],
      documentos: [],
      _pendingFotos: newServiceFotos.slice(),
      _pendingDocumentos: newServiceDocumentos.slice(),
    });
    ["s-fecha", "s-tipo", "s-km", "s-costo", "s-tecnico", "s-desc"].forEach((id) => { $(id).value = ""; });
    newServiceFotos = [];
    newServiceDocumentos = [];
    renderNewServiceAttachments();
    renderServicesList();
    showToast("Servicio agregado a la lista (aún debes guardar los cambios)", "success");
  }

  /* ---------------- Vista previa de adjuntos del servicio en captura ---------------- */

  function renderNewServiceAttachments() {
    const fotosEl = $("s-fotos-preview");
    fotosEl.innerHTML = newServiceFotos.map((file, i) => `
      <div class="attach-thumb pending attach-thumb-remove">
        <img src="${URL.createObjectURL(file)}" alt="">
        <button type="button" data-remove-foto="${i}" title="Quitar">×</button>
      </div>
    `).join("");
    fotosEl.querySelectorAll("[data-remove-foto]").forEach((btn) => {
      btn.addEventListener("click", () => {
        newServiceFotos.splice(Number(btn.dataset.removeFoto), 1);
        renderNewServiceAttachments();
      });
    });

    const docsEl = $("s-docs-preview");
    docsEl.innerHTML = newServiceDocumentos.map((file, i) => `
      <span class="doc-chip pending">📄 ${file.name}
        <button type="button" class="doc-remove" data-remove-doc="${i}" title="Quitar">×</button>
      </span>
    `).join("");
    docsEl.querySelectorAll("[data-remove-doc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        newServiceDocumentos.splice(Number(btn.dataset.removeDoc), 1);
        renderNewServiceAttachments();
      });
    });
  }

  function handleFotosSelected(fileList) {
    Array.from(fileList).forEach((f) => {
      if (f.type.startsWith("image/")) newServiceFotos.push(f);
    });
    renderNewServiceAttachments();
  }

  function handlePdfsSelected(fileList) {
    Array.from(fileList).forEach((f) => {
      if (f.type !== "application/pdf") {
        showToast(`${f.name} no es un PDF, se omitió`, "error");
        return;
      }
      if (f.size > MAX_PDF_MB * 1024 * 1024) {
        showToast(`${f.name} pesa más de ${MAX_PDF_MB} MB, se omitió`, "error");
        return;
      }
      newServiceDocumentos.push(f);
    });
    renderNewServiceAttachments();
  }

  function buildVehicleFromForm() {
    const id = $("f-id").value.trim();
    if (!id) throw new Error("El ID de la etiqueta NFC es obligatorio");

    return {
      id,
      placas: $("f-placas").value.trim(),
      marca: $("f-marca").value.trim(),
      modelo: $("f-modelo").value.trim(),
      anio: $("f-anio").value ? Number($("f-anio").value) : null,
      version: $("f-version").value.trim(),
      color: $("f-color").value.trim(),
      combustible: $("f-combustible").value.trim(),
      vin: $("f-vin").value.trim(),
      km_actual: $("f-km").value ? Number($("f-km").value) : null,
      cliente_nombre: $("f-cliente-nombre").value.trim(),
      cliente_telefono: $("f-cliente-tel").value.trim(),
      ficha_tecnica: {
        aceite_tipo: $("f-aceite-tipo").value.trim(),
        aceite_capacidad: $("f-aceite-cap").value.trim(),
        presion_llantas: $("f-llantas").value.trim(),
        bateria: $("f-bateria").value.trim(),
        filtro_aire: $("f-filtro-aire").value.trim(),
        filtro_aceite: $("f-filtro-aceite").value.trim(),
      },
      proximo_servicio: {
        descripcion: $("f-prox-desc").value.trim(),
        km_estimado: $("f-prox-km").value ? Number($("f-prox-km").value) : null,
        fecha_estimada: $("f-prox-fecha").value || null,
      },
      servicios: pendingServices,
    };
  }

  async function saveVehicle() {
    let vehicle;
    try {
      vehicle = buildVehicleFromForm();
    } catch (err) {
      showToast(err.message, "error");
      return;
    }

    if (isNewVehicle && db.vehicles[vehicle.id]) {
      showToast("Ya existe un vehículo con ese ID", "error");
      return;
    }
    // Si el ID cambió (no debería, pero por seguridad) o es nuevo, se limpia el anterior
    if (currentVehicleId && currentVehicleId !== vehicle.id) {
      delete db.vehicles[currentVehicleId];
    }

    const btn = $("btn-save");
    btn.disabled = true;
    btn.textContent = "Guardando…";
    try {
      await uploadPendingAttachments(vehicle);

      db.vehicles[vehicle.id] = vehicle;
      const msg = isNewVehicle
        ? `Agregar vehículo ${vehicle.placas || vehicle.id}`
        : `Actualizar vehículo ${vehicle.placas || vehicle.id}`;
      await saveDatabase(msg);
      showToast("Cambios guardados en GitHub", "success");
      currentVehicleId = vehicle.id;
      isNewVehicle = false;
      renderDashboard($("search-box").value);
      showView("dashboard");
    } catch (err) {
      showToast("Error al guardar: " + err.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Guardar cambios en GitHub";
    }
  }

  async function deleteVehicle() {
    if (!currentVehicleId) return;
    if (!confirm("¿Eliminar este vehículo de forma permanente?")) return;

    delete db.vehicles[currentVehicleId];
    const btn = $("btn-delete");
    btn.disabled = true;
    try {
      await saveDatabase(`Eliminar vehículo ${currentVehicleId}`);
      showToast("Vehículo eliminado", "success");
      renderDashboard($("search-box").value);
      showView("dashboard");
    } catch (err) {
      showToast("Error al eliminar: " + err.message, "error");
    } finally {
      btn.disabled = false;
    }
  }

  /* ---------------- Eventos ---------------- */

  $("btn-connect").addEventListener("click", connect);
  $("btn-logout").addEventListener("click", logout);
  $("btn-back").addEventListener("click", () => showView("dashboard"));
  $("btn-new-vehicle").addEventListener("click", () => openEditor(null));
  $("btn-add-service").addEventListener("click", addServiceFromForm);
  $("btn-save").addEventListener("click", saveVehicle);
  $("btn-delete").addEventListener("click", deleteVehicle);
  $("search-box").addEventListener("input", (e) => renderDashboard(e.target.value));

  $("btn-take-photo").addEventListener("click", () => $("s-camera-input").click());
  $("btn-pick-photo").addEventListener("click", () => $("s-gallery-input").click());
  $("btn-pick-pdf").addEventListener("click", () => $("s-pdf-input").click());
  $("s-camera-input").addEventListener("change", (e) => { handleFotosSelected(e.target.files); e.target.value = ""; });
  $("s-gallery-input").addEventListener("change", (e) => { handleFotosSelected(e.target.files); e.target.value = ""; });
  $("s-pdf-input").addEventListener("change", (e) => { handlePdfsSelected(e.target.files); e.target.value = ""; });

  /* ---------------- Init ---------------- */

  (async function init() {
    if (restoreSession()) {
      try {
        await loadDatabase();
        renderDashboard();
        showView("dashboard");
        return;
      } catch (err) {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
    showView("login");
  })();
})();
