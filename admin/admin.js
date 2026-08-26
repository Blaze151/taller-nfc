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
    list.innerHTML = sorted.map((s, i) => `
      <div class="vlist-item" style="cursor:default;">
        <div>
          <div class="vlist-item-title">${s.tipo || "Servicio"} — ${s.fecha || ""}</div>
          <div class="vlist-item-sub">${s.km ? s.km + " km · " : ""}${s.tecnico || ""}</div>
        </div>
        <button class="btn btn-outline btn-sm" data-remove="${i}">Quitar</button>
      </div>
    `).join("");

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
    });
    ["s-fecha", "s-tipo", "s-km", "s-costo", "s-tecnico", "s-desc"].forEach((id) => { $(id).value = ""; });
    renderServicesList();
    showToast("Servicio agregado a la lista (aún debes guardar los cambios)", "success");
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

    db.vehicles[vehicle.id] = vehicle;

    const btn = $("btn-save");
    btn.disabled = true;
    btn.textContent = "Guardando…";
    try {
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
