/**
 * NAVIDAD 2026 - PWA DE GESTIÓN INTEGRAL, LOGÍSTICA, CRONOGRAMA Y PRESUPUESTO
 * Arquitectura: GitHub Pages + GitHub REST API v3 (SHA Optimistic Concurrency + Smart Merge)
 * Usuarios: TeTe (Gestión), Bea (Catering), Leli (Administración), Jose (Cocina)
 */

const GITHUB_CONFIG = {
  owner: 'VisualXet',
  repo: 'Navidad2026',
  branch: 'main',
  dataPath: 'data/db.json',
  // Bóveda AES-GCM (256-bit, PBKDF2 100.000 iteraciones SHA-256) protegida con el PIN del equipo
  encryptedVault: {
    salt: 'Y+mdAs2mnA/5hVUsz/3w4w==',
    iv: 'N0IDn0vc0DvN9Zk2',
    data: '4r9f1VsLFxdheeG555WKAs5yeXWTuxlNHe58Q9/lCQnWSjCojyHF9tdBOLHcY2VdO9nx5GzjtNg='
  }
};

const STORAGE_KEYS = {
  TOKEN: 'navidad2026_gh_token',
  ACTIVE_USER: 'navidad2026_active_user',
  ACTIVE_USER_CUSTOM_NAME: 'navidad2026_active_user_custom_name',
  DB_CACHE: 'navidad2026_db_cache',
  LAST_SHA: 'navidad2026_last_sha',
  PENDING_SYNC: 'navidad2026_pending_sync',
  THEME: 'navidad2026_theme'
};

const DEFAULT_USERS = [
  {
    id: 'tete',
    name: 'TeTe',
    role: 'Gestión y Organización',
    sector: 'Organización',
    color: '#2563eb',
    avatar: 'TT'
  },
  {
    id: 'bea',
    name: 'Bea',
    role: 'Catering y Sala',
    sector: 'Catering',
    color: '#9333ea',
    avatar: 'BE'
  },
  {
    id: 'leli',
    name: 'Leli',
    role: 'Administración y Presupuesto',
    sector: 'Administración',
    color: '#d97706',
    avatar: 'LE'
  },
  {
    id: 'jose',
    name: 'Jose',
    role: 'Jefe de Cocina',
    sector: 'Cocina',
    color: '#16a34a',
    avatar: 'JO'
  }
];

const SECTORS = ['Cocina', 'Catering', 'Administración', 'Organización'];

const NEED_CATEGORIES = [
  'Alimentación y Bebidas',
  'Material y Mobiliario',
  'Servicios y Personal',
  'Espectáculo y Ambientación',
  'Ideas y Solicitudes'
];

const QUICK_ENTRY_TYPES = [
  {
    key: 'idea',
    icon: '💡',
    label: 'Idea / Propuesta',
    placeholder: 'Ej. Bingo musical navideño en la sobremesa, vídeo resumen del año...',
    category: 'Ideas y Solicitudes',
    subcategory: 'Idea / Propuesta',
    sector: 'Organización',
    originType: 'Propio',
    defaultUnit: 'propuesta'
  },
  {
    key: 'solicitud',
    icon: '🔔',
    label: 'Solicitud / Petición',
    placeholder: 'Ej. Menú vegetariano/celíaco, estufa exterior para terraza, taxi...',
    category: 'Ideas y Solicitudes',
    subcategory: 'Solicitud de Compañero',
    sector: 'Organización',
    originType: 'Contratado',
    defaultUnit: 'solicitud'
  },
  {
    key: 'comida',
    icon: '🍽️',
    label: 'Comida / Bebida',
    placeholder: 'Ej. Tabla de embutidos, sidra achampanada, croquetas caseras, hielo...',
    category: 'Alimentación y Bebidas',
    subcategory: 'Comida y Bebida',
    sector: 'Cocina',
    originType: 'Contratado',
    defaultUnit: 'uds'
  },
  {
    key: 'utensilios',
    icon: '🥄',
    label: 'Utensilios / Menaje',
    placeholder: 'Ej. Servilletas doradas, copas de balón, pinzas de hielo, bandejas...',
    category: 'Material y Mobiliario',
    subcategory: 'Utensilios y Menaje',
    sector: 'Catering',
    originType: 'Contratado',
    defaultUnit: 'ud'
  },
  {
    key: 'decoracion',
    icon: '🎄',
    label: 'Decoración',
    placeholder: 'Ej. Guirnalda luces cálidas, gorros Papá Noel, centro de mesa...',
    category: 'Espectáculo y Ambientación',
    subcategory: 'Decoración',
    sector: 'Organización',
    originType: 'Contratado',
    defaultUnit: 'ud'
  },
  {
    key: 'servicio',
    icon: '🚚',
    label: 'Servicio / Música',
    placeholder: 'Ej. Fotomatón, canción para el DJ, limpieza extra, transporte...',
    category: 'Servicios y Personal',
    subcategory: 'Servicios y Apoyo',
    sector: 'Organización',
    originType: 'Contratado',
    defaultUnit: 'servicio'
  }
];

const INITIAL_PACKAGING_STOCK = [
  { id: 'stock_pkg_01', concept: 'Cartucho cartón', qty: 52, unit: 'ud', sector: 'Catering', responsibleId: 'bea', notes: 'Inventario packaging disponible del año pasado.' },
  { id: 'stock_pkg_02', concept: 'Barquetas pino', qty: 54, unit: 'ud', sector: 'Catering', responsibleId: 'bea', notes: 'Inventario packaging disponible del año pasado.' },
  { id: 'stock_pkg_03', concept: 'Cuencos bambú', qty: 44, unit: 'ud', sector: 'Catering', responsibleId: 'bea', notes: 'Inventario packaging disponible del año pasado.' },
  { id: 'stock_pkg_04', concept: 'Mini cuchara negra plástico', qty: 50, unit: 'ud', sector: 'Catering', responsibleId: 'bea', notes: 'Inventario packaging disponible del año pasado.' },
  { id: 'stock_pkg_05', concept: 'Mini tenedor plástico negro', qty: 100, unit: 'ud aprox', sector: 'Catering', responsibleId: 'bea', notes: 'Cantidad aproximada (100 ud aprox). Inventario packaging del año pasado.' },
  { id: 'stock_pkg_06', concept: 'Cuchara negra plástico compostable', qty: 100, unit: 'ud', sector: 'Catering', responsibleId: 'bea', notes: 'Plástico compostable. Inventario packaging del año pasado.' },
  { id: 'stock_pkg_07', concept: 'Tenedor plástico compostable', qty: 120, unit: 'ud aprox', sector: 'Catering', responsibleId: 'bea', notes: 'Plástico compostable (120 ud aprox). Inventario packaging del año pasado.' },
  { id: 'stock_pkg_08', concept: 'Vasito truncado transparente', qty: 120, unit: 'ud', sector: 'Catering', responsibleId: 'bea', notes: 'Inventario packaging disponible del año pasado.' },
  { id: 'stock_pkg_09', concept: 'Pajitas cocktail negras papel cortas', qty: 250, unit: 'ud', sector: 'Catering', responsibleId: 'bea', notes: 'Inventario packaging disponible del año pasado.' },
  { id: 'stock_pkg_10', concept: 'Brochetas 19 cm', qty: 400, unit: 'ud', sector: 'Cocina', responsibleId: 'jose', notes: 'Brochetas de 19 cms. Inventario packaging del año pasado.' },
  { id: 'stock_pkg_11', concept: 'Vasos cartón 200 ml', qty: 50, unit: 'ud', sector: 'Catering', responsibleId: 'bea', notes: 'Inventario packaging disponible del año pasado.' },
  { id: 'stock_pkg_12', concept: 'Platito cuenco (Sodo) negro', qty: 102, unit: 'ud', sector: 'Catering', responsibleId: 'bea', notes: 'Inventario packaging disponible del año pasado.' },
  { id: 'stock_pkg_13', concept: 'Brocheta bambú 15 cm', qty: 200, unit: 'ud', sector: 'Cocina', responsibleId: 'jose', notes: 'Brocheta bambú 15 cms. Inventario packaging del año pasado.' },
  { id: 'stock_pkg_14', concept: 'Bandejas bambú medianas', qty: 10, unit: 'ud', sector: 'Catering', responsibleId: 'bea', notes: 'Inventario packaging disponible del año pasado.' },
  { id: 'stock_pkg_15', concept: 'Pinzas bambú', qty: 19, unit: 'ud', sector: 'Cocina', responsibleId: 'jose', notes: 'Inventario packaging disponible del año pasado.' }
];

const NEED_STATUSES = [
  'Pendiente',
  'Solicitado',
  'Confirmado',
  'En instalaciones',
  'Completado'
];

const TASK_STATUSES = ['Pendiente', 'En Curso', 'Completada'];
const SCHEDULE_STATUSES = ['Pendiente', 'En Curso', 'Completado'];
const PAYMENT_STATUSES = ['Pendiente', 'Parcial', 'Pagado'];

const App = {
  db: null,
  currentView: 'dashboard',
  quickTab: 'aportar', // 'aportar' | 'stock'
  quickEntryType: 'idea',
  quickSearchStock: '',
  quickFilterType: 'ALL',
  quickToastMessage: '',
  activeUserId: localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) || 'tete',
  customUserName: localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_CUSTOM_NAME) || '',
  theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'light',
  ghToken: localStorage.getItem(STORAGE_KEYS.TOKEN) || '',
  lastSha: localStorage.getItem(STORAGE_KEYS.LAST_SHA) || null,
  hasPendingSync: localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) === 'true',
  isSyncing: false,

  filters: {
    sector: 'ALL',
    user: 'ALL',
    status: 'ALL',
    search: '',
    needCategory: 'ALL',
    needOrigin: 'ALL',
    taskPriority: 'ALL',
    schedulePhase: 'ALL', // ALL | preEvent | eventDay
    paymentStatus: 'ALL'
  },

  editingContext: null, // { type: 'need'|'task'|'preEvent'|'eventDay'|'budgetExtra', id: string|null }

  /* ========================================================================
     1. INICIALIZACIÓN Y CICLO DE VIDA PWA
     ======================================================================== */
  async init() {
    this.applyTheme();
    this.registerServiceWorker();
    this.updateCountdown();

    // Cargar caché local inmediata si existe
    const cachedRaw = localStorage.getItem(STORAGE_KEYS.DB_CACHE);
    if (cachedRaw) {
      try {
        this.db = JSON.parse(cachedRaw);
      } catch (e) {
        console.warn('Error leyendo caché local:', e);
      }
    }

    // Si aún no hay caché local, cargar semilla local ./data/db.json
    if (!this.db) {
      await this.loadLocalSeed();
    }

    // Garantizar que el inventario de packaging del año pasado esté cargado
    this.ensurePackagingStockLoaded();

    // En teléfonos, tablets o en movil.html abrir directamente la vista sencilla para compañeros
    const isSimplePage = document.body && document.body.dataset.mode === 'movil-only';
    const isMobileOrTablet = window.innerWidth <= 1024 || location.search.includes('modo=movil');
    if (isSimplePage || isMobileOrTablet) {
      this.currentView = 'quick';
    }

    this.updateUserUI();
    this.setView(this.currentView);

    // Preparar impresión dinámica también cuando el usuario pulsa Ctrl+P / Cmd+P
    window.addEventListener('beforeprint', () => {
      this.buildPrintDocument();
    });

    // Sincronizar con GitHub si hay token disponible; si no, mostrar modal de bienvenida/PIN
    if (this.ghToken) {
      await this.syncNow(false);
    } else {
      this.setSyncIndicator('pending', 'Activar PIN Sync');
      setTimeout(() => this.openAuthModal(), 400);
    }

    // Auto-refresco al volver a la pestaña o cada 45 segundos
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.ghToken && !this.isSyncing) {
        this.syncNow(false);
      }
    });

    setInterval(() => {
      if (this.ghToken && !this.isSyncing && document.visibilityState === 'visible') {
        this.syncNow(false);
      }
    }, 45000);
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('SW no registrado:', err);
      });
    }
  },

  applyTheme() {
    const isDark = this.theme === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (document.body) {
      document.body.classList.toggle('dark-theme', isDark);
    }
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = isDark ? '☀️ Claro' : '🌙 Oscuro';
      btn.title = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    }
  },

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEYS.THEME, this.theme);
    this.applyTheme();
  },

  updateCountdown() {
    const badge = document.getElementById('countdown-badge');
    if (!badge) return;
    const eventDate = new Date('2026-12-18T13:30:00');
    const now = new Date();
    const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      badge.innerHTML = `🎄 Faltan <strong>${diffDays} días</strong> · 18 Dic 2026`;
    } else if (diffDays === 0) {
      badge.innerHTML = `🥂 ¡HOY ES EL EVENTO! · 18 Dic 2026`;
    } else {
      badge.innerHTML = `🎄 Evento 18 Dic 2026`;
    }
  },

  async loadLocalSeed() {
    try {
      const res = await fetch(`./data/db.json?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        this.db = await res.json();
        this.saveToLocalCache();
        return;
      }
    } catch (err) {
      console.warn('Semilla por fetch no disponible (ej. file://), usando base inicial integrada:', err);
    }

    if (!this.db) {
      this.db = {
        meta: {
          eventTitle: 'Fiesta Empresarial de Navidad 2026',
          eventSubtitle: 'Celebración Anual en Instalaciones Propias',
          eventDate: '2026-12-18',
          location: 'Instalaciones Centrales de la Empresa',
          estimatedGuests: 85,
          version: 1,
          lastUpdated: '2026-11-04T12:08:00Z',
          lastUpdatedBy: 'TeTe',
          users: DEFAULT_USERS,
          sectors: SECTORS
        },
        needs: [],
        tasks: [],
        schedule: { preEvent: [], eventDay: [] },
        budgetExtra: [],
        deletedIds: []
      };
    }
  },

  saveToLocalCache() {
    if (!this.db) return;
    localStorage.setItem(STORAGE_KEYS.DB_CACHE, JSON.stringify(this.db));
  },

  ensurePackagingStockLoaded() {
    if (!this.db) return;
    this.db.needs = this.db.needs || [];
    const deletedSet = new Set(this.db.deletedIds || []);
    let added = false;

    for (const s of INITIAL_PACKAGING_STOCK) {
      if (deletedSet.has(s.id)) continue;
      const exists = this.db.needs.some((n) => n.id === s.id);
      if (!exists) {
        this.db.needs.push({
          id: s.id,
          concept: s.concept,
          category: 'Material y Mobiliario',
          subcategory: 'Inventario Packaging (Stock)',
          sector: s.sector,
          qtyNeeded: s.qty,
          qtyConfirmed: s.qty,
          unit: s.unit,
          originType: 'Propio',
          providerName: 'Stock Propio (Año pasado)',
          providerContact: 'Almacén interno',
          responsibleId: s.responsibleId,
          status: 'En instalaciones',
          budgetEstimated: 0,
          budgetReal: 0,
          amountPaid: 0,
          paymentStatus: 'Pagado',
          notes: s.notes,
          updatedAt: '2026-11-05T15:55:00Z',
          updatedBy: 'TeTe'
        });
        added = true;
      }
    }

    if (added) {
      this.saveToLocalCache();
    }
  },

  /* ========================================================================
     2. SEGURIDAD AES-GCM (DESBLOQUEO CON PIN DE EQUIPO) Y PERFIL DE USUARIO
     ======================================================================== */
  base64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  },

  async decryptTokenWithPin(pinCode) {
    const cleanPin = (pinCode || '').trim();
    if (cleanPin.startsWith('ghp_') || cleanPin.startsWith('github_pat_')) {
      return cleanPin;
    }

    const enc = new TextEncoder();
    const salt = this.base64ToBytes(GITHUB_CONFIG.encryptedVault.salt);
    const iv = this.base64ToBytes(GITHUB_CONFIG.encryptedVault.iv);
    const ciphertext = this.base64ToBytes(GITHUB_CONFIG.encryptedVault.data);

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(cleanPin),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer).trim();
  },

  getUsers() {
    const dbUsers = this.db && this.db.meta && Array.isArray(this.db.meta.users) ? this.db.meta.users : [];
    return dbUsers.length ? dbUsers : DEFAULT_USERS;
  },

  getUserById(userId) {
    const users = this.getUsers();
    const found =
      users.find((u) => u.id === userId) ||
      DEFAULT_USERS.find((u) => u.id === userId) ||
      DEFAULT_USERS[0];
    if (userId === this.activeUserId && this.customUserName && this.customUserName.trim()) {
      const custom = this.customUserName.trim();
      return {
        ...found,
        name: custom,
        avatar: custom.slice(0, 2).toUpperCase()
      };
    }
    return found;
  },

  updateUserUI() {
    const u = this.getUserById(this.activeUserId);
    const avatarEl = document.getElementById('sidebar-user-avatar');
    const nameEl = document.getElementById('sidebar-user-name');
    const topbarUserEl = document.getElementById('topbar-user-label');

    if (avatarEl) {
      avatarEl.style.background = u.color;
      avatarEl.textContent = u.avatar;
    }
    if (nameEl) {
      nameEl.textContent = `${u.name} (${u.sector})`;
    }
    if (topbarUserEl) {
      topbarUserEl.textContent = u.name;
    }
  },

  renderAuthUserGrid() {
    const grid = document.getElementById('auth-user-grid');
    if (!grid) return;
    const users = this.getUsers();
    grid.innerHTML = users
      .map((u) => {
        const isSel = u.id === this.activeUserId;
        return `
          <button type="button"
            class="btn ${isSel ? 'btn-dark' : 'btn-secondary'}"
            style="justify-content:flex-start;padding:10px 12px;border-width:2px;${isSel ? `border-color:${u.color}` : ''}"
            onclick="App.selectUserInModal('${u.id}')">
            <span class="user-chip-dot" style="background:${u.color};width:24px;height:24px;">${u.avatar}</span>
            <div style="text-align:left;line-height:1.2;">
              <div style="font-weight:800;font-size:13px;">${u.name}${isSel ? ' ✓' : ''}</div>
              <div style="font-size:11px;opacity:0.85;">${u.sector}</div>
            </div>
          </button>
        `;
      })
      .join('');
  },

  openAuthModal() {
    const modal = document.getElementById('auth-modal');
    const statusBox = document.getElementById('auth-status-box');
    const pinInput = document.getElementById('auth-pin-input');
    const nameInput = document.getElementById('auth-user-name-input');

    this.renderAuthUserGrid();

    if (nameInput) {
      const currentU = this.getUserById(this.activeUserId);
      nameInput.value = currentU.name;
    }

    if (pinInput) {
      pinInput.value = '';
    }

    if (this.ghToken) {
      statusBox.style.background = '#dcfce7';
      statusBox.style.borderColor = '#86efac';
      statusBox.style.color = '#166534';
      statusBox.innerHTML = `✅ <strong>Sincronización GitHub Activa</strong> en este dispositivo (Repositorio <code>${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}</code>). Deja el PIN en blanco si solo quieres cambiar de usuario.`;
    } else {
      statusBox.style.background = '#fef3c7';
      statusBox.style.borderColor = '#fcd34d';
      statusBox.style.color = '#92400e';
      statusBox.innerHTML = `🔑 Selecciona o escribe <strong>quién eres</strong> arriba e introduce el <strong>PIN de equipo</strong> para activar la sincronización en vivo con GitHub.`;
    }

    modal.classList.add('open');
  },

  selectUserInModal(userId) {
    this.activeUserId = userId;
    this.customUserName = '';
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, userId);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_CUSTOM_NAME);

    const nameInput = document.getElementById('auth-user-name-input');
    const baseUser = this.getUsers().find((u) => u.id === userId) || DEFAULT_USERS[0];
    if (nameInput && baseUser) {
      nameInput.value = baseUser.name;
    }

    this.renderAuthUserGrid();
    this.updateUserUI();
    this.render();
  },

  handleUserNameInput(rawVal) {
    const val = (rawVal || '').trim();
    const norm = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const users = this.getUsers();
    const matched = users.find(
      (u) =>
        u.id.toLowerCase() === norm ||
        u.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === norm
    );

    if (matched) {
      this.activeUserId = matched.id;
      this.customUserName = '';
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, matched.id);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_CUSTOM_NAME);
    } else if (val) {
      this.customUserName = val;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_CUSTOM_NAME, val);
    } else {
      this.customUserName = '';
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_CUSTOM_NAME);
    }

    this.renderAuthUserGrid();
    this.updateUserUI();
    this.render();
  },

  closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('open');
  },

  async saveAuthModal(e) {
    e.preventDefault();
    const pinInput = document.getElementById('auth-pin-input');
    const statusBox = document.getElementById('auth-status-box');
    const pinVal = pinInput.value.trim();

    if (pinVal) {
      try {
        const decryptedToken = await this.decryptTokenWithPin(pinVal);
        if (!decryptedToken.startsWith('ghp_') && !decryptedToken.startsWith('github_pat_')) {
          throw new Error('Token desencriptado inválido');
        }
        this.ghToken = decryptedToken;
        localStorage.setItem(STORAGE_KEYS.TOKEN, decryptedToken);
        statusBox.style.background = '#dcfce7';
        statusBox.style.borderColor = '#86efac';
        statusBox.style.color = '#166534';
        statusBox.innerHTML = `✅ ¡PIN correcto! Sincronizando con GitHub...`;
        await this.syncNow(true);
        setTimeout(() => this.closeAuthModal(), 500);
      } catch (err) {
        statusBox.style.background = '#fee2e2';
        statusBox.style.borderColor = '#fca5a5';
        statusBox.style.color = '#991b1b';
        statusBox.innerHTML = `❌ PIN incorrecto. Verifica los 6 dígitos e inténtalo de nuevo.`;
      }
    } else {
      this.closeAuthModal();
      this.render();
    }
  },

  /* ========================================================================
     3. MOTOR DE SINCRONIZACIÓN GITHUB API + SMART MERGE (4 USUARIOS)
     ======================================================================== */
  setSyncIndicator(state, text) {
    const el = document.getElementById('sync-status-btn');
    const txt = document.getElementById('sync-status-text');
    if (!el || !txt) return;
    el.className = `sync-indicator ${state}`;
    txt.textContent = text;
  },

  utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  },

  base64ToUtf8(b64) {
    const clean = b64.replace(/\s/g, '');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  },

  /**
   * Fusiona dos estados de la base de datos registro por registro usando `updatedAt` y `deletedIds`
   * para evitar que ninguno de los 4 organizadores pise el trabajo de otro.
   */
  smartMergeDatabases(localDb, remoteDb) {
    if (!remoteDb) return localDb;
    if (!localDb) return remoteDb;

    const deletedSet = new Set([
      ...(localDb.deletedIds || []),
      ...(remoteDb.deletedIds || [])
    ]);

    const mergeArrayById = (arrA = [], arrB = []) => {
      const map = new Map();
      for (const item of arrB) {
        if (item && item.id && !deletedSet.has(item.id)) {
          map.set(item.id, item);
        }
      }
      for (const item of arrA) {
        if (!item || !item.id || deletedSet.has(item.id)) continue;
        const existing = map.get(item.id);
        if (!existing) {
          map.set(item.id, item);
        } else {
          const timeA = Date.parse(item.updatedAt || '2000-01-01T00:00:00Z') || 0;
          const timeB = Date.parse(existing.updatedAt || '2000-01-01T00:00:00Z') || 0;
          if (timeA >= timeB) {
            map.set(item.id, item);
          }
        }
      }
      return Array.from(map.values());
    };

    const mergedNeeds = mergeArrayById(localDb.needs, remoteDb.needs);
    const mergedTasks = mergeArrayById(localDb.tasks, remoteDb.tasks);
    const mergedPre = mergeArrayById(
      localDb.schedule && localDb.schedule.preEvent,
      remoteDb.schedule && remoteDb.schedule.preEvent
    ).sort((a, b) => `${a.date || ''} ${a.timeStart || ''}`.localeCompare(`${b.date || ''} ${b.timeStart || ''}`));

    const mergedEventDay = mergeArrayById(
      localDb.schedule && localDb.schedule.eventDay,
      remoteDb.schedule && remoteDb.schedule.eventDay
    ).sort((a, b) => (a.timeStart || '').localeCompare(b.timeStart || ''));

    const mergedBudgetExtra = mergeArrayById(localDb.budgetExtra, remoteDb.budgetExtra);

    const localMetaTime = Date.parse((localDb.meta && localDb.meta.lastUpdated) || '2000-01-01') || 0;
    const remoteMetaTime = Date.parse((remoteDb.meta && remoteDb.meta.lastUpdated) || '2000-01-01') || 0;

    return {
      meta: localMetaTime >= remoteMetaTime ? { ...remoteDb.meta, ...localDb.meta } : { ...localDb.meta, ...remoteDb.meta },
      needs: mergedNeeds,
      tasks: mergedTasks,
      schedule: {
        preEvent: mergedPre,
        eventDay: mergedEventDay
      },
      budgetExtra: mergedBudgetExtra,
      deletedIds: Array.from(deletedSet).slice(-300)
    };
  },

  async fetchRemoteDb() {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataPath}?ref=${GITHUB_CONFIG.branch}&t=${Date.now()}`;
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (this.ghToken) {
      headers.Authorization = `Bearer ${this.ghToken}`;
    }

    const res = await fetch(url, { headers, cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const payload = await res.json();
    const jsonStr = this.base64ToUtf8(payload.content);
    const remoteDb = JSON.parse(jsonStr);
    return { remoteDb, sha: payload.sha };
  },

  async syncNow(pushIfPending = true) {
    if (!this.ghToken) {
      this.openAuthModal();
      return;
    }
    if (this.isSyncing) return;

    this.isSyncing = true;
    this.setSyncIndicator('syncing', 'Sincronizando...');

    try {
      const { remoteDb, sha } = await this.fetchRemoteDb();
      this.lastSha = sha;
      localStorage.setItem(STORAGE_KEYS.LAST_SHA, sha);

      if (this.hasPendingSync) {
        this.db = this.smartMergeDatabases(this.db, remoteDb);
        this.saveToLocalCache();
        if (pushIfPending) {
          await this.pushToGitHub('Sincronización automática de cambios pendientes');
        }
      } else {
        this.db = this.smartMergeDatabases(remoteDb, this.db);
        this.saveToLocalCache();
        this.setSyncIndicator('synced', 'Sincronizado');
      }

      this.render();

      // Si estamos en el ordenador local y hay cambios de código web pendientes de subir a GitHub Pages, publicarlos automáticamente
      if (location.hostname !== 'visualxet.github.io' && window.NAVIDAD_WEB_BUNDLE) {
        const pushedVer = localStorage.getItem('navidad2026_pushed_web_version');
        if (pushedVer !== window.NAVIDAD_WEB_BUNDLE.version) {
          this.publishWebToGitHub(true);
        }
      }
    } catch (err) {
      console.warn('No se pudo conectar con GitHub API:', err);
      this.setSyncIndicator(
        this.hasPendingSync ? 'pending' : 'error',
        this.hasPendingSync ? 'Guardado local (Pendiente)' : 'Modo Offline'
      );
    } finally {
      this.isSyncing = false;
    }
  },

  async commitChange(actionDescription) {
    const u = this.getUserById(this.activeUserId);
    const nowIso = new Date().toISOString();
    this.db.meta.lastUpdated = nowIso;
    this.db.meta.lastUpdatedBy = u.name;
    this.db.meta.version = (this.db.meta.version || 1) + 1;

    this.hasPendingSync = true;
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, 'true');
    this.saveToLocalCache();
    this.render();

    if (!this.ghToken) {
      this.setSyncIndicator('pending', 'Guardado local (Falta PIN)');
      return;
    }

    await this.pushToGitHub(`[${u.name}] ${actionDescription}`);
  },

  async pushToGitHub(commitMessage, retryCount = 0) {
    this.isSyncing = true;
    this.setSyncIndicator('syncing', 'Guardando en nube...');

    try {
      // Si no tenemos sha aún, obtener el actual primero
      if (!this.lastSha) {
        const remote = await this.fetchRemoteDb();
        this.lastSha = remote.sha;
        this.db = this.smartMergeDatabases(this.db, remote.remoteDb);
      }

      const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataPath}`;
      const contentFormatted = JSON.stringify(this.db, null, 2);
      const body = {
        message: commitMessage,
        content: this.utf8ToBase64(contentFormatted),
        Branch: GITHUB_CONFIG.branch,
        branch: GITHUB_CONFIG.branch,
        sha: this.lastSha
      };

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.ghToken}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify(body)
      });

      if (res.status === 200 || res.status === 201) {
        const data = await res.json();
        this.lastSha = data.content.sha;
        localStorage.setItem(STORAGE_KEYS.LAST_SHA, this.lastSha);
        this.hasPendingSync = false;
        localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, 'false');
        this.saveToLocalCache();
        this.setSyncIndicator('synced', 'Sincronizado');
      } else if ((res.status === 409 || res.status === 422) && retryCount < 2) {
        // Conflicto de concurrencia: otro usuario acaba de guardar. Descargamos, fusionamos y reintentamos.
        const remote = await this.fetchRemoteDb();
        this.lastSha = remote.sha;
        this.db = this.smartMergeDatabases(this.db, remote.remoteDb);
        this.saveToLocalCache();
        this.render();
        await this.pushToGitHub(commitMessage, retryCount + 1);
      } else {
        throw new Error(`GitHub PUT status ${res.status}`);
      }
    } catch (err) {
      console.error('Error guardando en GitHub:', err);
      this.setSyncIndicator('pending', 'Guardado en dispositivo');
    } finally {
      this.isSyncing = false;
    }
  },

  async uploadRepoFile(repoPath, utf8Content, commitMessage) {
    const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${repoPath}`;
    const headers = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${this.ghToken}`,
      'X-GitHub-Api-Version': '2022-11-28'
    };

    let existingSha = null;
    const getRes = await fetch(`${apiUrl}?ref=${GITHUB_CONFIG.branch}&t=${Date.now()}`, {
      headers,
      cache: 'no-store'
    });
    if (getRes.ok) {
      const getJson = await getRes.json();
      existingSha = getJson.sha;
    }

    const body = {
      message: commitMessage,
      content: this.utf8ToBase64(utf8Content),
      branch: GITHUB_CONFIG.branch
    };
    if (existingSha) {
      body.sha = existingSha;
    }

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      throw new Error(`No se pudo subir ${repoPath} (HTTP ${putRes.status})`);
    }
    return await putRes.json();
  },

  async publishWebToGitHub(silent = false) {
    if (!this.ghToken) {
      if (!silent) {
        alert('Primero introduce el PIN del equipo para activar la conexión con GitHub.');
        this.openAuthModal();
      }
      return;
    }

    const btn = document.getElementById('publish-gh-web-btn');
    const prevBtnHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Subiendo web a GitHub...';
    }

    try {
      const filesMap = (window.NAVIDAD_WEB_BUNDLE && window.NAVIDAD_WEB_BUNDLE.files) || {};
      const paths = Object.keys(filesMap);

      if (paths.length === 0) {
        // Intentar leer por fetch si estamos en un servidor local http://
        const candidatePaths = ['index.html', 'movil.html', 'css/styles.css', 'js/app.js', 'sw.js', 'README.md'];
        for (const p of candidatePaths) {
          const r = await fetch(`./${p}?t=${Date.now()}`, { cache: 'no-store' });
          if (r.ok) {
            filesMap[p] = await r.text();
          }
        }
      }

      const finalPaths = Object.keys(filesMap);
      if (finalPaths.length === 0) {
        throw new Error('No se encontraron archivos locales para publicar.');
      }

      let count = 0;
      for (const relPath of finalPaths) {
        count++;
        if (btn) {
          btn.innerHTML = `⏳ Subiendo (${count}/${finalPaths.length}): ${relPath}...`;
        }
        await this.uploadRepoFile(
          relPath,
          filesMap[relPath],
          `Actualizar ${relPath} en GitHub Pages (PIN ejemplo genérico, stock y web móvil)`
        );
      }

      // También sincronizar la base de datos con el stock
      await this.pushToGitHub('Sincronizar base de datos e inventario inicial de packaging');

      if (window.NAVIDAD_WEB_BUNDLE && window.NAVIDAD_WEB_BUNDLE.version) {
        localStorage.setItem('navidad2026_pushed_web_version', window.NAVIDAD_WEB_BUNDLE.version);
      }

      if (btn) {
        btn.innerHTML = '✅ ¡Web GitHub Actualizada!';
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = prevBtnHtml;
        }, 4000);
      }

      if (!silent) {
        alert(
          '✅ ¡Todos los archivos de la web (index.html, movil.html, js/app.js, css/styles.css, sw.js) se han subido a GitHub!\n\nEn unos 30-60 segundos GitHub Pages refrescará la web pública (recuerda pulsar Ctrl+F5 en la web de GitHub si el navegador tenía guardada la versión antigua en caché).'
        );
      } else {
        this.showQuickToast('✅ Web de GitHub actualizada automáticamente con los últimos cambios');
      }
    } catch (err) {
      console.error('Error publicando archivos web en GitHub:', err);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = prevBtnHtml;
      }
      if (!silent) {
        alert('Error al subir archivos a GitHub: ' + err.message);
      }
    }
  },

  /* ========================================================================
     4. NAVEGACIÓN, FILTROS TRANSVERSALES Y HELPERS
     ======================================================================== */
  setView(viewName) {
    this.currentView = viewName;
    if (document.body) {
      document.body.dataset.view = viewName;
    }

    document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    const filterBar = document.getElementById('global-filter-bar');
    if (filterBar) {
      filterBar.style.display = viewName === 'quick' ? 'none' : '';
    }

    const toggleQuickBtn = document.getElementById('toggle-quick-mode-btn');
    if (toggleQuickBtn) {
      toggleQuickBtn.innerHTML =
        viewName === 'quick' ? '💻 Ir a Panel Completo' : '📱 Aportar / Stock Rápido';
    }

    const titles = {
      quick: '📱 Modo Sencillo · Aportar Ideas, Solicitudes y Stock',
      dashboard: 'Cuadro de Mando General',
      needs: 'Necesidades, Logística y Proveedores',
      tasks: 'Asignación y Seguimiento de Tareas',
      schedule: 'Planificación Temporal (Pre-Evento y 18 Diciembre)',
      budget: 'Control de Presupuesto y Costes'
    };
    const titleEl = document.getElementById('current-view-title');
    if (titleEl) titleEl.textContent = titles[viewName] || 'Navidad 2026';

    const addBtn = document.getElementById('primary-add-btn');
    if (addBtn) {
      const btnLabels = {
        quick: '➕ Registro Avanzado',
        dashboard: '➕ Nueva Necesidad',
        needs: '➕ Nueva Necesidad',
        tasks: '➕ Nueva Tarea',
        schedule: '➕ Nuevo Hito Horario',
        budget: '➕ Partida Extra'
      };
      addBtn.textContent = btnLabels[viewName] || '➕ Nuevo';
    }

    this.render();
  },

  setFilter(key, value) {
    this.filters[key] = value;

    if (key === 'sector') {
      document.querySelectorAll('.sector-pills .pill-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.sector === value);
      });
    }
    if (key === 'user') {
      document.querySelectorAll('.user-pills .pill-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.user === value);
      });
    }

    this.render();
  },

  resetFilters() {
    this.filters = {
      sector: 'ALL',
      user: 'ALL',
      status: 'ALL',
      search: '',
      needCategory: 'ALL',
      needOrigin: 'ALL',
      taskPriority: 'ALL',
      schedulePhase: 'ALL',
      paymentStatus: 'ALL'
    };

    document.querySelectorAll('.sector-pills .pill-btn').forEach((b) =>
      b.classList.toggle('active', b.dataset.sector === 'ALL')
    );
    document.querySelectorAll('.user-pills .pill-btn').forEach((b) =>
      b.classList.toggle('active', b.dataset.user === 'ALL')
    );

    const statusSel = document.getElementById('filter-status-select');
    if (statusSel) statusSel.value = 'ALL';
    const searchInp = document.getElementById('global-search-input');
    if (searchInp) searchInp.value = '';

    this.render();
  },

  matchesGlobalFilters(item, responsibleField = 'responsibleId') {
    if (!item) return false;

    // 1. Sector
    if (this.filters.sector !== 'ALL' && item.sector !== this.filters.sector) {
      return false;
    }

    // 2. Usuario / Responsable
    const targetUser =
      this.filters.user === 'MINE' ? this.activeUserId : this.filters.user;
    if (targetUser !== 'ALL' && item[responsibleField] !== targetUser) {
      return false;
    }

    // 3. Estado
    if (this.filters.status !== 'ALL') {
      if (this.filters.status === 'OPEN') {
        if (item.status === 'Completado' || item.status === 'Completada') return false;
      } else if (this.filters.status === 'Completado') {
        if (item.status !== 'Completado' && item.status !== 'Completada') return false;
      } else if (item.status !== this.filters.status) {
        return false;
      }
    }

    // 4. Búsqueda libre
    if (this.filters.search.trim() !== '') {
      const q = this.filters.search.toLowerCase().trim();
      const haystack = [
        item.concept,
        item.title,
        item.description,
        item.category,
        item.subcategory,
        item.providerName,
        item.location,
        item.notes,
        item.sector
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  },

  getFilteredNeeds() {
    return (this.db.needs || []).filter((item) => {
      if (!this.matchesGlobalFilters(item, 'responsibleId')) return false;
      if (this.filters.needCategory !== 'ALL' && item.category !== this.filters.needCategory) return false;
      if (this.filters.needOrigin !== 'ALL' && item.originType !== this.filters.needOrigin) return false;
      return true;
    });
  },

  getFilteredTasks() {
    return (this.db.tasks || []).filter((item) => {
      if (!this.matchesGlobalFilters(item, 'assignedTo')) return false;
      if (this.filters.taskPriority !== 'ALL' && item.priority !== this.filters.taskPriority) return false;
      return true;
    });
  },

  getFilteredSchedule() {
    const pre = ((this.db.schedule && this.db.schedule.preEvent) || []).filter((item) =>
      this.matchesGlobalFilters(item, 'responsibleId')
    );
    const ev = ((this.db.schedule && this.db.schedule.eventDay) || []).filter((item) =>
      this.matchesGlobalFilters(item, 'responsibleId')
    );
    return { preEvent: pre, eventDay: ev };
  },

  getUnifiedBudgetItems() {
    const fromNeeds = (this.db.needs || []).map((n) => ({
      id: n.id,
      sourceType: 'need',
      concept: n.concept,
      category: n.category,
      sector: n.sector,
      responsibleId: n.responsibleId,
      originType: n.originType,
      providerName: n.providerName || '-',
      budgetEstimated: Number(n.budgetEstimated) || 0,
      budgetReal: Number(n.budgetReal) || 0,
      amountPaid: Number(n.amountPaid) || 0,
      paymentStatus: n.paymentStatus || 'Pendiente',
      status: n.status || 'Pendiente',
      notes: n.notes || ''
    }));

    const fromExtra = (this.db.budgetExtra || []).map((b) => ({
      id: b.id,
      sourceType: 'budgetExtra',
      concept: b.concept,
      category: 'Gasto / Partida Extra',
      sector: b.sector,
      responsibleId: b.responsibleId,
      originType: 'Contratado',
      providerName: b.providerName || '-',
      budgetEstimated: Number(b.budgetEstimated) || 0,
      budgetReal: Number(b.budgetReal) || 0,
      amountPaid: Number(b.amountPaid) || 0,
      paymentStatus: b.paymentStatus || 'Pendiente',
      status: b.paymentStatus === 'Pagado' ? 'Completado' : 'Pendiente',
      notes: b.notes || ''
    }));

    return [...fromNeeds, ...fromExtra].filter((item) => {
      if (!this.matchesGlobalFilters(item, 'responsibleId')) return false;
      if (this.filters.paymentStatus !== 'ALL' && item.paymentStatus !== this.filters.paymentStatus) return false;
      return true;
    });
  },

  formatCurrency(val) {
    const num = Number(val) || 0;
    return num.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  },

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  renderUserChip(userId) {
    const u = this.getUserById(userId);
    return `
      <span class="user-chip">
        <span class="user-chip-dot" style="background:${u.color}">${u.avatar}</span>
        <span>${this.escapeHtml(u.name)}</span>
      </span>
    `;
  },

  renderSectorBadge(sector) {
    const icons = {
      Cocina: '🍳',
      Catering: '🥂',
      Administración: '📋',
      Organización: '🎄'
    };
    return `<span class="badge sector-${sector}">${icons[sector] || '📌'} ${this.escapeHtml(sector)}</span>`;
  },

  /* ========================================================================
     5. RENDERIZADO DE SUBFILTROS Y VISTAS PRINCIPALES
     ======================================================================== */
  render() {
    if (!this.db) return;

    // Actualizar contadores laterales
    const bNeeds = document.getElementById('badge-needs');
    const bTasks = document.getElementById('badge-tasks');
    const bSched = document.getElementById('badge-schedule');

    if (bNeeds) bNeeds.textContent = (this.db.needs || []).length;
    if (bTasks) {
      const openTasks = (this.db.tasks || []).filter((t) => t.status !== 'Completada').length;
      bTasks.textContent = openTasks;
    }
    if (bSched) {
      const totalSched =
        ((this.db.schedule && this.db.schedule.preEvent) || []).length +
        ((this.db.schedule && this.db.schedule.eventDay) || []).length;
      bSched.textContent = totalSched;
    }

    this.renderContextualSubfilters();

    const container = document.getElementById('main-view-container');
    if (!container) return;

    switch (this.currentView) {
      case 'quick':
        container.innerHTML = this.renderQuickMobileView();
        break;
      case 'dashboard':
        container.innerHTML = this.renderDashboardView();
        break;
      case 'needs':
        container.innerHTML = this.renderNeedsView();
        break;
      case 'tasks':
        container.innerHTML = this.renderTasksView();
        break;
      case 'schedule':
        container.innerHTML = this.renderScheduleView();
        break;
      case 'budget':
        container.innerHTML = this.renderBudgetView();
        break;
      default:
        container.innerHTML = this.renderQuickMobileView();
        break;
    }

    // Mantener documento de impresión A4 sincronizado con la vista filtrada actual
    this.buildPrintDocument();
  },

  renderContextualSubfilters() {
    const box = document.getElementById('contextual-subfilters');
    if (!box) return;

    if (this.currentView === 'needs') {
      box.innerHTML = `
        <span class="filter-label">Categoría:</span>
        <select class="select-filter" onchange="App.setFilter('needCategory', this.value)">
          <option value="ALL" ${this.filters.needCategory === 'ALL' ? 'selected' : ''}>Todas las Categorías</option>
          ${NEED_CATEGORIES.map(
            (c) => `<option value="${c}" ${this.filters.needCategory === c ? 'selected' : ''}>${c}</option>`
          ).join('')}
        </select>
        <select class="select-filter" onchange="App.setFilter('needOrigin', this.value)">
          <option value="ALL" ${this.filters.needOrigin === 'ALL' ? 'selected' : ''}>Origen: Propio + Contratado</option>
          <option value="Propio" ${this.filters.needOrigin === 'Propio' ? 'selected' : ''}>🏢 Medios Propios</option>
          <option value="Contratado" ${this.filters.needOrigin === 'Contratado' ? 'selected' : ''}>🚚 Alquilado / Contratado</option>
        </select>
      `;
    } else if (this.currentView === 'tasks') {
      box.innerHTML = `
        <span class="filter-label">Prioridad:</span>
        <select class="select-filter" onchange="App.setFilter('taskPriority', this.value)">
          <option value="ALL" ${this.filters.taskPriority === 'ALL' ? 'selected' : ''}>Todas las Prioridades</option>
          <option value="Alta" ${this.filters.taskPriority === 'Alta' ? 'selected' : ''}>🔴 Prioridad Alta</option>
          <option value="Media" ${this.filters.taskPriority === 'Media' ? 'selected' : ''}>🟡 Prioridad Media</option>
          <option value="Baja" ${this.filters.taskPriority === 'Baja' ? 'selected' : ''}>🔵 Prioridad Baja</option>
        </select>
      `;
    } else if (this.currentView === 'schedule') {
      box.innerHTML = `
        <span class="filter-label">Cronograma:</span>
        <button class="pill-btn ${this.filters.schedulePhase === 'ALL' ? 'active' : ''}" onclick="App.setFilter('schedulePhase', 'ALL')">Ambos Cronogramas</button>
        <button class="pill-btn ${this.filters.schedulePhase === 'preEvent' ? 'active' : ''}" onclick="App.setFilter('schedulePhase', 'preEvent')">📅 Días Previos (Pre-Evento)</button>
        <button class="pill-btn ${this.filters.schedulePhase === 'eventDay' ? 'active' : ''}" onclick="App.setFilter('schedulePhase', 'eventDay')">🎄 Día 18 Dic (Escaleta Minuto a Minuto)</button>
      `;
    } else if (this.currentView === 'budget') {
      box.innerHTML = `
        <span class="filter-label">Estado de Pago:</span>
        <select class="select-filter" onchange="App.setFilter('paymentStatus', this.value)">
          <option value="ALL" ${this.filters.paymentStatus === 'ALL' ? 'selected' : ''}>Pagos: Todos</option>
          <option value="Pendiente" ${this.filters.paymentStatus === 'Pendiente' ? 'selected' : ''}>⏳ Pendiente de Pago</option>
          <option value="Parcial" ${this.filters.paymentStatus === 'Parcial' ? 'selected' : ''}>🌓 Pago Parcial / Señal</option>
          <option value="Pagado" ${this.filters.paymentStatus === 'Pagado' ? 'selected' : ''}>✅ Pagado 100%</option>
        </select>
      `;
    } else {
      box.innerHTML = `
        <span style="font-size:12px;color:var(--text-light);">
          💡 Filtra arriba por <strong>Sector</strong> o <strong>Responsable</strong> y pulsa <strong>🖨️ Imprimir Vista</strong> para obtener el informe en A4.
        </span>
      `;
    }
  },

  /* ========================================================================
     5.0. VISTA SENCILLA PARA TELÉFONO Y TABLET (DIVIDIDA EN DOS: APORTAR Y STOCK)
     ======================================================================== */
  copyGitHubLink(url = 'https://visualxet.github.io/Navidad2026/') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copy-gh-link-btn');
        if (btn) {
          const prev = btn.innerHTML;
          btn.innerHTML = '✅ ¡Link Copiado!';
          setTimeout(() => {
            btn.innerHTML = prev;
          }, 2200);
        }
        this.showQuickToast(`✅ Enlace copiado al portapapeles: ${url}`);
      });
    } else {
      prompt('Copia este enlace de la web en GitHub:', url);
    }
  },

  setQuickTab(tab) {
    this.quickTab = tab;
    this.render();
  },

  setQuickEntryType(typeKey) {
    this.quickEntryType = typeKey;
    this.render();
    setTimeout(() => {
      const inp = document.getElementById('quick-concept-input');
      if (inp) inp.focus();
    }, 30);
  },

  setQuickFilterType(val) {
    this.quickFilterType = val;
    this.render();
  },

  setQuickSearchStock(val) {
    this.quickSearchStock = val;
    const listBox = document.getElementById('quick-stock-list-container');
    if (listBox) {
      listBox.innerHTML = this.renderQuickStockItemsHtml();
    }
  },

  showQuickToast(msg) {
    this.quickToastMessage = msg;
    this.render();
    setTimeout(() => {
      if (this.quickToastMessage === msg) {
        this.quickToastMessage = '';
        const toastEl = document.getElementById('quick-toast-banner');
        if (toastEl) toastEl.style.display = 'none';
      }
    }, 3500);
  },

  async submitQuickEntry(e) {
    e.preventDefault();
    const conceptEl = document.getElementById('quick-concept-input');
    const qtyEl = document.getElementById('quick-qty-input');
    const notesEl = document.getElementById('quick-notes-input');

    const concept = (conceptEl && conceptEl.value ? conceptEl.value : '').trim();
    if (!concept) return;

    const qtyVal = Number(qtyEl && qtyEl.value ? qtyEl.value : 1) || 1;
    const notesVal = (notesEl && notesEl.value ? notesEl.value : '').trim();

    const typeObj =
      QUICK_ENTRY_TYPES.find((t) => t.key === this.quickEntryType) || QUICK_ENTRY_TYPES[0];
    const activeUser = this.getUserById(this.activeUserId);
    const nowIso = new Date().toISOString();

    const newRecord = {
      id: `quick_${Date.now()}`,
      concept,
      category: typeObj.category,
      subcategory: `${typeObj.icon} ${typeObj.label}`,
      sector: typeObj.sector,
      qtyNeeded: qtyVal,
      qtyConfirmed: typeObj.key === 'idea' ? 1 : 0,
      unit: typeObj.defaultUnit,
      originType: typeObj.originType,
      providerName: `Propuesto por ${activeUser.name}`,
      providerContact: '',
      responsibleId: this.activeUserId,
      status: 'Pendiente',
      budgetEstimated: 0,
      budgetReal: 0,
      amountPaid: 0,
      paymentStatus: 'Pendiente',
      notes: notesVal ? `[Apuntado por ${activeUser.name}] ${notesVal}` : `Apuntado por ${activeUser.name} desde móvil/tablet`,
      updatedAt: nowIso,
      updatedBy: activeUser.name
    };

    this.db.needs = this.db.needs || [];
    this.db.needs.unshift(newRecord);

    await this.commitChange(`Añadido (${typeObj.label}): ${concept}`);
    this.showQuickToast(`✅ ¡Añadido "${concept}" en ${typeObj.label}!`);
  },

  async submitQuickStock(e) {
    e.preventDefault();
    const conceptEl = document.getElementById('quick-stock-concept');
    const qtyEl = document.getElementById('quick-stock-qty');
    const unitEl = document.getElementById('quick-stock-unit');
    const notesEl = document.getElementById('quick-stock-notes');

    const concept = (conceptEl && conceptEl.value ? conceptEl.value : '').trim();
    if (!concept) return;

    const qty = Number(qtyEl && qtyEl.value ? qtyEl.value : 1) || 1;
    const unit = (unitEl && unitEl.value ? unitEl.value : 'ud').trim() || 'ud';
    const notes = (notesEl && notesEl.value ? notesEl.value : '').trim();
    const activeUser = this.getUserById(this.activeUserId);
    const nowIso = new Date().toISOString();

    const newStock = {
      id: `stock_${Date.now()}`,
      concept,
      category: 'Material y Mobiliario',
      subcategory: 'Inventario Packaging (Stock)',
      sector: 'Catering',
      qtyNeeded: qty,
      qtyConfirmed: qty,
      unit,
      originType: 'Propio',
      providerName: 'Stock Propio (Instalaciones)',
      providerContact: 'Almacén interno',
      responsibleId: this.activeUserId,
      status: 'En instalaciones',
      budgetEstimated: 0,
      budgetReal: 0,
      amountPaid: 0,
      paymentStatus: 'Pagado',
      notes: notes || `Añadido a stock por ${activeUser.name}`,
      updatedAt: nowIso,
      updatedBy: activeUser.name
    };

    this.db.needs = this.db.needs || [];
    this.db.needs.unshift(newStock);

    await this.commitChange(`Nuevo stock: ${concept} (${qty} ${unit})`);
    this.showQuickToast(`📦 ¡Añadido al stock: ${concept} (${qty} ${unit})!`);
  },

  async adjustStockQty(id, delta) {
    const item = (this.db.needs || []).find((n) => n.id === id);
    if (!item) return;
    const current = Number(item.qtyConfirmed) || 0;
    const next = Math.max(0, current + delta);
    item.qtyConfirmed = next;
    item.qtyNeeded = next;
    item.updatedAt = new Date().toISOString();
    item.updatedBy = this.getUserById(this.activeUserId).name;
    await this.commitChange(`Stock "${item.concept}": ${next} ${item.unit || 'ud'}`);
  },

  async quickDeleteItem(id) {
    const item = (this.db.needs || []).find((n) => n.id === id);
    if (!item) return;
    if (!confirm(`¿Seguro que quieres quitar "${item.concept}"?`)) return;
    this.db.deletedIds = this.db.deletedIds || [];
    if (!this.db.deletedIds.includes(id)) {
      this.db.deletedIds.push(id);
    }
    this.db.needs = (this.db.needs || []).filter((n) => n.id !== id);
    await this.commitChange(`Eliminado "${item.concept}"`);
  },

  getStockItems() {
    return (this.db.needs || []).filter(
      (n) =>
        n.originType === 'Propio' ||
        (n.subcategory && n.subcategory.toLowerCase().includes('stock')) ||
        (n.id && n.id.startsWith('stock_'))
    );
  },

  renderQuickStockItemsHtml() {
    const q = (this.quickSearchStock || '').toLowerCase().trim();
    const stockItems = this.getStockItems().filter((item) => {
      if (!q) return true;
      return `${item.concept} ${item.notes || ''} ${item.subcategory || ''}`.toLowerCase().includes(q);
    });

    if (!stockItems.length) {
      return `
        <div style="text-align:center;padding:24px;color:var(--text-light);background:#f8fafc;border-radius:12px;">
          No se encontraron artículos en stock con esa búsqueda.
        </div>
      `;
    }

    return stockItems
      .map(
        (item) => `
        <div class="quick-stock-card">
          <div style="flex:1;min-width:160px;">
            <div style="font-weight:800;font-size:15px;color:var(--text-main);">
              📦 ${this.escapeHtml(item.concept)}
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
              ${this.escapeHtml(item.notes || item.subcategory || 'Stock disponible')}
            </div>
          </div>

          <div class="quick-stock-stepper">
            <button type="button" class="stepper-btn" onclick="App.adjustStockQty('${item.id}', -10)" title="Restar 10">-10</button>
            <button type="button" class="stepper-btn" onclick="App.adjustStockQty('${item.id}', -1)" title="Restar 1">−</button>
            <div class="stepper-value">
              <span style="font-size:18px;font-weight:900;color:#166534;">${item.qtyConfirmed}</span>
              <span style="font-size:11px;color:var(--text-muted);display:block;">${this.escapeHtml(item.unit || 'ud')}</span>
            </div>
            <button type="button" class="stepper-btn plus" onclick="App.adjustStockQty('${item.id}', 1)" title="Sumar 1">+</button>
            <button type="button" class="stepper-btn plus" onclick="App.adjustStockQty('${item.id}', 10)" title="Sumar 10">+10</button>
            <button type="button" class="btn btn-secondary btn-sm" style="margin-left:4px;padding:6px 8px;" onclick="App.openCrudModal('need', '${item.id}')" title="Editar detalle">✏️</button>
          </div>
        </div>
      `
      )
      .join('');
  },

  renderQuickMobileView() {
    const users = this.getUsers();
    const activeUser = this.getUserById(this.activeUserId);
    const selectedType =
      QUICK_ENTRY_TYPES.find((t) => t.key === this.quickEntryType) || QUICK_ENTRY_TYPES[0];
    const stockItems = this.getStockItems();
    const nonStockItems = (this.db.needs || []).filter(
      (n) => !stockItems.some((s) => s.id === n.id)
    );

    const filteredFeed = nonStockItems.filter((item) => {
      if (this.quickFilterType === 'ALL') return true;
      const t = QUICK_ENTRY_TYPES.find((x) => x.key === this.quickFilterType);
      if (!t) return true;
      return (
        item.category === t.category ||
        (item.subcategory && item.subcategory.includes(t.label))
      );
    });

    return `
      <div class="quick-mobile-wrapper">
        ${
          this.quickToastMessage
            ? `<div id="quick-toast-banner" class="quick-toast">${this.escapeHtml(this.quickToastMessage)}</div>`
            : ''
        }

        <!-- SELECTOR RÁPIDO DE QUIÉN ERES -->
        <div class="quick-user-bar">
          <div style="font-size:12.5px;font-weight:800;color:var(--text-muted);margin-bottom:6px;">
            👤 ¿Quién eres? (Toca tu nombre o escríbelo):
          </div>
          <div class="quick-user-chips">
            ${users
              .map((u) => {
                const isSel = u.id === this.activeUserId && !this.customUserName;
                return `
                  <button type="button"
                    class="quick-user-btn ${isSel ? 'active' : ''}"
                    style="${isSel ? `background:${u.color};color:#fff;border-color:${u.color};` : ''}"
                    onclick="App.selectUserInModal('${u.id}')">
                    <span class="user-chip-dot" style="background:${isSel ? 'rgba(255,255,255,0.25)' : u.color};width:22px;height:22px;">${u.avatar}</span>
                    <span>${this.escapeHtml(u.name)}${isSel ? ' ✓' : ''}</span>
                  </button>
                `;
              })
              .join('')}
            <input
              type="text"
              class="form-control"
              style="max-width:190px;padding:6px 10px;font-size:13px;"
              placeholder="✍️ Otro compañero..."
              value="${this.escapeHtml(this.customUserName || '')}"
              oninput="App.handleUserNameInput(this.value)"
            />
          </div>
        </div>

        <!-- DIVISIÓN EN DOS PARTES GRANDES Y CÓMODAS -->
        <div class="quick-two-tabs">
          <button type="button"
            class="quick-big-tab ${this.quickTab === 'aportar' ? 'active' : ''}"
            onclick="App.setQuickTab('aportar')">
            <span style="font-size:22px;">➕</span>
            <div>
              <div style="font-weight:900;font-size:15px;">1. Aportar Ideas y Peticiones</div>
              <div style="font-size:11.5px;opacity:0.85;">Comidas, utensilios, decoración, ideas...</div>
            </div>
          </button>

          <button type="button"
            class="quick-big-tab ${this.quickTab === 'stock' ? 'active' : ''}"
            onclick="App.setQuickTab('stock')">
            <span style="font-size:22px;">📦</span>
            <div>
              <div style="font-weight:900;font-size:15px;">2. Stock / Material (${stockItems.length})</div>
              <div style="font-size:11.5px;opacity:0.85;">Inventario packaging año pasado</div>
            </div>
          </button>
        </div>

        ${
          this.quickTab === 'aportar'
            ? `
          <!-- PARTE 1: INCORPORAR FÁCILMENTE IDEAS, SOLICITUDES, COMIDAS, UTENSILIOS, DECORACIÓN, SERVICIOS -->
          <div class="panel-card" style="padding:18px;border:2px solid var(--border-strong);">
            <div style="font-weight:900;font-size:16px;margin-bottom:10px;color:var(--text-main);">
              1️⃣ ¿Qué quieres incorporar a la fiesta?
            </div>

            <div class="quick-type-grid">
              ${QUICK_ENTRY_TYPES.map((t) => {
                const isSel = t.key === this.quickEntryType;
                return `
                  <button type="button"
                    class="quick-type-btn ${isSel ? 'active' : ''}"
                    onclick="App.setQuickEntryType('${t.key}')">
                    <span style="font-size:24px;">${t.icon}</span>
                    <span style="font-weight:800;font-size:13px;">${t.label}</span>
                  </button>
                `;
              }).join('')}
            </div>

            <form onsubmit="App.submitQuickEntry(event)" style="margin-top:16px;display:flex;flex-direction:column;gap:12px;">
              <div>
                <label style="font-weight:800;font-size:13.5px;color:var(--text-main);display:block;margin-bottom:5px;">
                  2️⃣ Escribe tu ${selectedType.label.toLowerCase()} *
                </label>
                <input
                  type="text"
                  id="quick-concept-input"
                  class="form-control"
                  style="font-size:16px;padding:13px 14px;font-weight:600;border-width:2px;"
                  required
                  placeholder="${this.escapeHtml(selectedType.placeholder)}"
                />
              </div>

              <div style="display:grid;grid-template-columns:120px 1fr;gap:10px;">
                <div>
                  <label style="font-weight:700;font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    step="any"
                    id="quick-qty-input"
                    class="form-control"
                    style="font-size:15px;padding:10px;font-weight:700;"
                    value="1"
                  />
                </div>
                <div>
                  <label style="font-weight:700;font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">
                    Detalle o comentario (opcional)
                  </label>
                  <input
                    type="text"
                    id="quick-notes-input"
                    class="form-control"
                    style="font-size:14px;padding:10px;"
                    placeholder="Dónde comprarlo, para qué momento, idea..."
                  />
                </div>
              </div>

              <button type="submit" class="btn btn-primary" style="padding:14px;font-size:16px;font-weight:900;border-radius:12px;box-shadow:0 4px 14px rgba(153,27,27,0.3);">
                ➕ INCORPORAR ${selectedType.label.toUpperCase()} (como ${this.escapeHtml(activeUser.name)})
              </button>
            </form>
          </div>

          <!-- LISTADO CLARO DE LO INCORPORADO POR EL EQUIPO -->
          <div class="panel-card" style="padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
              <div style="font-weight:900;font-size:15px;">
                📋 Solicitudes, Ideas, Comidas y Recursos Apuntados (${filteredFeed.length})
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button type="button" class="pill-btn ${this.quickFilterType === 'ALL' ? 'active' : ''}" onclick="App.setQuickFilterType('ALL')">Todos</button>
                ${QUICK_ENTRY_TYPES.map(
                  (t) => `
                  <button type="button" class="pill-btn ${this.quickFilterType === t.key ? 'active' : ''}" onclick="App.setQuickFilterType('${t.key}')">
                    ${t.icon} ${t.label.split('/')[0].trim()}
                  </button>
                `
                ).join('')}
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:8px;">
              ${filteredFeed
                .map(
                  (item) => `
                <div class="quick-feed-item">
                  <div style="flex:1;min-width:180px;">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px;">
                      <span class="badge" style="background:var(--bg-subtle);color:var(--text-main);border:1px solid var(--border-strong);">
                        ${this.escapeHtml(item.subcategory || item.category)}
                      </span>
                      ${this.renderSectorBadge(item.sector)}
                      ${this.renderUserChip(item.responsibleId)}
                    </div>
                    <div style="font-weight:800;font-size:15px;color:var(--text-main);">
                      ${this.escapeHtml(item.concept)}
                      ${
                        Number(item.qtyNeeded) > 1
                          ? `<span style="color:var(--brand-primary);font-weight:900;"> · ${item.qtyNeeded} ${this.escapeHtml(item.unit || 'uds')}</span>`
                          : ''
                      }
                    </div>
                    ${
                      item.notes
                        ? `<div style="font-size:12.5px;color:var(--text-muted);margin-top:2px;">💬 ${this.escapeHtml(item.notes)}</div>`
                        : ''
                    }
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="App.openCrudModal('need', '${item.id}')">✏️</button>
                    <button type="button" class="btn btn-danger btn-sm" onclick="App.quickDeleteItem('${item.id}')">🗑️</button>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : `
          <!-- PARTE 2: INVENTARIO Y STOCK DISPONIBLE (MATERIAL DEL AÑO PASADO E INSTALACIONES) -->
          <div class="panel-card quick-stock-add-box" style="padding:18px;">
            <div class="quick-stock-add-title" style="font-weight:900;font-size:15.5px;margin-bottom:8px;">
              ➕ Añadir Nuevo Material / Utensilio a nuestro Stock
            </div>
            <form onsubmit="App.submitQuickStock(event)" style="display:grid;grid-template-columns:1fr 90px 90px auto;gap:8px;align-items:end;" class="quick-stock-form-grid">
              <div>
                <label class="quick-stock-add-label" style="font-size:11.5px;font-weight:700;">Material / Utensilio en almacén *</label>
                <input type="text" id="quick-stock-concept" class="form-control" required placeholder="Ej. Servilletas negras, Copas plástico, Manteles..." />
              </div>
              <div>
                <label class="quick-stock-add-label" style="font-size:11.5px;font-weight:700;">Cantidad *</label>
                <input type="number" step="any" id="quick-stock-qty" class="form-control" required value="50" />
              </div>
              <div>
                <label class="quick-stock-add-label" style="font-size:11.5px;font-weight:700;">Unidad</label>
                <input type="text" id="quick-stock-unit" class="form-control" value="ud" placeholder="ud, cajas..." />
              </div>
              <button type="submit" class="btn btn-primary" style="background:#16a34a;padding:10px 16px;font-weight:800;">
                ➕ Guardar Stock
              </button>
            </form>
          </div>

          <div class="panel-card" style="padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
              <div>
                <div style="font-weight:900;font-size:16px;">
                  📦 Inventario de Packaging y Material Disponible (${stockItems.length} artículos)
                </div>
                <div style="font-size:12px;color:var(--text-muted);">
                  Usa los botones <strong>− / +</strong> para actualizar las unidades directamente desde el móvil o tablet.
                </div>
              </div>
              <input
                type="search"
                class="search-input"
                style="min-width:240px;"
                placeholder="🔍 Buscar en stock (bambú, vasos, cuchara...)"
                value="${this.escapeHtml(this.quickSearchStock)}"
                oninput="App.setQuickSearchStock(this.value)"
              />
            </div>

            <div id="quick-stock-list-container" style="display:flex;flex-direction:column;gap:8px;">
              ${this.renderQuickStockItemsHtml()}
            </div>
          </div>
        `
        }
      </div>
    `;
  },

  /* ========================================================================
     5.1. VISTA 1: CUADRO DE MANDO GENERAL (DASHBOARD)
     ======================================================================== */
  renderDashboardView() {
    const needs = this.getFilteredNeeds();
    const tasks = this.getFilteredTasks();
    const sched = this.getFilteredSchedule();
    const budgetItems = this.getUnifiedBudgetItems();

    const confirmedNeeds = needs.filter((n) =>
      ['Confirmado', 'En instalaciones', 'Completado'].includes(n.status)
    ).length;
    const needsPct = needs.length ? Math.round((confirmedNeeds / needs.length) * 100) : 0;

    const doneTasks = tasks.filter((t) => t.status === 'Completada').length;
    const tasksPct = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

    const totalEst = budgetItems.reduce((acc, i) => acc + i.budgetEstimated, 0);
    const totalReal = budgetItems.reduce((acc, i) => acc + i.budgetReal, 0);
    const totalPaid = budgetItems.reduce((acc, i) => acc + i.amountPaid, 0);
    const totalPendingPay = Math.max(0, totalReal - totalPaid);
    const paidPct = totalReal > 0 ? Math.round((totalPaid / totalReal) * 100) : 0;

    // Resumen por los 4 Sectores
    const sectorCards = SECTORS.map((sec) => {
      const secNeeds = (this.db.needs || []).filter((n) => n.sector === sec);
      const secNeedsOk = secNeeds.filter((n) =>
        ['Confirmado', 'En instalaciones', 'Completado'].includes(n.status)
      ).length;
      const secTasks = (this.db.tasks || []).filter((t) => t.sector === sec);
      const secTasksPending = secTasks.filter((t) => t.status !== 'Completada').length;
      const secBudget = this.getUnifiedBudgetItems().filter((b) => b.sector === sec);
      const secReal = secBudget.reduce((a, b) => a + b.budgetReal, 0);

      return `
        <div class="kpi-card" style="cursor:pointer;" onclick="App.setFilter('sector', '${sec}')">
          <div class="kpi-card-header">
            ${this.renderSectorBadge(sec)}
            <span style="font-size:11px;color:var(--text-light);">Filtrar →</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:6px;">
            <div>
              <div style="font-size:18px;font-weight:800;">${secNeedsOk}/${secNeeds.length} <span style="font-size:12px;font-weight:600;color:var(--text-muted);">recursos listos</span></div>
              <div class="kpi-sub">${secTasksPending} tareas pendientes</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:14px;font-weight:800;color:var(--brand-primary);">${this.formatCurrency(secReal)}</div>
              <div class="kpi-sub">Coste real</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Resumen por los 4 Organizadores (TeTe, Bea, Leli, Jose)
    const users = this.getUsers();
    const userCards = users
      .map((u) => {
        const uNeeds = (this.db.needs || []).filter((n) => n.responsibleId === u.id);
        const uTasks = (this.db.tasks || []).filter((t) => t.assignedTo === u.id);
        const uTasksOpen = uTasks.filter((t) => t.status !== 'Completada').length;
        return `
          <div class="kpi-card" style="cursor:pointer;" onclick="App.setFilter('user', '${u.id}')">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="user-avatar" style="background:${u.color};width:38px;height:38px;">${u.avatar}</span>
              <div>
                <div style="font-weight:800;font-size:15px;">${this.escapeHtml(u.name)}</div>
                <div style="font-size:11.5px;color:var(--text-muted);">${this.escapeHtml(u.role)}</div>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid var(--border-color);font-size:12.5px;">
              <span>📦 <strong>${uNeeds.length}</strong> recursos</span>
              <span>✅ <strong>${uTasksOpen}</strong> tareas activas</span>
            </div>
          </div>
        `;
      })
      .join('');

    // Tareas prioritarias pendientes
    const urgentTasks = tasks
      .filter((t) => t.status !== 'Completada')
      .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
      .slice(0, 6);

    return `
      <!-- KPIs Ejecutivos -->
      <div class="kpi-grid">
        <div class="kpi-card" onclick="App.setView('needs')" style="cursor:pointer;">
          <div class="kpi-card-header">
            <span>📦 Logística y Catering</span>
            <span>${needsPct}%</span>
          </div>
          <div class="kpi-value">${confirmedNeeds} / ${needs.length}</div>
          <div class="kpi-sub">Recursos confirmados o en instalaciones</div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${needsPct}%;background:#16a34a;"></div>
          </div>
        </div>

        <div class="kpi-card" onclick="App.setView('tasks')" style="cursor:pointer;">
          <div class="kpi-card-header">
            <span>✅ Tareas Organizadores</span>
            <span>${tasksPct}%</span>
          </div>
          <div class="kpi-value">${doneTasks} / ${tasks.length}</div>
          <div class="kpi-sub">${tasks.length - doneTasks} tareas pendientes de cierre</div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${tasksPct}%;background:#2563eb;"></div>
          </div>
        </div>

        <div class="kpi-card" onclick="App.setView('schedule')" style="cursor:pointer;">
          <div class="kpi-card-header">
            <span>⏱️ Cronograma 18 Dic</span>
            <span>Escaleta</span>
          </div>
          <div class="kpi-value">${sched.eventDay.length} tramos</div>
          <div class="kpi-sub">+ ${sched.preEvent.length} hitos en días previos de montaje</div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:100%;background:#9333ea;"></div>
          </div>
        </div>

        <div class="kpi-card" onclick="App.setView('budget')" style="cursor:pointer;">
          <div class="kpi-card-header">
            <span>💶 Presupuesto Real</span>
            <span>Est: ${this.formatCurrency(totalEst)}</span>
          </div>
          <div class="kpi-value">${this.formatCurrency(totalReal)}</div>
          <div class="kpi-sub">Pagado: ${this.formatCurrency(totalPaid)} · Pend: ${this.formatCurrency(totalPendingPay)}</div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${paidPct}%;background:#d97706;"></div>
          </div>
        </div>
      </div>

      <!-- Estado por los 4 Sectores -->
      <h2 style="font-size:14px;font-weight:800;text-transform:uppercase;color:var(--text-muted);margin:18px 0 10px;">
        Estado por Departamentos / Sectores
      </h2>
      <div class="kpi-grid">
        ${sectorCards}
      </div>

      <!-- Equipo Organizador (4 Usuarios) -->
      <h2 style="font-size:14px;font-weight:800;text-transform:uppercase;color:var(--text-muted);margin:18px 0 10px;">
        Equipo Organizador (4 Usuarios Concurrentes)
      </h2>
      <div class="kpi-grid">
        ${userCards}
      </div>

      <!-- Dos Columnas Inferiores: Tareas Urgentes + Escaleta Día 18 -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(340px, 1fr));gap:18px;margin-top:10px;">
        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-title">🔥 Próximas Tareas Pendientes</div>
            <button class="btn btn-secondary btn-sm" onclick="App.setView('tasks')">Ver todas →</button>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tarea</th>
                  <th>Sector</th>
                  <th>Resp.</th>
                  <th>Límite</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${
                  urgentTasks.length
                    ? urgentTasks
                        .map(
                          (t) => `
                    <tr>
                      <td>
                        <div style="font-weight:700;">${this.escapeHtml(t.title)}</div>
                        <span class="badge prio-${t.priority}" style="margin-top:3px;">Prioridad ${t.priority}</span>
                      </td>
                      <td>${this.renderSectorBadge(t.sector)}</td>
                      <td>${this.renderUserChip(t.assignedTo)}</td>
                      <td style="white-space:nowrap;font-weight:600;">${this.escapeHtml(t.dueDate || '-')}</td>
                      <td>
                        <select class="inline-status-select" onchange="App.quickUpdateTaskStatus('${t.id}', this.value)">
                          ${TASK_STATUSES.map(
                            (st) => `<option value="${st}" ${t.status === st ? 'selected' : ''}>${st}</option>`
                          ).join('')}
                        </select>
                      </td>
                    </tr>
                  `
                        )
                        .join('')
                    : `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-light);">No hay tareas pendientes con los filtros actuales.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-title">🎄 Hitos Clave · Viernes 18 de Diciembre</div>
            <button class="btn btn-secondary btn-sm" onclick="App.setView('schedule')">Ver escaleta completa →</button>
          </div>
          <div class="timeline-list">
            ${sched.eventDay
              .slice(0, 6)
              .map(
                (ev) => `
              <div class="timeline-item ${ev.isMilestone ? 'milestone' : ''}">
                <div class="timeline-time">
                  <span>${this.escapeHtml(ev.timeStart)} - ${this.escapeHtml(ev.timeEnd)}</span>
                  <span class="timeline-date-badge">${this.escapeHtml(ev.location)}</span>
                </div>
                <div>
                  <div style="font-weight:700;">${ev.isMilestone ? '⭐ ' : ''}${this.escapeHtml(ev.title)}</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${this.escapeHtml(ev.notes || '')}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                  ${this.renderSectorBadge(ev.sector)}
                  ${this.renderUserChip(ev.responsibleId)}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  },

  /* ========================================================================
     5.2. VISTA 2: NECESIDADES, LOGÍSTICA Y PROVEEDORES (ESTILO CATERING PROPIO)
     ======================================================================== */
  renderNeedsView() {
    const items = this.getFilteredNeeds();
    const totalEst = items.reduce((a, b) => a + (Number(b.budgetEstimated) || 0), 0);
    const totalReal = items.reduce((a, b) => a + (Number(b.budgetReal) || 0), 0);

    return `
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-title">📦 Gestión de Necesidades, Recursos, Catering y Proveedores (${items.length})</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
              Coste Estimado Vista: <strong>${this.formatCurrency(totalEst)}</strong> · Coste Real/Aprobado Vista: <strong>${this.formatCurrency(totalReal)}</strong>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary btn-sm" onclick="App.openCrudModal('need', null)">
              ➕ Añadir Recurso / Necesidad
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Concepto y Notas</th>
                <th>Categoría</th>
                <th>Sector</th>
                <th>Cant. (Conf/Nec)</th>
                <th>Origen / Proveedor</th>
                <th>Responsable</th>
                <th>Estado Logístico</th>
                <th>Coste Real</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${
                items.length
                  ? items
                      .map((item) => {
                        const qtyOk = Number(item.qtyConfirmed) >= Number(item.qtyNeeded) && Number(item.qtyNeeded) > 0;
                        return `
                  <tr>
                    <td style="min-width:220px;">
                      <div style="font-weight:700;color:var(--text-main);">${this.escapeHtml(item.concept)}</div>
                      ${
                        item.notes
                          ? `<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">📝 ${this.escapeHtml(item.notes)}</div>`
                          : ''
                      }
                    </td>
                    <td>
                      <div style="font-weight:600;font-size:12px;">${this.escapeHtml(item.category)}</div>
                      <div style="font-size:11px;color:var(--text-light);">${this.escapeHtml(item.subcategory || '')}</div>
                    </td>
                    <td>${this.renderSectorBadge(item.sector)}</td>
                    <td style="white-space:nowrap;">
                      <span style="font-weight:800;color:${qtyOk ? '#166534' : '#b45309'};">
                        ${item.qtyConfirmed} / ${item.qtyNeeded}
                      </span>
                      <span style="font-size:11.5px;color:var(--text-muted);">${this.escapeHtml(item.unit || 'uds')}</span>
                    </td>
                    <td>
                      <span class="badge" style="background:${item.originType === 'Propio' ? '#e0f2fe;color:#0369a1' : '#f3e8ff;color:#6b21a8'}">
                        ${item.originType === 'Propio' ? '🏢 Propio' : '🚚 Contratado'}
                      </span>
                      <div style="font-size:12px;font-weight:600;margin-top:3px;">${this.escapeHtml(item.providerName || '-')}</div>
                      ${
                        item.providerContact
                          ? `<div style="font-size:11px;color:var(--text-light);">📞 ${this.escapeHtml(item.providerContact)}</div>`
                          : ''
                      }
                    </td>
                    <td>${this.renderUserChip(item.responsibleId)}</td>
                    <td>
                      <select class="inline-status-select" onchange="App.quickUpdateNeedStatus('${item.id}', this.value)">
                        ${NEED_STATUSES.map(
                          (st) => `<option value="${st}" ${item.status === st ? 'selected' : ''}>${st}</option>`
                        ).join('')}
                      </select>
                    </td>
                    <td style="white-space:nowrap;">
                      <div style="font-weight:800;">${this.formatCurrency(item.budgetReal)}</div>
                      <div style="font-size:11px;color:var(--text-light);">Est: ${this.formatCurrency(item.budgetEstimated)}</div>
                    </td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="App.openCrudModal('need', '${item.id}')">✏️ Editar</button>
                    </td>
                  </tr>
                `;
                      })
                      .join('')
                  : `<tr><td colspan="9" style="text-align:center;padding:26px;color:var(--text-light);">No hay recursos que coincidan con los filtros seleccionados.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /* ========================================================================
     5.3. VISTA 3: ASIGNACIÓN Y SEGUIMIENTO DE TAREAS
     ======================================================================== */
  renderTasksView() {
    const tasks = this.getFilteredTasks().sort((a, b) =>
      (a.dueDate || '9999').localeCompare(b.dueDate || '9999')
    );

    return `
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-title">✅ Gestión y Asignación de Tareas del Equipo (${tasks.length})</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
              Asignadas entre TeTe (Gestión), Bea (Catering), Leli (Administración) y Jose (Cocina)
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="App.openCrudModal('task', null)">
            ➕ Nueva Tarea
          </button>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tarea y Descripción</th>
                <th>Prioridad</th>
                <th>Sector</th>
                <th>Asignado a</th>
                <th>Fecha Límite</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${
                tasks.length
                  ? tasks
                      .map(
                        (t) => `
                  <tr style="${t.status === 'Completada' ? 'opacity:0.68;' : ''}">
                    <td style="min-width:250px;">
                      <div style="font-weight:700;${t.status === 'Completada' ? 'text-decoration:line-through;' : ''}">
                        ${this.escapeHtml(t.title)}
                      </div>
                      <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                        ${this.escapeHtml(t.description || '')}
                      </div>
                      ${
                        t.notes
                          ? `<div style="font-size:11.5px;color:#0369a1;margin-top:3px;">📌 ${this.escapeHtml(t.notes)}</div>`
                          : ''
                      }
                    </td>
                    <td><span class="badge prio-${t.priority}">Prioridad ${t.priority}</span></td>
                    <td>${this.renderSectorBadge(t.sector)}</td>
                    <td>${this.renderUserChip(t.assignedTo)}</td>
                    <td style="white-space:nowrap;font-weight:700;">📅 ${this.escapeHtml(t.dueDate || '-')}</td>
                    <td>
                      <select class="inline-status-select" onchange="App.quickUpdateTaskStatus('${t.id}', this.value)">
                        ${TASK_STATUSES.map(
                          (st) => `<option value="${st}" ${t.status === st ? 'selected' : ''}>${st}</option>`
                        ).join('')}
                      </select>
                    </td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="App.openCrudModal('task', '${t.id}')">✏️ Editar</button>
                    </td>
                  </tr>
                `
                      )
                      .join('')
                  : `<tr><td colspan="7" style="text-align:center;padding:26px;color:var(--text-light);">No hay tareas para los filtros seleccionados.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /* ========================================================================
     5.4. VISTA 4: PLANIFICACIÓN TEMPORAL (CRONOGRAMA DOBLE)
     ======================================================================== */
  renderScheduleView() {
    const { preEvent, eventDay } = this.getFilteredSchedule();
    const showPre = this.filters.schedulePhase === 'ALL' || this.filters.schedulePhase === 'preEvent';
    const showEvent = this.filters.schedulePhase === 'ALL' || this.filters.schedulePhase === 'eventDay';

    return `
      ${
        showPre
          ? `
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <div class="panel-title">📅 Fase 1: Días Previos de Organización y Montaje (Pre-Evento) (${preEvent.length})</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                Compras, recepción de alquileres, montaje técnico de iluminación/sonido y pre-elaboración de cocina
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="App.openCrudModal('preEvent', null)">
              ➕ Añadir Hito Pre-Evento
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Actividad / Hito de Preparación</th>
                  <th>Ubicación</th>
                  <th>Sector</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${
                  preEvent.length
                    ? preEvent
                        .map(
                          (item) => `
                    <tr>
                      <td style="white-space:nowrap;font-weight:800;color:var(--brand-primary);">${this.escapeHtml(item.date)}</td>
                      <td style="white-space:nowrap;font-weight:700;">${this.escapeHtml(item.timeStart)} - ${this.escapeHtml(item.timeEnd)}</td>
                      <td>
                        <div style="font-weight:700;">${this.escapeHtml(item.title)}</div>
                        ${
                          item.notes
                            ? `<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">📝 ${this.escapeHtml(item.notes)}</div>`
                            : ''
                        }
                      </td>
                      <td>📍 ${this.escapeHtml(item.location || '-')}</td>
                      <td>${this.renderSectorBadge(item.sector)}</td>
                      <td>${this.renderUserChip(item.responsibleId)}</td>
                      <td>
                        <select class="inline-status-select" onchange="App.quickUpdateScheduleStatus('preEvent', '${item.id}', this.value)">
                          ${SCHEDULE_STATUSES.map(
                            (st) => `<option value="${st}" ${item.status === st ? 'selected' : ''}>${st}</option>`
                          ).join('')}
                        </select>
                      </td>
                      <td>
                        <button class="btn btn-secondary btn-sm" onclick="App.openCrudModal('preEvent', '${item.id}')">✏️ Editar</button>
                      </td>
                    </tr>
                  `
                        )
                        .join('')
                    : `<tr><td colspan="8" style="text-align:center;padding:22px;color:var(--text-light);">Sin hitos pre-evento en este filtro.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      `
          : ''
      }

      ${
        showEvent
          ? `
        <div class="panel-card">
          <div class="panel-header">
            <div>
              <div class="panel-title">🎄 Fase 2: Escaleta Minuto a Minuto · Viernes 18 de Diciembre de 2026 (${eventDay.length})</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                Llegada de personal, encendido de luces, bienvenida con saxofonista, pase de comida, sesión DJ y cierre
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="App.openCrudModal('eventDay', null)">
              ➕ Añadir Tramo Día 18
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tramo Horario</th>
                  <th>Hito / Escaleta del 18 de Diciembre</th>
                  <th>Zona / Sala</th>
                  <th>Sector</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${
                  eventDay.length
                    ? eventDay
                        .map(
                          (item) => `
                    <tr style="${item.isMilestone ? 'background:#fffbeb;' : ''}">
                      <td style="white-space:nowrap;font-weight:800;font-size:13.5px;color:var(--brand-primary);">
                        ⏰ ${this.escapeHtml(item.timeStart)} - ${this.escapeHtml(item.timeEnd)}
                      </td>
                      <td>
                        <div style="font-weight:700;">
                          ${item.isMilestone ? '<span class="badge prio-Media" style="margin-right:5px;">⭐ HITO</span>' : ''}
                          ${this.escapeHtml(item.title)}
                        </div>
                        ${
                          item.notes
                            ? `<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">📝 ${this.escapeHtml(item.notes)}</div>`
                            : ''
                        }
                      </td>
                      <td>📍 ${this.escapeHtml(item.location || '-')}</td>
                      <td>${this.renderSectorBadge(item.sector)}</td>
                      <td>${this.renderUserChip(item.responsibleId)}</td>
                      <td>
                        <select class="inline-status-select" onchange="App.quickUpdateScheduleStatus('eventDay', '${item.id}', this.value)">
                          ${SCHEDULE_STATUSES.map(
                            (st) => `<option value="${st}" ${item.status === st ? 'selected' : ''}>${st}</option>`
                          ).join('')}
                        </select>
                      </td>
                      <td>
                        <button class="btn btn-secondary btn-sm" onclick="App.openCrudModal('eventDay', '${item.id}')">✏️ Editar</button>
                      </td>
                    </tr>
                  `
                        )
                        .join('')
                    : `<tr><td colspan="7" style="text-align:center;padding:22px;color:var(--text-light);">Sin tramos horarios para el día 18 con este filtro.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      `
          : ''
      }
    `;
  },

  /* ========================================================================
     5.5. VISTA 5: CONTROL DE PRESUPUESTO Y COSTES
     ======================================================================== */
  renderBudgetView() {
    const items = this.getUnifiedBudgetItems();

    const sumEst = items.reduce((a, b) => a + b.budgetEstimated, 0);
    const sumReal = items.reduce((a, b) => a + b.budgetReal, 0);
    const sumPaid = items.reduce((a, b) => a + b.amountPaid, 0);
    const sumPending = Math.max(0, sumReal - sumPaid);
    const diff = sumReal - sumEst;

    // Desglose por Sector
    const sectorBreakdown = SECTORS.map((sec) => {
      const sItems = items.filter((i) => i.sector === sec);
      const est = sItems.reduce((a, b) => a + b.budgetEstimated, 0);
      const real = sItems.reduce((a, b) => a + b.budgetReal, 0);
      const paid = sItems.reduce((a, b) => a + b.amountPaid, 0);
      const pend = Math.max(0, real - paid);
      const d = real - est;
      return { sec, count: sItems.length, est, real, paid, pend, d };
    });

    return `
      <!-- KPIs Financieros -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-card-header"><span>📊 Presupuesto Estimado</span></div>
          <div class="kpi-value">${this.formatCurrency(sumEst)}</div>
          <div class="kpi-sub">${items.length} partidas en la vista actual</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header"><span>💶 Coste Real / Aprobado</span></div>
          <div class="kpi-value" style="color:var(--brand-primary);">${this.formatCurrency(sumReal)}</div>
          <div class="kpi-sub">
            Desviación: <strong style="color:${diff <= 0 ? '#166534' : '#b91c1c'};">
              ${diff > 0 ? '+' : ''}${this.formatCurrency(diff)}
            </strong>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header"><span>✅ Total Pagado / Anticipos</span></div>
          <div class="kpi-value" style="color:#166534;">${this.formatCurrency(sumPaid)}</div>
          <div class="kpi-sub">${sumReal > 0 ? Math.round((sumPaid / sumReal) * 100) : 0}% del coste real abonado</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card-header"><span>⏳ Pendiente de Pago</span></div>
          <div class="kpi-value" style="color:#d97706;">${this.formatCurrency(sumPending)}</div>
          <div class="kpi-sub">Por liquidar a proveedores</div>
        </div>
      </div>

      <!-- Tabla Resumen por Sector -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="panel-title">🏛️ Resumen Financiero por Departamento / Sector</div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sector</th>
                <th>Nº Partidas</th>
                <th>Coste Estimado</th>
                <th>Coste Real / Aprobado</th>
                <th>Desviación</th>
                <th>Pagado</th>
                <th>Pendiente de Pago</th>
              </tr>
            </thead>
            <tbody>
              ${sectorBreakdown
                .map(
                  (s) => `
                <tr>
                  <td>${this.renderSectorBadge(s.sec)}</td>
                  <td><strong>${s.count}</strong> partidas</td>
                  <td>${this.formatCurrency(s.est)}</td>
                  <td style="font-weight:800;">${this.formatCurrency(s.real)}</td>
                  <td style="font-weight:700;color:${s.d <= 0 ? '#166534' : '#b91c1c'};">
                    ${s.d > 0 ? '+' : ''}${this.formatCurrency(s.d)}
                  </td>
                  <td style="color:#166534;font-weight:700;">${this.formatCurrency(s.paid)}</td>
                  <td style="color:#b45309;font-weight:800;">${this.formatCurrency(s.pend)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Detalle de Partidas Presupuestarias -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <div class="panel-title">🧾 Detalle de Partidas de Presupuesto (Necesidades + Gastos Extra)</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
              Vinculado en tiempo real con el módulo de Logística y Necesidades
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="App.openCrudModal('need', null)">
              ➕ Recurso con Coste
            </button>
            <button class="btn btn-primary btn-sm" onclick="App.openCrudModal('budgetExtra', null)">
              ➕ Partida Extra Administrativa
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Concepto / Partida</th>
                <th>Sector</th>
                <th>Proveedor</th>
                <th>Responsable</th>
                <th>Estimado</th>
                <th>Real / Aprobado</th>
                <th>Pagado</th>
                <th>Pendiente</th>
                <th>Estado Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map((item) => {
                  const pend = Math.max(0, item.budgetReal - item.amountPaid);
                  return `
                  <tr>
                    <td>
                      <div style="font-weight:700;">${this.escapeHtml(item.concept)}</div>
                      <div style="font-size:11px;color:var(--text-light);">${this.escapeHtml(item.category)}</div>
                    </td>
                    <td>${this.renderSectorBadge(item.sector)}</td>
                    <td>${this.escapeHtml(item.providerName)}</td>
                    <td>${this.renderUserChip(item.responsibleId)}</td>
                    <td style="white-space:nowrap;">${this.formatCurrency(item.budgetEstimated)}</td>
                    <td style="white-space:nowrap;font-weight:800;">${this.formatCurrency(item.budgetReal)}</td>
                    <td style="white-space:nowrap;color:#166534;font-weight:700;">${this.formatCurrency(item.amountPaid)}</td>
                    <td style="white-space:nowrap;color:${pend > 0 ? '#b45309' : '#64748b'};font-weight:700;">
                      ${this.formatCurrency(pend)}
                    </td>
                    <td><span class="badge status-${item.paymentStatus}">${item.paymentStatus}</span></td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="App.openCrudModal('${item.sourceType}', '${item.id}')">
                        ✏️ Editar
                      </button>
                    </td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /* ========================================================================
     6. ACCIONES RÁPIDAS Y MODALES CRUD (CREAR, EDITAR, BORRAR)
     ======================================================================== */
  handlePrimaryAdd() {
    if (this.currentView === 'tasks') {
      this.openCrudModal('task', null);
    } else if (this.currentView === 'schedule') {
      const type = this.filters.schedulePhase === 'preEvent' ? 'preEvent' : 'eventDay';
      this.openCrudModal(type, null);
    } else if (this.currentView === 'budget') {
      this.openCrudModal('budgetExtra', null);
    } else {
      this.openCrudModal('need', null);
    }
  },

  async quickUpdateNeedStatus(id, newStatus) {
    const item = (this.db.needs || []).find((n) => n.id === id);
    if (!item) return;
    item.status = newStatus;
    item.updatedAt = new Date().toISOString();
    item.updatedBy = this.getUserById(this.activeUserId).name;
    await this.commitChange(`Estado de "${item.concept}" -> ${newStatus}`);
  },

  async quickUpdateTaskStatus(id, newStatus) {
    const item = (this.db.tasks || []).find((t) => t.id === id);
    if (!item) return;
    item.status = newStatus;
    item.updatedAt = new Date().toISOString();
    item.updatedBy = this.getUserById(this.activeUserId).name;
    await this.commitChange(`Tarea "${item.title}" -> ${newStatus}`);
  },

  async quickUpdateScheduleStatus(phase, id, newStatus) {
    const list = (this.db.schedule && this.db.schedule[phase]) || [];
    const item = list.find((s) => s.id === id);
    if (!item) return;
    item.status = newStatus;
    item.updatedAt = new Date().toISOString();
    item.updatedBy = this.getUserById(this.activeUserId).name;
    await this.commitChange(`Horario "${item.title}" -> ${newStatus}`);
  },

  openCrudModal(type, id = null) {
    this.editingContext = { type, id };
    const modal = document.getElementById('crud-modal');
    const titleEl = document.getElementById('crud-modal-title');
    const bodyEl = document.getElementById('crud-modal-body');
    const delBtn = document.getElementById('crud-delete-btn');

    delBtn.style.display = id ? 'inline-flex' : 'none';
    const users = this.getUsers();
    const defaultSector = this.filters.sector !== 'ALL' ? this.filters.sector : this.getUserById(this.activeUserId).sector;

    if (type === 'need') {
      const item = id
        ? (this.db.needs || []).find((n) => n.id === id)
        : {
            concept: '',
            category: this.filters.needCategory !== 'ALL' ? this.filters.needCategory : 'Alimentación y Bebidas',
            subcategory: '',
            sector: defaultSector,
            qtyNeeded: 1,
            qtyConfirmed: 0,
            unit: 'uds',
            originType: 'Contratado',
            providerName: '',
            providerContact: '',
            responsibleId: this.activeUserId,
            status: 'Pendiente',
            budgetEstimated: 0,
            budgetReal: 0,
            amountPaid: 0,
            paymentStatus: 'Pendiente',
            notes: ''
          };

      titleEl.textContent = id ? '✏️ Editar Necesidad / Recurso' : '➕ Nueva Necesidad / Recurso';
      bodyEl.innerHTML = `
        <div class="form-grid">
          <div class="form-group full">
            <label>Concepto / Recurso *</label>
            <input type="text" name="concept" class="form-control" required value="${this.escapeHtml(item.concept)}" placeholder="Ej. 15 Mesas altas de cóctel, Cortador de Jamón, Saxofonista..." />
          </div>
          <div class="form-group">
            <label>Categoría Principal</label>
            <select name="category" class="form-control">
              ${NEED_CATEGORIES.map((c) => `<option value="${c}" ${item.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Subcategoría</label>
            <input type="text" name="subcategory" class="form-control" value="${this.escapeHtml(item.subcategory)}" placeholder="Ej. Bebidas, Mobiliario, Música..." />
          </div>
          <div class="form-group">
            <label>Sector / Departamento *</label>
            <select name="sector" class="form-control">
              ${SECTORS.map((s) => `<option value="${s}" ${item.sector === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Responsable (Organizador)</label>
            <select name="responsibleId" class="form-control">
              ${users.map((u) => `<option value="${u.id}" ${item.responsibleId === u.id ? 'selected' : ''}>${u.name} (${u.sector})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Cantidad Necesaria</label>
            <input type="number" step="any" name="qtyNeeded" class="form-control" value="${item.qtyNeeded}" />
          </div>
          <div class="form-group">
            <label>Cantidad Confirmada + Unidad</label>
            <div style="display:flex;gap:6px;">
              <input type="number" step="any" name="qtyConfirmed" class="form-control" style="flex:1;" value="${item.qtyConfirmed}" />
              <input type="text" name="unit" class="form-control" style="width:95px;" value="${this.escapeHtml(item.unit || 'uds')}" placeholder="uds, pax..." />
            </div>
          </div>
          <div class="form-group">
            <label>Origen del Recurso</label>
            <select name="originType" class="form-control">
              <option value="Contratado" ${item.originType === 'Contratado' ? 'selected' : ''}>🚚 Alquilado / Contratado</option>
              <option value="Propio" ${item.originType === 'Propio' ? 'selected' : ''}>🏢 Medios Propios Empresa</option>
            </select>
          </div>
          <div class="form-group">
            <label>Estado Logístico</label>
            <select name="status" class="form-control">
              ${NEED_STATUSES.map((st) => `<option value="${st}" ${item.status === st ? 'selected' : ''}>${st}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Nombre del Proveedor</label>
            <input type="text" name="providerName" class="form-control" value="${this.escapeHtml(item.providerName)}" placeholder="Proveedor o Interno" />
          </div>
          <div class="form-group">
            <label>Teléfono / Contacto Proveedor</label>
            <input type="text" name="providerContact" class="form-control" value="${this.escapeHtml(item.providerContact)}" placeholder="600 000 000" />
          </div>
          <div class="form-group">
            <label>Coste Estimado (€)</label>
            <input type="number" step="0.01" name="budgetEstimated" class="form-control" value="${item.budgetEstimated}" />
          </div>
          <div class="form-group">
            <label>Coste Real / Aprobado (€)</label>
            <input type="number" step="0.01" name="budgetReal" class="form-control" value="${item.budgetReal}" />
          </div>
          <div class="form-group">
            <label>Importe Ya Pagado (€)</label>
            <input type="number" step="0.01" name="amountPaid" class="form-control" value="${item.amountPaid}" />
          </div>
          <div class="form-group">
            <label>Estado de Pago</label>
            <select name="paymentStatus" class="form-control">
              ${PAYMENT_STATUSES.map((ps) => `<option value="${ps}" ${item.paymentStatus === ps ? 'selected' : ''}>${ps}</option>`).join('')}
            </select>
          </div>
          <div class="form-group full">
            <label>Notas / Observaciones</label>
            <textarea name="notes" rows="2" class="form-control" placeholder="Detalles de entrega, horarios, observaciones...">${this.escapeHtml(item.notes)}</textarea>
          </div>
        </div>
      `;
    } else if (type === 'task') {
      const item = id
        ? (this.db.tasks || []).find((t) => t.id === id)
        : {
            title: '',
            description: '',
            sector: defaultSector,
            assignedTo: this.activeUserId,
            priority: 'Alta',
            dueDate: '2026-12-15',
            status: 'Pendiente',
            notes: ''
          };

      titleEl.textContent = id ? '✏️ Editar Tarea' : '➕ Nueva Tarea del Equipo';
      bodyEl.innerHTML = `
        <div class="form-grid">
          <div class="form-group full">
            <label>Título de la Tarea *</label>
            <input type="text" name="title" class="form-control" required value="${this.escapeHtml(item.title)}" />
          </div>
          <div class="form-group full">
            <label>Descripción detallada</label>
            <textarea name="description" rows="2" class="form-control">${this.escapeHtml(item.description)}</textarea>
          </div>
          <div class="form-group">
            <label>Sector</label>
            <select name="sector" class="form-control">
              ${SECTORS.map((s) => `<option value="${s}" ${item.sector === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Asignado a</label>
            <select name="assignedTo" class="form-control">
              ${users.map((u) => `<option value="${u.id}" ${item.assignedTo === u.id ? 'selected' : ''}>${u.name} (${u.sector})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Prioridad</label>
            <select name="priority" class="form-control">
              <option value="Alta" ${item.priority === 'Alta' ? 'selected' : ''}>🔴 Alta</option>
              <option value="Media" ${item.priority === 'Media' ? 'selected' : ''}>🟡 Media</option>
              <option value="Baja" ${item.priority === 'Baja' ? 'selected' : ''}>🔵 Baja</option>
            </select>
          </div>
          <div class="form-group">
            <label>Fecha Límite</label>
            <input type="date" name="dueDate" class="form-control" value="${this.escapeHtml(item.dueDate)}" />
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select name="status" class="form-control">
              ${TASK_STATUSES.map((st) => `<option value="${st}" ${item.status === st ? 'selected' : ''}>${st}</option>`).join('')}
            </select>
          </div>
          <div class="form-group full">
            <label>Notas adicionales</label>
            <input type="text" name="notes" class="form-control" value="${this.escapeHtml(item.notes)}" />
          </div>
        </div>
      `;
    } else if (type === 'preEvent' || type === 'eventDay') {
      const list = (this.db.schedule && this.db.schedule[type]) || [];
      const item = id
        ? list.find((s) => s.id === id)
        : {
            date: '2026-12-17',
            timeStart: '10:00',
            timeEnd: '11:30',
            title: '',
            sector: defaultSector,
            responsibleId: this.activeUserId,
            location: 'Salón Principal',
            status: 'Pendiente',
            isMilestone: false,
            notes: ''
          };

      titleEl.textContent =
        type === 'preEvent'
          ? id
            ? '✏️ Editar Hito Pre-Evento'
            : '➕ Nuevo Hito Días Previos'
          : id
          ? '✏️ Editar Tramo Escaleta 18 Diciembre'
          : '➕ Nuevo Tramo Escaleta 18 Diciembre';

      bodyEl.innerHTML = `
        <div class="form-grid">
          <div class="form-group full">
            <label>Actividad / Tramo Horario *</label>
            <input type="text" name="title" class="form-control" required value="${this.escapeHtml(item.title)}" />
          </div>
          ${
            type === 'preEvent'
              ? `
            <div class="form-group">
              <label>Fecha (Día previo)</label>
              <input type="date" name="date" class="form-control" required value="${this.escapeHtml(item.date || '2026-12-17')}" />
            </div>
          `
              : `
            <div class="form-group">
              <label>Tipo de Hito (18 Diciembre)</label>
              <select name="isMilestone" class="form-control">
                <option value="false" ${!item.isMilestone ? 'selected' : ''}>Tramo Estándar</option>
                <option value="true" ${item.isMilestone ? 'selected' : ''}>⭐ Momento Clave / Hito Principal</option>
              </select>
            </div>
          `
          }
          <div class="form-group">
            <label>Ubicación / Zona</label>
            <input type="text" name="location" class="form-control" value="${this.escapeHtml(item.location)}" />
          </div>
          <div class="form-group">
            <label>Hora Inicio</label>
            <input type="time" name="timeStart" class="form-control" required value="${this.escapeHtml(item.timeStart)}" />
          </div>
          <div class="form-group">
            <label>Hora Fin</label>
            <input type="time" name="timeEnd" class="form-control" required value="${this.escapeHtml(item.timeEnd)}" />
          </div>
          <div class="form-group">
            <label>Sector</label>
            <select name="sector" class="form-control">
              ${SECTORS.map((s) => `<option value="${s}" ${item.sector === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Responsable</label>
            <select name="responsibleId" class="form-control">
              ${users.map((u) => `<option value="${u.id}" ${item.responsibleId === u.id ? 'selected' : ''}>${u.name} (${u.sector})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select name="status" class="form-control">
              ${SCHEDULE_STATUSES.map((st) => `<option value="${st}" ${item.status === st ? 'selected' : ''}>${st}</option>`).join('')}
            </select>
          </div>
          <div class="form-group full">
            <label>Notas de coordinación</label>
            <textarea name="notes" rows="2" class="form-control">${this.escapeHtml(item.notes)}</textarea>
          </div>
        </div>
      `;
    } else if (type === 'budgetExtra') {
      const item = id
        ? (this.db.budgetExtra || []).find((b) => b.id === id)
        : {
            concept: '',
            sector: 'Administración',
            responsibleId: this.activeUserId,
            providerName: '',
            budgetEstimated: 0,
            budgetReal: 0,
            amountPaid: 0,
            paymentStatus: 'Pendiente',
            notes: ''
          };

      titleEl.textContent = id ? '✏️ Editar Partida Presupuestaria Extra' : '➕ Nueva Partida Presupuestaria Extra';
      bodyEl.innerHTML = `
        <div class="form-grid">
          <div class="form-group full">
            <label>Concepto de la Partida *</label>
            <input type="text" name="concept" class="form-control" required value="${this.escapeHtml(item.concept)}" />
          </div>
          <div class="form-group">
            <label>Sector</label>
            <select name="sector" class="form-control">
              ${SECTORS.map((s) => `<option value="${s}" ${item.sector === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Responsable</label>
            <select name="responsibleId" class="form-control">
              ${users.map((u) => `<option value="${u.id}" ${item.responsibleId === u.id ? 'selected' : ''}>${u.name} (${u.sector})</option>`).join('')}
            </select>
          </div>
          <div class="form-group full">
            <label>Proveedor / Destinatario</label>
            <input type="text" name="providerName" class="form-control" value="${this.escapeHtml(item.providerName)}" />
          </div>
          <div class="form-group">
            <label>Coste Estimado (€)</label>
            <input type="number" step="0.01" name="budgetEstimated" class="form-control" value="${item.budgetEstimated}" />
          </div>
          <div class="form-group">
            <label>Coste Real / Aprobado (€)</label>
            <input type="number" step="0.01" name="budgetReal" class="form-control" value="${item.budgetReal}" />
          </div>
          <div class="form-group">
            <label>Importe Pagado (€)</label>
            <input type="number" step="0.01" name="amountPaid" class="form-control" value="${item.amountPaid}" />
          </div>
          <div class="form-group">
            <label>Estado de Pago</label>
            <select name="paymentStatus" class="form-control">
              ${PAYMENT_STATUSES.map((ps) => `<option value="${ps}" ${item.paymentStatus === ps ? 'selected' : ''}>${ps}</option>`).join('')}
            </select>
          </div>
          <div class="form-group full">
            <label>Notas</label>
            <textarea name="notes" rows="2" class="form-control">${this.escapeHtml(item.notes)}</textarea>
          </div>
        </div>
      `;
    }

    modal.classList.add('open');
  },

  closeCrudModal() {
    document.getElementById('crud-modal').classList.remove('open');
    this.editingContext = null;
  },

  async saveCrudForm(e) {
    e.preventDefault();
    if (!this.editingContext) return;

    const { type, id } = this.editingContext;
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const nowIso = new Date().toISOString();
    const userName = this.getUserById(this.activeUserId).name;

    if (type === 'need') {
      const record = {
        id: id || `need_${Date.now()}`,
        concept: data.concept.trim(),
        category: data.category,
        subcategory: (data.subcategory || '').trim(),
        sector: data.sector,
        qtyNeeded: Number(data.qtyNeeded) || 0,
        qtyConfirmed: Number(data.qtyConfirmed) || 0,
        unit: (data.unit || 'uds').trim(),
        originType: data.originType,
        providerName: (data.providerName || '').trim(),
        providerContact: (data.providerContact || '').trim(),
        responsibleId: data.responsibleId,
        status: data.status,
        budgetEstimated: Number(data.budgetEstimated) || 0,
        budgetReal: Number(data.budgetReal) || 0,
        amountPaid: Number(data.amountPaid) || 0,
        paymentStatus: data.paymentStatus,
        notes: (data.notes || '').trim(),
        updatedAt: nowIso,
        updatedBy: userName
      };

      const idx = (this.db.needs || []).findIndex((n) => n.id === record.id);
      if (idx >= 0) this.db.needs[idx] = record;
      else this.db.needs.push(record);

      this.closeCrudModal();
      await this.commitChange(`${id ? 'Editado' : 'Añadido'} recurso: ${record.concept}`);
    } else if (type === 'task') {
      const record = {
        id: id || `task_${Date.now()}`,
        title: data.title.trim(),
        description: (data.description || '').trim(),
        sector: data.sector,
        assignedTo: data.assignedTo,
        priority: data.priority,
        dueDate: data.dueDate,
        status: data.status,
        notes: (data.notes || '').trim(),
        updatedAt: nowIso,
        updatedBy: userName
      };

      const idx = (this.db.tasks || []).findIndex((t) => t.id === record.id);
      if (idx >= 0) this.db.tasks[idx] = record;
      else this.db.tasks.push(record);

      this.closeCrudModal();
      await this.commitChange(`${id ? 'Editada' : 'Añadida'} tarea: ${record.title}`);
    } else if (type === 'preEvent' || type === 'eventDay') {
      const record = {
        id: id || `${type === 'preEvent' ? 'pre' : 'ev'}_${Date.now()}`,
        date: type === 'preEvent' ? data.date : '2026-12-18',
        timeStart: data.timeStart,
        timeEnd: data.timeEnd,
        title: data.title.trim(),
        sector: data.sector,
        responsibleId: data.responsibleId,
        location: (data.location || '').trim(),
        status: data.status,
        isMilestone: data.isMilestone === 'true',
        notes: (data.notes || '').trim(),
        updatedAt: nowIso,
        updatedBy: userName
      };

      const list = this.db.schedule[type];
      const idx = list.findIndex((s) => s.id === record.id);
      if (idx >= 0) list[idx] = record;
      else list.push(record);

      list.sort((a, b) =>
        `${a.date || ''} ${a.timeStart || ''}`.localeCompare(`${b.date || ''} ${b.timeStart || ''}`)
      );

      this.closeCrudModal();
      await this.commitChange(`${id ? 'Editado' : 'Añadido'} horario: ${record.title}`);
    } else if (type === 'budgetExtra') {
      const record = {
        id: id || `bex_${Date.now()}`,
        concept: data.concept.trim(),
        sector: data.sector,
        responsibleId: data.responsibleId,
        providerName: (data.providerName || '').trim(),
        budgetEstimated: Number(data.budgetEstimated) || 0,
        budgetReal: Number(data.budgetReal) || 0,
        amountPaid: Number(data.amountPaid) || 0,
        paymentStatus: data.paymentStatus,
        notes: (data.notes || '').trim(),
        updatedAt: nowIso,
        updatedBy: userName
      };

      const idx = (this.db.budgetExtra || []).findIndex((b) => b.id === record.id);
      if (idx >= 0) this.db.budgetExtra[idx] = record;
      else this.db.budgetExtra.push(record);

      this.closeCrudModal();
      await this.commitChange(`${id ? 'Editada' : 'Añadida'} partida: ${record.concept}`);
    }
  },

  async deleteCrudRecord() {
    if (!this.editingContext || !this.editingContext.id) return;
    const { type, id } = this.editingContext;
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;

    this.db.deletedIds = this.db.deletedIds || [];
    if (!this.db.deletedIds.includes(id)) {
      this.db.deletedIds.push(id);
    }

    if (type === 'need') {
      this.db.needs = (this.db.needs || []).filter((n) => n.id !== id);
    } else if (type === 'task') {
      this.db.tasks = (this.db.tasks || []).filter((t) => t.id !== id);
    } else if (type === 'preEvent' || type === 'eventDay') {
      this.db.schedule[type] = (this.db.schedule[type] || []).filter((s) => s.id !== id);
    } else if (type === 'budgetExtra') {
      this.db.budgetExtra = (this.db.budgetExtra || []).filter((b) => b.id !== id);
    }

    this.closeCrudModal();
    await this.commitChange(`Eliminado registro (${id})`);
  },

  /* ========================================================================
     7. MOTOR DE IMPRESIÓN DINÁMICA A4 (@media print) EN BLANCO Y NEGRO
     ======================================================================== */
  getActiveFilterSummaryText() {
    const parts = [];
    parts.push(`Sector: ${this.filters.sector === 'ALL' ? 'TODOS LOS SECTORES' : this.filters.sector.toUpperCase()}`);
    if (this.filters.user === 'ALL') {
      parts.push('Responsable: EQUIPO COMPLETO (4)');
    } else if (this.filters.user === 'MINE') {
      parts.push(`Responsable: ${this.getUserById(this.activeUserId).name.toUpperCase()}`);
    } else {
      parts.push(`Responsable: ${this.getUserById(this.filters.user).name.toUpperCase()}`);
    }
    if (this.filters.status !== 'ALL') {
      parts.push(`Estado: ${this.filters.status.toUpperCase()}`);
    }
    if (this.filters.search.trim()) {
      parts.push(`Búsqueda: "${this.filters.search.trim()}"`);
    }
    return parts.join('  |  ');
  },

  buildPrintDocument() {
    const printEl = document.getElementById('print-document');
    if (!printEl || !this.db) return;

    const nowStr = new Date().toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
    const activeUser = this.getUserById(this.activeUserId);

    const viewNames = {
      dashboard: 'INFORME EJECUTIVO INTEGRAL (CUADRO DE MANDO)',
      needs: 'LISTADO DE NECESIDADES, LOGÍSTICA Y PROVEEDORES',
      tasks: 'HOJA DE TAREAS Y SEGUIMIENTO OPERATIVO',
      schedule: 'CRONOGRAMA Y ESCALETA DE TIEMPOS (18 DE DICIEMBRE)',
      budget: 'INFORME DE PRESUPUESTO, COSTES Y PAGOS'
    };

    let bodyHtml = '';

    if (this.currentView === 'needs') {
      const items = this.getFilteredNeeds();
      const sumEst = items.reduce((a, b) => a + (Number(b.budgetEstimated) || 0), 0);
      const sumReal = items.reduce((a, b) => a + (Number(b.budgetReal) || 0), 0);

      bodyHtml = `
        <div class="print-summary-strip">
          <span>Total Ítems Filtrados: ${items.length}</span>
          <span>Coste Estimado: ${this.formatCurrency(sumEst)}</span>
          <span>Coste Real: ${this.formatCurrency(sumReal)}</span>
        </div>
        <table class="print-table">
          <thead>
            <tr>
              <th style="width:24px;">OK</th>
              <th>Concepto / Recurso</th>
              <th>Categoría</th>
              <th>Sector</th>
              <th>Cantidad</th>
              <th>Origen / Proveedor</th>
              <th>Resp.</th>
              <th>Estado</th>
              <th>Coste Real</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (i) => `
              <tr>
                <td><span class="print-check-box"></span></td>
                <td>
                  <strong>${this.escapeHtml(i.concept)}</strong>
                  ${i.notes ? `<br/><small>Nota: ${this.escapeHtml(i.notes)}</small>` : ''}
                </td>
                <td>${this.escapeHtml(i.category)}</td>
                <td>${this.escapeHtml(i.sector)}</td>
                <td>${i.qtyConfirmed} / ${i.qtyNeeded} ${this.escapeHtml(i.unit || '')}</td>
                <td>${this.escapeHtml(i.originType)}: ${this.escapeHtml(i.providerName || '-')} ${i.providerContact ? `(${this.escapeHtml(i.providerContact)})` : ''}</td>
                <td>${this.escapeHtml(this.getUserById(i.responsibleId).name)}</td>
                <td>${this.escapeHtml(i.status)}</td>
                <td style="text-align:right;">${this.formatCurrency(i.budgetReal)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    } else if (this.currentView === 'tasks') {
      const tasks = this.getFilteredTasks();
      bodyHtml = `
        <div class="print-summary-strip">
          <span>Total Tareas Filtradas: ${tasks.length}</span>
          <span>Pendientes/En Curso: ${tasks.filter((t) => t.status !== 'Completada').length}</span>
          <span>Completadas: ${tasks.filter((t) => t.status === 'Completada').length}</span>
        </div>
        <table class="print-table">
          <thead>
            <tr>
              <th style="width:24px;">OK</th>
              <th>Tarea / Descripción</th>
              <th>Prioridad</th>
              <th>Sector</th>
              <th>Responsable</th>
              <th>Fecha Límite</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${tasks
              .map(
                (t) => `
              <tr>
                <td><span class="print-check-box"></span></td>
                <td>
                  <strong>${this.escapeHtml(t.title)}</strong>
                  ${t.description ? `<br/><small>${this.escapeHtml(t.description)}</small>` : ''}
                  ${t.notes ? `<br/><small>Nota: ${this.escapeHtml(t.notes)}</small>` : ''}
                </td>
                <td>${this.escapeHtml(t.priority)}</td>
                <td>${this.escapeHtml(t.sector)}</td>
                <td>${this.escapeHtml(this.getUserById(t.assignedTo).name)}</td>
                <td>${this.escapeHtml(t.dueDate || '-')}</td>
                <td>${this.escapeHtml(t.status)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    } else if (this.currentView === 'schedule') {
      const { preEvent, eventDay } = this.getFilteredSchedule();
      const showPre = this.filters.schedulePhase === 'ALL' || this.filters.schedulePhase === 'preEvent';
      const showEv = this.filters.schedulePhase === 'ALL' || this.filters.schedulePhase === 'eventDay';

      bodyHtml = `
        ${
          showPre
            ? `
          <h3 style="margin:8px 0 6px;font-size:11pt;text-transform:uppercase;">1. Cronograma Días Previos (Pre-Evento)</h3>
          <table class="print-table">
            <thead>
              <tr>
                <th style="width:24px;">OK</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Actividad / Hito</th>
                <th>Ubicación</th>
                <th>Sector</th>
                <th>Resp.</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${preEvent
                .map(
                  (p) => `
                <tr>
                  <td><span class="print-check-box"></span></td>
                  <td><strong>${this.escapeHtml(p.date)}</strong></td>
                  <td>${this.escapeHtml(p.timeStart)} - ${this.escapeHtml(p.timeEnd)}</td>
                  <td>
                    <strong>${this.escapeHtml(p.title)}</strong>
                    ${p.notes ? `<br/><small>${this.escapeHtml(p.notes)}</small>` : ''}
                  </td>
                  <td>${this.escapeHtml(p.location || '-')}</td>
                  <td>${this.escapeHtml(p.sector)}</td>
                  <td>${this.escapeHtml(this.getUserById(p.responsibleId).name)}</td>
                  <td>${this.escapeHtml(p.status)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }
        ${
          showEv
            ? `
          <h3 style="margin:12px 0 6px;font-size:11pt;text-transform:uppercase;">2. Escaleta Minuto a Minuto · Viernes 18 de Diciembre 2026</h3>
          <table class="print-table">
            <thead>
              <tr>
                <th style="width:24px;">OK</th>
                <th>Horario</th>
                <th>Hito / Escaleta del Evento</th>
                <th>Zona / Sala</th>
                <th>Sector</th>
                <th>Resp.</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${eventDay
                .map(
                  (ev) => `
                <tr>
                  <td><span class="print-check-box"></span></td>
                  <td><strong>${this.escapeHtml(ev.timeStart)} - ${this.escapeHtml(ev.timeEnd)}</strong></td>
                  <td>
                    <strong>${ev.isMilestone ? '[HITO] ' : ''}${this.escapeHtml(ev.title)}</strong>
                    ${ev.notes ? `<br/><small>${this.escapeHtml(ev.notes)}</small>` : ''}
                  </td>
                  <td>${this.escapeHtml(ev.location || '-')}</td>
                  <td>${this.escapeHtml(ev.sector)}</td>
                  <td>${this.escapeHtml(this.getUserById(ev.responsibleId).name)}</td>
                  <td>${this.escapeHtml(ev.status)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }
      `;
    } else if (this.currentView === 'budget') {
      const items = this.getUnifiedBudgetItems();
      const sumEst = items.reduce((a, b) => a + b.budgetEstimated, 0);
      const sumReal = items.reduce((a, b) => a + b.budgetReal, 0);
      const sumPaid = items.reduce((a, b) => a + b.amountPaid, 0);
      const sumPend = Math.max(0, sumReal - sumPaid);

      bodyHtml = `
        <div class="print-summary-strip">
          <span>Estimado: ${this.formatCurrency(sumEst)}</span>
          <span>Real/Aprobado: ${this.formatCurrency(sumReal)}</span>
          <span>Pagado: ${this.formatCurrency(sumPaid)}</span>
          <span>Pendiente de Pago: ${this.formatCurrency(sumPend)}</span>
        </div>
        <table class="print-table">
          <thead>
            <tr>
              <th>Concepto / Partida</th>
              <th>Sector</th>
              <th>Proveedor</th>
              <th>Resp.</th>
              <th>Estimado</th>
              <th>Real</th>
              <th>Pagado</th>
              <th>Pendiente</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (i) => `
              <tr>
                <td><strong>${this.escapeHtml(i.concept)}</strong></td>
                <td>${this.escapeHtml(i.sector)}</td>
                <td>${this.escapeHtml(i.providerName)}</td>
                <td>${this.escapeHtml(this.getUserById(i.responsibleId).name)}</td>
                <td style="text-align:right;">${this.formatCurrency(i.budgetEstimated)}</td>
                <td style="text-align:right;"><strong>${this.formatCurrency(i.budgetReal)}</strong></td>
                <td style="text-align:right;">${this.formatCurrency(i.amountPaid)}</td>
                <td style="text-align:right;">${this.formatCurrency(Math.max(0, i.budgetReal - i.amountPaid))}</td>
                <td>${this.escapeHtml(i.paymentStatus)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    } else {
      // Dashboard Impreso: Resumen Integral (Necesidades + Tareas + Escaleta 18 Dic)
      const needs = this.getFilteredNeeds();
      const tasks = this.getFilteredTasks().filter((t) => t.status !== 'Completada');
      const { eventDay } = this.getFilteredSchedule();
      const budgetItems = this.getUnifiedBudgetItems();
      const sumReal = budgetItems.reduce((a, b) => a + b.budgetReal, 0);
      const sumPaid = budgetItems.reduce((a, b) => a + b.amountPaid, 0);

      bodyHtml = `
        <div class="print-summary-strip">
          <span>Recursos: ${needs.length}</span>
          <span>Tareas Activas: ${tasks.length}</span>
          <span>Tramos 18 Dic: ${eventDay.length}</span>
          <span>Presupuesto Real: ${this.formatCurrency(sumReal)} (Pagado: ${this.formatCurrency(sumPaid)})</span>
        </div>

        <h3 style="margin:8px 0 4px;font-size:10.5pt;text-transform:uppercase;">1. Tareas Pendientes / En Curso</h3>
        <table class="print-table">
          <thead>
            <tr>
              <th style="width:22px;">OK</th>
              <th>Tarea</th>
              <th>Prioridad</th>
              <th>Sector</th>
              <th>Resp.</th>
              <th>Fecha Límite</th>
            </tr>
          </thead>
          <tbody>
            ${tasks
              .map(
                (t) => `
              <tr>
                <td><span class="print-check-box"></span></td>
                <td><strong>${this.escapeHtml(t.title)}</strong></td>
                <td>${this.escapeHtml(t.priority)}</td>
                <td>${this.escapeHtml(t.sector)}</td>
                <td>${this.escapeHtml(this.getUserById(t.assignedTo).name)}</td>
                <td>${this.escapeHtml(t.dueDate || '-')}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <h3 style="margin:10px 0 4px;font-size:10.5pt;text-transform:uppercase;">2. Necesidades y Logística (${needs.length})</h3>
        <table class="print-table">
          <thead>
            <tr>
              <th style="width:22px;">OK</th>
              <th>Concepto</th>
              <th>Sector</th>
              <th>Cant.</th>
              <th>Proveedor</th>
              <th>Resp.</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${needs
              .map(
                (n) => `
              <tr>
                <td><span class="print-check-box"></span></td>
                <td><strong>${this.escapeHtml(n.concept)}</strong></td>
                <td>${this.escapeHtml(n.sector)}</td>
                <td>${n.qtyConfirmed}/${n.qtyNeeded} ${this.escapeHtml(n.unit || '')}</td>
                <td>${this.escapeHtml(n.providerName || '-')}</td>
                <td>${this.escapeHtml(this.getUserById(n.responsibleId).name)}</td>
                <td>${this.escapeHtml(n.status)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;
    }

    printEl.innerHTML = `
      <div class="print-header">
        <div>
          <div class="print-title">FIESTA EMPRESARIAL DE NAVIDAD 2026 · 18 DICIEMBRE</div>
          <div class="print-subtitle">${viewNames[this.currentView] || 'INFORME OPERATIVO'}</div>
        </div>
        <div class="print-meta">
          <div>Impreso por: <strong>${this.escapeHtml(activeUser.name)} (${this.escapeHtml(activeUser.sector)})</strong></div>
          <div>Fecha: ${nowStr}</div>
        </div>
      </div>
      <div class="print-filter-banner">
        <strong>FILTROS ACTIVOS EN ESTA HOJA:</strong> ${this.escapeHtml(this.getActiveFilterSummaryText())}
      </div>
      ${bodyHtml}
      <div class="print-footer">
        <span>Fiesta Empresarial de Navidad · 18 de Diciembre de 2026 (Instalaciones Propias)</span>
        <span>Documento Operativo A4 · Control de Equipo (TeTe · Bea · Leli · Jose)</span>
      </div>
    `;
  },

  printCurrentView() {
    this.buildPrintDocument();
    window.print();
  },

  /* ========================================================================
     8. EXPORTACIÓN A EXCEL (CSV UTF-8 BOM) Y BACKUP/RESTORE JSON
     ======================================================================== */
  exportCurrentCSV() {
    let headers = [];
    let rows = [];
    let filename = `Navidad2026_${this.currentView}_${this.filters.sector}.csv`;

    if (this.currentView === 'needs' || this.currentView === 'dashboard') {
      const items = this.getFilteredNeeds();
      headers = [
        'ID',
        'Concepto',
        'Categoría',
        'Subcategoría',
        'Sector',
        'Cant. Necesaria',
        'Cant. Confirmada',
        'Unidad',
        'Origen',
        'Proveedor',
        'Contacto',
        'Responsable',
        'Estado',
        'Coste Estimado (€)',
        'Coste Real (€)',
        'Pagado (€)',
        'Estado Pago',
        'Notas'
      ];
      rows = items.map((i) => [
        i.id,
        i.concept,
        i.category,
        i.subcategory || '',
        i.sector,
        i.qtyNeeded,
        i.qtyConfirmed,
        i.unit || '',
        i.originType,
        i.providerName || '',
        i.providerContact || '',
        this.getUserById(i.responsibleId).name,
        i.status,
        i.budgetEstimated,
        i.budgetReal,
        i.amountPaid,
        i.paymentStatus,
        i.notes || ''
      ]);
    } else if (this.currentView === 'tasks') {
      const items = this.getFilteredTasks();
      headers = ['ID', 'Tarea', 'Descripción', 'Prioridad', 'Sector', 'Responsable', 'Fecha Límite', 'Estado', 'Notas'];
      rows = items.map((t) => [
        t.id,
        t.title,
        t.description || '',
        t.priority,
        t.sector,
        this.getUserById(t.assignedTo).name,
        t.dueDate || '',
        t.status,
        t.notes || ''
      ]);
    } else if (this.currentView === 'schedule') {
      const { preEvent, eventDay } = this.getFilteredSchedule();
      headers = ['Fase', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Actividad / Hito', 'Ubicación', 'Sector', 'Responsable', 'Estado', 'Notas'];
      rows = [
        ...preEvent.map((p) => [
          'Pre-Evento',
          p.date,
          p.timeStart,
          p.timeEnd,
          p.title,
          p.location || '',
          p.sector,
          this.getUserById(p.responsibleId).name,
          p.status,
          p.notes || ''
        ]),
        ...eventDay.map((e) => [
          'Día 18 Diciembre',
          '2026-12-18',
          e.timeStart,
          e.timeEnd,
          e.title,
          e.location || '',
          e.sector,
          this.getUserById(e.responsibleId).name,
          e.status,
          e.notes || ''
        ])
      ];
    } else if (this.currentView === 'budget') {
      const items = this.getUnifiedBudgetItems();
      headers = ['ID', 'Concepto', 'Categoría', 'Sector', 'Proveedor', 'Responsable', 'Estimado (€)', 'Real (€)', 'Pagado (€)', 'Pendiente (€)', 'Estado Pago', 'Notas'];
      rows = items.map((b) => [
        b.id,
        b.concept,
        b.category,
        b.sector,
        b.providerName,
        this.getUserById(b.responsibleId).name,
        b.budgetEstimated,
        b.budgetReal,
        b.amountPaid,
        Math.max(0, b.budgetReal - b.amountPaid),
        b.paymentStatus,
        b.notes || ''
      ]);
    }

    const escapeCsvCell = (val) => {
      const str = String(val ?? '').replace(/\r?\n/g, ' ');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvContent =
      '\uFEFF' +
      [headers.map(escapeCsvCell).join(';'), ...rows.map((r) => r.map(escapeCsvCell).join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportFullJSON() {
    if (!this.db) return;
    const content = JSON.stringify(this.db, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Navidad2026_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async importFullJSON(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!imported.needs || !imported.tasks || !imported.schedule) {
        alert('El archivo JSON no tiene el formato válido de Navidad 2026.');
        return;
      }
      if (!confirm('¿Deseas fusionar/restaurar esta copia de seguridad JSON y sincronizarla con GitHub?')) {
        return;
      }
      this.db = this.smartMergeDatabases(imported, this.db);
      await this.commitChange('Restauración / Fusión de Copia de Seguridad JSON');
      alert('Copia de seguridad importada y sincronizada correctamente.');
    } catch (err) {
      alert('Error al leer el archivo JSON: ' + err.message);
    } finally {
      event.target.value = '';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
