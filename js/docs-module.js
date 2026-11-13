/**
 * MÓDULO DE ARCHIVO DOCUMENTAL Y CONSULTA DE FACTURAS HISTÓRICAS (NAVIDAD 2026)
 * - Cero impacto en el rendimiento de data/db.json: los binarios (PDF/JPG/PNG) se guardan
 *   como archivos independientes en `docs/` dentro de GitHub y en caché local IndexedDB.
 * - Solo para consulta (no altera el presupuesto ni las necesidades activas de 2026).
 * - Incluye Visualizador Interactivo (Zoom, Rotación 90°/180° y Desplazamiento Horizontal y Vertical)
 *   y Generador de Resumen de Facturas (extracción directa PDF.js + OCR en español Tesseract.js).
 */

var DOC_TYPES = ['Factura', 'Presupuesto', 'Albarán', 'Menú / Catálogo', 'Otro Documento'];
var DOC_YEARS = ['2025', '2024', '2023', '2022', '2026', 'Histórico'];

var DocsModule = {
  idbName: 'navidad2026_docs_idb',
  idbStore: 'files',
  pdfJsLoaded: false,
  tesseractLoaded: false,

  //Filtros locales de la vista de documentos
  docFilters: {
    year: 'ALL',
    docType: 'ALL'
  },

  // Estado del visualizador interactivo
  viewer: {
    isOpen: false,
    docId: null,
    blobUrl: null,
    mimeType: '',
    pdfDoc: null,
    pageNum: 1,
    pageCount: 1,
    zoom: 1, // 0.25 a 5.0
    rotation: 0, // 0, 90, 180, 270
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    panOriginX: 0,
    panOriginY: 0,
    sidePanelOpen: true,
    isSummarizing: false,
    ocrStatusText: ''
  },

  // Estado temporal del modal de subida
  pendingUpload: {
    file: null,
    processedBlob: null,
    mimeType: '',
    cleanFileName: '',
    extractedSummary: '',
    detectedProvider: '',
    detectedYear: '2025',
    detectedTotal: 0,
    isAnalyzing: false
  },

  /* ========================================================================
     1. CACHÉ LOCAL EN INDEXEDDB (INSTANTÁNEO Y OFFLINE)
     ======================================================================== */
  openIdb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      const req = indexedDB.open(this.idbName, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.idbStore)) {
          db.createObjectStore(this.idbStore, { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = () => resolve(null);
    });
  },

  async saveBlobToIdb(id, blob, mimeType, fileName) {
    const db = await this.openIdb();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(this.idbStore, 'readwrite');
      tx.objectStore(this.idbStore).put({
        id,
        blob,
        mimeType,
        fileName,
        savedAt: Date.now()
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  },

  async getBlobFromIdb(id) {
    const db = await this.openIdb();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(this.idbStore, 'readonly');
      const req = tx.objectStore(this.idbStore).get(id);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => resolve(null);
    });
  },

  async deleteBlobFromIdb(id) {
    const db = await this.openIdb();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(this.idbStore, 'readwrite');
      tx.objectStore(this.idbStore).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  },

  /* ========================================================================
     2. SUBIDA Y DESCARGA DE BINARIOS EN GITHUB (`docs/`) SIN INFLAR `db.json`
     ======================================================================== */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  },

  sanitizeFileName(name) {
    return (name || 'documento')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .slice(-80);
  },

  formatBytes(bytes) {
    const b = Number(bytes) || 0;
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  },

  async optimizeImageIfNeeded(file) {
    if (!file.type.startsWith('image/') || file.size <= 900 * 1024) {
      return { blob: file, mimeType: file.type || 'application/octet-stream' };
    }

    return new Promise((resolve) => {
      const img = new Image();
      const tmpUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(tmpUrl);
        const maxDim = 2200; // Mantiene nitidez perfecta para leer letra pequeña de facturas
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve({ blob, mimeType: 'image/jpeg' });
            } else {
              resolve({ blob: file, mimeType: file.type });
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(tmpUrl);
        resolve({ blob: file, mimeType: file.type });
      };
      img.src = tmpUrl;
    });
  },

  async uploadBinaryToGitHub(repoPath, blob, commitMessage) {
    if (!App.ghToken) {
      return { uploaded: false, reason: 'no-token' };
    }

    const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${repoPath}`;
    const headers = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${App.ghToken}`,
      'X-GitHub-Api-Version': '2022-11-28'
    };

    let existingSha = null;
    try {
      const getRes = await fetch(`${apiUrl}?ref=${GITHUB_CONFIG.branch}&t=${Date.now()}`, {
        headers,
        cache: 'no-store'
      });
      if (getRes.ok) {
        const meta = await getRes.json();
        existingSha = meta.sha;
      }
    } catch (e) {
      // Archivo nuevo
    }

    const arrayBuf = await blob.arrayBuffer();
    const contentB64 = this.arrayBufferToBase64(arrayBuf);

    const body = {
      message: commitMessage,
      content: contentB64,
      branch: GITHUB_CONFIG.branch
    };
    if (existingSha) body.sha = existingSha;

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      throw new Error(`Error subiendo archivo a GitHub (HTTP ${putRes.status})`);
    }
    const resJson = await putRes.json();
    return { uploaded: true, sha: resJson.content && resJson.content.sha };
  },

  async deleteBinaryFromGitHub(repoPath, title) {
    if (!App.ghToken || !repoPath) return;
    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${repoPath}`;
      const headers = {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${App.ghToken}`,
        'X-GitHub-Api-Version': '2022-11-28'
      };
      const getRes = await fetch(`${apiUrl}?ref=${GITHUB_CONFIG.branch}&t=${Date.now()}`, { headers });
      if (!getRes.ok) return;
      const meta = await getRes.json();
      if (!meta.sha) return;

      await fetch(apiUrl, {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Eliminar documento de consulta: ${title}`,
          sha: meta.sha,
          branch: GITHUB_CONFIG.branch
        })
      });
    } catch (err) {
      console.warn('No se pudo borrar el binario remoto:', err);
    }
  },

  async resolveDocumentBlob(doc) {
    // 1. Intentar desde IndexedDB local
    const cached = await this.getBlobFromIdb(doc.id);
    if (cached) return cached;

    if (!doc.repoPath) {
      throw new Error('Este documento solo estaba en el dispositivo donde se subió (sin sincronizar a GitHub).');
    }

    // 2. Intentar por ruta relativa directa (GitHub Pages o carpeta local servida por HTTP)
    try {
      const localRes = await fetch(`./${doc.repoPath}?t=${Date.now()}`);
      if (localRes.ok) {
        const rawBlob = await localRes.blob();
        const typedBlob = new Blob([rawBlob], { type: doc.mimeType || rawBlob.type });
        await this.saveBlobToIdb(doc.id, typedBlob, doc.mimeType, doc.fileName);
        return typedBlob;
      }
    } catch (e) {
      // Continuar a GitHub API
    }

    // 3. Descargar desde GitHub API (soporta archivos recién subidos aunque GitHub Pages tarde 1 min)
    const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${doc.repoPath}?ref=${GITHUB_CONFIG.branch}`;
    const headers = {
      Accept: 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (App.ghToken) {
      headers.Authorization = `Bearer ${App.ghToken}`;
    }

    const apiRes = await fetch(apiUrl, { headers, cache: 'no-store' });
    if (!apiRes.ok) {
      throw new Error(`No se pudo descargar el documento desde GitHub (HTTP ${apiRes.status}). Comprueba que el PIN esté activo.`);
    }
    const buf = await apiRes.arrayBuffer();
    const finalBlob = new Blob([buf], { type: doc.mimeType || 'application/octet-stream' });
    await this.saveBlobToIdb(doc.id, finalBlob, doc.mimeType, doc.fileName);
    return finalBlob;
  },

  /* ========================================================================
     3. CARGA BAJO DEMANDA DE PDF.JS Y TESSERACT OCR + RESUMEN DE FACTURAS
     ======================================================================== */
  async ensurePdfJs() {
    if (window.pdfjsLib) {
      this.pdfJsLoaded = true;
      return window.pdfjsLib;
    }
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          this.pdfJsLoaded = true;
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('PDF.js no disponible'));
        }
      };
      s.onerror = () => reject(new Error('No se pudo cargar el visor PDF.js (revisa tu conexión a internet).'));
      document.head.appendChild(s);
    });
  },

  async ensureTesseract() {
    if (window.Tesseract) {
      this.tesseractLoaded = true;
      return window.Tesseract;
    }
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      s.onload = () => {
        this.tesseractLoaded = true;
        resolve(window.Tesseract);
      };
      s.onerror = () => reject(new Error('No se pudo cargar el motor OCR (revisa tu conexión a internet).'));
      document.head.appendChild(s);
    });
  },

  async extractTextFromPdfBlob(blob) {
    const pdfjsLib = await this.ensurePdfJs();
    const arrayBuf = await blob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
    const allLines = [];

    const maxPages = Math.min(pdf.numPages, 8);
    for (let p = 1; p <= maxPages; p++) {
      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();
      // Agrupar fragmentos por coordenada Y aproximada para reconstruir las filas de la factura
      const rowMap = new Map();
      for (const item of textContent.items) {
        const str = (item.str || '').trim();
        if (!str) continue;
        const y = Math.round((item.transform ? item.transform[5] : 0) / 4) * 4;
        if (!rowMap.has(y)) rowMap.set(y, []);
        rowMap.get(y).push({ x: item.transform ? item.transform[4] : 0, str });
      }
      const sortedYs = Array.from(rowMap.keys()).sort((a, b) => b - a);
      for (const y of sortedYs) {
        const rowItems = rowMap.get(y).sort((a, b) => a.x - b.x);
        const lineStr = rowItems.map((r) => r.str).join('   ').trim();
        if (lineStr) allLines.push(lineStr);
      }
    }
    return { text: allLines.join('\n'), numPages: pdf.numPages };
  },

  async extractTextWithOcr(imageSource, onProgress) {
    const Tesseract = await this.ensureTesseract();
    const result = await Tesseract.recognize(imageSource, 'spa', {
      logger: (m) => {
        if (m && m.status && onProgress) {
          const pct = m.progress ? Math.round(m.progress * 100) : 0;
          onProgress(`🔍 Leyendo factura con OCR (${pct}%)...`);
        }
      }
    });
    return (result && result.data && result.data.text) || '';
  },

  parseAmountString(raw) {
    if (!raw) return 0;
    let clean = String(raw).replace(/[€$\s]/g, '').trim();
    if (clean.includes(',') && clean.includes('.')) {
      if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    const num = parseFloat(clean);
    return Number.isFinite(num) ? num : 0;
  },

  /**
   * Analiza el texto extraído de una factura/presupuesto y construye un resumen estructurado
   * con proveedor, fecha/año, total y desglose de cantidades y precios unitarios.
   */
  analyzeInvoiceText(rawText, fallbackName = '') {
    const lines = (rawText || '')
      .split(/\r?\n/)
      .map((l) => l.replace(/\s{2,}/g, ' ').trim())
      .filter((l) => l.length > 1);

    if (!lines.length) {
      return {
        provider: '',
        year: '2025',
        total: 0,
        summary: '⚠️ No se detectó texto legible automáticamente. Puedes escribir aquí las cantidades, precios y proveedor de referencia.'
      };
    }

    // 1. Detectar CIF/NIF y Proveedor
    const cifRegex = /\b([A-HJ-NP-SUVW]\s?-?\d{7}[0-9A-J]|\d{8}\s?-?[A-Z])\b/i;
    const companyRegex = /\b(S\.?L\.?U?\.?|S\.?A\.?|C\.?B\.?|COOP|DISTRIBUCIONES|CATERING|HOSTELERIA|ALIMENTACION|BEBIDAS|EVENTOS|BODEGAS|CARNICAS|IBERICOS|OBRADOR)\b/i;
    let detectedCif = '';
    let detectedProvider = '';

    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const l = lines[i];
      if (!detectedCif) {
        const mCif = l.match(cifRegex);
        if (mCif) detectedCif = mCif[0];
      }
      if (!detectedProvider && companyRegex.test(l) && !/factura|fecha|cliente|albaran/i.test(l)) {
        detectedProvider = l.slice(0, 70);
      }
    }
    if (!detectedProvider && lines[0]) {
      detectedProvider = lines[0].replace(/factura|presupuesto|albaran/gi, '').trim().slice(0, 60);
    }

    // 2. Detectar Fecha y Año
    let detectedDate = '';
    let detectedYear = '2025';
    const dateMatch = rawText.match(/\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.](20\d{2}|\d{2}))\b/);
    if (dateMatch) {
      detectedDate = dateMatch[1];
      const yPart = dateMatch[2];
      detectedYear = yPart.length === 2 ? `20${yPart}` : yPart;
    } else {
      const yearMatch = `${fallbackName} ${rawText}`.match(/\b(202[1-6])\b/);
      if (yearMatch) detectedYear = yearMatch[1];
    }

    // 3. Detectar Nº Factura
    let invoiceNum = '';
    const invMatch = rawText.match(/(?:factura|fra\.?|albar[aá]n|presupuesto)\s*(?:n[º°o.]?|num\.?|#|:)?\s*([A-Z0-9\-\/]{3,20})/i);
    if (invMatch) invoiceNum = invMatch[1];

    // 4. Detectar Importe Total
    let detectedTotal = 0;
    const totalRegexes = [
      /(?:total\s+factura|total\s+a\s+pagar|importe\s+total|total\s+eur|total\s+€|líquido\s+total)[^\d]{0,18}(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/i,
      /\btotal\b[^\d\n]{0,15}(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/gi
    ];

    const mMainTotal = rawText.match(totalRegexes[0]);
    if (mMainTotal) {
      detectedTotal = this.parseAmountString(mMainTotal[1]);
    } else {
      let matches;
      while ((matches = totalRegexes[1].exec(rawText)) !== null) {
        const val = this.parseAmountString(matches[1]);
        if (val > detectedTotal) detectedTotal = val;
      }
    }

    // 5. Extraer líneas de artículos (cantidades, conceptos y precios)
    const itemLines = [];
    const ignoreLineRegex = /\b(subtotal|base\s+imponible|i\.?v\.?a\.?|recargo|total\s+factura|vencimiento|iban|forma\s+de\s+pago|transferencia|registro\s+mercantil|página|domicilio|c\.?i\.?f\.?|n\.?i\.?f\.?)\b/i;
    const priceAtEndRegex = /(\d{1,4}(?:[.,]\d{3})*[.,]\d{2})\s*€?/;
    const qtyStartRegex = /^(\d+(?:[.,]\d+)?)\s*(ud|uds|unid|kg|kgs|caja|cajas|bot|botellas|l|lt|pack|bandeja|piezas|pza|rac|horas|h)?\b/i;

    for (const line of lines) {
      if (line.length < 6 || line.length > 140) continue;
      if (ignoreLineRegex.test(line)) continue;
      if (priceAtEndRegex.test(line) && (qtyStartRegex.test(line) || /\d+\s*[xX*]\s*\d+/.test(line) || /[a-zA-ZáéíóúñÁÉÍÓÚÑ]{4,}/.test(line))) {
        // Evitar líneas que son solo fechas o teléfonos
        if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(line)) continue;
        itemLines.push(`• ${line}`);
        if (itemLines.length >= 18) break;
      }
    }

    // Construir resumen limpio y fácil de consultar
    const summaryParts = [];
    const headerBits = [];
    if (detectedProvider) headerBits.push(`🏢 Proveedor: ${detectedProvider}${detectedCif ? ` (${detectedCif})` : ''}`);
    if (detectedDate || invoiceNum) {
      headerBits.push(`📅 ${detectedDate ? `Fecha: ${detectedDate}` : `Año: ${detectedYear}`}${invoiceNum ? ` · Nº: ${invoiceNum}` : ''}`);
    }
    if (detectedTotal > 0) {
      headerBits.push(`💶 Importe Total: ${App.formatCurrency(detectedTotal)}`);
    }
    if (headerBits.length) {
      summaryParts.push(headerBits.join(' | '));
    }

    if (itemLines.length) {
      summaryParts.push('\n📦 Conceptos, Cantidades y Precios detectados:\n' + itemLines.join('\n'));
    } else {
      const previewLines = lines.slice(0, 12).map((l) => `• ${l}`);
      summaryParts.push('\n📄 Extracto del documento:\n' + previewLines.join('\n'));
    }

    return {
      provider: detectedProvider,
      year: DOC_YEARS.includes(detectedYear) ? detectedYear : '2025',
      total: detectedTotal,
      summary: summaryParts.join('\n')
    };
  },

  /* ========================================================================
     4. MODAL PARA SUBIR NUEVO DOCUMENTO / FACTURA
     ======================================================================== */
  ensureModalsInDom() {
    if (typeof document === 'undefined' || !document.body) return;
    if (!document.getElementById('doc-upload-modal')) {
      const up = document.createElement('div');
      up.className = 'modal-backdrop';
      up.id = 'doc-upload-modal';
      up.innerHTML = `
        <div class="modal-box" style="max-width:680px;">
          <div class="modal-header">
            <h3 class="modal-title">📤 Subir Factura o Documento (Solo Consulta)</h3>
            <button type="button" class="btn btn-secondary btn-sm" onclick="DocsModule.closeUploadModal()">✕</button>
          </div>
          <form onsubmit="DocsModule.saveUploadedDocument(event)">
            <div class="modal-body" id="doc-upload-modal-body"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="DocsModule.closeUploadModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="doc-upload-submit-btn">💾 Archivar y Consultar</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(up);
    }
    if (!document.getElementById('doc-viewer-modal')) {
      const vw = document.createElement('div');
      vw.className = 'modal-backdrop';
      vw.id = 'doc-viewer-modal';
      vw.innerHTML = `<div class="doc-viewer-shell" id="doc-viewer-modal-content"></div>`;
      document.body.appendChild(vw);
    }
  },

  openUploadModal() {
    this.ensureModalsInDom();
    this.pendingUpload = {
      file: null,
      processedBlob: null,
      mimeType: '',
      cleanFileName: '',
      extractedSummary: '',
      detectedProvider: '',
      detectedYear: '2025',
      detectedTotal: 0,
      isAnalyzing: false
    };

    const modal = document.getElementById('doc-upload-modal');
    if (!modal) return;
    this.renderUploadModalBody();
    modal.classList.add('open');
  },

  closeUploadModal() {
    const modal = document.getElementById('doc-upload-modal');
    if (modal) modal.classList.remove('open');
  },

  renderUploadModalBody() {
    const body = document.getElementById('doc-upload-modal-body');
    if (!body) return;
    const defaultSector =
      App.filters.sector !== 'ALL' ? App.filters.sector : App.getUserById(App.activeUserId).sector;

    body.innerHTML = `
      ${
        !App.ghToken
          ? `
        <div style="margin-bottom:12px;padding:10px 14px;border-radius:10px;background:#fef3c7;border:1.5px solid #f59e0b;color:#92400e;font-size:12.5px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
          <div>
            ⚠️ <strong>Falta el PIN en este dispositivo:</strong> Si guardas sin PIN, la factura solo se verá en tu ordenador hasta que actives el PIN.
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="DocsModule.closeUploadModal();App.openAuthModal();">
            🔑 Poner PIN ahora
          </button>
        </div>
      `
          : ''
      }
      <div class="doc-dropzone" onclick="document.getElementById('doc-file-input').click()"
        ondragover="event.preventDefault();this.classList.add('dragover');"
        ondragleave="this.classList.remove('dragover');"
        ondrop="DocsModule.handleFileDrop(event)">
        <input type="file" id="doc-file-input" accept=".pdf,image/*" style="display:none;" onchange="DocsModule.handleFileSelected(event)" />
        <div style="font-size:30px;margin-bottom:4px;">📄📸</div>
        <div style="font-weight:800;font-size:14.5px;color:var(--text-main);" id="doc-selected-file-label">
          Haz clic aquí o arrastra una Factura / Documento (PDF, JPG, PNG)
        </div>
        <div style="font-size:12px;color:var(--text-light);margin-top:3px;">
          Las fotos grandes de móvil se optimizan automáticamente (~250 KB) manteniendo total nitidez al hacer zoom.
        </div>
      </div>

      <div id="doc-upload-analysis-banner" style="display:none;margin-top:10px;padding:10px 12px;border-radius:8px;background:#eff6ff;border:1px solid #93c5fd;color:#1e40af;font-size:12.5px;font-weight:700;">
      </div>

      <div class="form-grid" style="margin-top:14px;">
        <div class="form-group full">
          <label>Título descriptivo para consulta *</label>
          <input type="text" id="doc-up-title" class="form-control" required placeholder="Ej. Factura Jamones y Embutidos Navidad 2024" />
        </div>

        <div class="form-group">
          <label>Año del documento</label>
          <select id="doc-up-year" class="form-control">
            ${DOC_YEARS.map((y) => `<option value="${y}" ${y === '2025' ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label>Tipo de documento</label>
          <select id="doc-up-type" class="form-control">
            ${DOC_TYPES.map((t) => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label>Proveedor</label>
          <input type="text" id="doc-up-provider" class="form-control" placeholder="Ej. Ibéricos Selectos S.L., Makro, Bodegas..." />
        </div>

        <div class="form-group">
          <label>Sector relacionado</label>
          <select id="doc-up-sector" class="form-control">
            ${SECTORS.map((s) => `<option value="${s}" ${s === defaultSector ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label>Importe Total Orientativo (€) <span style="font-weight:400;color:var(--text-light);">(Solo consulta)</span></label>
          <input type="number" step="0.01" id="doc-up-total" class="form-control" value="0" />
        </div>

        <div class="form-group" style="justify-content:flex-end;">
          <button type="button" class="btn btn-secondary" id="doc-up-ocr-btn" onclick="DocsModule.runUploadAutoSummary(true)" style="width:100%;">
            ✨ Extraer Resumen Automático (PDF / OCR)
          </button>
        </div>

        <div class="form-group full">
          <label>📝 Resumen del documento (Cantidades, precios unitarios, necesidades, notas de proveedor)</label>
          <textarea id="doc-up-summary" class="form-control" rows="6" placeholder="Aquí aparecerá el resumen automático de la factura (o escribe las cantidades, precios por unidad y detalles clave para consultar rápidamente)..."></textarea>
        </div>
      </div>
    `;
  },

  handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) this.processSelectedFile(file);
  },

  handleFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (file) this.processSelectedFile(file);
  },

  async processSelectedFile(file) {
    if (file.size > 22 * 1024 * 1024) {
      alert('El archivo supera los 22 MB. Por favor sube un PDF o imagen más ligero para no sobrecargar el repositorio de GitHub.');
      return;
    }

    const label = document.getElementById('doc-selected-file-label');
    const titleInp = document.getElementById('doc-up-title');
    const banner = document.getElementById('doc-upload-analysis-banner');

    if (label) {
      label.innerHTML = `✅ Archivo seleccionado: <strong>${App.escapeHtml(file.name)}</strong> (${this.formatBytes(file.size)})`;
    }
    if (titleInp && !titleInp.value.trim()) {
      titleInp.value = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
    }

    const optimized = await this.optimizeImageIfNeeded(file);
    const ext =
      optimized.mimeType === 'image/jpeg' && !/\.jpe?g$/i.test(file.name)
        ? '.jpg'
        : '';
    this.pendingUpload.file = file;
    this.pendingUpload.processedBlob = optimized.blob;
    this.pendingUpload.mimeType = optimized.mimeType || file.type || 'application/pdf';
    this.pendingUpload.cleanFileName = this.sanitizeFileName(file.name + ext);

    if (label && optimized.blob.size !== file.size) {
      label.innerHTML = `✅ <strong>${App.escapeHtml(file.name)}</strong> · Optimizado de ${this.formatBytes(file.size)} a <strong>${this.formatBytes(optimized.blob.size)}</strong>`;
    }

    // Si es PDF digital, extraer resumen automáticamente al instante
    if (this.pendingUpload.mimeType === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      await this.runUploadAutoSummary(false);
    } else if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = `💡 Imagen lista. Pulsa <strong>"✨ Extraer Resumen Automático (PDF / OCR)"</strong> si quieres leer automáticamente los precios y cantidades de la foto, o escríbelos abajo.`;
    }
  },

  async runUploadAutoSummary(forceOcr = false) {
    const blob = this.pendingUpload.processedBlob;
    if (!blob) {
      alert('Primero selecciona un archivo PDF o imagen de factura.');
      return;
    }

    const banner = document.getElementById('doc-upload-analysis-banner');
    const summaryEl = document.getElementById('doc-up-summary');
    const provEl = document.getElementById('doc-up-provider');
    const yearEl = document.getElementById('doc-up-year');
    const totalEl = document.getElementById('doc-up-total');

    if (banner) {
      banner.style.display = 'block';
      banner.innerHTML = '⏳ Analizando documento y extrayendo cantidades, precios y proveedor...';
    }

    try {
      let rawText = '';
      const isPdf =
        this.pendingUpload.mimeType === 'application/pdf' ||
        /\.pdf$/i.test(this.pendingUpload.cleanFileName);

      if (isPdf) {
        const pdfData = await this.extractTextFromPdfBlob(blob);
        rawText = pdfData.text;

        // Si el PDF es escaneado (sin capa de texto) y el usuario pidió OCR explícito, renderizar pág 1 y pasar OCR
        if ((!rawText || rawText.trim().length < 20) && forceOcr) {
          if (banner) banner.innerHTML = '⏳ PDF escaneado detectado: ejecutando lectura óptica (OCR)...';
          const pdfjsLib = await this.ensurePdfJs();
          const pdf = await pdfjsLib.getDocument({ data: await blob.arrayBuffer() }).promise;
          const page = await pdf.getPage(1);
          const vp = page.getViewport({ scale: 2.0 });
          const tmpCanvas = document.createElement('canvas');
          tmpCanvas.width = vp.width;
          tmpCanvas.height = vp.height;
          await page.render({ canvasContext: tmpCanvas.getContext('2d'), viewport: vp }).promise;
          rawText = await this.extractTextWithOcr(tmpCanvas, (msg) => {
            if (banner) banner.innerHTML = msg;
          });
        } else if (!rawText || rawText.trim().length < 20) {
          if (banner) {
            banner.innerHTML = 'ℹ️ Este PDF es una imagen escaneada. Pulsa <strong>"✨ Extraer Resumen Automático (PDF / OCR)"</strong> para leerlo con reconocimiento óptico.';
          }
          return;
        }
      } else {
        rawText = await this.extractTextWithOcr(blob, (msg) => {
          if (banner) banner.innerHTML = msg;
        });
      }

      const parsed = this.analyzeInvoiceText(rawText, this.pendingUpload.cleanFileName);
      if (summaryEl) summaryEl.value = parsed.summary;
      if (provEl && !provEl.value.trim() && parsed.provider) provEl.value = parsed.provider;
      if (yearEl && parsed.year) yearEl.value = parsed.year;
      if (totalEl && (!Number(totalEl.value) || Number(totalEl.value) === 0) && parsed.total > 0) {
        totalEl.value = parsed.total;
      }

      if (banner) {
        banner.innerHTML = '✅ Resumen extraído correctamente. Puedes revisarlo o ajustar cualquier dato antes de guardar.';
      }
    } catch (err) {
      console.warn('Error en auto-resumen:', err);
      if (banner) {
        banner.innerHTML = `⚠️ No se pudo completar la lectura automática (${App.escapeHtml(err.message)}). Puedes anotar el resumen manualmente.`;
      }
    }
  },

  async saveUploadedDocument(e) {
    e.preventDefault();
    if (!this.pendingUpload.processedBlob) {
      alert('Selecciona primero el archivo PDF o imagen que deseas subir.');
      return;
    }

    const saveBtn = document.getElementById('doc-upload-submit-btn');
    const prevText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '⏳ Subiendo documento...';
    }

    try {
      const docId = `doc_${Date.now()}`;
      const repoFileName = `${docId}_${this.pendingUpload.cleanFileName}`;
      const repoPath = `docs/${repoFileName}`;
      const blob = this.pendingUpload.processedBlob;
      const activeUser = App.getUserById(App.activeUserId);

      // 1. Guardar copia instantánea en IndexedDB local
      await this.saveBlobToIdb(docId, blob, this.pendingUpload.mimeType, repoFileName);

      // 2. Si hay token de GitHub activo, subir archivo binario independiente a `docs/`
      let uploadedRemote = false;
      if (App.ghToken) {
        const upRes = await this.uploadBinaryToGitHub(
          repoPath,
          blob,
          `[${activeUser.name}] Subir documento consulta: ${repoFileName}`
        );
        uploadedRemote = upRes.uploaded;
      }

      const docMeta = {
        id: docId,
        title: (document.getElementById('doc-up-title').value || '').trim() || repoFileName,
        year: document.getElementById('doc-up-year').value || '2025',
        docType: document.getElementById('doc-up-type').value || 'Factura',
        providerName: (document.getElementById('doc-up-provider').value || '').trim(),
        sector: document.getElementById('doc-up-sector').value || 'Organización',
        referenceTotal: Number(document.getElementById('doc-up-total').value) || 0,
        summary: (document.getElementById('doc-up-summary').value || '').trim(),
        fileName: repoFileName,
        repoPath: uploadedRemote ? repoPath : '',
        mimeType: this.pendingUpload.mimeType,
        fileSize: blob.size,
        responsibleId: App.activeUserId,
        uploadedBy: activeUser.name,
        updatedAt: new Date().toISOString()
      };

      App.db.documents = App.db.documents || [];
      App.db.documents.unshift(docMeta);

      await App.commitChange(`Añadido documento de consulta: ${docMeta.title}`);
      this.closeUploadModal();
      this.openViewer(docId);
    } catch (err) {
      alert('Error al guardar el documento: ' + err.message);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = prevText;
      }
    }
  },

  /**
   * Si un compañero (ej. Leli) subió facturas cuando le faltaba poner el PIN (`!doc.repoPath`),
   * en cuanto introduzca el PIN este método sube automáticamente todos sus PDFs/fotos guardados
   * en IndexedDB a `docs/` en GitHub sin tener que volver a seleccionarlos uno por uno.
   */
  async syncPendingLocalBlobs() {
    if (!App.ghToken || !App.db || !Array.isArray(App.db.documents)) return false;
    if (this._isSyncingBlobs) return false;

    const missingRemote = App.db.documents.filter((d) => d && !d.repoPath);
    if (missingRemote.length === 0) return false;

    this._isSyncingBlobs = true;
    let uploadedCount = 0;

    try {
      for (let i = 0; i < missingRemote.length; i++) {
        const doc = missingRemote[i];
        const localBlob = await this.getBlobFromIdb(doc.id);
        if (!localBlob) continue; // El archivo original está en el navegador del compañero que lo subió

        const safeName =
          doc.fileName || `${doc.id}_${this.sanitizeFileName(doc.title || 'documento.pdf')}`;
        const repoPath = `docs/${safeName}`;

        App.setSyncIndicator(
          'syncing',
          `Subiendo PDFs (${uploadedCount + 1}/${missingRemote.length})...`
        );

        const upRes = await this.uploadBinaryToGitHub(
          repoPath,
          localBlob,
          `[${doc.uploadedBy || 'Equipo'}] Sincronizar documento pendiente: ${safeName}`
        );

        if (upRes && upRes.uploaded) {
          doc.fileName = safeName;
          doc.repoPath = repoPath;
          doc.updatedAt = new Date().toISOString();
          uploadedCount++;
        }
      }
    } catch (err) {
      console.warn('Error subiendo documentos locales pendientes:', err);
    } finally {
      this._isSyncingBlobs = false;
    }

    if (uploadedCount > 0) {
      App.db.meta.lastUpdated = new Date().toISOString();
      App.db.meta.version = (App.db.meta.version || 1) + 1;
      App.hasPendingSync = true;
      App.saveToLocalCache();
      App.render();
      return true;
    }
    return false;
  },

  async deleteDocument(docId) {
    const doc = (App.db.documents || []).find((d) => d.id === docId);
    if (!doc) return;
    if (!confirm(`¿Seguro que deseas eliminar del archivo el documento "${doc.title}"?`)) return;

    await this.deleteBlobFromIdb(docId);
    if (doc.repoPath && App.ghToken) {
      await this.deleteBinaryFromGitHub(doc.repoPath, doc.title);
    }

    App.db.deletedIds = App.db.deletedIds || [];
    if (!App.db.deletedIds.includes(docId)) {
      App.db.deletedIds.push(docId);
    }
    App.db.documents = (App.db.documents || []).filter((d) => d.id !== docId);

    if (this.viewer.isOpen && this.viewer.docId === docId) {
      this.closeViewer();
    }
    await App.commitChange(`Eliminado documento: ${doc.title}`);
  },

  /* ========================================================================
     5. VISTA PRINCIPAL DE CONSULTA DE DOCUMENTOS Y FACTURAS (`data-view="docs"`)
     ======================================================================== */
  getFilteredDocuments() {
    const list = (App.db && App.db.documents) || [];
    const q = (App.filters.search || '').toLowerCase().trim();

    return list.filter((doc) => {
      if (App.filters.sector !== 'ALL' && doc.sector !== App.filters.sector) return false;
      const targetUser = App.filters.user === 'MINE' ? App.activeUserId : App.filters.user;
      if (targetUser !== 'ALL' && doc.responsibleId !== targetUser) return false;

      if (this.docFilters.year !== 'ALL' && doc.year !== this.docFilters.year) return false;
      if (this.docFilters.docType !== 'ALL' && doc.docType !== this.docFilters.docType) return false;

      if (q) {
        const hay = `${doc.title} ${doc.providerName || ''} ${doc.year || ''} ${doc.docType || ''} ${doc.summary || ''} ${doc.sector || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  },

  setDocSubfilter(key, val) {
    this.docFilters[key] = val;
    App.render();
  },

  renderSubfiltersHtml() {
    return `
      <span class="filter-label">Año:</span>
      <select class="select-filter" onchange="DocsModule.setDocSubfilter('year', this.value)">
        <option value="ALL" ${this.docFilters.year === 'ALL' ? 'selected' : ''}>Todos los Años</option>
        ${DOC_YEARS.map((y) => `<option value="${y}" ${this.docFilters.year === y ? 'selected' : ''}>📅 ${y}</option>`).join('')}
      </select>
      <select class="select-filter" onchange="DocsModule.setDocSubfilter('docType', this.value)">
        <option value="ALL" ${this.docFilters.docType === 'ALL' ? 'selected' : ''}>Todos los Tipos</option>
        ${DOC_TYPES.map((t) => `<option value="${t}" ${this.docFilters.docType === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
    `;
  },

  renderDocsView(isEmbeddedMobile = false) {
    const docs = this.getFilteredDocuments();
    const allDocs = (App.db && App.db.documents) || [];
    const unsyncedDocs = allDocs.filter((d) => d && !d.repoPath);
    const totalSizeBytes = allDocs.reduce((acc, d) => acc + (Number(d.fileSize) || 0), 0);
    const repoPct = Math.min(100, (totalSizeBytes / (1024 * 1024 * 1024)) * 100);

    return `
      ${
        !App.ghToken
          ? `
        <div class="panel-card" style="margin-bottom:14px;padding:14px 18px;background:#fffbeb;border:2px solid #f59e0b;color:#78350f;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <div style="font-weight:900;font-size:14.5px;color:#92400e;">
                ${
                  unsyncedDocs.length > 0
                    ? `⚠️ Tienes ${unsyncedDocs.length} documento(s) guardados SOLO en este ordenador (Falta el PIN)`
                    : '🔑 Falta activar el PIN del equipo en este dispositivo'
                }
              </div>
              <div style="font-size:12.5px;color:#78350f;margin-top:2px;">
                ${
                  unsyncedDocs.length > 0
                    ? 'Los demás compañeros ven 0 documentos hasta que introduzcas el PIN. Al ponerlo se subirán solos sin volver a cargarlos.'
                    : 'Introduce el PIN una sola vez para que las facturas que subas se compartan automáticamente con todo el equipo.'
                }
              </div>
            </div>
            <button type="button" class="btn btn-primary" onclick="App.openAuthModal()">
              🔑 Introducir PIN y Sincronizar Ahora
            </button>
          </div>
        </div>
      `
          : unsyncedDocs.length > 0
          ? `
        <div class="panel-card" style="margin-bottom:14px;padding:12px 16px;background:#eff6ff;border:1.5px solid #60a5fa;color:#1e3a8a;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div style="font-size:12.5px;font-weight:700;">
              ☁️ Hay <strong>${unsyncedDocs.length}</strong> factura(s) con el PDF pendiente de subir desde el ordenador donde se cargaron. Si las subiste tú en este PC, pulsa sincronizar:
            </div>
            <button type="button" class="btn btn-primary btn-sm" onclick="App.syncNow(true)">
              ☁️ Subir PDFs Pendientes Ahora
            </button>
          </div>
        </div>
      `
          : ''
      }
      <!-- Banner Informativo y Buscador Rápido (Especialmente útil en Móvil / Tablet) -->
      <div class="panel-card" style="margin-bottom:16px;padding:14px 18px;border-left:5px solid #2563eb;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-weight:800;font-size:15px;color:var(--text-main);">
              📂 Archivo de Facturas y Documentos (Solo Consulta)
            </div>
            <div style="font-size:12.5px;color:var(--text-muted);margin-top:2px;">
              Consulta cantidades, precios y proveedores de otros años con resumen y visor interactivo.
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            ${
              !isEmbeddedMobile
                ? `<div style="font-size:12px;padding:6px 10px;border-radius:8px;background:var(--bg-subtle);border:1px solid var(--border-color);">
              ☁️ GitHub: <strong>${this.formatBytes(totalSizeBytes)}</strong> / 1 GB (${repoPct.toFixed(2)}%) · <strong>${allDocs.length}</strong> docs
            </div>`
                : ''
            }
            <button class="btn btn-primary" onclick="DocsModule.openUploadModal()">
              📤 Subir Factura / Foto
            </button>
          </div>
        </div>

        ${
          isEmbeddedMobile
            ? `
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid var(--border-color);">
            <input
              type="search"
              class="search-input"
              style="flex:1;min-width:190px;"
              placeholder="🔍 Buscar producto, proveedor o nota..."
              value="${App.escapeHtml(App.filters.search || '')}"
              oninput="App.setFilter('search', this.value)"
            />
            <select class="select-filter" onchange="DocsModule.setDocSubfilter('year', this.value)">
              <option value="ALL" ${this.docFilters.year === 'ALL' ? 'selected' : ''}>📅 Todos los Años</option>
              ${DOC_YEARS.map((y) => `<option value="${y}" ${this.docFilters.year === y ? 'selected' : ''}>📅 ${y}</option>`).join('')}
            </select>
          </div>
        `
            : ''
        }
      </div>

      ${
        docs.length === 0
          ? `
        <div class="panel-card" style="padding:40px 20px;text-align:center;">
          <div style="font-size:42px;margin-bottom:8px;">🧾</div>
          <div style="font-weight:800;font-size:16px;color:var(--text-main);">
            ${allDocs.length === 0 ? 'Todavía no hay facturas ni documentos archivados' : 'Ningún documento coincide con los filtros actuales'}
          </div>
          <div style="font-size:13px;color:var(--text-muted);max-width:520px;margin:6px auto 16px;">
            ${
              allDocs.length === 0
                ? 'Sube facturas en PDF o fotos de años anteriores para consultar precios unitarios, cantidades pedidas y datos de proveedores, con resumen automático y visor con zoom, giro y desplazamiento.'
                : `Hay <strong>${allDocs.length} documentos</strong> guardados en el archivo, pero tienes un filtro activo arriba (Sector, Responsable o Año) que los está ocultando.`
            }
          </div>
          <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
            ${
              allDocs.length > 0
                ? `<button type="button" class="btn btn-dark" onclick="App.resetFilters();DocsModule.docFilters={year:'ALL',docType:'ALL'};App.render();">
                🔄 Ver los ${allDocs.length} documentos (Quitar filtros)
              </button>`
                : ''
            }
            <button class="btn btn-primary" onclick="DocsModule.openUploadModal()">
              📤 ${allDocs.length === 0 ? 'Subir Primera Factura o Documento' : 'Subir Factura / Foto'}
            </button>
          </div>
        </div>
      `
          : `
        <div class="docs-cards-grid">
          ${docs
            .map((doc) => {
              const isPdf = (doc.mimeType || '').includes('pdf') || /\.pdf$/i.test(doc.fileName || '');
              const summaryPreview = (doc.summary || 'Sin resumen todavía. Abre el visor para generarlo o editarlo.')
                .slice(0, 260);
              return `
              <div class="panel-card doc-archive-card">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span class="badge" style="background:#dbeafe;color:#1e40af;border:1px solid #93c5fd;">
                      📅 ${App.escapeHtml(doc.year || 'Histórico')}
                    </span>
                    <span class="badge" style="background:var(--bg-subtle);color:var(--text-main);border:1px solid var(--border-strong);">
                      ${isPdf ? '📕 PDF' : '🖼️ Imagen'} · ${App.escapeHtml(doc.docType || 'Factura')}
                    </span>
                    ${App.renderSectorBadge(doc.sector || 'Organización')}
                    ${
                      !doc.repoPath
                        ? `<span class="badge" style="background:#fef3c7;color:#92400e;border:1px solid #f59e0b;" title="Falta sincronizar con PIN desde el dispositivo de ${App.escapeHtml(doc.uploadedBy || 'quien lo subió')}">⏳ Solo local (${App.escapeHtml(doc.uploadedBy || 'Falta PIN')})</span>`
                        : ''
                    }
                  </div>
                  <span style="font-size:11px;color:var(--text-light);white-space:nowrap;">
                    ${this.formatBytes(doc.fileSize || 0)}
                  </span>
                </div>

                <div style="margin-top:10px;">
                  <div style="font-weight:800;font-size:15.5px;color:var(--text-main);line-height:1.3;">
                    ${App.escapeHtml(doc.title)}
                  </div>
                  <div style="font-size:12.5px;color:var(--text-muted);margin-top:4px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;">
                    <span>🏢 <strong>${App.escapeHtml(doc.providerName || 'Proveedor no indicado')}</strong></span>
                    ${
                      Number(doc.referenceTotal) > 0
                        ? `<span style="font-weight:800;color:var(--brand-primary);">Ref: ${App.formatCurrency(doc.referenceTotal)}</span>`
                        : ''
                    }
                  </div>
                </div>

                <div class="doc-summary-preview">${App.escapeHtml(summaryPreview)}${(doc.summary || '').length > 260 ? '…' : ''}</div>

                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:auto;padding-top:10px;border-top:1px solid var(--border-color);">
                  <div style="font-size:11.5px;color:var(--text-light);">
                    Subido por <strong>${App.escapeHtml(doc.uploadedBy || 'Equipo')}</strong>
                  </div>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-danger btn-sm" onclick="DocsModule.deleteDocument('${doc.id}')" title="Eliminar documento">
                      🗑️
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="DocsModule.openViewer('${doc.id}')">
                      🔍 Consultar y Visor
                    </button>
                  </div>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      `
      }
    `;
  },

  /* ========================================================================
     6. VISUALIZADOR INTERACTIVO CON ZOOM, ROTACIÓN Y DESPLAZAMIENTO H / V
     ======================================================================== */
  async openViewer(docId) {
    this.ensureModalsInDom();
    const doc = (App.db.documents || []).find((d) => d.id === docId);
    if (!doc) return;

    this.viewer = {
      ...this.viewer,
      isOpen: true,
      docId,
      pdfDoc: null,
      pageNum: 1,
      pageCount: 1,
      zoom: 1,
      rotation: 0,
      panX: 0,
      panY: 0,
      sidePanelOpen: window.innerWidth > 900,
      isDragging: false,
      isSummarizing: false,
      ocrStatusText: ''
    };

    const modal = document.getElementById('doc-viewer-modal');
    if (!modal) return;
    modal.classList.add('open');
    this.renderViewerShell(doc, true);

    try {
      const blob = await this.resolveDocumentBlob(doc);
      if (this.viewer.blobUrl) URL.revokeObjectURL(this.viewer.blobUrl);
      this.viewer.blobUrl = URL.createObjectURL(blob);
      this.viewer.mimeType = doc.mimeType || blob.type || '';
      this.viewer.currentBlob = blob;

      const isPdf =
        this.viewer.mimeType.includes('pdf') || /\.pdf$/i.test(doc.fileName || '');

      if (isPdf) {
        const pdfjsLib = await this.ensurePdfJs();
        const buf = await blob.arrayBuffer();
        this.viewer.pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
        this.viewer.pageCount = this.viewer.pdfDoc.numPages;
        this.viewer.pageNum = 1;
        this.renderViewerShell(doc, false);
        await this.renderPdfPageToCanvas();
      } else {
        this.renderViewerShell(doc, false);
        this.applyTransformToStage();
      }
    } catch (err) {
      const stage = document.getElementById('doc-viewer-stage-inner');
      if (stage) {
        stage.innerHTML = `
          <div style="padding:30px;background:#1e293b;color:#fecaca;border:1px solid #f87171;border-radius:12px;max-width:460px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">⚠️</div>
            <div style="font-weight:800;margin-bottom:6px;">No se pudo cargar el archivo</div>
            <div style="font-size:13px;">${App.escapeHtml(err.message)}</div>
          </div>
        `;
      }
    }
  },

  closeViewer() {
    this.viewer.isOpen = false;
    if (this.viewer.blobUrl) {
      URL.revokeObjectURL(this.viewer.blobUrl);
      this.viewer.blobUrl = null;
    }
    this.viewer.pdfDoc = null;
    const modal = document.getElementById('doc-viewer-modal');
    if (modal) modal.classList.remove('open');
  },

  renderViewerShell(doc, isLoading = false) {
    const box = document.getElementById('doc-viewer-modal-content');
    if (!box) return;
    const isPdf =
      (doc.mimeType || '').includes('pdf') || /\.pdf$/i.test(doc.fileName || '');

    box.innerHTML = `
      <!-- BARRA SUPERIOR DE CONTROLES DEL VISOR -->
      <div class="doc-viewer-toolbar">
        <div style="display:flex;align-items:center;gap:8px;min-width:0;">
          <span style="font-size:18px;">${isPdf ? '📕' : '🖼️'}</span>
          <div style="min-width:0;">
            <div style="font-weight:800;font-size:14px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;" title="${App.escapeHtml(doc.title)}">
              ${App.escapeHtml(doc.title)}
            </div>
            <div style="font-size:11px;color:#94a3b8;">
              ${App.escapeHtml(doc.providerName || 'Sin proveedor')} · Año ${App.escapeHtml(doc.year || '-')}
            </div>
          </div>
        </div>

        <!-- Controles de Zoom, Rotación y Desplazamiento -->
        <div class="doc-viewer-controls-group">
          ${
            isPdf && this.viewer.pageCount > 1
              ? `
            <div class="viewer-pill-group">
              <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.changePdfPage(-1)" title="Página anterior">◀</button>
              <span id="viewer-page-label" style="font-size:12px;font-weight:700;color:#e2e8f0;padding:0 6px;">
                Pág ${this.viewer.pageNum}/${this.viewer.pageCount}
              </span>
              <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.changePdfPage(1)" title="Página siguiente">▶</button>
            </div>
          `
              : ''
          }

          <!-- ZOOM -->
          <div class="viewer-pill-group" title="Controles de Zoom (también puedes usar la rueda del ratón)">
            <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.stepZoom(-0.25)" title="Alejar (-)">➖</button>
            <input type="range" id="viewer-zoom-slider" min="25" max="500" step="5" value="${Math.round(this.viewer.zoom * 100)}"
              style="width:85px;cursor:pointer;" oninput="DocsModule.setZoomPercent(this.value)" />
            <span id="viewer-zoom-label" style="font-size:12px;font-weight:800;color:#fde047;min-width:44px;text-align:center;">
              ${Math.round(this.viewer.zoom * 100)}%
            </span>
            <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.stepZoom(0.25)" title="Acercar (+)">➕</button>
            <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.resetViewTransform()" title="Restaurar 100% y centrar">100%</button>
          </div>

          <!-- ROTACIÓN -->
          <div class="viewer-pill-group" title="Rotar documento">
            <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.rotateBy(-90)" title="Girar 90° a la izquierda">↺ -90°</button>
            <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.rotateBy(90)" title="Girar 90° a la derecha">↻ +90°</button>
            <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.rotateBy(180)" title="Voltear 180°">🔄 180°</button>
            <span id="viewer-rot-label" style="font-size:11.5px;font-weight:700;color:#cbd5e1;padding:0 4px;">${this.viewer.rotation}°</span>
          </div>

          <!-- DESPLAZAMIENTO HORIZONTAL Y VERTICAL -->
          <div class="viewer-pill-group" title="Desplazar horizontal y verticalmente (o arrastra directamente con el ratón / dedo)">
            <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.panBy(90, 0)" title="Desplazar a la izquierda">⬅️</button>
            <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.panBy(0, 90)" title="Desplazar arriba">⬆️</button>
            <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.panBy(0, -90)" title="Desplazar abajo">⬇️</button>
            <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.panBy(-90, 0)" title="Desplazar a la derecha">➡️</button>
            <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.centerPan()" title="Centrar documento">🎯</button>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:6px;">
          <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.downloadCurrentDoc()" title="Descargar archivo original">
            ⬇️ Descargar
          </button>
          <button type="button" class="viewer-ctrl-btn" onclick="DocsModule.toggleSidePanel()" title="Mostrar / Ocultar panel de resumen">
            📝 Resumen
          </button>
          <button type="button" class="btn btn-danger btn-sm" onclick="DocsModule.closeViewer()">✕ Cerrar</button>
        </div>
      </div>

      <!-- CUERPO DIVIDIDO: LIENZO INTERACTIVO + PANEL DE RESUMEN DE FACTURA -->
      <div class="doc-viewer-body">
        <div class="doc-viewer-main-col">
          <div class="doc-viewer-stage" id="doc-viewer-stage"
            onwheel="DocsModule.handleStageWheel(event)"
            onpointerdown="DocsModule.handlePointerDown(event)"
            onpointermove="DocsModule.handlePointerMove(event)"
            onpointerup="DocsModule.handlePointerUp(event)"
            onpointercancel="DocsModule.handlePointerUp(event)">
            <div id="doc-viewer-stage-inner" class="doc-viewer-stage-inner">
              ${
                isLoading
                  ? `<div style="color:#e2e8f0;font-weight:700;font-size:14px;">⏳ Cargando documento en alta definición...</div>`
                  : isPdf
                  ? `<canvas id="doc-viewer-canvas" class="doc-viewer-media"></canvas>`
                  : `<img id="doc-viewer-img" src="${this.viewer.blobUrl || ''}" alt="${App.escapeHtml(doc.title)}" class="doc-viewer-media" draggable="false" />`
              }
            </div>
          </div>

          <!-- BARRAS EXPLÍCITAS DE DESPLAZAMIENTO HORIZONTAL Y VERTICAL -->
          <div class="doc-viewer-panbars">
            <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:180px;">
              <span style="font-size:11.5px;color:#cbd5e1;font-weight:700;white-space:nowrap;">↔ Desplaz. Horizontal:</span>
              <input type="range" id="viewer-panx-slider" min="-1200" max="1200" step="10" value="${this.viewer.panX}"
                style="flex:1;cursor:pointer;" oninput="DocsModule.setPanAxis('x', this.value)" />
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:180px;">
              <span style="font-size:11.5px;color:#cbd5e1;font-weight:700;white-space:nowrap;">↕ Desplaz. Vertical:</span>
              <input type="range" id="viewer-pany-slider" min="-1200" max="1200" step="10" value="${this.viewer.panY}"
                style="flex:1;cursor:pointer;" oninput="DocsModule.setPanAxis('y', this.value)" />
            </div>
            <span style="font-size:11px;color:#94a3b8;">💡 Arrastra con el ratón/dedo o usa la rueda para hacer zoom</span>
          </div>
        </div>

        <!-- PANEL LATERAL DE RESUMEN Y DATOS DE CONSULTA -->
        <aside class="doc-viewer-sidebar" id="doc-viewer-sidebar" style="${this.viewer.sidePanelOpen ? '' : 'display:none;'}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;">
            <div style="font-weight:800;font-size:14.5px;color:var(--text-main);">🧾 Resumen de Consulta</div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="DocsModule.autoSummarizeInViewer()" id="viewer-ocr-btn">
              ✨ Auto-Resumir
            </button>
          </div>

          <div id="viewer-ocr-status" style="display:none;margin-bottom:10px;padding:8px 10px;border-radius:8px;font-size:12px;font-weight:700;background:#eff6ff;color:#1e40af;border:1px solid #93c5fd;"></div>

          <form onsubmit="DocsModule.saveViewerMetadata(event)" style="display:flex;flex-direction:column;gap:10px;flex:1;">
            <div class="form-group">
              <label>Título del documento</label>
              <input type="text" id="vw-doc-title" class="form-control" value="${App.escapeHtml(doc.title)}" required />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div class="form-group">
                <label>Año</label>
                <select id="vw-doc-year" class="form-control">
                  ${DOC_YEARS.map((y) => `<option value="${y}" ${doc.year === y ? 'selected' : ''}>${y}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Importe Ref. (€)</label>
                <input type="number" step="0.01" id="vw-doc-total" class="form-control" value="${Number(doc.referenceTotal) || 0}" />
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div class="form-group">
                <label>Proveedor</label>
                <input type="text" id="vw-doc-provider" class="form-control" value="${App.escapeHtml(doc.providerName || '')}" placeholder="Nombre proveedor" />
              </div>
              <div class="form-group">
                <label>Sector</label>
                <select id="vw-doc-sector" class="form-control">
                  ${SECTORS.map((s) => `<option value="${s}" ${doc.sector === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="form-group" style="flex:1;display:flex;flex-direction:column;">
              <label>Cantidades, Precios, Necesidades y Resumen</label>
              <textarea id="vw-doc-summary" class="form-control" style="flex:1;min-height:210px;font-size:12.8px;line-height:1.45;"
                placeholder="Apunta o genera automáticamente las cantidades, precios unitarios, contacto del proveedor y observaciones para este año...">${App.escapeHtml(doc.summary || '')}</textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%;">
              💾 Guardar Resumen y Datos
            </button>
          </form>
        </aside>
      </div>
    `;
  },

  async renderPdfPageToCanvas() {
    if (!this.viewer.pdfDoc) return;
    const canvas = document.getElementById('doc-viewer-canvas');
    if (!canvas) return;
    const page = await this.viewer.pdfDoc.getPage(this.viewer.pageNum);
    // Renderizar a escala base alta (2.0x) para que al hacer zoom se lea nítido
    const baseViewport = page.getViewport({ scale: 2.0 });
    canvas.width = baseViewport.width;
    canvas.height = baseViewport.height;
    canvas.style.width = `${Math.round(baseViewport.width / 2)}px`;
    canvas.style.height = `${Math.round(baseViewport.height / 2)}px`;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: baseViewport }).promise;

    const pageLbl = document.getElementById('viewer-page-label');
    if (pageLbl) pageLbl.textContent = `Pág ${this.viewer.pageNum}/${this.viewer.pageCount}`;
    this.applyTransformToStage();
  },

  async changePdfPage(delta) {
    if (!this.viewer.pdfDoc) return;
    const next = Math.min(this.viewer.pageCount, Math.max(1, this.viewer.pageNum + delta));
    if (next === this.viewer.pageNum) return;
    this.viewer.pageNum = next;
    this.viewer.panX = 0;
    this.viewer.panY = 0;
    await this.renderPdfPageToCanvas();
  },

  applyTransformToStage() {
    const inner = document.getElementById('doc-viewer-stage-inner');
    if (inner) {
      inner.style.transform = `translate(${this.viewer.panX}px, ${this.viewer.panY}px) scale(${this.viewer.zoom}) rotate(${this.viewer.rotation}deg)`;
    }
    const zLbl = document.getElementById('viewer-zoom-label');
    if (zLbl) zLbl.textContent = `${Math.round(this.viewer.zoom * 100)}%`;
    const zSlider = document.getElementById('viewer-zoom-slider');
    if (zSlider) zSlider.value = Math.round(this.viewer.zoom * 100);
    const rLbl = document.getElementById('viewer-rot-label');
    if (rLbl) rLbl.textContent = `${((this.viewer.rotation % 360) + 360) % 360}°`;
    const pxSlider = document.getElementById('viewer-panx-slider');
    if (pxSlider) pxSlider.value = Math.max(-1200, Math.min(1200, Math.round(this.viewer.panX)));
    const pySlider = document.getElementById('viewer-pany-slider');
    if (pySlider) pySlider.value = Math.max(-1200, Math.min(1200, Math.round(this.viewer.panY)));
  },

  stepZoom(delta) {
    this.viewer.zoom = Math.min(5.0, Math.max(0.25, Math.round((this.viewer.zoom + delta) * 100) / 100));
    this.applyTransformToStage();
  },

  setZoomPercent(pct) {
    this.viewer.zoom = Math.min(5.0, Math.max(0.25, Number(pct) / 100));
    this.applyTransformToStage();
  },

  rotateBy(deg) {
    this.viewer.rotation = (this.viewer.rotation + deg) % 360;
    this.applyTransformToStage();
  },

  panBy(dx, dy) {
    this.viewer.panX += dx;
    this.viewer.panY += dy;
    this.applyTransformToStage();
  },

  setPanAxis(axis, val) {
    if (axis === 'x') this.viewer.panX = Number(val) || 0;
    if (axis === 'y') this.viewer.panY = Number(val) || 0;
    this.applyTransformToStage();
  },

  centerPan() {
    this.viewer.panX = 0;
    this.viewer.panY = 0;
    this.applyTransformToStage();
  },

  resetViewTransform() {
    this.viewer.zoom = 1;
    this.viewer.rotation = 0;
    this.viewer.panX = 0;
    this.viewer.panY = 0;
    this.applyTransformToStage();
  },

  handleStageWheel(e) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    this.stepZoom(delta);
  },

  handlePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    this.viewer.isDragging = true;
    this.viewer.dragStartX = e.clientX;
    this.viewer.dragStartY = e.clientY;
    this.viewer.panOriginX = this.viewer.panX;
    this.viewer.panOriginY = this.viewer.panY;
    const stage = document.getElementById('doc-viewer-stage');
    if (stage) {
      stage.classList.add('dragging');
      if (stage.setPointerCapture) {
        try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      }
    }
  },

  handlePointerMove(e) {
    if (!this.viewer.isDragging) return;
    const dx = e.clientX - this.viewer.dragStartX;
    const dy = e.clientY - this.viewer.dragStartY;
    this.viewer.panX = this.viewer.panOriginX + dx;
    this.viewer.panY = this.viewer.panOriginY + dy;
    this.applyTransformToStage();
  },

  handlePointerUp(e) {
    if (!this.viewer.isDragging) return;
    this.viewer.isDragging = false;
    const stage = document.getElementById('doc-viewer-stage');
    if (stage) {
      stage.classList.remove('dragging');
      if (stage.releasePointerCapture && e && e.pointerId !== undefined) {
        try { stage.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    }
  },

  toggleSidePanel() {
    this.viewer.sidePanelOpen = !this.viewer.sidePanelOpen;
    const sb = document.getElementById('doc-viewer-sidebar');
    if (sb) sb.style.display = this.viewer.sidePanelOpen ? '' : 'none';
  },

  downloadCurrentDoc() {
    const doc = (App.db.documents || []).find((d) => d.id === this.viewer.docId);
    if (!doc || !this.viewer.blobUrl) return;
    const a = document.createElement('a');
    a.href = this.viewer.blobUrl;
    a.download = doc.fileName || `${doc.title}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  async autoSummarizeInViewer() {
    const doc = (App.db.documents || []).find((d) => d.id === this.viewer.docId);
    if (!doc || !this.viewer.currentBlob) return;

    const statusEl = document.getElementById('viewer-ocr-status');
    const summaryEl = document.getElementById('vw-doc-summary');
    const provEl = document.getElementById('vw-doc-provider');
    const yearEl = document.getElementById('vw-doc-year');
    const totalEl = document.getElementById('vw-doc-total');

    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = '⏳ Analizando factura para extraer cantidades, precios y proveedor...';
    }

    try {
      let rawText = '';
      if (this.viewer.pdfDoc) {
        const pdfRes = await this.extractTextFromPdfBlob(this.viewer.currentBlob);
        rawText = pdfRes.text;
        // Si es PDF escaneado, usar el canvas actual ya renderizado en pantalla
        if (!rawText || rawText.trim().length < 20) {
          const canvas = document.getElementById('doc-viewer-canvas');
          if (canvas) {
            rawText = await this.extractTextWithOcr(canvas, (msg) => {
              if (statusEl) statusEl.innerHTML = msg;
            });
          }
        }
      } else {
        rawText = await this.extractTextWithOcr(this.viewer.currentBlob, (msg) => {
          if (statusEl) statusEl.innerHTML = msg;
        });
      }

      const parsed = this.analyzeInvoiceText(rawText, doc.fileName);
      if (summaryEl) summaryEl.value = parsed.summary;
      if (provEl && !provEl.value.trim() && parsed.provider) provEl.value = parsed.provider;
      if (yearEl && parsed.year) yearEl.value = parsed.year;
      if (totalEl && (!Number(totalEl.value) || Number(totalEl.value) === 0) && parsed.total > 0) {
        totalEl.value = parsed.total;
      }

      if (statusEl) {
        statusEl.innerHTML = '✅ Resumen generado. Pulsa "💾 Guardar Resumen y Datos" abajo para conservarlo.';
      }
    } catch (err) {
      if (statusEl) {
        statusEl.innerHTML = `⚠️ Error al extraer texto: ${App.escapeHtml(err.message)}`;
      }
    }
  },

  async saveViewerMetadata(e) {
    e.preventDefault();
    const doc = (App.db.documents || []).find((d) => d.id === this.viewer.docId);
    if (!doc) return;

    doc.title = (document.getElementById('vw-doc-title').value || '').trim() || doc.title;
    doc.year = document.getElementById('vw-doc-year').value || doc.year;
    doc.referenceTotal = Number(document.getElementById('vw-doc-total').value) || 0;
    doc.providerName = (document.getElementById('vw-doc-provider').value || '').trim();
    doc.sector = document.getElementById('vw-doc-sector').value || doc.sector;
    doc.summary = (document.getElementById('vw-doc-summary').value || '').trim();
    doc.updatedAt = new Date().toISOString();

    await App.commitChange(`Actualizado resumen de documento: ${doc.title}`);
    const statusEl = document.getElementById('viewer-ocr-status');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.style.background = '#dcfce7';
      statusEl.style.color = '#166534';
      statusEl.style.borderColor = '#86efac';
      statusEl.innerHTML = '✅ Resumen y datos guardados correctamente.';
    }
  }
};

if (typeof window !== 'undefined') {
  window.DocsModule = DocsModule;
  window.DOC_TYPES = DOC_TYPES;
  window.DOC_YEARS = DOC_YEARS;
}

// Atajos de teclado mientras el visor está abierto (+ / - zoom, flechas desplazar, R rotar, Esc cerrar)
document.addEventListener('keydown', (e) => {
  if (!DocsModule.viewer.isOpen) return;
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  if (e.key === 'Escape') {
    DocsModule.closeViewer();
  } else if (e.key === '+' || e.key === '=') {
    e.preventDefault();
    DocsModule.stepZoom(0.2);
  } else if (e.key === '-') {
    e.preventDefault();
    DocsModule.stepZoom(-0.2);
  } else if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    DocsModule.rotateBy(90);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    DocsModule.panBy(60, 0);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    DocsModule.panBy(-60, 0);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    DocsModule.panBy(0, 60);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    DocsModule.panBy(0, -60);
  }
});

