from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from io import BytesIO
from datetime import datetime, date, timezone, timedelta
import json
import os
import threading
import webbrowser
import re
import zipfile
import xml.etree.ElementTree as ET
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
NEW_TEMPLATE = ROOT / "template.xlsx"
OLD_TEMPLATE = ROOT / "old-template.xlsx"
os.chdir(ROOT)

MAX_SKU = 12
MAX_DEFECTS = 6
QUESTIONS_WITHOUT_TIME = {'2.1', '3.1', '5.1', '5.2', '6.1', '7.1', '7.2', '7.3', '8.0.1', '8.0.2', '8.4', '8.7'}
EXCEL_STEP_ONE_TIME_CODES = {'1.1', '1.2'}
EXCEL_STEP_ONE_TIME_ROW = 26
QUESTIONS = [
    ("0.1", 25, "yesno", None), ("1.1", 27, "yesno", None),
    ("1.2", 28, "yesno", None), ("2.1", 29, "yesno", None),
    ("2.2", 30, "yesno", None), ("3.1", 31, "yesno", None),
    ("3.3", 32, "yesno", None), ("4.1", 33, "yesno", None),
    ("5.1", 34, "yesno", None), ("5.2", 35, "yesno", None),
    ("5.3", 36, "number", None), ("6.1", 37, "yesno", "requiresColor"),
    ("6.2", 38, "yesno", "requiresColor"), ("7.1", 39, "yesno", None),
    ("7.2", 40, "yesno", None), ("7.3", 41, "yesno", None),
    ("7.4", 42, "number", None), ("7.5", 43, "yesno", None),
    ("8.0.1", 44, "yesno", None), ("8.0.2", 45, "yesno", None),
    ("8.1", 46, "yesno", None), ("8.4", 47, "yesno", "requiresDensity"),
    ("8.5", 48, "yesno", "requiresDensity"), ("8.7", 49, "yesno", "requiresBrix"),
    ("8.8", 50, "yesno", "requiresBrix"), ("9.1", 52, "yesno", None),
    ("10.1", 53, "yesno", None),
]

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
XML_NS = "http://www.w3.org/XML/1998/namespace"
ET.register_namespace("", MAIN_NS)
ET.register_namespace("r", REL_NS)


def qn(tag):
    return f"{{{MAIN_NS}}}{tag}"


def sanitize_core_properties(data):
    """Remove personal author/editor metadata from an OOXML core-properties part."""
    patterns = (
        rb'<dc:creator(?:\s[^>]*)?>.*?</dc:creator>',
        rb'<cp:lastModifiedBy(?:\s[^>]*)?>.*?</cp:lastModifiedBy>',
        rb'<cp:lastPrinted(?:\s[^>]*)?>.*?</cp:lastPrinted>',
    )
    for pattern in patterns:
        data = re.sub(pattern, b'', data, flags=re.DOTALL | re.IGNORECASE)
    return data


def number_or_blank(value):
    if value in (None, ""):
        return None
    try:
        return float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return None


def normalize_brix_values(value):
    text = str(value or "").replace(",", ".")
    text = re.sub(r"[\/|;\s]+", r"\\", text)
    text = re.sub(r"[^0-9.\\]", "", text)
    text = re.sub(r"\\{2,}", r"\\", text)
    parts = []
    for part in text.split("\\"):
        if not part:
            continue
        if "." in part:
            head, tail = part.split(".", 1)
            part = f"{head}.{tail.replace('.', '')}"
        if part.startswith("."):
            part = f"0{part}"
        part = part.rstrip(".")
        if part:
            parts.append(part)
    return "\\".join(parts)


def local_status(value):
    return {"yes": "да", "no": "нет", "na": "н/п"}.get(value, "")


def local_visual(value):
    text = str(value or "").strip()
    if text == "yes":
        return "Видно"
    if text == "no":
        return "Невидно"
    return text


def defect_type_for_export(defect):
    defect = defect or {}
    defect_type = str(defect.get("type", "") or "").strip()
    if defect.get("severity") != "caliber":
        return defect_type
    return f"Некалибр — {defect_type}" if defect_type else "Некалибр"


def parse_datetime(value):
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        try:
            parsed = datetime.strptime(text, "%Y-%m-%d")
        except ValueError:
            return None
    if parsed.tzinfo is not None:
        parsed = parsed.replace(tzinfo=None)
    return parsed


def parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(str(value)[:10], "%Y-%m-%d")
    except ValueError:
        return parse_datetime(value)


def excel_serial(value):
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        value = datetime.combine(value, datetime.min.time())
    epoch = datetime(1899, 12, 30)
    delta = value - epoch
    return delta.days + (delta.seconds + delta.microseconds / 1_000_000) / 86400


def col_to_num(ref):
    letters = re.match(r"[A-Z]+", ref).group(0)
    out = 0
    for ch in letters:
        out = out * 26 + ord(ch) - 64
    return out


def get_or_create_cell(sheet_root, ref):
    row_num = int(re.search(r"\d+", ref).group(0))
    sheet_data = sheet_root.find(qn("sheetData"))
    rows = {int(row.attrib["r"]): row for row in sheet_data.findall(qn("row"))}
    row = rows.get(row_num)
    if row is None:
        row = ET.Element(qn("row"), {"r": str(row_num)})
        inserted = False
        for idx, existing in enumerate(list(sheet_data)):
            if int(existing.attrib.get("r", 0)) > row_num:
                sheet_data.insert(idx, row)
                inserted = True
                break
        if not inserted:
            sheet_data.append(row)
    for cell in row.findall(qn("c")):
        if cell.attrib.get("r") == ref:
            return cell
    cell = ET.Element(qn("c"), {"r": ref})
    target_col = col_to_num(ref)
    inserted = False
    for idx, existing in enumerate(row.findall(qn("c"))):
        if col_to_num(existing.attrib["r"]) > target_col:
            row.insert(idx, cell)
            inserted = True
            break
    if not inserted:
        row.append(cell)
    return cell


def clear_value_nodes(cell, keep_formula=False):
    for child in list(cell):
        if child.tag in {qn("v"), qn("is")} or (not keep_formula and child.tag == qn("f")):
            cell.remove(child)


def set_cell_value(sheet_root, ref, value, kind="auto"):
    cell = get_or_create_cell(sheet_root, ref)
    clear_value_nodes(cell, keep_formula=False)
    cell.attrib.pop("t", None)
    if value is None or value == "":
        return
    if kind == "number" or isinstance(value, (int, float)):
        v = ET.SubElement(cell, qn("v"))
        v.text = format(float(value), ".15g")
        return
    cell.set("t", "inlineStr")
    is_node = ET.SubElement(cell, qn("is"))
    t = ET.SubElement(is_node, qn("t"))
    text = str(value)
    if text[:1].isspace() or text[-1:].isspace() or "\n" in text:
        t.set(f"{{{XML_NS}}}space", "preserve")
    t.text = text


def copy_cell_style(sheet_root, source_ref, target_ref):
    source = get_or_create_cell(sheet_root, source_ref)
    target = get_or_create_cell(sheet_root, target_ref)
    if "s" in source.attrib:
        target.set("s", source.attrib["s"])


def set_formula_cache(sheet_root, ref, value, string=False):
    cell = get_or_create_cell(sheet_root, ref)
    formula = cell.find(qn("f"))
    if formula is None:
        return
    clear_value_nodes(cell, keep_formula=True)
    if value is None or value == "":
        cell.set("t", "str")
        return
    if string:
        cell.set("t", "str")
        v = ET.SubElement(cell, qn("v"))
        v.text = str(value)
    else:
        cell.attrib.pop("t", None)
        v = ET.SubElement(cell, qn("v"))
        v.text = format(float(value), ".15g")


def set_formula_with_result(sheet_root, ref, formula_text, result):
    """Write a formula and its cached string result without changing cell styling."""
    cell = get_or_create_cell(sheet_root, ref)
    clear_value_nodes(cell, keep_formula=False)
    cell.set("t", "str")
    formula = ET.SubElement(cell, qn("f"))
    formula.text = formula_text
    if result not in (None, ""):
        value = ET.SubElement(cell, qn("v"))
        value.text = str(result)


def workbook_sheet_path(zf, sheet_name):
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
    for sheet in workbook.find(qn("sheets")):
        if sheet.attrib.get("name") == sheet_name:
            rid = sheet.attrib[f"{{{REL_NS}}}id"]
            target = rel_map[rid].lstrip("/")
            return target if target.startswith("xl/") else f"xl/{target}"
    raise ValueError(f"В шаблоне не найден лист «{sheet_name}»")


def duration_days(start, end):
    if not start or not end:
        return None
    seconds = (end - start).total_seconds()
    if seconds < 0:
        seconds += 86400
    return max(0.0, seconds / 86400)


def excel_col_name(number):
    n = int(number)
    out = ""
    while n > 0:
        n -= 1
        out = chr(65 + (n % 26)) + out
        n //= 26
    return out


def sku_block(index):
    start = 10 + index * 7
    return {
        "status": excel_col_name(start),
        "time": excel_col_name(start + 1),
        "comment": excel_col_name(start + 2),
        "defect_type": excel_col_name(start),
        "defect_visual": excel_col_name(start + 2),
        "defect_count": excel_col_name(start + 4),
        "defect_comment": excel_col_name(start + 5),
        "helper": excel_col_name(94 + index),
    }


def build_updates(state, export_type="new"):
    s = state.get("shipment") or {}
    skus = list((state.get("skus") or [])[:MAX_SKU])
    while len(skus) < MAX_SKU:
        skus.append(None)

    summary_cols = ["C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "X", "AA", "AB"]
    blocks = [sku_block(i) for i in range(MAX_SKU)]
    updates = {}
    caches = {}

    connection_time = parse_datetime(s.get("connectionTime") or s.get("acceptanceStart"))
    acceptance_start = parse_datetime(s.get("acceptanceStart") or s.get("connectionTime"))
    acceptance_end = parse_datetime(s.get("acceptanceEnd"))
    report_end = parse_datetime(s.get("reportEnd"))
    if connection_time and acceptance_start and acceptance_start < connection_time:
        acceptance_start += timedelta(days=1)
    if acceptance_start and acceptance_end and acceptance_end < acceptance_start:
        acceptance_end += timedelta(days=1)
    report_anchor = acceptance_end or acceptance_start or connection_time
    if report_anchor and report_end and report_end < report_anchor:
        report_end += timedelta(days=1)

    updates["D2"] = (excel_serial(connection_time), "number") if connection_time else (None, "auto")
    updates["I75"] = (excel_serial(report_end), "number") if report_end else (None, "auto")

    sku_min_times = []
    sku_max_times = []

    for i, sku in enumerate(skus):
        block = blocks[i]
        row = 5 + i
        if sku:
            values = [
                s.get("id", ""), s.get("rc", ""), excel_serial(parse_date(s.get("date"))), s.get("supplier", ""),
                sku.get("code", ""), sku.get("name", ""), s.get("format", ""), s.get("mokk", ""),
                s.get("dpId", ""), sku.get("vpt", ""), number_or_blank(sku.get("sampleMass")),
                number_or_blank(sku.get("defectMass")), number_or_blank(sku.get("nonstandardMass")),
                number_or_blank(sku.get("debrisMass")), number_or_blank(sku.get("caliberMass")),
                normalize_brix_values(sku.get("brixValues")) if sku.get("requiresBrix") else None,
                "да" if sku.get("apmError") == "yes" else "нет", sku.get("comment", ""),
            ]
        else:
            values = [None] * len(summary_cols)
        for col, value in zip(summary_cols, values):
            kind = "number" if col in {"E", "M", "N", "O", "P", "Q"} and value is not None else "auto"
            updates[f"{col}{row}"] = (value, kind)
        updates[f"R{row}"] = (None, "auto")

        checklist = (sku or {}).get("checklist", {}) if sku else {}
        times = []
        step_one_times = []
        last_sku_time = acceptance_start or connection_time
        written_statuses = {}
        for code, qrow, qtype, feature in QUESTIONS:
            answer = checklist.get(code, {}) if sku else {}
            applicable = bool(sku) and (not feature or bool(sku.get(feature)))
            is_na = answer.get("status") == "na"
            skipped = qtype != "number" and (not applicable or is_na)
            if not sku:
                status_value = None
            elif qtype == "number":
                status_value = number_or_blank(answer.get("value"))
            elif skipped:
                status_value = None
            else:
                status_value = local_status(answer.get("status"))
            written_statuses[qrow] = status_value
            updates[f"{block['status']}{qrow}"] = (status_value, "number" if qtype == "number" and status_value is not None else "auto")

            allow_details = bool(sku) and (qtype == "number" or not skipped)
            allow_time = allow_details and not is_na and code not in QUESTIONS_WITHOUT_TIME and not (code == "7.4" and (number_or_blank(answer.get("value")) or 0) <= 0)
            dt = parse_datetime(answer.get("time")) if allow_time else None
            if dt:
                while last_sku_time and dt < last_sku_time:
                    dt += timedelta(days=1)
                last_sku_time = dt
            if code in EXCEL_STEP_ONE_TIME_CODES:
                updates[f"{block['time']}{qrow}"] = (None, "auto")
                if dt:
                    step_one_times.append(dt)
            else:
                updates[f"{block['time']}{qrow}"] = (excel_serial(dt), "number") if dt else (None, "auto")
            if dt:
                times.append(dt)
            updates[f"{block['comment']}{qrow}"] = (answer.get("comment", "") if allow_details else None, "auto")

        step_one_time = max(step_one_times) if step_one_times else None
        updates[f"{block['time']}{EXCEL_STEP_ONE_TIME_ROW}"] = ((excel_serial(step_one_time), "number") if step_one_time else (None, "auto"))

        defects = (sku or {}).get("defects", []) if sku else []
        defect_types = []
        defect_total = 0.0
        for r in range(MAX_DEFECTS):
            target = 66 + r
            defect = defects[r] if r < len(defects) else {}
            dtype = defect_type_for_export(defect) or None
            dcount = number_or_blank(defect.get("count"))
            if dtype:
                defect_types.append(str(dtype))
            if dcount is not None:
                defect_total += dcount
            updates[f"{block['defect_type']}{target}"] = (dtype, "auto")
            updates[f"{block['defect_visual']}{target}"] = (local_visual(defect.get("visual")) or None, "auto")
            updates[f"{block['defect_count']}{target}"] = (dcount, "number" if dcount is not None else "auto")
            updates[f"{block['defect_comment']}{target}"] = (defect.get("comment", "") or None, "auto")
        updates[f"{block['defect_count']}72"] = (defect_total if sku else 0, "number")

        if sku:
            sample = number_or_blank(sku.get("sampleMass")) or 0.0
            masses = [
                number_or_blank(sku.get("defectMass")) or 0.0,
                number_or_blank(sku.get("nonstandardMass")) or 0.0,
                number_or_blank(sku.get("debrisMass")) or 0.0,
                number_or_blank(sku.get("caliberMass")) or 0.0,
                number_or_blank(sku.get("debrisMass")) or 0.0,
            ]
            for col, mass in zip(["S", "T", "U", "V", "W"], masses):
                updates[f"{col}{row}"] = (((mass * 100 / sample) if sample else 0.0), "number")
            updates[f"Y{row}"] = (", ".join(defect_types), "auto")
            apm_count = 1 if sku.get("apmError") == "yes" else 0
            process_no = 0
            for code, qrow, qtype, feature in QUESTIONS:
                if qtype != "yesno" or code in {"8.0.1", "8.0.2"}:
                    continue
                if feature and not sku.get(feature):
                    continue
                if checklist.get(code, {}).get("status") == "no":
                    process_no += 1
            quality_count = number_or_blank(checklist.get("7.4", {}).get("value")) or 0.0
            if checklist.get("7.3", {}).get("status") == "no":
                quality_count += 1
            process_total = process_no + apm_count
            updates[f"AD{row}"] = (apm_count, "number")
            updates[f"AE{row}"] = (process_total, "number")
            updates[f"AF{row}"] = (quality_count, "number")
            updates[f"AG{row}"] = (1 if process_total + quality_count > 0 else 0, "number")
            answer_count = sum(1 for qrow, val in written_statuses.items() if 27 <= qrow <= 53 and val not in (None, ""))
            updates[f"{block['status']}55"] = (answer_count, "number")
            if times:
                min_t, max_t = min(times), max(times)
                sku_min_times.append(min_t); sku_max_times.append(max_t)
                updates[f"{block['time']}56"] = (excel_serial(min_t), "number")
                updates[f"{block['time']}57"] = (excel_serial(max_t), "number")
                updates[f"{block['time']}58"] = (duration_days(min_t, max_t), "number")
                updates[f"AH{row}"] = (duration_days(min_t, max_t), "number")
            else:
                updates[f"{block['time']}56"] = (None, "auto")
                updates[f"{block['time']}57"] = (None, "auto")
                updates[f"{block['time']}58"] = (None, "auto")
                updates[f"AH{row}"] = (None, "auto")
        else:
            for col in ["S", "T", "U", "V", "W", "Y", "AD", "AE", "AF", "AG", "AH", "AI"]:
                updates[f"{col}{row}"] = (None, "auto")
            updates[f"{block['status']}55"] = (0, "number")
            for rr in [56,57,58]:
                updates[f"{block['time']}{rr}"] = (None, "auto")

    checklist_start = min(sku_min_times) if sku_min_times else None
    checklist_end = max(sku_max_times) if sku_max_times else None
    overall_min = acceptance_start or checklist_start or connection_time
    overall_max = acceptance_end or checklist_end
    if overall_min and overall_max and overall_max < overall_min:
        overall_max += timedelta(days=1)
    if overall_max and report_end and report_end < overall_max:
        report_end += timedelta(days=1)

    acceptance_duration = duration_days(overall_min, overall_max) if overall_min and overall_max else None
    check_and_fill_duration = duration_days(connection_time, report_end) if connection_time and report_end else None
    total_duration = (check_and_fill_duration + acceptance_duration) if check_and_fill_duration is not None and acceptance_duration is not None else None
    report_duration = duration_days(overall_max, report_end) if overall_max and report_end else None
    updates["K59"] = (excel_serial(overall_max), "number") if overall_max else (None, "auto")
    updates["K60"] = (excel_serial(overall_min), "number") if overall_min else (None, "auto")
    updates["K61"] = (acceptance_duration, "number") if acceptance_duration is not None else (None, "auto")
    updates["I76"] = (check_and_fill_duration, "number") if check_and_fill_duration is not None else (None, "auto")
    updates["I77"] = (total_duration, "number") if total_duration is not None else (None, "auto")
    for i, sku in enumerate(skus):
        updates[f"AI{5 + i}"] = (report_duration if sku and report_duration is not None else None, "number" if sku and report_duration is not None else "auto")

    return updates, caches


def build_excel(state, export_type="new"):
    normalized_type = "old" if export_type == "old" else "new"
    template_path = OLD_TEMPLATE if normalized_type == "old" else NEW_TEMPLATE
    if not template_path.exists():
        raise FileNotFoundError(
            "Не найден old-template.xlsx" if normalized_type == "old" else "Не найден template.xlsx"
        )

    with zipfile.ZipFile(template_path, "r") as source:
        sheet_path = workbook_sheet_path(source, "Чек лист_ДП_Отчет")
        sheet_root = ET.fromstring(source.read(sheet_path))
        workbook_root = ET.fromstring(source.read("xl/workbook.xml"))

        updates, caches = build_updates(state, normalized_type)
        for ref, (value, kind) in updates.items():
            set_cell_value(sheet_root, ref, value, kind)
        # Строка 23 — отдельное поле времени завершения шага 1.
        # Берём формат hh:mm у соседней штатной ячейки тайм-кода.
        for i in range(MAX_SKU):
            time_col = sku_block(i)["time"]
            copy_cell_style(sheet_root, f"{time_col}29", f"{time_col}{EXCEL_STEP_ONE_TIME_ROW}")
        for ref, (value, is_string) in caches.items():
            set_formula_cache(sheet_root, ref, value, string=is_string)

        # Заголовки 12 блоков чек-листа повторяют названия товаров из H5:H16.
        skus = list((state.get("skus") or [])[:MAX_SKU])
        while len(skus) < MAX_SKU:
            skus.append(None)
        for index in range(MAX_SKU):
            sku = skus[index] or {}
            header_col = sku_block(index)["status"]
            set_formula_with_result(
                sheet_root,
                f"{header_col}23",
                f'IF(H{5 + index}="","",H{5 + index})',
                sku.get("name", "") or "",
            )

        calc_pr = workbook_root.find(qn("calcPr"))
        if calc_pr is None:
            calc_pr = ET.SubElement(workbook_root, qn("calcPr"))
        calc_pr.set("calcMode", "auto")
        calc_pr.set("fullCalcOnLoad", "1")
        calc_pr.set("forceFullCalc", "1")

        modified = {
            sheet_path: ET.tostring(sheet_root, encoding="utf-8", xml_declaration=True),
            "xl/workbook.xml": ET.tostring(workbook_root, encoding="utf-8", xml_declaration=True),
        }
        if "docProps/core.xml" in source.namelist():
            modified["docProps/core.xml"] = sanitize_core_properties(source.read("docProps/core.xml"))

        output = BytesIO()
        with zipfile.ZipFile(output, "w") as target:
            for info in source.infolist():
                data = modified.get(info.filename, source.read(info.filename))
                target.writestr(info, data)
        return output.getvalue()


class QualityHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?", 1)[0] == "/api/health":
            body = json.dumps({"ok": True, "service": "Дистанционная Приёмка", "version": 50}, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_POST(self):
        if self.path.split("?", 1)[0] != "/api/export":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 20_000_000:
                raise ValueError("Некорректный размер запроса")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            state = payload.get("state") or payload
            export_type = "old" if payload.get("exportType") == "old" else "new"
            data = build_excel(state, export_type)
            shipment = state.get("shipment") or {}
            supplier = re.sub(r'[\/:*?"<>|]+', ' ', str(shipment.get("supplier") or ""))
            application = re.sub(r'[\/:*?"<>|]+', ' ', str(shipment.get("id") or ""))
            supplier = re.sub(r'\s+', ' ', supplier).strip()
            application = re.sub(r'\s+', ' ', application).strip()
            base = " ".join(part for part in [supplier, application] if part) or "Чек-лист"
            filename = f"{base}.xlsx"
            self.send_response(200)
            self.send_header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{quote(filename)}")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as exc:
            body = json.dumps({"error": str(exc)}, ensure_ascii=False).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    def log_message(self, fmt, *args):
        print(f"[Дистанционная Приёмка] {self.address_string()} - {fmt % args}")


def main():
    server = None
    for candidate_port in range(8765, 8776):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", candidate_port), QualityHandler)
            break
        except OSError:
            continue
    if server is None:
        server = ThreadingHTTPServer(("127.0.0.1", 0), QualityHandler)
    port = server.server_address[1]
    url = f"http://127.0.0.1:{port}/index.html?v=59"
    print("=" * 68)
    print("Дистанционная Приёмка v54 запущена — текстовая визуальная оценка дефектов")
    print(url)
    print("Не закрывайте это окно, пока работаете с сайтом.")
    print("=" * 68)
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nДистанционная Приёмка остановлена.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
