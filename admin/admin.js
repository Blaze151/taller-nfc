/* ==========================================================
   Panel de administración
   Usa la API REST de GitHub (Contents API) para leer y escribir
   data/vehicles.json directamente como commits en el repositorio.
   El token vive guardado en este dispositivo (localStorage) hasta que cierres sesión.

   Modelo de datos por vehículo:
     - servicio_actual: el servicio que se está realizando ahora mismo
       (o null si no hay ninguno). Tiene su propia etapa (recibido /
       en_proceso / listo) y fotos/documentos separados por etapa.
       Es editable hasta que se marca como finalizado.
     - servicios: historial de servicios ya finalizados (solo lectura,
       con fotos/documentos ya fusionados).
   ========================================================== */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const DATA_PATH = "data/vehicles.json";
  const SESSION_KEY = "taller_nfc_admin_session";
  const DEFAULT_OWNER = "Blaze151";
  const DEFAULT_REPO = "taller-nfc";
  const DEFAULT_BRANCH = "main";
  const MAX_PDF_MB = 8;

  const ESTADOS_SERVICIO = () => ({
    recibido: { label: t("estado_recibido"), icon: "📥" },
    en_proceso: { label: t("estado_en_proceso"), icon: "🔧" },
    listo: { label: t("estado_listo"), icon: "✅" },
    recogido: { label: t("estado_entregado"), icon: "🚗" },
  });
  const ORDEN_ESTADOS_SERVICIO = ["recibido", "en_proceso", "listo", "recogido"];

  const PAGO_INFO = () => ({ icon: "💳", label: t("pago_comprobante") });
  const PAGO_ESTADOS = () => ({
    no_pagado: { label: t("pago_no_pagado"), icon: "🕓" },
    pagado: { label: t("pago_pagado"), icon: "✅" },
    a_deber: { label: t("pago_a_deber"), icon: "⚠️" },
  });
  const ATTACH_STAGES = [...ORDEN_ESTADOS_SERVICIO, "pago"];

  /* ---------------- Idioma (ES/EN) ---------------- */

  const LANG_KEY = "taller_nfc_lang";
  const STR = {
    es: {
      admin_titulo: "HGR Automotriz — Administración",
      cerrar_sesion: "Cerrar sesión",
      login_titulo: "Conectar con el repositorio",
      login_desc_html: 'Se conecta directo a tu repositorio de GitHub usando un token personal. Los cambios que hagas aquí se guardan como commits en <code class="mono">data/vehicles.json</code>.',
      github_user_label: "Usuario u organización de GitHub",
      github_user_placeholder: "ej. hmoralesc",
      repo_label: "Repositorio",
      repo_placeholder: "ej. taller-nfc",
      branch_label: "Rama",
      token_label: "Token de acceso personal (fine-grained, permiso Contents: Read and write)",
      btn_conectar: "Conectar",
      login_note: 'El token queda guardado en este dispositivo (no se comparte ni se sube a ningún lado) hasta que presiones "Cerrar sesión". Úsalo solo en tu celular o computadora del taller, no en equipos compartidos. Crea el token en GitHub → Settings → Developer settings → Fine-grained tokens, limitado únicamente a este repositorio.',
      ver_tablero: "📋 Ver tablero por estado",
      buscar_vehiculo_titulo: "Buscar vehículo",
      buscar_vehiculo_placeholder: "Buscar por placa, marca, modelo o cliente...",
      vehiculos_registrados: "Vehículos registrados",
      btn_agregar_vehiculo: "+ Agregar vehículo nuevo",
      volver_lista: "← Volver a la lista",
      llamar_btn: "📞 Llamar",
      whatsapp_btn: "💬 WhatsApp",
      datos_vehiculo: "Datos del vehículo",
      foto_vehiculo_label: "Foto del vehículo",
      tomar_foto: "📷 Tomar foto",
      subir_fototeca: "🖼️ Subir de la fototeca",
      id_nfc_label: "ID de la etiqueta NFC",
      id_nfc_placeholder: "ej. ABC123",
      placas_label: "Placas",
      marca_label: "Marca",
      modelo_label: "Modelo",
      anio_label: "Año",
      version_label: "Versión / motor",
      color_label: "Color",
      combustible_label: "Combustible",
      combustible_sin_especificar: "Sin especificar",
      combustible_gasolina: "Gasolina",
      combustible_diesel: "Diesel",
      combustible_electrico: "Eléctrico",
      combustible_gas: "Gas",
      vin_label: "VIN",
      km_actual_label: "Kilometraje actual",
      cliente_label: "Cliente",
      telefono_cliente_label: "Teléfono del cliente",
      documentos_vehiculo_titulo: "Documentos del vehículo",
      documentos_vehiculo_desc: "Fotos o PDF generales del vehículo (tarjeta de circulación, seguro, etc.), no ligados a un servicio en particular. Aparecen en la ficha del cliente como un desplegable.",
      fototeca_btn: "🖼️ Fototeca",
      pdf_btn: "📄 PDF",
      ficha_tecnica_titulo: "Ficha técnica",
      aceite_tipo_label: "Aceite (tipo)",
      aceite_cap_label: "Capacidad de aceite",
      presion_llantas_label: "Presión de llantas",
      bateria_label: "Batería",
      filtro_aire_label: "Filtro de aire",
      filtro_aceite_label: "Filtro de aceite",
      servicio_en_proceso_titulo: "🔧 Servicio en proceso",
      historial_titulo: "Historial de servicios (finalizados)",
      historial_desc: "Solo se puede editar mientras un servicio está en proceso. Una vez finalizado, queda como registro permanente.",
      guardar_btn: "Guardar cambios en GitHub",
      guardando_btn: "Guardando…",
      guardado_btn: "Guardado",
      eliminar_btn: "Eliminar vehículo",
      panel_admin_footer: "Panel de administración",
      reportar_problema: "🛠️ Reportar un problema del sistema",
      estado_recibido: "Recibido",
      estado_en_proceso: "En proceso",
      estado_listo: "Listo para recoger",
      estado_entregado: "Entregado",
      pago_comprobante: "Comprobante de pago",
      pago_no_pagado: "No pagado",
      pago_pagado: "Pagado",
      pago_a_deber: "A deber",
      sin_servicio_activo: "Sin servicio activo",
      cambiar_tema: "Cambiar tema",
      msg_completa_campos: "Completa usuario, repositorio y token.",
      msg_conectando: "Conectando…",
      msg_no_conectar: "No se pudo conectar: ",
      msg_no_procesar_imagen: "No se pudo procesar la imagen",
      msg_no_leer_imagen: "No se pudo leer la imagen",
      board_en_esta_etapa: "En esta etapa",
      board_otras_etapas_activas: "Otras etapas activas",
      board_ningun_recibido: "Ningún vehículo recién recibido.",
      board_ningun_en_proceso: "Ningún vehículo en proceso.",
      board_ya_entregado: "Ya entregado",
      board_aun_no_entrega: "Aún no se entrega",
      board_otras_etapas: "Otras etapas",
      board_ningun_listo: "Ningún vehículo listo para recoger todavía.",
      board_pagos_titulo: "Pagos",
      board_no_hay_activos: "No hay servicios activos.",
      board_con_servicio_activo: "Con servicio activo",
      board_todos_tienen_activo: "Todos los vehículos tienen un servicio activo.",
      msg_sin_vehiculos_aqui: "Sin vehículos aquí.",
      quitar_btn: "Quitar",
      servicio_generico: "Servicio",
      metodo_efectivo: "Efectivo",
      metodo_transferencia: "Transferencia",
      msg_servicio_finalizado: 'Servicio finalizado. No olvides presionar "Guardar cambios en GitHub".',
      msg_id_nfc_obligatorio: "El ID de la etiqueta NFC es obligatorio",
      msg_indica_tipo_servicio: "Indica al menos el tipo de servicio antes de finalizar",
      msg_ya_existe_id: "Ya existe un vehículo con ese ID",
      msg_cambios_guardados: "Cambios guardados en GitHub",
      msg_error_guardar: "Error al guardar: ",
      msg_vehiculo_eliminado: "Vehículo eliminado",
      msg_error_eliminar: "Error al eliminar: ",
      msg_subiendo_foto_vehiculo: "Subiendo foto del vehículo…",
      msg_no_coinciden: "No hay vehículos que coincidan.",
      en_historial: "en historial",
      sin_placa_texto: "sin placa",
      ver_vehiculos_txt: "Ver vehículos",
      wa_sin_telefono: "Este vehículo no tiene teléfono de cliente registrado.",
      cerrar_btn: "Cerrar",
      wa_prompt_titulo: "📲 Vehículo listo para recoger",
      wa_prompt_titulo_recibido: "📲 Vehículo recibido en el taller",
      wa_prompt_pre: "¿Quieres avisarle a",
      wa_prompt_post: "por WhatsApp?",
      enviar_whatsapp_btn: "📲 Enviar WhatsApp",
      ver_fotos_por_etapa: "Ver fotos y documentos por etapa",
      sin_servicios_finalizados: "Sin servicios finalizados todavía.",
      no_hay_servicio_proceso: "No hay ningún servicio en proceso actualmente.",
      iniciar_servicio_btn: "+ Iniciar nuevo servicio",
      tipo_servicio_label: "Tipo de servicio",
      kilometraje_label: "Kilometraje",
      costo_estimado_label: "Costo estimado",
      tecnico_label: "Técnico",
      descripcion_label: "Descripción",
      etapa_actual_label: "Etapa actual",
      iniciado_txt: "Iniciado",
      actualizado_txt: "Actualizado",
      pago_titulo: "💳 Pago",
      estado_pago_label: "Estado de pago",
      metodo_pago_label: "Método de pago",
      sin_especificar: "Sin especificar",
      marcar_finalizado_btn: "✅ Marcar como finalizado",
      cancelar_servicio_btn: "Cancelar servicio en proceso",
      confirm_cancelar_servicio: "¿Cancelar este servicio en proceso? Se perderá lo capturado que aún no se ha guardado.",
      confirm_finalizar_servicio: "¿Marcar este servicio como finalizado? Pasará al historial y ya no se podrá editar (recuerda guardar los cambios después).",
      confirm_eliminar_vehiculo: "¿Eliminar este vehículo de forma permanente?",
    },
    en: {
      admin_titulo: "HGR Automotriz — Admin",
      cerrar_sesion: "Log out",
      login_titulo: "Connect to the repository",
      login_desc_html: 'Connects directly to your GitHub repository using a personal token. Changes you make here are saved as commits in <code class="mono">data/vehicles.json</code>.',
      github_user_label: "GitHub username or organization",
      github_user_placeholder: "e.g. hmoralesc",
      repo_label: "Repository",
      repo_placeholder: "e.g. taller-nfc",
      branch_label: "Branch",
      token_label: "Personal access token (fine-grained, Contents: Read and write permission)",
      btn_conectar: "Connect",
      login_note: 'The token stays saved on this device (never shared or uploaded anywhere) until you press "Log out". Use it only on your own phone or shop computer, never on a shared device. Create the token on GitHub → Settings → Developer settings → Fine-grained tokens, limited to this repository only.',
      ver_tablero: "📋 View status board",
      buscar_vehiculo_titulo: "Search vehicle",
      buscar_vehiculo_placeholder: "Search by plate, make, model, or customer...",
      vehiculos_registrados: "Registered vehicles",
      btn_agregar_vehiculo: "+ Add new vehicle",
      volver_lista: "← Back to list",
      llamar_btn: "📞 Call",
      whatsapp_btn: "💬 WhatsApp",
      datos_vehiculo: "Vehicle details",
      foto_vehiculo_label: "Vehicle photo",
      tomar_foto: "📷 Take photo",
      subir_fototeca: "🖼️ Upload from gallery",
      id_nfc_label: "NFC tag ID",
      id_nfc_placeholder: "e.g. ABC123",
      placas_label: "License plate",
      marca_label: "Make",
      modelo_label: "Model",
      anio_label: "Year",
      version_label: "Trim / engine",
      color_label: "Color",
      combustible_label: "Fuel",
      combustible_sin_especificar: "Not specified",
      combustible_gasolina: "Gasoline",
      combustible_diesel: "Diesel",
      combustible_electrico: "Electric",
      combustible_gas: "Gas",
      vin_label: "VIN",
      km_actual_label: "Current mileage",
      cliente_label: "Customer",
      telefono_cliente_label: "Customer phone",
      documentos_vehiculo_titulo: "Vehicle documents",
      documentos_vehiculo_desc: "General vehicle photos or PDFs (registration card, insurance, etc.), not tied to a specific service. They appear in the customer's record as a dropdown.",
      fototeca_btn: "🖼️ Gallery",
      pdf_btn: "📄 PDF",
      ficha_tecnica_titulo: "Technical specs",
      aceite_tipo_label: "Oil (type)",
      aceite_cap_label: "Oil capacity",
      presion_llantas_label: "Tire pressure",
      bateria_label: "Battery",
      filtro_aire_label: "Air filter",
      filtro_aceite_label: "Oil filter",
      servicio_en_proceso_titulo: "🔧 Service in progress",
      historial_titulo: "Service history (completed)",
      historial_desc: "Only editable while a service is in progress. Once finalized, it stays as a permanent record.",
      guardar_btn: "Save changes to GitHub",
      guardando_btn: "Saving…",
      guardado_btn: "Saved",
      eliminar_btn: "Delete vehicle",
      panel_admin_footer: "Admin panel",
      reportar_problema: "🛠️ Report a system issue",
      estado_recibido: "Received",
      estado_en_proceso: "In progress",
      estado_listo: "Ready for pickup",
      estado_entregado: "Delivered",
      pago_comprobante: "Payment receipt",
      pago_no_pagado: "Not paid",
      pago_pagado: "Paid",
      pago_a_deber: "Balance due",
      sin_servicio_activo: "No active service",
      cambiar_tema: "Toggle theme",
      msg_completa_campos: "Fill in username, repository, and token.",
      msg_conectando: "Connecting…",
      msg_no_conectar: "Could not connect: ",
      msg_no_procesar_imagen: "Could not process the image",
      msg_no_leer_imagen: "Could not read the image",
      board_en_esta_etapa: "At this stage",
      board_otras_etapas_activas: "Other active stages",
      board_ningun_recibido: "No vehicles just received.",
      board_ningun_en_proceso: "No vehicles in progress.",
      board_ya_entregado: "Already delivered",
      board_aun_no_entrega: "Not delivered yet",
      board_otras_etapas: "Other stages",
      board_ningun_listo: "No vehicles ready for pickup yet.",
      board_pagos_titulo: "Payments",
      board_no_hay_activos: "No active services.",
      board_con_servicio_activo: "Has an active service",
      board_todos_tienen_activo: "All vehicles have an active service.",
      msg_sin_vehiculos_aqui: "No vehicles here.",
      quitar_btn: "Remove",
      servicio_generico: "Service",
      metodo_efectivo: "Cash",
      metodo_transferencia: "Bank transfer",
      msg_servicio_finalizado: 'Service finalized. Don\'t forget to press "Save changes to GitHub".',
      msg_id_nfc_obligatorio: "The NFC tag ID is required",
      msg_indica_tipo_servicio: "Enter at least the service type before finalizing",
      msg_ya_existe_id: "A vehicle with that ID already exists",
      msg_cambios_guardados: "Changes saved to GitHub",
      msg_error_guardar: "Error saving: ",
      msg_vehiculo_eliminado: "Vehicle deleted",
      msg_error_eliminar: "Error deleting: ",
      msg_subiendo_foto_vehiculo: "Uploading vehicle photo…",
      msg_no_coinciden: "No matching vehicles.",
      en_historial: "in history",
      sin_placa_texto: "no plate",
      ver_vehiculos_txt: "View vehicles",
      wa_sin_telefono: "This vehicle has no customer phone registered.",
      cerrar_btn: "Close",
      wa_prompt_titulo: "📲 Vehicle ready for pickup",
      wa_prompt_titulo_recibido: "📲 Vehicle received at the shop",
      wa_prompt_pre: "Do you want to notify",
      wa_prompt_post: "via WhatsApp?",
      enviar_whatsapp_btn: "📲 Send WhatsApp",
      ver_fotos_por_etapa: "View photos and documents by stage",
      sin_servicios_finalizados: "No completed services yet.",
      no_hay_servicio_proceso: "There's no service in progress right now.",
      iniciar_servicio_btn: "+ Start new service",
      tipo_servicio_label: "Service type",
      kilometraje_label: "Mileage",
      costo_estimado_label: "Estimated cost",
      tecnico_label: "Technician",
      descripcion_label: "Description",
      etapa_actual_label: "Current stage",
      iniciado_txt: "Started",
      actualizado_txt: "Updated",
      pago_titulo: "💳 Payment",
      estado_pago_label: "Payment status",
      metodo_pago_label: "Payment method",
      sin_especificar: "Not specified",
      marcar_finalizado_btn: "✅ Mark as finished",
      cancelar_servicio_btn: "Cancel service in progress",
      confirm_cancelar_servicio: "Cancel this service in progress? Anything not yet saved will be lost.",
      confirm_finalizar_servicio: "Mark this service as finished? It will move to history and can no longer be edited (remember to save changes afterward).",
      confirm_eliminar_vehiculo: "Permanently delete this vehicle?",
    },
  };

  let currentLang = "es";
  try { currentLang = localStorage.getItem(LANG_KEY) || "es"; } catch (e) {}

  function t(key) {
    return (STR[currentLang] && STR[currentLang][key]) || STR.es[key] || key;
  }

  function applyStaticTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.innerHTML = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === currentLang);
    });
    const themeBtn = $("theme-toggle");
    if (themeBtn) themeBtn.title = t("cambiar_tema");
  }

  function setLang(lang) {
    if (lang !== "es" && lang !== "en") return;
    currentLang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    applyStaticTranslations();
    rerenderCurrentView();
  }

  function rerenderCurrentView() {
    if (!db) return;
    if ($("view-board").style.display !== "none") { renderBoard(); return; }
    if ($("view-editor").style.display !== "none") {
      renderVehiclePhotoPreview();
      renderVehicleDocsPreview();
      renderServicesList();
      renderActiveServiceCard();
      updateClientContactLinks();
      return;
    }
    renderDashboard($("search-box") ? $("search-box").value : "");
  }

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });

  /* ---------------- Tema claro/oscuro ---------------- */

  const THEME_KEY = "taller_nfc_theme";

  function updateThemeIcon() {
    const btn = $("theme-toggle");
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

  const themeToggleBtn = $("theme-toggle");
  if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);
  updateThemeIcon();
  applyStaticTranslations();

  let cfg = null;           // { owner, repo, branch, token }
  let db = null;             // contenido completo de vehicles.json
  let dbSha = null;          // sha del archivo (necesario para actualizar)
  let currentVehicleId = null;
  let isNewVehicle = false;

  let pendingServices = [];       // historial (servicios finalizados) del vehículo en edición
  let svcActual = null;           // servicio en proceso del vehículo en edición (o null)
  let svcActualEstadoOriginal = null;
  let svcActualPending = null;    // File[] pendientes de subir, por etapa: { recibido:{fotos,documentos}, ... }

  let currentFotoPerfil = null;      // ruta ya guardada de la foto de perfil (o null)
  let vFotoPerfilPending = null;     // File pendiente de subir como nueva foto de perfil
  let vFotoPerfilRemoved = false;    // true si el usuario quitó la foto sin reemplazarla
  let currentDocumentosVehiculo = { fotos: [], documentos: [] }; // rutas ya guardadas
  let vDocsPending = { fotos: [], documentos: [] };               // File[] pendientes de subir

  function esc(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatFechaCorta(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  }

  function emptyPendingStruct() {
    return {
      recibido: { fotos: [], documentos: [] },
      en_proceso: { fotos: [], documentos: [] },
      listo: { fotos: [], documentos: [] },
      recogido: { fotos: [], documentos: [] },
      pago: { fotos: [], documentos: [] },
    };
  }

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
    $("view-board").style.display = name === "board" ? "block" : "none";
    $("view-editor").style.display = name === "editor" ? "block" : "none";
    $("btn-logout").style.display = name === "login" ? "none" : "inline-flex";

    const active = $("view-" + name);
    if (active) {
      active.classList.remove("view-fade-in");
      void active.offsetWidth; // reinicia la animación aunque se repita la misma vista
      active.classList.add("view-fade-in");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          if (!blob) return reject(new Error(t("msg_no_procesar_imagen")));
          resolve(blob);
        }, "image/jpeg", quality);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error(t("msg_no_leer_imagen"))); };
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

  // Sube adjuntos pendientes del historial (fotos/documentos de un servicio que
  // se acaba de finalizar en esta sesión), conservando la etapa de cada uno.
  async function uploadPendingAttachments(vehicle) {
    for (const service of vehicle.servicios) {
      if (!service._pendingAdjuntos) continue;
      if (!service.adjuntos) service.adjuntos = emptyPendingStruct();

      for (const stage of ATTACH_STAGES) {
        const pend = service._pendingAdjuntos[stage] || { fotos: [], documentos: [] };
        if (!service.adjuntos[stage]) service.adjuntos[stage] = { fotos: [], documentos: [] };
        const stageLabel = (ESTADOS_SERVICIO()[stage] || PAGO_INFO()).label;

        for (let i = 0; i < pend.fotos.length; i++) {
          showToast(`Subiendo foto ${i + 1}/${pend.fotos.length} (${stageLabel})…`);
          const file = pend.fotos[i];
          let blob;
          try { blob = await compressImage(file); } catch { blob = file; }
          const base64 = await blobToBase64(blob);
          const filename = `${timestampSlug()}-${stage}-${i}-${slugifyFilename(file.name.replace(/\.[^.]+$/, ""))}.jpg`;
          const path = `uploads/${vehicle.id}/${filename}`;
          await uploadBinaryFile(path, base64, `Agregar foto (${stageLabel}, historial) — ${vehicle.placas || vehicle.id}`);
          service.adjuntos[stage].fotos.push(path);
        }

        for (let i = 0; i < pend.documentos.length; i++) {
          showToast(`Subiendo documento ${i + 1}/${pend.documentos.length} (${stageLabel})…`);
          const file = pend.documentos[i];
          const base64 = await blobToBase64(file);
          const filename = `${timestampSlug()}-${stage}-${i}-${slugifyFilename(file.name)}`;
          const path = `uploads/${vehicle.id}/${filename}`;
          await uploadBinaryFile(path, base64, `Agregar documento (${stageLabel}, historial) — ${vehicle.placas || vehicle.id}`);
          service.adjuntos[stage].documentos.push(path);
        }
      }
      delete service._pendingAdjuntos;
    }
  }

  // Sube adjuntos pendientes del servicio EN PROCESO, separados por etapa.
  async function uploadPendingActiveServiceAttachments(vehicle) {
    const active = vehicle.servicio_actual;
    if (!active || !active._pendingAdjuntos) return;

    for (const stage of ATTACH_STAGES) {
      const pend = active._pendingAdjuntos[stage] || { fotos: [], documentos: [] };
      if (!active.adjuntos[stage]) active.adjuntos[stage] = { fotos: [], documentos: [] };
      const stageLabel = (ESTADOS_SERVICIO()[stage] || PAGO_INFO()).label;

      for (let i = 0; i < pend.fotos.length; i++) {
        showToast(`Subiendo foto ${i + 1}/${pend.fotos.length} (${stageLabel})…`);
        const file = pend.fotos[i];
        let blob;
        try { blob = await compressImage(file); } catch { blob = file; }
        const base64 = await blobToBase64(blob);
        const filename = `${timestampSlug()}-${stage}-${i}-${slugifyFilename(file.name.replace(/\.[^.]+$/, ""))}.jpg`;
        const path = `uploads/${vehicle.id}/${filename}`;
        await uploadBinaryFile(path, base64, `Agregar foto (${stageLabel}) — ${vehicle.placas || vehicle.id}`);
        active.adjuntos[stage].fotos.push(path);
      }

      for (let i = 0; i < pend.documentos.length; i++) {
        showToast(`Subiendo documento ${i + 1}/${pend.documentos.length} (${stageLabel})…`);
        const file = pend.documentos[i];
        const base64 = await blobToBase64(file);
        const filename = `${timestampSlug()}-${stage}-${i}-${slugifyFilename(file.name)}`;
        const path = `uploads/${vehicle.id}/${filename}`;
        await uploadBinaryFile(path, base64, `Agregar documento (${stageLabel}) — ${vehicle.placas || vehicle.id}`);
        active.adjuntos[stage].documentos.push(path);
      }
    }
    delete active._pendingAdjuntos;
  }

  // Sube la foto de perfil y los documentos generales del vehículo (no ligados a un servicio).
  async function uploadVehicleLevelAttachments(vehicle) {
    if (vehicle._pendingFotoPerfil) {
      showToast(t("msg_subiendo_foto_vehiculo"));
      let blob;
      try { blob = await compressImage(vehicle._pendingFotoPerfil, 1200, 0.8); } catch { blob = vehicle._pendingFotoPerfil; }
      const base64 = await blobToBase64(blob);
      const filename = `${timestampSlug()}-perfil.jpg`;
      const path = `uploads/${vehicle.id}/${filename}`;
      await uploadBinaryFile(path, base64, `Actualizar foto del vehículo (${vehicle.placas || vehicle.id})`);
      vehicle.foto_perfil = path;
    }
    delete vehicle._pendingFotoPerfil;

    if (!vehicle.documentos_vehiculo) vehicle.documentos_vehiculo = { fotos: [], documentos: [] };
    const pend = vehicle._pendingDocumentosVehiculo || { fotos: [], documentos: [] };

    for (let i = 0; i < pend.fotos.length; i++) {
      showToast(`Subiendo foto del vehículo ${i + 1}/${pend.fotos.length}…`);
      const file = pend.fotos[i];
      let blob;
      try { blob = await compressImage(file); } catch { blob = file; }
      const base64 = await blobToBase64(blob);
      const filename = `${timestampSlug()}-vdoc-${i}-${slugifyFilename(file.name.replace(/\.[^.]+$/, ""))}.jpg`;
      const path = `uploads/${vehicle.id}/${filename}`;
      await uploadBinaryFile(path, base64, `Agregar foto del vehículo (${vehicle.placas || vehicle.id})`);
      vehicle.documentos_vehiculo.fotos.push(path);
    }

    for (let i = 0; i < pend.documentos.length; i++) {
      showToast(`Subiendo documento del vehículo ${i + 1}/${pend.documentos.length}…`);
      const file = pend.documentos[i];
      const base64 = await blobToBase64(file);
      const filename = `${timestampSlug()}-vdoc-${i}-${slugifyFilename(file.name)}`;
      const path = `uploads/${vehicle.id}/${filename}`;
      await uploadBinaryFile(path, base64, `Agregar documento del vehículo (${vehicle.placas || vehicle.id})`);
      vehicle.documentos_vehiculo.documentos.push(path);
    }
    delete vehicle._pendingDocumentosVehiculo;
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
    const raw = localStorage.getItem(SESSION_KEY);
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
      errEl.textContent = t("msg_completa_campos");
      errEl.style.display = "block";
      return;
    }

    cfg = { owner, repo, branch, token };
    const btn = $("btn-connect");
    btn.disabled = true;
    btn.textContent = t("msg_conectando");

    try {
      await loadDatabase();
      localStorage.setItem(SESSION_KEY, JSON.stringify(cfg));
      renderDashboard();
      showView("dashboard");
    } catch (err) {
      errEl.textContent = t("msg_no_conectar") + err.message;
      errEl.style.display = "block";
    } finally {
      btn.disabled = false;
      btn.textContent = t("btn_conectar");
    }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
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
      list.innerHTML = `<p style="color:var(--text-faint);font-size:13px;">${esc(t("msg_no_coinciden"))}</p>`;
      return;
    }

    list.innerHTML = filtered.map((v) => {
      const active = v.servicio_actual;
      const badge = active
        ? `<span class="status-chip st-${active.estado}">${ESTADOS_SERVICIO()[active.estado].icon} ${ESTADOS_SERVICIO()[active.estado].label}</span>`
        : `<span class="tag">${esc(t("sin_servicio_activo"))}</span>`;
      const pagoInfo = active && active.pago ? PAGO_ESTADOS()[active.pago.estado] : null;
      const pagoBadge = pagoInfo ? `<span class="tag">${pagoInfo.icon} ${pagoInfo.label}</span>` : "";
      const photoHtml = v.foto_perfil
        ? `<div class="attach-thumb" style="width:50px;height:50px;flex-shrink:0;"><img src="../${esc(v.foto_perfil)}" alt=""></div>`
        : `<div class="attach-thumb" style="width:50px;height:50px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;">🚗</div>`;
      return `
      <div class="vlist-item" data-id="${v.id}" style="display:block;">
        <div style="display:flex;gap:10px;align-items:center;">
          ${photoHtml}
          <div style="flex:1;min-width:0;">
            <div class="vlist-item-title">${v.marca || ""} ${v.modelo || ""} — ${v.placas || t("sin_placa_texto")}</div>
            <div class="vlist-item-sub">ID: ${v.id} ${v.cliente_nombre ? "· " + v.cliente_nombre : ""} · ${(v.servicios || []).length} ${esc(t("en_historial"))}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px;">${badge}${pagoBadge}</div>
      </div>
    `;
    }).join("");

    list.querySelectorAll(".vlist-item").forEach((el) => {
      el.addEventListener("click", () => openEditor(el.dataset.id));
    });
  }

  /* ---------------- Tablero por etapa (gráficas de pastel) ---------------- */

  // Genera el degradado cónico (CSS) para una gráfica de pastel/dona a partir
  // de segmentos [{label, value, color}].
  function pieGradient(segments, total) {
    total = total || segments.reduce((s, x) => s + x.value, 0);
    if (!total) return `var(--surface-alt) 0deg 360deg`;
    let acc = 0;
    return segments.map((seg) => {
      const start = (acc / total) * 360;
      acc += seg.value;
      const end = (acc / total) * 360;
      return `${seg.color} ${start}deg ${end}deg`;
    }).join(", ");
  }

  function renderPieCard({ title, icon, segments, holdPct, vehiculos, emptyMsg, renderVehicleRow }) {
    const total = segments.reduce((s, x) => s + x.value, 0);
    const pct = holdPct != null ? holdPct : (total ? Math.round((segments[0].value / total) * 100) : 0);
    const gradient = pieGradient(segments, total);
    const legendHtml = segments.map((seg) => {
      const segPct = total ? Math.round((seg.value / total) * 100) : 0;
      return `<div class="pie-legend-item"><span class="pie-dot" style="background:${seg.color}"></span>${esc(seg.label)}: <strong>${seg.value}</strong> (${segPct}%)</div>`;
    }).join("");

    const listHtml = vehiculos.length
      ? vehiculos.map(renderVehicleRow).join("")
      : `<p style="color:var(--text-faint);font-size:12px;margin:8px 0 0;">${esc(emptyMsg || t("msg_sin_vehiculos_aqui"))}</p>`;

    return `
      <div class="card pie-card">
        <div class="card-title">${icon} ${esc(title)}</div>
        <div class="pie-chart" style="background: conic-gradient(${gradient});">
          <div class="pie-chart-hole"><span class="pie-chart-total">${pct}%</span></div>
        </div>
        <div class="pie-legend">${legendHtml}</div>
        <details class="pie-dropdown">
          <summary>${esc(t("ver_vehiculos_txt"))} (${vehiculos.length})</summary>
          <div class="pie-dropdown-list">${listHtml}</div>
        </details>
      </div>`;
  }

  function vehicleRowBasic(v) {
    return `<div class="vlist-item" data-id="${v.id}" style="margin-bottom:6px;">
      <div>
        <div class="vlist-item-title">${esc((v.marca || "") + " " + (v.modelo || ""))}</div>
        <div class="vlist-item-sub">${esc(v.placas || t("sin_placa_texto"))}${v.cliente_nombre ? " · " + esc(v.cliente_nombre) : ""}</div>
      </div>
    </div>`;
  }

  function renderBoard() {
    const board = $("board");
    const entries = Object.values(db.vehicles || {});
    const activos = entries.filter((v) => v.servicio_actual);
    const sinActivo = entries.filter((v) => !v.servicio_actual);
    const totalActivos = activos.length;

    const porEtapa = { recibido: [], en_proceso: [], listo: [], recogido: [] };
    activos.forEach((v) => {
      const e = v.servicio_actual.estado;
      if (porEtapa[e]) porEtapa[e].push(v);
    });

    const pagados = activos.filter((v) => v.servicio_actual.pago && v.servicio_actual.pago.estado === "pagado");
    const aDeber = activos.filter((v) => v.servicio_actual.pago && v.servicio_actual.pago.estado === "a_deber");
    const noPagados = activos.filter((v) => !v.servicio_actual.pago || v.servicio_actual.pago.estado === "no_pagado");

    const GREEN = "var(--green)";
    const GREEN_BRIGHT = "var(--green-bright)";
    const AMARILLO = "var(--yellow)";
    const AZUL = "var(--blue)";
    const GRIS = "var(--text-faint)";
    const GRIS_CLARO = "rgba(255,255,255,0.14)";

    const cards = [];

    cards.push(renderPieCard({
      title: t("estado_recibido"), icon: "📥",
      segments: [
        { label: t("board_en_esta_etapa"), value: porEtapa.recibido.length, color: GREEN },
        { label: t("board_otras_etapas_activas"), value: totalActivos - porEtapa.recibido.length, color: GRIS },
      ],
      vehiculos: porEtapa.recibido,
      emptyMsg: t("board_ningun_recibido"),
      renderVehicleRow: vehicleRowBasic,
    }));

    cards.push(renderPieCard({
      title: t("estado_en_proceso"), icon: "🔧",
      segments: [
        { label: t("board_en_esta_etapa"), value: porEtapa.en_proceso.length, color: GREEN },
        { label: t("board_otras_etapas_activas"), value: totalActivos - porEtapa.en_proceso.length, color: GRIS },
      ],
      vehiculos: porEtapa.en_proceso,
      emptyMsg: t("board_ningun_en_proceso"),
      renderVehicleRow: vehicleRowBasic,
    }));

    const listoGrupo = [...porEtapa.listo, ...porEtapa.recogido];
    cards.push(renderPieCard({
      title: t("estado_listo"), icon: "✅",
      segments: [
        { label: t("board_ya_entregado"), value: porEtapa.recogido.length, color: GREEN_BRIGHT },
        { label: t("board_aun_no_entrega"), value: porEtapa.listo.length, color: GREEN },
        { label: t("board_otras_etapas"), value: totalActivos - listoGrupo.length, color: GRIS },
      ],
      holdPct: totalActivos ? Math.round((listoGrupo.length / totalActivos) * 100) : 0,
      vehiculos: listoGrupo,
      emptyMsg: t("board_ningun_listo"),
      renderVehicleRow: (v) => {
        const recogido = v.servicio_actual.estado === "recogido";
        return `<div class="vlist-item" data-id="${v.id}" style="margin-bottom:6px;">
          <div>
            <div class="vlist-item-title">${esc((v.marca || "") + " " + (v.modelo || ""))}</div>
            <div class="vlist-item-sub">${esc(v.placas || t("sin_placa_texto"))}${v.cliente_nombre ? " · " + esc(v.cliente_nombre) : ""}</div>
          </div>
          <span class="tag">${recogido ? t("board_ya_entregado") : t("board_aun_no_entrega")}</span>
        </div>`;
      },
    }));

    cards.push(renderPieCard({
      title: t("board_pagos_titulo"), icon: "💳",
      segments: [
        { label: t("pago_pagado"), value: pagados.length, color: GREEN_BRIGHT },
        { label: t("pago_a_deber"), value: aDeber.length, color: AMARILLO },
        { label: t("pago_no_pagado"), value: noPagados.length, color: AZUL },
      ],
      holdPct: totalActivos ? Math.round((pagados.length / totalActivos) * 100) : 0,
      vehiculos: activos,
      emptyMsg: t("board_no_hay_activos"),
      renderVehicleRow: (v) => {
        const info = v.servicio_actual.pago ? PAGO_ESTADOS()[v.servicio_actual.pago.estado] : PAGO_ESTADOS().no_pagado;
        return `<div class="vlist-item" data-id="${v.id}" style="margin-bottom:6px;">
          <div>
            <div class="vlist-item-title">${esc((v.marca || "") + " " + (v.modelo || ""))}</div>
            <div class="vlist-item-sub">${esc(v.placas || t("sin_placa_texto"))}${v.cliente_nombre ? " · " + esc(v.cliente_nombre) : ""}</div>
          </div>
          <span class="tag">${info.icon} ${info.label}</span>
        </div>`;
      },
    }));

    cards.push(renderPieCard({
      title: t("sin_servicio_activo"), icon: "🏁",
      segments: [
        { label: t("sin_servicio_activo"), value: sinActivo.length, color: GREEN },
        { label: t("board_con_servicio_activo"), value: activos.length, color: GRIS },
      ],
      vehiculos: sinActivo,
      emptyMsg: t("board_todos_tienen_activo"),
      renderVehicleRow: vehicleRowBasic,
    }));

    board.innerHTML = cards.join("");

    board.querySelectorAll(".vlist-item[data-id]").forEach((el) => {
      el.addEventListener("click", () => openEditor(el.dataset.id));
    });
  }

  /* ---------------- Botones de contacto rápido (llamar / WhatsApp) ---------------- */

  function updateClientContactLinks() {
    const telRaw = ($("f-cliente-tel").value || "").trim();
    const nombre = $("f-cliente-nombre").value.trim();
    const placas = $("f-placas").value.trim();
    let digits = telRaw.replace(/\D/g, "");

    const callBtn = $("btn-call-client");
    const waBtn = $("btn-whatsapp-client");

    if (!digits) {
      callBtn.href = "tel:";
      waBtn.href = "https://wa.me/";
      callBtn.setAttribute("aria-disabled", "true");
      waBtn.setAttribute("aria-disabled", "true");
      return;
    }
    callBtn.removeAttribute("aria-disabled");
    waBtn.removeAttribute("aria-disabled");

    callBtn.href = "tel:" + digits;

    let waDigits = digits;
    if (waDigits.length === 10) waDigits = "52" + waDigits;
    const tallerNombre = (db && db.taller && db.taller.nombre) || "el taller";
    const msg = `Hola ${nombre || ""}, te contactamos de ${tallerNombre} sobre tu vehículo${placas ? " (placas " + placas + ")" : ""}.`
      .replace(/\s+/g, " ").trim();
    waBtn.href = `https://wa.me/${waDigits}?text=${encodeURIComponent(msg)}`;
  }

  $("f-cliente-tel").addEventListener("input", updateClientContactLinks);
  $("f-cliente-nombre").addEventListener("input", updateClientContactLinks);
  $("f-placas").addEventListener("input", updateClientContactLinks);

  /* ---------------- Mensaje de WhatsApp al marcar "listo para recoger" ---------------- */

  function buildWhatsAppListoLink({ nombre, telefono, marca, modelo, placas, costo }) {
    let phone = (telefono || "").replace(/\D/g, "");
    if (!phone) return null;
    if (phone.length === 10) phone = "52" + phone;
    const tallerNombre = (db && db.taller && db.taller.nombre) || "el taller";
    const costoTxt = costo ? `$${Number(costo).toLocaleString("es-MX")}` : "un monto por confirmar";
    const msg = `Hola ${nombre || ""}, tu vehículo ${marca || ""} ${modelo || ""} (placas ${placas || "N/A"}) ya está listo para recoger en ${tallerNombre}. El total a pagar es ${costoTxt}. Te esperamos!`
      .replace(/\s+/g, " ").trim();
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  // Muestra un enlace REAL de WhatsApp para que el usuario lo toque directamente.
  // (window.open()/confirm() se bloquean en muchos navegadores móviles si no
  // hay un clic directo del usuario justo antes; un <a href> siempre funciona.)
  function showWhatsAppPrompt(nombre, link, titulo) {
    closeWhatsAppPrompt();
    const overlay = document.createElement("div");
    overlay.id = "wa-prompt-overlay";
    overlay.className = "wa-prompt-overlay";
    overlay.innerHTML = `
      <div class="card wa-prompt-card">
        <div class="card-title">${esc(titulo || t("wa_prompt_titulo"))}</div>
        <p style="font-size:13.5px;color:var(--text-dim);margin:0 0 16px;">${esc(t("wa_prompt_pre"))} <strong style="color:var(--text);">${esc(nombre || t("cliente_label"))}</strong> ${esc(t("wa_prompt_post"))}</p>
        <div class="actions-row">
          ${link
            ? `<a class="btn" href="${link}" target="_blank" rel="noopener" id="wa-prompt-link">${esc(t("enviar_whatsapp_btn"))}</a>`
            : `<span style="color:var(--text-faint);font-size:12.5px;">${esc(t("wa_sin_telefono"))}</span>`}
          <button class="btn btn-outline" id="wa-prompt-dismiss">${esc(t("cerrar_btn"))}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    $("wa-prompt-dismiss").addEventListener("click", closeWhatsAppPrompt);
    const linkEl = $("wa-prompt-link");
    if (linkEl) linkEl.addEventListener("click", () => setTimeout(closeWhatsAppPrompt, 250));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeWhatsAppPrompt(); });
  }

  function closeWhatsAppPrompt() {
    const el = document.getElementById("wa-prompt-overlay");
    if (el) el.remove();
  }

  function offerWhatsAppListo(datos) {
    showWhatsAppPrompt(datos.nombre, buildWhatsAppListoLink(datos));
  }

  const TRACK_BASE_URL = "https://blaze151.github.io/taller-nfc/";

  function buildWhatsAppRecibidoLink({ nombre, telefono, marca, modelo, placas, id }) {
    let phone = (telefono || "").replace(/\D/g, "");
    if (!phone) return null;
    if (phone.length === 10) phone = "52" + phone;
    const tallerNombre = (db && db.taller && db.taller.nombre) || "el taller";
    const trackUrl = id ? `${TRACK_BASE_URL}?v=${encodeURIComponent(id)}` : TRACK_BASE_URL;
    const msg = `Hola ${nombre || ""}, tu vehículo ${marca || ""} ${modelo || ""} (placas ${placas || "N/A"}) fue recibido en ${tallerNombre}. Puedes checar el avance de tu servicio en cualquier momento en este enlace: ${trackUrl}`
      .replace(/[ \t]+/g, " ").trim();
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  function offerWhatsAppRecibido(datos) {
    showWhatsAppPrompt(datos.nombre, buildWhatsAppRecibidoLink(datos), t("wa_prompt_titulo_recibido"));
  }

  function buildHistoricalEntryFromActive(active, pending) {
    pending = pending || emptyPendingStruct();
    return {
      fecha: todayISO(),
      tipo: active.tipo,
      descripcion: active.descripcion,
      km: active.km,
      costo: active.costo,
      tecnico: active.tecnico,
      fecha_inicio: active.fecha_inicio,
      pago: active.pago ? { estado: active.pago.estado, metodo: active.pago.metodo } : null,
      adjuntos: JSON.parse(JSON.stringify(active.adjuntos || emptyPendingStruct())),
      _pendingAdjuntos: pending,
    };
  }

  /* ---------------- Editor de vehículo ---------------- */

  function clearEditorForm() {
    ["f-id", "f-placas", "f-marca", "f-modelo", "f-anio", "f-version", "f-color", "f-combustible",
     "f-vin", "f-km", "f-cliente-nombre", "f-cliente-tel", "f-aceite-tipo", "f-aceite-cap",
     "f-llantas", "f-bateria", "f-filtro-aire", "f-filtro-aceite"
    ].forEach((id) => { $(id).value = ""; });
  }

  function openEditor(id) {
    isNewVehicle = !id;
    currentVehicleId = id || null;
    clearEditorForm();

    const v = id ? db.vehicles[id] : {};
    const ficha = (v && v.ficha_tecnica) || {};

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
    updateClientContactLinks();

    $("f-aceite-tipo").value = ficha.aceite_tipo || "";
    $("f-aceite-cap").value = ficha.aceite_capacidad || "";
    $("f-llantas").value = ficha.presion_llantas || "";
    $("f-bateria").value = ficha.bateria || "";
    $("f-filtro-aire").value = ficha.filtro_aire || "";
    $("f-filtro-aceite").value = ficha.filtro_aceite || "";

    pendingServices = (v && v.servicios) ? v.servicios.slice() : [];
    svcActual = (v && v.servicio_actual) ? JSON.parse(JSON.stringify(v.servicio_actual)) : null;
    if (svcActual) {
      if (!svcActual.pago) svcActual.pago = { estado: "no_pagado", metodo: null };
      if (!svcActual.adjuntos) svcActual.adjuntos = emptyPendingStruct();
      if (!svcActual.adjuntos.pago) svcActual.adjuntos.pago = { fotos: [], documentos: [] };
      if (!svcActual.adjuntos.recogido) svcActual.adjuntos.recogido = { fotos: [], documentos: [] };
    }
    svcActualEstadoOriginal = svcActual ? svcActual.estado : null;
    svcActualPending = emptyPendingStruct();

    currentFotoPerfil = (v && v.foto_perfil) || null;
    vFotoPerfilPending = null;
    vFotoPerfilRemoved = false;
    currentDocumentosVehiculo = (v && v.documentos_vehiculo) ? JSON.parse(JSON.stringify(v.documentos_vehiculo)) : { fotos: [], documentos: [] };
    vDocsPending = { fotos: [], documentos: [] };

    renderServicesList();
    renderActiveServiceCard();
    renderVehiclePhotoPreview();
    renderVehicleDocsPreview();

    $("btn-delete").style.display = isNewVehicle ? "none" : "inline-flex";
    showView("editor");
  }

  /* ---------------- Foto de perfil del vehículo ---------------- */

  function renderVehiclePhotoPreview() {
    const el = $("vehicle-photo-preview");
    if (vFotoPerfilPending) {
      el.innerHTML = `<div class="vehicle-photo attach-thumb-remove" style="width:110px;height:110px;"><img src="${URL.createObjectURL(vFotoPerfilPending)}" alt=""><button type="button" id="btn-vphoto-remove" title="${esc(t('quitar_btn'))}">×</button></div>`;
    } else if (!vFotoPerfilRemoved && currentFotoPerfil) {
      el.innerHTML = `<div class="vehicle-photo attach-thumb-remove" style="width:110px;height:110px;"><img src="../${esc(currentFotoPerfil)}" alt=""><button type="button" id="btn-vphoto-remove" title="${esc(t('quitar_btn'))}">×</button></div>`;
    } else {
      el.innerHTML = `<div class="vehicle-photo" style="width:110px;height:110px;"><div class="vehicle-photo-placeholder">🚗</div></div>`;
    }
    const rmBtn = $("btn-vphoto-remove");
    if (rmBtn) {
      rmBtn.addEventListener("click", () => {
        vFotoPerfilPending = null;
        vFotoPerfilRemoved = true;
        renderVehiclePhotoPreview();
      });
    }
  }

  /* ---------------- Documentos generales del vehículo ---------------- */

  function renderVehicleDocsPreview() {
    const fotosEl = $("vdoc-fotos-preview");
    let fotosHtml = "";
    currentDocumentosVehiculo.fotos.forEach((path, i) => {
      fotosHtml += `<div class="attach-thumb attach-thumb-remove"><img src="../${esc(path)}" alt=""><button type="button" data-vdoc-remove-saved-foto="${i}" title="${esc(t('quitar_btn'))}">×</button></div>`;
    });
    vDocsPending.fotos.forEach((file, i) => {
      fotosHtml += `<div class="attach-thumb pending attach-thumb-remove"><img src="${URL.createObjectURL(file)}" alt=""><button type="button" data-vdoc-remove-pending-foto="${i}" title="${esc(t('quitar_btn'))}">×</button></div>`;
    });
    fotosEl.innerHTML = fotosHtml;

    const docsEl = $("vdoc-docs-preview");
    let docsHtml = "";
    currentDocumentosVehiculo.documentos.forEach((path, i) => {
      const name = decodeURIComponent(path.split("/").pop());
      docsHtml += `<span class="doc-chip">📄 ${esc(name)} <button type="button" class="doc-remove" data-vdoc-remove-saved-doc="${i}" title="${esc(t('quitar_btn'))}">×</button></span>`;
    });
    vDocsPending.documentos.forEach((file, i) => {
      docsHtml += `<span class="doc-chip pending">📄 ${esc(file.name)} <button type="button" class="doc-remove" data-vdoc-remove-pending-doc="${i}" title="${esc(t('quitar_btn'))}">×</button></span>`;
    });
    docsEl.innerHTML = docsHtml;

    fotosEl.querySelectorAll("[data-vdoc-remove-saved-foto]").forEach((b) => b.addEventListener("click", () => {
      currentDocumentosVehiculo.fotos.splice(Number(b.dataset.vdocRemoveSavedFoto), 1);
      renderVehicleDocsPreview();
    }));
    fotosEl.querySelectorAll("[data-vdoc-remove-pending-foto]").forEach((b) => b.addEventListener("click", () => {
      vDocsPending.fotos.splice(Number(b.dataset.vdocRemovePendingFoto), 1);
      renderVehicleDocsPreview();
    }));
    docsEl.querySelectorAll("[data-vdoc-remove-saved-doc]").forEach((b) => b.addEventListener("click", () => {
      currentDocumentosVehiculo.documentos.splice(Number(b.dataset.vdocRemoveSavedDoc), 1);
      renderVehicleDocsPreview();
    }));
    docsEl.querySelectorAll("[data-vdoc-remove-pending-doc]").forEach((b) => b.addEventListener("click", () => {
      vDocsPending.documentos.splice(Number(b.dataset.vdocRemovePendingDoc), 1);
      renderVehicleDocsPreview();
    }));
  }

  /* ---------------- Historial (solo lectura + quitar) ---------------- */

  function renderHistoryAttachmentsDetail(s) {
    let stagesHtml = "";
    ATTACH_STAGES.forEach((stage) => {
      const saved = (s.adjuntos && s.adjuntos[stage]) || { fotos: [], documentos: [] };
      if (!saved.fotos.length && !saved.documentos.length) return;
      const info = ESTADOS_SERVICIO()[stage] || PAGO_INFO();
      const fotosHtml = saved.fotos.map((path) => `<div class="attach-thumb"><img src="../${esc(path)}" alt=""></div>`).join("");
      const docsHtml = saved.documentos.map((path) => {
        const name = decodeURIComponent(path.split("/").pop());
        return `<a class="doc-chip" href="../${esc(path)}" target="_blank" rel="noopener">📄 ${esc(name)}</a>`;
      }).join("");
      stagesHtml += `
        <div style="margin-top:8px;">
          <div style="font-size:10.5px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">${info.icon} ${info.label}</div>
          ${fotosHtml ? `<div class="attach-gallery">${fotosHtml}</div>` : ""}
          ${docsHtml}
        </div>`;
    });

    // Compatibilidad con registros antiguos guardados como galería única (sin etapas)
    let legacyHtml = "";
    if (!s.adjuntos && ((s.fotos && s.fotos.length) || (s.documentos && s.documentos.length))) {
      const fotosHtml = (s.fotos || []).map((path) => `<div class="attach-thumb"><img src="../${esc(path)}" alt=""></div>`).join("");
      const docsHtml = (s.documentos || []).map((path) => {
        const name = decodeURIComponent(path.split("/").pop());
        return `<a class="doc-chip" href="../${esc(path)}" target="_blank" rel="noopener">📄 ${esc(name)}</a>`;
      }).join("");
      legacyHtml = `${fotosHtml ? `<div class="attach-gallery">${fotosHtml}</div>` : ""}${docsHtml}`;
    }

    if (!stagesHtml && !legacyHtml) return "";
    return `<details style="margin-top:8px;"><summary style="cursor:pointer;font-size:11.5px;color:var(--text-dim);">${esc(t("ver_fotos_por_etapa"))}</summary>${stagesHtml}${legacyHtml}</details>`;
  }

  function renderServicesList() {
    const list = $("services-list");
    const sorted = pendingServices.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    if (!sorted.length) {
      list.innerHTML = `<p style="color:var(--text-faint);font-size:13px;">${esc(t("sin_servicios_finalizados"))}</p>`;
      return;
    }
    list.innerHTML = sorted.map((s, i) => {
      let nFotos = (s.fotos || []).length;
      let nDocs = (s.documentos || []).length;
      ATTACH_STAGES.forEach((stage) => {
        nFotos += ((s.adjuntos && s.adjuntos[stage] && s.adjuntos[stage].fotos) || []).length;
        nFotos += ((s._pendingAdjuntos && s._pendingAdjuntos[stage] && s._pendingAdjuntos[stage].fotos) || []).length;
        nDocs += ((s.adjuntos && s.adjuntos[stage] && s.adjuntos[stage].documentos) || []).length;
        nDocs += ((s._pendingAdjuntos && s._pendingAdjuntos[stage] && s._pendingAdjuntos[stage].documentos) || []).length;
      });
      const chips = [];
      if (nFotos) chips.push(`<span class="tag">📷 ${nFotos}</span>`);
      if (nDocs) chips.push(`<span class="tag">📄 ${nDocs}</span>`);
      const pagoInfo = s.pago ? PAGO_ESTADOS()[s.pago.estado] : null;
      const pagoTxt = pagoInfo ? ` · ${pagoInfo.icon} ${pagoInfo.label}${s.pago.metodo ? " (" + (s.pago.metodo === "efectivo" ? t("metodo_efectivo") : t("metodo_transferencia")) + ")" : ""}` : "";
      return `
      <div class="vlist-item" style="cursor:default;display:block;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div class="vlist-item-title">${s.tipo || t("servicio_generico")} — ${s.fecha || ""}</div>
            <div class="vlist-item-sub">${s.km ? s.km + " km · " : ""}${s.tecnico || ""}${s.costo ? " · $" + Number(s.costo).toLocaleString("es-MX") : ""}${pagoTxt} ${chips.join(" ")}</div>
          </div>
          <button class="btn btn-outline btn-sm" data-remove="${i}">${esc(t("quitar_btn"))}</button>
        </div>
        ${renderHistoryAttachmentsDetail(s)}
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

  /* ---------------- Servicio en proceso ---------------- */

  function renderStageBlock(stage, infoOverride) {
    const info = infoOverride || ESTADOS_SERVICIO()[stage];
    const saved = (svcActual.adjuntos[stage]) || { fotos: [], documentos: [] };
    const pending = svcActualPending[stage];

    let fotosHtml = "";
    (saved.fotos || []).forEach((path, i) => {
      fotosHtml += `<div class="attach-thumb attach-thumb-remove"><img src="../${esc(path)}" alt=""><button type="button" data-remove-saved-foto="${stage}:${i}" title="${esc(t('quitar_btn'))}">×</button></div>`;
    });
    pending.fotos.forEach((file, i) => {
      fotosHtml += `<div class="attach-thumb pending attach-thumb-remove"><img src="${URL.createObjectURL(file)}" alt=""><button type="button" data-remove-pending-foto="${stage}:${i}" title="${esc(t('quitar_btn'))}">×</button></div>`;
    });

    let docsHtml = "";
    (saved.documentos || []).forEach((path, i) => {
      const name = decodeURIComponent(path.split("/").pop());
      docsHtml += `<span class="doc-chip">📄 ${esc(name)} <button type="button" class="doc-remove" data-remove-saved-doc="${stage}:${i}" title="${esc(t('quitar_btn'))}">×</button></span>`;
    });
    pending.documentos.forEach((file, i) => {
      docsHtml += `<span class="doc-chip pending">📄 ${esc(file.name)} <button type="button" class="doc-remove" data-remove-pending-doc="${stage}:${i}" title="${esc(t('quitar_btn'))}">×</button></span>`;
    });

    return `
      <details class="card-details" style="margin-top:14px;">
        <summary class="card-title">${info.icon} ${info.label} (${(saved.fotos||[]).length + pending.fotos.length + (saved.documentos||[]).length + pending.documentos.length})</summary>
        <div class="card-details-body">
          <div class="attach-input-row">
            <button type="button" class="btn btn-outline btn-sm" data-stage-camera="${stage}">${esc(t("tomar_foto"))}</button>
            <button type="button" class="btn btn-outline btn-sm" data-stage-gallery="${stage}">${esc(t("fototeca_btn"))}</button>
            <button type="button" class="btn btn-outline btn-sm" data-stage-pdf="${stage}">${esc(t("pdf_btn"))}</button>
            <input type="file" id="as-cam-${stage}" data-stage="${stage}" data-kind="foto" accept="image/*" capture="environment" style="display:none;">
            <input type="file" id="as-gal-${stage}" data-stage="${stage}" data-kind="foto" accept="image/*" multiple style="display:none;">
            <input type="file" id="as-pdf-${stage}" data-stage="${stage}" data-kind="pdf" accept="application/pdf" multiple style="display:none;">
          </div>
          <div class="attach-gallery">${fotosHtml}</div>
          <div>${docsHtml}</div>
        </div>
      </details>`;
  }

  function renderActiveServiceCard() {
    const container = $("active-service-container");

    if (!svcActual) {
      container.innerHTML = `
        <p style="color:var(--text-faint);font-size:13px;">${esc(t("no_hay_servicio_proceso"))}</p>
        <button class="btn btn-block" id="btn-start-service">${esc(t("iniciar_servicio_btn"))}</button>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid-2">
        <div class="form-group"><label class="form-label">${esc(t("tipo_servicio_label"))}</label><input type="text" id="as-tipo" value="${esc(svcActual.tipo || "")}"></div>
        <div class="form-group"><label class="form-label">${esc(t("kilometraje_label"))}</label><input type="number" id="as-km" value="${svcActual.km ?? ""}"></div>
        <div class="form-group"><label class="form-label">${esc(t("costo_estimado_label"))}</label><input type="number" id="as-costo" value="${svcActual.costo ?? ""}"></div>
        <div class="form-group"><label class="form-label">${esc(t("tecnico_label"))}</label><input type="text" id="as-tecnico" value="${esc(svcActual.tecnico || "")}"></div>
      </div>
      <div class="form-group">
        <label class="form-label">${esc(t("descripcion_label"))}</label>
        <textarea id="as-desc">${esc(svcActual.descripcion || "")}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">${esc(t("etapa_actual_label"))}</label>
        <select id="as-estado">
          ${ORDEN_ESTADOS_SERVICIO.map((k) => `<option value="${k}" ${k === svcActual.estado ? "selected" : ""}>${ESTADOS_SERVICIO()[k].icon} ${ESTADOS_SERVICIO()[k].label}</option>`).join("")}
        </select>
      </div>
      <div style="font-size:11px;color:var(--text-faint);margin-bottom:4px;">
        ${esc(t("iniciado_txt"))}: ${formatFechaCorta(svcActual.fecha_inicio)} · ${esc(t("actualizado_txt"))}: ${formatFechaCorta(svcActual.actualizado)}
      </div>

      ${ORDEN_ESTADOS_SERVICIO.map((stage) => renderStageBlock(stage)).join("")}

      <div style="margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06);">
        <div class="card-title">${esc(t("pago_titulo"))}</div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">${esc(t("estado_pago_label"))}</label>
            <select id="as-pago-estado">
              ${Object.keys(PAGO_ESTADOS()).map((k) => `<option value="${k}" ${k === svcActual.pago.estado ? "selected" : ""}>${PAGO_ESTADOS()[k].icon} ${PAGO_ESTADOS()[k].label}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${esc(t("metodo_pago_label"))}</label>
            <select id="as-pago-metodo">
              <option value="" ${!svcActual.pago.metodo ? "selected" : ""}>${esc(t("sin_especificar"))}</option>
              <option value="efectivo" ${svcActual.pago.metodo === "efectivo" ? "selected" : ""}>💵 ${esc(t("metodo_efectivo"))}</option>
              <option value="transferencia" ${svcActual.pago.metodo === "transferencia" ? "selected" : ""}>🏦 ${esc(t("metodo_transferencia"))}</option>
            </select>
          </div>
        </div>
        ${renderStageBlock("pago", PAGO_INFO())}
      </div>

      <div class="actions-row" style="margin-top:16px;">
        <button class="btn" id="btn-finalize-service">${esc(t("marcar_finalizado_btn"))}</button>
        <button class="btn btn-outline btn-danger" id="btn-cancel-service">${esc(t("cancelar_servicio_btn"))}</button>
      </div>
    `;
  }

  function readActiveServiceFieldsFromDom() {
    if (!svcActual) return;
    svcActual.tipo = $("as-tipo").value.trim();
    svcActual.descripcion = $("as-desc").value.trim();
    svcActual.km = $("as-km").value ? Number($("as-km").value) : null;
    svcActual.costo = $("as-costo").value ? Number($("as-costo").value) : null;
    svcActual.tecnico = $("as-tecnico").value.trim();
    if (!svcActual.pago) svcActual.pago = { estado: "no_pagado", metodo: null };
    if ($("as-pago-estado")) svcActual.pago.estado = $("as-pago-estado").value;
    if ($("as-pago-metodo")) svcActual.pago.metodo = $("as-pago-metodo").value || null;
    const nuevoEstado = $("as-estado").value;
    if (nuevoEstado !== svcActualEstadoOriginal) {
      svcActual.actualizado = todayISO();
      svcActualEstadoOriginal = nuevoEstado;
    }
    svcActual.estado = nuevoEstado;
  }

  function onStartServiceClick() {
    const today = todayISO();
    svcActual = {
      id: "svc_" + Date.now(),
      tipo: "", descripcion: "", km: null, costo: null, tecnico: "",
      fecha_inicio: today, estado: "recibido", actualizado: today,
      pago: { estado: "no_pagado", metodo: null },
      adjuntos: {
        recibido: { fotos: [], documentos: [] },
        en_proceso: { fotos: [], documentos: [] },
        listo: { fotos: [], documentos: [] },
        recogido: { fotos: [], documentos: [] },
        pago: { fotos: [], documentos: [] },
      },
    };
    svcActualEstadoOriginal = "recibido";
    svcActualPending = emptyPendingStruct();
    renderActiveServiceCard();
    offerWhatsAppRecibido({
      nombre: $("f-cliente-nombre").value.trim(),
      telefono: $("f-cliente-tel").value.trim(),
      marca: $("f-marca").value.trim(),
      modelo: $("f-modelo").value.trim(),
      placas: $("f-placas").value.trim(),
      id: $("f-id").value.trim(),
    });
  }

  function onCancelServiceClick() {
    if (!svcActual) return;
    if (!confirm(t("confirm_cancelar_servicio"))) return;
    svcActual = null;
    svcActualPending = emptyPendingStruct();
    renderActiveServiceCard();
  }

  function onFinalizeServiceClick() {
    if (!svcActual) return;
    readActiveServiceFieldsFromDom();
    if (!svcActual.tipo) {
      showToast(t("msg_indica_tipo_servicio"), "error");
      return;
    }
    if (!confirm(t("confirm_finalizar_servicio"))) return;

    pendingServices.unshift(buildHistoricalEntryFromActive(svcActual, svcActualPending));
    svcActual = null;
    svcActualPending = emptyPendingStruct();

    renderServicesList();
    renderActiveServiceCard();
    showToast(t("msg_servicio_finalizado"), "success");
  }

  /* Delegación de eventos dentro del contenedor del servicio activo */
  $("active-service-container").addEventListener("click", (e) => {
    if (e.target.id === "btn-start-service") return onStartServiceClick();
    if (e.target.id === "btn-finalize-service") return onFinalizeServiceClick();
    if (e.target.id === "btn-cancel-service") return onCancelServiceClick();

    const cam = e.target.closest("[data-stage-camera]");
    if (cam) { $(`as-cam-${cam.dataset.stageCamera}`).click(); return; }
    const gal = e.target.closest("[data-stage-gallery]");
    if (gal) { $(`as-gal-${gal.dataset.stageGallery}`).click(); return; }
    const pdf = e.target.closest("[data-stage-pdf]");
    if (pdf) { $(`as-pdf-${pdf.dataset.stagePdf}`).click(); return; }

    const rmSavedFoto = e.target.closest("[data-remove-saved-foto]");
    if (rmSavedFoto) {
      const [stage, idx] = rmSavedFoto.dataset.removeSavedFoto.split(":");
      readActiveServiceFieldsFromDom();
      svcActual.adjuntos[stage].fotos.splice(Number(idx), 1);
      renderActiveServiceCard();
      return;
    }
    const rmPendingFoto = e.target.closest("[data-remove-pending-foto]");
    if (rmPendingFoto) {
      const [stage, idx] = rmPendingFoto.dataset.removePendingFoto.split(":");
      readActiveServiceFieldsFromDom();
      svcActualPending[stage].fotos.splice(Number(idx), 1);
      renderActiveServiceCard();
      return;
    }
    const rmSavedDoc = e.target.closest("[data-remove-saved-doc]");
    if (rmSavedDoc) {
      const [stage, idx] = rmSavedDoc.dataset.removeSavedDoc.split(":");
      readActiveServiceFieldsFromDom();
      svcActual.adjuntos[stage].documentos.splice(Number(idx), 1);
      renderActiveServiceCard();
      return;
    }
    const rmPendingDoc = e.target.closest("[data-remove-pending-doc]");
    if (rmPendingDoc) {
      const [stage, idx] = rmPendingDoc.dataset.removePendingDoc.split(":");
      readActiveServiceFieldsFromDom();
      svcActualPending[stage].documentos.splice(Number(idx), 1);
      renderActiveServiceCard();
      return;
    }
  });

  $("active-service-container").addEventListener("change", (e) => {
    const t = e.target;

    if (t.id === "as-estado") {
      const prevEstado = svcActual.estado;
      readActiveServiceFieldsFromDom();
      renderActiveServiceCard();
      if (t.value === "listo" && prevEstado !== "listo") {
        offerWhatsAppListo({
          nombre: $("f-cliente-nombre").value.trim(),
          telefono: $("f-cliente-tel").value.trim(),
          marca: $("f-marca").value.trim(),
          modelo: $("f-modelo").value.trim(),
          placas: $("f-placas").value.trim(),
          costo: svcActual.costo,
        });
      } else if (t.value === "recibido" && prevEstado !== "recibido") {
        offerWhatsAppRecibido({
          nombre: $("f-cliente-nombre").value.trim(),
          telefono: $("f-cliente-tel").value.trim(),
          marca: $("f-marca").value.trim(),
          modelo: $("f-modelo").value.trim(),
          placas: $("f-placas").value.trim(),
          id: $("f-id").value.trim(),
        });
      }
      return;
    }

    if (!(t.tagName === "INPUT" && t.type === "file")) return;
    const stage = t.dataset.stage;
    const kind = t.dataset.kind;
    readActiveServiceFieldsFromDom();

    if (kind === "foto") {
      Array.from(t.files).forEach((f) => {
        if (f.type.startsWith("image/")) svcActualPending[stage].fotos.push(f);
      });
    } else if (kind === "pdf") {
      Array.from(t.files).forEach((f) => {
        if (f.type !== "application/pdf") { showToast(`${f.name} no es un PDF, se omitió`, "error"); return; }
        if (f.size > MAX_PDF_MB * 1024 * 1024) { showToast(`${f.name} pesa más de ${MAX_PDF_MB} MB, se omitió`, "error"); return; }
        svcActualPending[stage].documentos.push(f);
      });
    }
    t.value = "";
    renderActiveServiceCard();
  });

  /* ---------------- Eventos: foto de perfil y documentos del vehículo ---------------- */

  $("btn-vphoto-camera").addEventListener("click", () => $("vphoto-camera-input").click());
  $("btn-vphoto-gallery").addEventListener("click", () => $("vphoto-gallery-input").click());
  ["vphoto-camera-input", "vphoto-gallery-input"].forEach((id) => {
    $(id).addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        vFotoPerfilPending = file;
        vFotoPerfilRemoved = false;
        renderVehiclePhotoPreview();
      }
      e.target.value = "";
    });
  });

  $("btn-vdoc-camera").addEventListener("click", () => $("vdoc-camera-input").click());
  $("btn-vdoc-gallery").addEventListener("click", () => $("vdoc-gallery-input").click());
  $("btn-vdoc-pdf").addEventListener("click", () => $("vdoc-pdf-input").click());
  ["vdoc-camera-input", "vdoc-gallery-input"].forEach((id) => {
    $(id).addEventListener("change", (e) => {
      Array.from(e.target.files).forEach((f) => {
        if (f.type.startsWith("image/")) vDocsPending.fotos.push(f);
      });
      e.target.value = "";
      renderVehicleDocsPreview();
    });
  });
  $("vdoc-pdf-input").addEventListener("change", (e) => {
    Array.from(e.target.files).forEach((f) => {
      if (f.type !== "application/pdf") { showToast(`${f.name} no es un PDF, se omitió`, "error"); return; }
      if (f.size > MAX_PDF_MB * 1024 * 1024) { showToast(`${f.name} pesa más de ${MAX_PDF_MB} MB, se omitió`, "error"); return; }
      vDocsPending.documentos.push(f);
    });
    e.target.value = "";
    renderVehicleDocsPreview();
  });

  /* ---------------- Guardar / eliminar vehículo ---------------- */

  function buildVehicleFromForm() {
    const id = $("f-id").value.trim();
    if (!id) throw new Error(t("msg_id_nfc_obligatorio"));

    let servicioActualToSave = null;
    if (svcActual) {
      readActiveServiceFieldsFromDom();
      servicioActualToSave = {
        id: svcActual.id,
        tipo: svcActual.tipo,
        descripcion: svcActual.descripcion,
        km: svcActual.km,
        costo: svcActual.costo,
        tecnico: svcActual.tecnico,
        fecha_inicio: svcActual.fecha_inicio,
        estado: svcActual.estado,
        actualizado: svcActual.actualizado,
        pago: svcActual.pago,
        adjuntos: svcActual.adjuntos,
        _pendingAdjuntos: svcActualPending,
      };
    }

    return {
      id,
      foto_perfil: vFotoPerfilRemoved ? null : currentFotoPerfil,
      _pendingFotoPerfil: vFotoPerfilPending,
      documentos_vehiculo: {
        fotos: currentDocumentosVehiculo.fotos.slice(),
        documentos: currentDocumentosVehiculo.documentos.slice(),
      },
      _pendingDocumentosVehiculo: vDocsPending,
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
      servicio_actual: servicioActualToSave,
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
      showToast(t("msg_ya_existe_id"), "error");
      return;
    }
    if (currentVehicleId && currentVehicleId !== vehicle.id) {
      delete db.vehicles[currentVehicleId];
    }

    const btn = $("btn-save");
    btn.disabled = true;
    btn.textContent = t("guardando_btn");
    try {
      await uploadPendingAttachments(vehicle);
      await uploadPendingActiveServiceAttachments(vehicle);
      await uploadVehicleLevelAttachments(vehicle);

      db.vehicles[vehicle.id] = vehicle;
      const msg = isNewVehicle
        ? `Agregar vehículo ${vehicle.placas || vehicle.id}`
        : `Actualizar vehículo ${vehicle.placas || vehicle.id}`;
      await saveDatabase(msg);
      showToast(t("msg_cambios_guardados"), "success");
      btn.classList.add("btn-success-flash");
      btn.innerHTML = '<span class="check-pop">✓</span> Guardado';
      await new Promise((r) => setTimeout(r, 550));
      currentVehicleId = vehicle.id;
      isNewVehicle = false;
      renderDashboard($("search-box").value);
      showView("dashboard");
    } catch (err) {
      showToast(t("msg_error_guardar") + err.message, "error");
    } finally {
      btn.disabled = false;
      btn.classList.remove("btn-success-flash");
      btn.textContent = t("guardar_btn");
    }
  }

  async function deleteVehicle() {
    if (!currentVehicleId) return;
    if (!confirm(t("confirm_eliminar_vehiculo"))) return;

    delete db.vehicles[currentVehicleId];
    const btn = $("btn-delete");
    btn.disabled = true;
    try {
      await saveDatabase(`Eliminar vehículo ${currentVehicleId}`);
      showToast(t("msg_vehiculo_eliminado"), "success");
      renderDashboard($("search-box").value);
      showView("dashboard");
    } catch (err) {
      showToast(t("msg_error_eliminar") + err.message, "error");
    } finally {
      btn.disabled = false;
    }
  }

  /* ---------------- Eventos generales ---------------- */

  $("btn-connect").addEventListener("click", connect);
  $("btn-logout").addEventListener("click", logout);
  $("btn-back").addEventListener("click", () => showView("dashboard"));
  $("btn-new-vehicle").addEventListener("click", () => openEditor(null));
  $("btn-view-board").addEventListener("click", () => { renderBoard(); showView("board"); });
  $("btn-board-back").addEventListener("click", () => { renderDashboard($("search-box").value); showView("dashboard"); });
  $("btn-save").addEventListener("click", saveVehicle);
  $("btn-delete").addEventListener("click", deleteVehicle);
  $("search-box").addEventListener("input", (e) => renderDashboard(e.target.value));

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

  /* ---------------- Init ---------------- */

  (async function init() {
    $("cfg-owner").value = DEFAULT_OWNER;
    $("cfg-repo").value = DEFAULT_REPO;
    $("cfg-branch").value = DEFAULT_BRANCH;

    if (restoreSession()) {
      try {
        await loadDatabase();
        renderDashboard();
        showView("dashboard");
        return;
      } catch (err) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    showView("login");
  })();
})();
