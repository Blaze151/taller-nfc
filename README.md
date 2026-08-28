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



- No hay backend: la parte pública lee `data/vehicles.json` directamente
  (fetch estático), y la parte de administración escribe ahí mismo usando
  la API de GitHub (Contents API).
- Como el archivo se reescribe completo en cada guardado, solo una persona
  debería editar a la vez para evitar conflictos de commit.
- Si en el futuro el catálogo de vehículos crece mucho, se puede migrar a
  una base de datos real (ej. Firebase) sin tocar el diseño de la página
  pública, solo el `admin.js`.
