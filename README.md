# Sistema NFC — Taller Mecánico

Sitio de dos partes:
- **`/index.html`** — página pública que se abre al escanear el NFC del vehículo.
- **`/admin/index.html`** — panel privado para agregar/editar vehículos y servicios.

Los datos viven en **`data/vehicles.json`**, que el panel de administración
actualiza directamente en GitHub mediante commits (no hay servidor ni base de
datos externa).

## 1. Subir el proyecto a GitHub

1. Crea un repositorio nuevo en GitHub (puede ser público o privado; si es
   privado, GitHub Pages sigue funcionando en cuentas Pro, o puedes usarlo
   público ya que `admin/` no muestra el token en ningún archivo).
2. Sube todos estos archivos y carpetas manteniendo la misma estructura:
   ```
   index.html
   admin/index.html
   admin/admin.js
   assets/style.css
   assets/app.js
   data/vehicles.json
   ```
3. Ve a **Settings → Pages**, en "Source" selecciona la rama `main` y carpeta
   `/ (root)`. Guarda. En unos minutos tu sitio estará en:
   `https://TU-USUARIO.github.io/TU-REPO/`

## 2. Crear el token de acceso para el panel de administración

1. En GitHub ve a **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. En "Repository access" elige **Only select repositories** y selecciona
   este repositorio (nunca "All repositories").
3. En "Permissions" busca **Contents** y ponlo en **Read and write**. No se
   necesita ningún otro permiso.
4. Genera el token y guárdalo en un lugar seguro (por ejemplo un gestor de
   contraseñas). GitHub solo lo muestra una vez.

## 3. Usar el panel de administración

1. Entra a `https://TU-USUARIO.github.io/TU-REPO/admin/`
2. Llena usuario, repositorio, rama (`main`) y pega el token.
3. Desde ahí puedes agregar vehículos, editar su ficha técnica y
   registrar servicios. Cada "Guardar cambios" crea un commit en el repo.

**Importante:** el token queda guardado en el navegador de tu dispositivo
(localStorage) hasta que presiones "Cerrar sesión" en el panel — así no
tienes que volver a escribirlo cada vez que entras. Úsalo solo en tu celular
o computadora del taller, nunca en un equipo compartido o público, y no
compartas la URL del panel ni el token fuera del taller.

## 4. Generar las etiquetas NFC

Cada etiqueta debe apuntar a una URL de este tipo:

```
https://TU-USUARIO.github.io/TU-REPO/?v=ID_DEL_VEHICULO
```

Donde `ID_DEL_VEHICULO` es el mismo "ID de la etiqueta NFC" que capturaste
en el panel de administración al crear el vehículo (por ejemplo `DEMO123`).
Escribe esa URL en el tag NFC (NTAG213/216) con cualquier app de escritura
NFC (ej. NFC Tools).

## 5. Vehículo de ejemplo

El archivo `data/vehicles.json` incluye un vehículo de demostración con ID
`DEMO123` para que puedas probar la página pública en:

```
https://TU-USUARIO.github.io/TU-REPO/?v=DEMO123
```

Bórralo desde el panel de administración cuando ya no lo necesites.

## 6. Fotos y documentos por servicio

Al agregar un servicio en el panel de administración puedes:
- **Tomar una foto** (abre la cámara del celular)
- **Subir desde la fototeca** (varias a la vez)
- **Subir un PDF** (factura, garantía, etc. — máximo 8 MB por archivo)

Las fotos se comprimen automáticamente en el navegador antes de subirse (máx.
1600px de lado, calidad ~75%) para no llenar el repositorio de archivos
pesados. Todo se guarda en una carpeta `uploads/ID_DEL_VEHICULO/` que se crea
sola dentro del repo, con un commit por cada archivo.

**Nota:** después de guardar, GitHub Pages tarda uno o dos minutos en
republicar el sitio, así que las fotos nuevas pueden tardar un momento en
verse en la ficha pública aunque el commit ya se haya hecho.

## 7. Servicio en proceso

Ahora el estado ya no es del vehículo en general, sino de un **servicio específico que se está realizando**. Cada vehículo puede tener un solo servicio activo a la vez, con 3 etapas:

**Recibido → En proceso → Listo para recoger**

- Mientras un servicio está activo, aparece en un apartado propio **"Servicio en proceso"** — tanto en la ficha del cliente (con su barra de progreso) como en el panel de administración — y **no aparece en "Último servicio" ni en el historial** hasta que se marca como finalizado.
- Es **editable en todo momento** mientras está activo: tipo, descripción, kilometraje, costo, técnico y su etapa.
- **Fotos y documentos quedan organizados por etapa**: puedes subir fotos de cómo llegó el vehículo, fotos de cuando se está trabajando, y fotos de cuando queda listo — cada tanda se guarda y se muestra por separado, tanto en el admin como en la ficha del cliente.
- Al presionar **"✅ Marcar como finalizado"**, el servicio se mueve al historial (con todas sus fotos/documentos ya fusionados) y deja de poder editarse — a partir de ahí es un registro permanente, igual que los servicios anteriores.
- Puedes iniciar un servicio nuevo con **"+ Iniciar nuevo servicio"**, o cambiar su etapa rápidamente desde el **Tablero** sin abrir el vehículo completo.

## 8. Foto de perfil y documentos generales del vehículo

Además de las fotos/documentos por servicio, cada vehículo ahora tiene:

- **Foto de perfil**: se captura o se sube al dar de alta o editar el vehículo, y aparece junto a las placas y el modelo tanto en el panel de administración como en la ficha del cliente.
- **Documentos del vehículo**: fotos o PDF que no están ligados a ningún servicio en particular (tarjeta de circulación, póliza de seguro, fotos generales, etc.). En la ficha del cliente se muestran dentro de un botón desplegable "📄 Documentos del vehículo", para no saturar la vista principal.

## 9. Costo, pago, "Entregado" y aviso por WhatsApp

- El **costo** del servicio se muestra en la ficha del cliente en cualquier etapa en la que esté capturado, para que el cliente siempre pueda ver cuánto va a pagar.
- Control de **pago**, independiente de la etapa del servicio: estado (No pagado / Pagado / A deber) y método (Efectivo / Transferencia), con su propia sección de fotos y documentos (ej. comprobante de transferencia). Se conserva al pasar al historial.
- El flujo del servicio ahora tiene 4 etapas: **Recibido → En proceso → Listo para recoger → Entregado**. "Entregado" se elige igual que las demás, desde el menú de etapa, y también tiene su propio espacio para fotos. El botón "✅ Marcar como finalizado" mueve el servicio al historial en cualquier momento (normalmente después de marcarlo como Entregado).
- En el editor del vehículo, debajo del teléfono del cliente, hay dos botones de contacto rápido: **📞 Llamar al cliente** y **💬 Enviar WhatsApp** (con un mensaje inicial ya redactado). Se actualizan automáticamente según el teléfono, nombre y placas capturados.
- Al cambiar la etapa a **"Listo para recoger"** (solo desde el editor completo del vehículo), aparece una ventana con un botón real de WhatsApp: al tocarlo abre WhatsApp con un mensaje ya redactado (saluda al cliente por su nombre, menciona el vehículo con placas, y el monto a pagar). Requiere que el vehículo tenga teléfono de cliente registrado (números de 10 dígitos se completan automáticamente con el código de país 52).

## 10. Tablero con gráficas

El Tablero (botón "📋 Ver tablero por estado") muestra gráficas de dona en vez de columnas de tarjetas:

- **Recibido** y **En proceso**: porcentaje de los servicios activos que están en esa etapa.
- **Listo para recoger**: muestra qué porcentaje del total de servicios activos está en esa fase (listo + entregado combinados), y ese mismo porcentaje se divide en dos verdes — cuántos ya fueron entregados y cuántos aún no — dejando el resto de las etapas en gris.
- **Pagos**: los tres estados de pago se reparten sobre el 100% de los servicios activos — Pagado (verde), A deber (amarillo) y No pagado (azul) — cada uno con su porcentaje real.
- **Sin servicio activo**: porcentaje de vehículos registrados que no tienen ningún servicio en curso.

Cada gráfica tiene un desplegable "Ver vehículos" debajo para ver el detalle y abrir cualquiera directamente en su editor.

## 11. Menús desplegables para ahorrar espacio

- En la ficha del cliente, las fotos/documentos de cada etapa del servicio (y del historial) se muestran como un desplegable con el conteo entre paréntesis, en vez de ocupar espacio siempre visibles.
- En el panel de administración, las secciones **"Datos del vehículo"**, **"Documentos del vehículo"** y **"Ficha técnica"** ahora son desplegables (tócalas para expandir/colapsar), y las fotos/documentos de cada etapa del servicio en proceso también se muestran colapsadas con su conteo, para que el editor no se sienta tan largo.

## Notas técnicas

- No hay backend: la parte pública lee `data/vehicles.json` directamente
  (fetch estático), y la parte de administración escribe ahí mismo usando
  la API de GitHub (Contents API).
- Como el archivo se reescribe completo en cada guardado, solo una persona
  debería editar a la vez para evitar conflictos de commit.
- Si en el futuro el catálogo de vehículos crece mucho, se puede migrar a
  una base de datos real (ej. Firebase) sin tocar el diseño de la página
  pública, solo el `admin.js`.

## 12. SEO, favicon y página 404

- **Favicon**: el logo ahora aparece como ícono de pestaña/marcador en ambas páginas (usa `assets/logo.png`, optimizado a 53 KB sin perder calidad).
- **Títulos y meta descripción**: cada página tiene un `<title>` con el nombre del taller y una meta descripción.
- **Open Graph**: la ficha del cliente ahora muestra una vista previa (logo, título, descripción) al compartir el enlace por WhatsApp o redes sociales.
- **Página 404 personalizada** (`404.html` en la raíz): si alguien entra a un enlace roto, ve una página con la identidad del taller en vez del error genérico de GitHub.
- **Número de versión**: aparece discreto en el pie de ambas páginas (`v1.0.0`).

## 13. Animaciones, rendimiento y soporte

- **Transiciones suaves**: las tarjetas aparecen con una animación al cargar, y las vistas del admin (login, lista, tablero, editor) tienen una transición al cambiar entre ellas.
- **Confirmación visual al guardar**: el botón "Guardar cambios en GitHub" se pone verde con una palomita (✓ Guardado) durante un momento, además del mensaje flotante de siempre.
- **Skeleton de carga**: mientras la ficha del cliente carga los datos del vehículo, se ve un esqueleto animado en vez de una pantalla en blanco.
- **Botón "Volver arriba"**: aparece flotando abajo a la derecha en cuanto haces scroll hacia abajo, en ambas páginas.
- **Archivos minificados para producción**: `assets/style.min.css`, `assets/app.min.js` y `admin/admin.min.js` son las versiones comprimidas que realmente carga el sitio (más rápidas de descargar). Los archivos originales (`style.css`, `app.js`, `admin.js`) se conservan sin minificar para que sean fáciles de seguir editando — si les haces cambios, vuelve a generar los `.min` correspondientes antes de subir (o pídemelo y te los regenero).
- **Botón de soporte** en el pie del panel de administración ("🛠️ Reportar un problema del sistema"): **te falta poner el número de WhatsApp real** donde quieres recibir esos reportes — está como marcador de posición en `admin/index.html`, búscalo y reemplázalo.
