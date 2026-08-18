/* Локальный импорт АРМ. Файл Excel читается только в браузере/Worker и никуда не отправляется. */
'use strict';

importScripts('./vendor/exceljs.min.js');

const FIELD_ALIASES = {
  rowId: ['id'],
  requestNumber: ['номер заявки', 'номер заявки / поставки', 'номер заявки/поставки'],
  date: ['дата проверки', 'дата приемки', 'дата приёмки'],
  rc: ['рц'],
  supplier: ['поставщик', 'ка'],
  code: ['код товара', 'код товара / sku', 'sku'],
  name: ['название товара', 'наименование товара'],
  vpt: ['температура', 'впт', 'внутриплодная температура', 'температура продукта'],
  sampleMass: ['м выборки кг/шт', 'масса выборки', 'масса выборки кг/шт', 'м выборки', 'выборка кг/шт'],
  defectMass: ['м брака кг/шт', 'масса брака', 'масса брака кг/шт', 'м брака', 'брак масса кг/шт'],
  defectPercent: ['% брака', 'брак %'],
  nonstandardMass: ['нестандарт, масса кг/шт', 'нестандарт масса кг/шт', 'масса нестандарта', 'масса нестандарта кг/шт', 'м нестандарта'],
  nonstandardPercent: ['нестандарт %', '% нестандарта'],
  debrisMass: ['м осыпи/листьев капусты/земли', 'масса осыпи/листьев капусты/земли', 'масса осыпи листьев капусты земли', 'м осыпи'],
  debrisPercent: ['осыпь/листья капусты/земля %', '% осыпи/листьев капусты/земли', 'осыпь %'],
  caliberMass: ['м калибра', 'масса калибра', 'м некалибра', 'масса некалибра', 'некалибр масса кг/шт'],
  caliberPercent: ['калибр %', 'некалибр %', '% калибра'],
  combinedPercent: ['% нестандарт/калибр', '% нестандарт / калибр'],
  brix: ['замер брикс', 'brix', 'брикс'],
  defectCharacter: ['характер брака'],
  other: ['другое'],
  nonstandardCharacter: ['характер нестандарта'],
};

let requestIndex = new Map();
let loadSummary = null;

function normalizeHeader(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/ё/g, 'е')
    .replace(/%/g, ' процент ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[^0-9a-zа-я]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function plainValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return { __date: value.toISOString() };
  if (typeof value !== 'object') return value;
  if (Array.isArray(value.richText)) return value.richText.map(part => part?.text || '').join('');
  if (Object.prototype.hasOwnProperty.call(value, 'result')) return plainValue(value.result);
  if (Object.prototype.hasOwnProperty.call(value, 'text')) return value.text ?? '';
  if (Object.prototype.hasOwnProperty.call(value, 'hyperlink')) return value.text || value.hyperlink || '';
  return String(value);
}

function textValue(value) {
  const plain = plainValue(value);
  if (plain && typeof plain === 'object' && plain.__date) return plain.__date;
  return String(plain ?? '').trim();
}

function buildColumnMap(worksheet) {
  const required = ['requestNumber', 'rc', 'date', 'supplier', 'code', 'name'];
  let best = null;
  const maxHeaderRow = Math.min(25, Math.max(1, worksheet.rowCount || 1));
  for (let rowNumber = 1; rowNumber <= maxHeaderRow; rowNumber += 1) {
    const normalizedToColumn = new Map();
    worksheet.getRow(rowNumber).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const name = normalizeHeader(plainValue(cell.value));
      if (name && !normalizedToColumn.has(name)) normalizedToColumn.set(name, colNumber);
    });
    const columns = {};
    Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
      const match = aliases.map(normalizeHeader).find(alias => normalizedToColumn.has(alias));
      columns[field] = match ? normalizedToColumn.get(match) : 0;
    });
    const requiredScore = required.filter(field => columns[field]).length;
    const optionalScore = Object.values(columns).filter(Boolean).length;
    const score = requiredScore * 100 + optionalScore;
    if (!best || score > best.score) best = { columns, headerRow: rowNumber, score, requiredScore, optionalScore };
  }
  return best || { columns: {}, headerRow: 1, score: 0, requiredScore: 0, optionalScore: 0 };
}

function findArmWorksheet(workbook) {
  let best = null;
  workbook.worksheets.forEach(worksheet => {
    const candidate = buildColumnMap(worksheet);
    if (!best || candidate.score > best.score) best = { worksheet, ...candidate };
  });
  return best;
}

function rowRecord(row, columns) {
  const record = {};
  Object.entries(columns).forEach(([field, column]) => {
    record[field] = column ? plainValue(row.getCell(column).value) : '';
  });
  return record;
}

self.onmessage = async event => {
  const message = event.data || {};
  const id = message.id;
  try {
    if (message.type === 'load') {
      requestIndex = new Map();
      loadSummary = null;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(message.buffer);
      const detected = findArmWorksheet(workbook);
      const worksheet = detected?.worksheet;
      const columns = detected?.columns || {};
      const headerRow = detected?.headerRow || 1;
      if (!worksheet) throw new Error('В Excel не найден рабочий лист.');
      const requiredMissing = ['requestNumber', 'rc', 'date', 'supplier', 'code', 'name'].filter(field => !columns[field]);
      if (requiredMissing.length) throw new Error(`Не удалось определить таблицу АРМ. Не найдены обязательные колонки: ${requiredMissing.join(', ')}.`);

      let indexedRows = 0;
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber <= headerRow) return;
        const requestNumber = textValue(row.getCell(columns.requestNumber).value);
        if (!requestNumber) return;
        const record = rowRecord(row, columns);
        record.__rowNumber = rowNumber;
        if (!requestIndex.has(requestNumber)) requestIndex.set(requestNumber, []);
        requestIndex.get(requestNumber).push(record);
        indexedRows += 1;
      });
      loadSummary = {
        sheetName: worksheet.name,
        headerRow,
        rows: indexedRows,
        requests: requestIndex.size,
        availableFields: Object.fromEntries(Object.entries(columns).map(([key, value]) => [key, Boolean(value)])),
      };
      self.postMessage({ id, ok: true, type: 'loaded', summary: loadSummary });
      return;
    }

    if (message.type === 'search') {
      if (!loadSummary) throw new Error('Сначала загрузите Excel АРМ.');
      const requestNumber = String(message.requestNumber || '').trim();
      const rows = requestIndex.get(requestNumber) || [];
      self.postMessage({ id, ok: true, type: 'search-result', requestNumber, rows, summary: loadSummary });
      return;
    }

    throw new Error('Неизвестная команда импорта.');
  } catch (error) {
    self.postMessage({ id, ok: false, error: error?.message || String(error) });
  }
};
