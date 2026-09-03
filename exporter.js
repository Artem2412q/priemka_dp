(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./vendor/exceljs.min.js'), require('./schema-node.js'));
  else root.DPV3_EXPORTER = factory(root.ExcelJS, root.DPV3_SCHEMA);
})(typeof self !== 'undefined' ? self : this, function (ExcelJS, SCHEMA) {
  'use strict';

  if (!ExcelJS) throw new Error('ExcelJS не загружен.');

  function base64ToArrayBuffer(base64) {
    if (typeof Buffer !== 'undefined' && typeof window === 'undefined') {
      const b = Buffer.from(base64, 'base64');
      return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function normalizeText(value) { return String(value ?? '').trim(); }
  function numberOrNull(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const n = Number(String(value).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  function parseDate(value) {
    const text = normalizeText(value);
    const m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    // Пишем именно Excel serial, а не JS Date: так дата не сдвигается
    // на предыдущий день в браузерах с часовым поясом UTC+N.
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86400000 + 25569;
  }
  function timeFraction(value) {
    const text = normalizeText(value);
    const m = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return null;
    const h = Number(m[1]), min = Number(m[2]), sec = Number(m[3] || 0);
    if (h > 23 || min > 59 || sec > 59) return null;
    return (h * 3600 + min * 60 + sec) / 86400;
  }
  function normalizeAfter(value, anchor) {
    if (value === null) return null;
    let v = value;
    if (anchor !== null && anchor !== undefined) while (v < anchor) v += 1;
    return v;
  }
  function localizedStatus(status) {
    if (status === 'yes') return 'да';
    if (status === 'no') return 'нет';
    return null;
  }
  function isApplicable(sku, q) { return !q.feature || Boolean(sku?.[q.feature]); }
  function questionHasTime(q, answer) {
    if (!q || SCHEMA.QUESTIONS_WITHOUT_TIME.has(q.code) || q.noTime) return false;
    if (q.code === '7.4' && (numberOrNull(answer?.value) ?? 0) <= 0) return false;
    return true;
  }

  function getMetaMap(workbook) {
    const ws = workbook.getWorksheet(SCHEMA.TEMPLATE.metaSheet);
    if (!ws) throw new Error(`В шаблоне отсутствует лист «${SCHEMA.TEMPLATE.metaSheet}».`);
    const out = {};
    for (let row = 1; row <= 30; row++) {
      const key = normalizeText(ws.getCell(`A${row}`).value);
      if (!key) continue;
      const raw = ws.getCell(`B${row}`).value;
      out[key] = raw && typeof raw === 'object' && 'result' in raw ? raw.result : raw;
    }
    return out;
  }

  function validateTemplate(workbook) {
    const ws = workbook.getWorksheet(SCHEMA.TEMPLATE.reportSheet);
    if (!ws) throw new Error(`Не найден основной лист «${SCHEMA.TEMPLATE.reportSheet}».`);
    const meta = getMetaMap(workbook);
    const checks = [
      ['template_id', SCHEMA.TEMPLATE.id],
      ['template_version', SCHEMA.TEMPLATE.templateVersion],
      ['schema_version', SCHEMA.TEMPLATE.schemaVersion],
      ['sku_capacity', SCHEMA.TEMPLATE.skuCapacity],
      ['layout_mode', SCHEMA.TEMPLATE.layoutMode],
    ];
    for (const [key, expected] of checks) {
      if (String(meta[key]) !== String(expected)) throw new Error(`Шаблон V3 не прошёл проверку: ${key}=${meta[key] ?? '∅'}, ожидалось ${expected}.`);
    }
    return meta;
  }

  function clearDirectInputs(ws) {
    const C = SCHEMA.TEMPLATE.summaryColumns;
    const directCols = Object.values(C);
    for (let i = 0; i < SCHEMA.TEMPLATE.skuCapacity; i++) {
      const row = SCHEMA.TEMPLATE.summaryRows.start + i;
      directCols.forEach(col => { ws.getCell(`${col}${row}`).value = null; });
      const block = SCHEMA.skuExcelBlock(i);
      SCHEMA.QUESTIONS.forEach(q => {
        ws.getCell(`${block.status}${q.row}`).value = null;
        ws.getCell(`${block.time}${q.row}`).value = null;
        ws.getCell(`${block.comment}${q.row}`).value = null;
      });
      ws.getCell(`${block.time}${SCHEMA.TEMPLATE.sharedStepOneTimeRow}`).value = null;
      for (let r = SCHEMA.TEMPLATE.defectRows.start; r <= SCHEMA.TEMPLATE.defectRows.end; r++) {
        ws.getCell(`${block.defectType}${r}`).value = null;
        ws.getCell(`${block.defectVisual}${r}`).value = null;
        ws.getCell(`${block.defectCount}${r}`).value = null;
        ws.getCell(`${block.defectComment}${r}`).value = null;
      }
    }
    ws.getCell(SCHEMA.TEMPLATE.connectionTimeCell).value = null;
    ws.getCell(SCHEMA.TEMPLATE.reportEndCell).value = null;
  }

  function writeSummaryRow(ws, row, shipment, sku) {
    const C = SCHEMA.TEMPLATE.summaryColumns;
    const values = {
      requestNumber: shipment.requestNumber || null,
      rc: shipment.rc || null,
      date: parseDate(shipment.date),
      supplier: shipment.supplier || null,
      code: sku.code || null,
      name: sku.name || null,
      format: shipment.format || null,
      mokk: shipment.mokk || null,
      dpId: shipment.dpId || null,
      vpt: sku.vpt || null,
      sampleMass: numberOrNull(sku.sampleMass),
      defectMass: numberOrNull(sku.defectMass),
      nonstandardMass: numberOrNull(sku.nonstandardMass),
      debrisMass: numberOrNull(sku.debrisMass),
      caliberMass: numberOrNull(sku.caliberMass),
      mprPercent: numberOrNull(sku.mprPercent) ?? 3.4,
      brixValues: normalizeText(sku.brixValues) || null,
      apmError: sku.apmError === 'yes' ? 'да' : 'нет',
      comment: normalizeText(sku.comment) || null,
    };
    Object.entries(C).forEach(([key, col]) => {
      const cell = ws.getCell(`${col}${row}`);
      cell.value = values[key] ?? null;
      if (key === 'date' && values[key]) cell.numFmt = 'dd.mm.yyyy';
    });
  }

  function writeChecklist(ws, index, sku, connectionStart) {
    const block = SCHEMA.skuExcelBlock(index);
    let lastTime = connectionStart;
    const stepOneTimes = [];

    for (const q of SCHEMA.QUESTIONS) {
      const answer = sku.checklist?.[q.code] || {};
      const applicable = isApplicable(sku, q);
      const statusCell = ws.getCell(`${block.status}${q.row}`);
      const timeCell = ws.getCell(`${block.time}${q.row}`);
      const commentCell = ws.getCell(`${block.comment}${q.row}`);
      if (!applicable) continue;

      if (q.type === 'number') statusCell.value = numberOrNull(answer.value);
      else statusCell.value = localizedStatus(answer.status);
      commentCell.value = normalizeText(answer.comment) || null;

      if (questionHasTime(q, answer)) {
        let t = timeFraction(answer.time);
        if (t !== null) {
          t = normalizeAfter(t, lastTime);
          lastTime = t;
          if (q.code === '1.1' || q.code === '1.2') stepOneTimes.push(t);
          else {
            timeCell.value = t;
            timeCell.numFmt = 'hh:mm';
          }
        }
      }
    }

    if (stepOneTimes.length) {
      const shared = ws.getCell(`${block.time}${SCHEMA.TEMPLATE.sharedStepOneTimeRow}`);
      shared.value = Math.max(...stepOneTimes);
      shared.numFmt = 'hh:mm';
    }
  }

  function writeDefects(ws, index, sku) {
    const block = SCHEMA.skuExcelBlock(index);
    const defects = Array.isArray(sku.defects) ? sku.defects.slice(0, 6) : [];
    for (let d = 0; d < 6; d++) {
      const row = SCHEMA.TEMPLATE.defectRows.start + d;
      const defect = defects[d] || {};
      ws.getCell(`${block.defectType}${row}`).value = normalizeText(defect.type) || null;
      ws.getCell(`${block.defectVisual}${row}`).value = normalizeText(defect.visual) || null;
      ws.getCell(`${block.defectCount}${row}`).value = numberOrNull(defect.count);
      ws.getCell(`${block.defectComment}${row}`).value = normalizeText(defect.comment) || null;
    }
  }

  function fillWorkbook(workbook, state) {
    validateTemplate(workbook);
    const ws = workbook.getWorksheet(SCHEMA.TEMPLATE.reportSheet);
    clearDirectInputs(ws);

    const shipment = state.shipment || {};
    let connectionStart = timeFraction(shipment.connectionTime);
    if (connectionStart !== null) {
      ws.getCell(SCHEMA.TEMPLATE.connectionTimeCell).value = connectionStart;
      ws.getCell(SCHEMA.TEMPLATE.connectionTimeCell).numFmt = 'hh:mm';
    }

    const skus = Array.isArray(state.skus) ? state.skus.slice(0, SCHEMA.TEMPLATE.skuCapacity) : [];
    skus.forEach((sku, index) => {
      const row = SCHEMA.TEMPLATE.summaryRows.start + index;
      writeSummaryRow(ws, row, shipment, sku);
      writeChecklist(ws, index, sku, connectionStart);
      writeDefects(ws, index, sku);
    });

    // Окончание заполнения отчёта. При переходе через полночь сохраняем следующий день в serial.
    let reportEnd = timeFraction(shipment.reportEnd);
    if (reportEnd !== null) {
      let latestChecklistTime = connectionStart;
      // Временная шкала нормализуется отдельно для каждого SKU. Иначе одинаковые
      // часы разных SKU ошибочно воспринимались бы как последовательные дни.
      for (let i = 0; i < skus.length; i++) {
        let skuAnchor = connectionStart;
        for (const q of SCHEMA.QUESTIONS) {
          const answer = skus[i].checklist?.[q.code] || {};
          if (!isApplicable(skus[i], q) || !questionHasTime(q, answer)) continue;
          const raw = timeFraction(answer.time);
          if (raw === null) continue;
          const normalized = normalizeAfter(raw, skuAnchor);
          skuAnchor = normalized;
          if (latestChecklistTime === null || normalized > latestChecklistTime) latestChecklistTime = normalized;
        }
      }
      reportEnd = normalizeAfter(reportEnd, latestChecklistTime);
      ws.getCell(SCHEMA.TEMPLATE.reportEndCell).value = reportEnd;
      ws.getCell(SCHEMA.TEMPLATE.reportEndCell).numFmt = 'hh:mm';
    }

    workbook.calcProperties.fullCalcOnLoad = true;
    workbook.calcProperties.forceFullCalc = true;
    workbook.calcProperties.calcMode = 'auto';
    return workbook;
  }

  async function buildWorkbook(state, templateBase64) {
    if (!templateBase64) throw new Error('Не найден встроенный мастер-шаблон V3.');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(base64ToArrayBuffer(templateBase64));
    fillWorkbook(workbook, state);
    return workbook;
  }

  async function exportBuffer(state, templateBase64) {
    const workbook = await buildWorkbook(state, templateBase64);
    return workbook.xlsx.writeBuffer();
  }

  return { buildWorkbook, fillWorkbook, exportBuffer, validateTemplate, timeFraction };
});
