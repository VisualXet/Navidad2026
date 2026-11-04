# 📋 Plan Detallado de Arquitectura y Ejecución — PWA Fiesta Empresarial de Navidad 2026 (18 de Diciembre)

---

## 0. Parámetros Confirmados del Proyecto

- **Evento:** Fiesta Empresarial de Navidad 2026
- **Fecha del Evento:** Viernes, **18 de diciembre de 2026**
- **Ubicación:** Instalaciones propias de la empresa
- **Cuenta GitHub:** `VisualXet`
- **Repositorio GitHub:** `Navidad2026` (`https://github.com/VisualXet/Navidad2026`)
- **URL GitHub Pages:** `https://visualxet.github.io/Navidad2026/`
- **PIN / Clave de Acceso (Desbloqueo AES-GCM):** `509066`
- **Equipo Organizador (4 Usuarios):**
  1. **TeTe** — *Gestión / Organización* (`#2563eb` Azul Ejecutivo)
  2. **Bea** — *Catering* (`#9333ea` Púrpura Catering)
  3. **Leli** — *Administración* (`#d97706` Ámbar Finanzas)
  4. **Jose** — *Cocina* (`#16a34a` Verde Cocina)
- **Sectores Transversales:**
  1. `Cocina`
  2. `Catering`
  3. `Administración`
  4. `Organización`

---

## 1. Verificación de Accesos y Auditoría del Entorno

- **Credenciales Localizadas en `f:/Compartida/Antigravity/Congresos`:**
  - Archivo raíz: `GitHub Token.txt`
  - Configuración JSON: `config/github_config.json`
  - Cliente de referencia: `core/github_client.py`
- **Estado de Conexión GitHub (`VisualXet`):**
  - Token Personal de Acceso activo y verificado mediante GitHub REST API v3 / MCP.

---

## 2. Arquitectura Seleccionada: Opción A (100% GitHub Pages + GitHub REST API + PWA)

### 2.1. Justificación Técnica
- **Cero Infraestructura Local que Mantener:** Sin necesidad de abrir puertos en el firewall ni mantener contenedores Docker activos en el NAS Synology.
- **Movilidad Total (iPhone, iPad, Tablets Android, Windows):** Funciona idénticamente en la red Wi-Fi de la empresa o desde el exterior con datos móviles 4G/5G comprando en proveedores.
- **Historial y Backups Inmutables:** Cada actualización sobre `data/db.json` queda versionada en el historial de commits de Git con fecha, hora y usuario que realizó el cambio.

### 2.2. Seguridad del Token en Repositorio Público (Cifrado AES-GCM con PIN `509066`)
Para evitar que GitHub Secret Scanning detecte y revoque el token personal de GitHub al subir el código al repositorio público:
1. El token `ghp_...` se cifra localmente con **Web Crypto API (`AES-GCM` 256-bit + `PBKDF2` SHA-256 con 100.000 iteraciones)** usando la clave/PIN **`509066`**.
2. En el código fuente sólo se almacena la carga cifrada (`salt`, `iv`, `ciphertext`), que es completamente opaca e indescifrable sin el PIN.
3. **Flujo de Primer Acceso:**
   - Cuando **TeTe, Bea, Leli o Jose** abren la aplicación en su iPhone, iPad o PC por primera vez, eligen su perfil de usuario e introducen el PIN **`509066`**.
   - El navegador desencripta el token en memoria y lo guarda de forma persistente en el `localStorage` del dispositivo (`navidad2026_auth`). En usos posteriores entra directamente sin volver a pedir el PIN.

### 2.3. Sincronización Concurrente sin Pérdida de Datos (4 Usuarios)
Implementación de **Control de Concurrencia Optimista con Fusión Inteligente por Entidad (Entity-Level Smart Merge)**:
1. **Lectura en Tiempo Real:** Las lecturas se realizan contra `GET /repos/VisualXet/Navidad2026/contents/data/db.json` con cabeceras anti-caché, obteniendo el contenido fresco y su hash `sha` actual.
2. **Atributos de Auditoría por Registro:** Cada ítem (`needs`, `tasks`, `schedule.preEvent`, `schedule.eventDay`, `budgetExtra`) posee su `id` único, `updatedAt` (ISO 8601) y `updatedBy` (`TeTe`, `Bea`, `Leli`, `Jose`), además de una lista de `deletedIds` para bajas.
3. **Resolución Transparente de Conflictos (`409 / 422 SHA Mismatch`):**
   - Si dos usuarios guardan cambios casi al mismo tiempo y el `sha` ha cambiado en el servidor, la aplicación descarga automáticamente el JSON remoto recién actualizado, **fusiona entidad por entidad** conservando el registro más reciente según `updatedAt`, y completa el guardado con el nuevo `sha` sin perder ningún dato.
4. **Soporte Offline / Caché Local:** Todos los datos se respaldan en `localStorage`. Si no hay cobertura temporalmente, permite seguir trabajando y sincroniza los cambios pendientes al recuperar la red.

---

## 3. Estructura del Modelo de Datos (`data/db.json`)

```json
{
  "meta": {
    "eventTitle": "Fiesta Empresarial de Navidad 2026",
    "eventDate": "2026-12-18",
    "location": "Instalaciones Propias",
    "version": 1,
    "lastUpdated": "2026-11-04T12:05:00Z",
    "lastUpdatedBy": "TeTe",
    "users": [
      { "id": "tete", "name": "TeTe", "role": "Gestión y Organización", "sector": "Organización", "color": "#2563eb", "avatar": "TT" },
      { "id": "bea", "name": "Bea", "role": "Responsable de Catering", "sector": "Catering", "color": "#9333ea", "avatar": "BE" },
      { "id": "leli", "name": "Leli", "role": "Administración y Presupuesto", "sector": "Administración", "color": "#d97706", "avatar": "LE" },
      { "id": "jose", "name": "Jose", "role": "Jefe de Cocina", "sector": "Cocina", "color": "#16a34a", "avatar": "JO" }
    ],
    "sectors": ["Cocina", "Catering", "Administración", "Organización"]
  },
  "needs": [],
  "tasks": [],
  "schedule": {
    "preEvent": [],
    "eventDay": []
  },
  "budgetExtra": [],
  "deletedIds": []
}
```

### Campos por Módulo:
1. **Necesidades, Logística y Proveedores (`needs`):**
   - `id`, `concept`, `category` (`Alimentación y Bebidas`, `Material y Mobiliario`, `Servicios y Personal`, `Espectáculo y Ambientación`), `subcategory`, `sector` (`Cocina`, `Catering`, `Administración`, `Organización`), `qtyNeeded`, `qtyConfirmed`, `unit`, `originType` (`Propio`, `Alquilado/Contratado`), `providerName`, `providerContact`, `responsibleId` (`tete`, `bea`, `leli`, `jose`), `status` (`Pendiente`, `Solicitado`, `Confirmado`, `En instalaciones`, `Completado`), `budgetEstimated`, `budgetReal`, `amountPaid`, `paymentStatus` (`Pendiente`, `Parcial`, `Pagado`), `notes`, `updatedAt`, `updatedBy`.
2. **Asignación y Seguimiento de Tareas (`tasks`):**
   - `id`, `title`, `description`, `sector`, `assignedTo` (`tete`, `bea`, `leli`, `jose`), `priority` (`Alta`, `Media`, `Baja`), `dueDate`, `status` (`Pendiente`, `En Curso`, `Completada`), `notes`, `updatedAt`, `updatedBy`.
3. **Planificación Temporal (`schedule.preEvent` y `schedule.eventDay`):**
   - **Pre-Evento (Días previos al 18 de diciembre):** `id`, `date`, `timeStart`, `timeEnd`, `title`, `sector`, `responsibleId`, `location`, `status` (`Pendiente`, `En Curso`, `Completado`), `notes`, `updatedAt`, `updatedBy`.
   - **Día del Evento (Escaleta 18 de diciembre minuto a minuto):** `id`, `timeStart`, `timeEnd`, `title`, `sector`, `responsibleId`, `location`, `status` (`Pendiente`, `En Curso`, `Completado`), `isMilestone`, `notes`, `updatedAt`, `updatedBy`.
4. **Control de Presupuesto y Costes (`needs` + `budgetExtra`):**
   - Combina automáticamente todas las partidas económicas de **Necesidades y Logística** más las partidas adicionales de **`budgetExtra`** (gastos administrativos, seguros, imprevistos, etc.).
   - Calcula en tiempo real por Sector y Global: **Coste Estimado**, **Coste Real/Aprobado**, **Desviación (€ y %)**, **Importe Pagado** y **Pendiente de Pago**.

---

## 4. Diseño de Interfaz (UI/UX), Multiplataforma e Impresión Dinámica

### 4.1. Experiencia Multiplataforma (PWA)
- **Escritorio Windows (Pantallas Grandes / Doble Monitor):** Sidebar lateral fija, barra superior de filtros transversales siempre visible, tarjetas KPI ejecutivas y tablas de datos completas con edición rápida de estados.
- **iPad / Tablets y iPhone / Android:**
  - `manifest.json` + Iconos Apple Touch + Meta tags `apple-mobile-web-app-capable` para instalar en pantalla de inicio como app nativa a pantalla completa.
  - Barra de navegación inferior ergonómica (*Bottom Navigation Bar*) en móvil y diseño adaptativo de tarjetas táctiles.

### 4.2. Filtros Transversales Globales
- Selector rápido en todas las vistas por:
  - **Sector:** `Todos` | `🍳 Cocina` | `🥂 Catering` | `📋 Administración` | `🎄 Organización`
  - **Responsable:** `Todos` | `TeTe` | `Bea` | `Leli` | `Jose` + Botón rápido `"Mis Asignaciones"`
  - **Estado / Categoría / Búsqueda de texto libre**

### 4.3. Impresión Inteligente (`@media print`) y Exportación
- **Impresión Dinámica A4 en Blanco y Negro / Escala de Grises:**
  - Imprime **exactamente la vista y filtros activos en pantalla** (ej. *"Necesidades de Cocina — Pendientes"* o *"Escaleta 18 Diciembre — Catering"*).
  - Oculta toda la interfaz de navegación y genera una cabecera formal de documento con los filtros aplicados, fecha de impresión, casillas de verificación `[ ]` para punteo manual en papel y tabla de totales.
- **Exportación / Importación:**
  - Exportación a **CSV / Excel** (con BOM UTF-8 para abrir directamente en Microsoft Excel con tildes y símbolo `€`) de la vista filtrada actual.
  - Exportación e importación de **Copia de Seguridad Completa (`.json`)**.

---

## 5. Hoja de Ruta de Desarrollo

1. **Fase 1:** Creación del repositorio `Navidad2026` en GitHub (`VisualXet`), generación del bloque cifrado AES-GCM con el PIN `509066` y carga de la base de datos inicial `data/db.json` con datos semilla adaptados al evento del 18 de diciembre de 2026.
2. **Fase 2:** Construcción del núcleo PWA (`index.html`, `manifest.json`, `sw.js`, iconos), motor de sincronización GitHub API con *Smart Merge* y barra global de filtros.
3. **Fase 3:** Implementación de los 5 módulos interactivos (Dashboard, Logística/Necesidades, Tareas de TeTe/Bea/Leli/Jose, Cronograma Doble Pre-Evento + 18 Dic, y Presupuesto).
4. **Fase 4:** Motor de impresión A4 `@media print`, exportación CSV/Excel + Backup JSON, despliegue en GitHub Pages y verificación final.
