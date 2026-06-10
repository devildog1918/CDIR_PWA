/* Cellular Device Intake and Recycle - CDIR v4
   Static PWA. No APIs. Project data is saved to a user-selected JSON file.
*/

const ORIGINAL_COLUMNS = [
  "DATE", "VENDOR", "QTY", "MODEL", "TYPE OF DEVICE",
  "REASON", "USER NAME", "DEPARTMENT", "IMEI", "ICCID"
];

let project = {
  app: "Cellular Device Intake and Recycle",
  version: 4,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  records: []
};

let fileHandle = null;
let selectedPrintIndexes = new Set();

const $ = id => document.getElementById(id);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function setDefaultsForGroup() {
  const group = $("deviceGroup").value;
  $("typeOfDevice").value = group === "Hot Spot" ? "Hot Spot" : "Cell Phone";
}

function formRecord() {
  const group = $("deviceGroup").value;
  return {
    deviceGroup: group,
    date: $("date").value || todayISO(),
    vendor: $("vendor").value.trim() || "e-Cycle",
    qty: Number($("qty").value || 1),
    model: $("model").value.trim(),
    typeOfDevice: $("typeOfDevice").value.trim() || (group === "Hot Spot" ? "Hot Spot" : "Cell Phone"),
    reason: $("reason").value.trim() || "Recycle",
    userName: $("userName").value.trim(),
    department: $("department").value.trim(),
    imei: onlyDigits($("imei").value),
    iccid: onlyDigits($("iccid").value),
    mtn: formatMtn($("mtn").value),
    assetTag: $("assetTag").value.trim().toUpperCase()
  };
}

function loadRecordToForm(record) {
  $("deviceGroup").value = record.deviceGroup || "Phone";
  $("date").value = record.date || todayISO();
  $("vendor").value = record.vendor || "e-Cycle";
  $("qty").value = record.qty || 1;
  $("model").value = record.model || "";
  $("typeOfDevice").value = record.typeOfDevice || "";
  $("reason").value = record.reason || "Recycle";
  $("userName").value = record.userName || "";
  $("department").value = record.department || "";
  $("imei").value = record.imei || "";
  $("iccid").value = record.iccid || "";
  $("mtn").value = record.mtn || "";
  $("assetTag").value = record.assetTag || "";
}

function clearForm() {
  const group = $("deviceGroup").value;
  $("date").value = todayISO();
  $("vendor").value = "e-Cycle";
  $("qty").value = 1;
  $("model").value = "";
  $("reason").value = "Recycle";
  $("userName").value = "";
  $("department").value = "";
  $("imei").value = "";
  $("iccid").value = "";
  $("mtn").value = "";
  $("assetTag").value = "";
  $("quickScan").value = "";
  $("deviceGroup").value = group;
  setDefaultsForGroup();
  $("quickScan").focus();
}

function validateRecord(r) {
  const warnings = [];
  if (!r.model) warnings.push("Model is blank");
  if (!r.imei) warnings.push("IMEI is blank");
  if (r.imei && r.imei.length !== 15) warnings.push("IMEI should be 15 digits");
  if (r.iccid && !r.iccid.startsWith("89")) warnings.push("ICCID usually starts with 89");
  return warnings;
}

async function addRecord() {
  const r = formRecord();
  const warnings = validateRecord(r);
  project.records.push(r);
  selectedPrintIndexes.add(project.records.length - 1);
  project.updated = new Date().toISOString();
  renderRecords();
  await saveProject(false);
  $("formMessage").textContent = warnings.length
    ? "Added with warning: " + warnings.join("; ")
    : "Device added and project saved.";
  clearForm();
}

function renderRecords() {
  const tbody = $("recordsTable").querySelector("tbody");
  tbody.innerHTML = "";

  project.records.forEach((r, i) => {
    if (!selectedPrintIndexes.has(i) && selectedPrintIndexes.size === 0) {
      selectedPrintIndexes.add(i);
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="printCheck" type="checkbox" data-print="${i}" ${selectedPrintIndexes.has(i) ? "checked" : ""}></td>
      <td>${i + 1}</td>
      <td>${esc(r.deviceGroup)}</td>
      <td>${esc(r.date)}</td>
      <td>${esc(r.model)}</td>
      <td>${esc(r.userName)}</td>
      <td>${esc(r.imei)}</td>
      <td>${esc(r.iccid)}</td>
      <td>${esc(r.mtn)}</td>
      <td>${esc(r.assetTag)}</td>
      <td>
        <button class="secondary" data-preview="${i}">Preview</button>
        <button class="secondary" data-printone="${i}">Print</button>
        <button class="secondary" data-edit="${i}">Edit</button>
        <button class="danger" data-del="${i}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("input[data-print]").forEach(cb => {
    cb.addEventListener("change", () => {
      const idx = Number(cb.dataset.print);
      if (cb.checked) selectedPrintIndexes.add(idx);
      else selectedPrintIndexes.delete(idx);
    });
  });

  tbody.querySelectorAll("button[data-preview]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.preview);
      previewLabels([project.records[idx]]);
    });
  });

  tbody.querySelectorAll("button[data-printone]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.printone);
      printLabels([project.records[idx]]);
    });
  });

  tbody.querySelectorAll("button[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.edit);
      loadRecordToForm(project.records[idx]);
      project.records.splice(idx, 1);
      normalizeSelectedAfterDelete(idx);
      renderRecords();
      saveProject(false);
      $("formMessage").textContent = "Loaded row for editing. Add Device to save it back.";
    });
  });

  tbody.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const idx = Number(btn.dataset.del);
      if (confirm("Delete this record?")) {
        project.records.splice(idx, 1);
        normalizeSelectedAfterDelete(idx);
        project.updated = new Date().toISOString();
        renderRecords();
        await saveProject(false);
      }
    });
  });

  $("counter").textContent = `${project.records.length} record${project.records.length === 1 ? "" : "s"}`;
}

function normalizeSelectedAfterDelete(deletedIndex) {
  const next = new Set();
  selectedPrintIndexes.forEach(i => {
    if (i < deletedIndex) next.add(i);
    if (i > deletedIndex) next.add(i - 1);
  });
  selectedPrintIndexes = next;
}

function selectAllLabels() {
  selectedPrintIndexes = new Set(project.records.map((_, i) => i));
  renderRecords();
}

function selectNoLabels() {
  selectedPrintIndexes = new Set();
  renderRecords();
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatMtn(value) {
  const d = onlyDigits(value);
  if (d.length === 10) return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
  return String(value || "").trim();
}

function applyScan() {
  const raw = $("quickScan").value.trim();
  if (!raw) return;
  const cleaned = raw.replace(/\s+/g, "");
  const digits = onlyDigits(cleaned);

  if (/^T\d{5,}$/i.test(cleaned)) {
    $("assetTag").value = cleaned.toUpperCase();
  } else if (digits.length === 15) {
    $("imei").value = digits;
  } else if (digits.length >= 18 && digits.length <= 22 && digits.startsWith("89")) {
    $("iccid").value = digits;
  } else if (digits.length === 10) {
    $("mtn").value = formatMtn(digits);
  } else {
    const model = $("model").value.trim();
    $("model").value = model ? `${model} ${raw}` : raw;
  }

  $("quickScan").value = "";
  $("formMessage").textContent = `Applied scan: ${raw}`;
}

async function createProject() {
  project = {
    app: "Cellular Device Intake and Recycle",
    version: 4,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    records: []
  };
  selectedPrintIndexes = new Set();
  fileHandle = null;
  renderRecords();
  clearForm();
  clearPreview();

  if (window.showSaveFilePicker) {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: `CDIR_Project_${todayISO()}_capture_data.json`,
      types: [{ description: "JSON Project File", accept: { "application/json": [".json"] } }]
    });
    await saveProject(true);
  } else {
    downloadJson();
    updateStatus("Browser file save picker not available. Use JSON download/upload fallback.");
  }
}

async function openProject() {
  if (window.showOpenFilePicker) {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: "JSON Project File", accept: { "application/json": [".json"] } }],
      multiple: false
    });
    fileHandle = handle;
    const file = await handle.getFile();
    const text = await file.text();
    project = JSON.parse(text);
    if (!Array.isArray(project.records)) project.records = [];
    selectedPrintIndexes = new Set(project.records.map((_, i) => i));
    renderRecords();
    clearPreview();
    updateStatus(`Open: ${file.name}`);
  } else {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const text = await file.text();
      project = JSON.parse(text);
      if (!Array.isArray(project.records)) project.records = [];
      selectedPrintIndexes = new Set(project.records.map((_, i) => i));
      renderRecords();
      clearPreview();
      updateStatus(`Loaded: ${file.name}. Use Download JSON Backup to save changes.`);
    };
    input.click();
  }
}

async function saveProject(showAlert = true) {
  project.updated = new Date().toISOString();

  if (fileHandle && window.showSaveFilePicker) {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(project, null, 2));
    await writable.close();
    updateStatus("Saved project file");
    if (showAlert) $("formMessage").textContent = "Project saved.";
  } else {
    updateStatus("No writable project file selected");
    if (showAlert) $("formMessage").textContent = "No project file selected. Use Create/Open Project or download a JSON backup.";
  }
}

function downloadJson() {
  const name = `CDIR_Project_${todayISO()}_capture_data.json`;
  downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }), name);
}

function updateStatus(text) {
  $("saveStatus").textContent = text;
}

function getSelectedRecords() {
  return Array.from(selectedPrintIndexes)
    .sort((a, b) => a - b)
    .map(i => project.records[i])
    .filter(Boolean);
}

function labelIsSmall() {
  return $("labelSize")?.value === "address-standard";
}


function combineValues(left, right, sep = " — ") {
  const a = String(left || "").trim();
  const b = String(right || "").trim();
  if (a && b) return `${a}${sep}${b}`;
  return a || b;
}

function labelHtml(record, printClass = "") {
  const title = $("labelTitle")?.value?.trim() || "CELLULAR DEVICE RECYCLE";
  const typeModel = combineValues(record.typeOfDevice || record.deviceGroup, record.model);
  const userDept = combineValues(record.userName, record.department);
  const mtnAsset = combineValues(record.mtn, record.assetTag);
  return `
    <section class="${printClass}">
      <div class="labelTitle">${esc(title)}</div>
      <div class="rule"></div>
      ${labelLine("TYPE / MODEL", typeModel)}
      ${labelLine("USER / DEPT", userDept)}
      ${labelLine("IMEI", record.imei)}
      ${labelLine("ICCID", record.iccid)}
      ${labelLine("MTN / ASSET", mtnAsset)}
      ${labelLine("DATE", record.date)}
    </section>
  `;
}

function labelLine(label, value) {
  if (!value) return "";
  return `<div class="labelLine"><span>${esc(label)}:</span> ${esc(value)}</div>`;
}

function previewSelectedLabels() {
  const rows = getSelectedRecords();
  if (!rows.length) {
    alert("No records selected for label preview.");
    return;
  }
  previewLabels(rows);
}

function previewLabels(records) {
  const small = labelIsSmall();
  $("labelPreviewScreen").innerHTML = records.map(r =>
    labelHtml(r, `screenLabel${small ? " small" : ""}`)
  ).join("");
}

function clearPreview() {
  $("labelPreviewScreen").innerHTML = '<p class="hint">No label preview yet. Select records and click Preview Selected Labels.</p>';
  $("printArea").innerHTML = "";
}

function printSelectedLabels() {
  const rows = getSelectedRecords();
  if (!rows.length) {
    alert("No records selected for label printing.");
    return;
  }
  printLabels(rows);
}

function printAllLabels() {
  if (!project.records.length) {
    alert("No records to print.");
    return;
  }
  printLabels(project.records);
}

function printLabels(records) {
  document.body.classList.remove("print-large", "print-standard");
  document.body.classList.add(labelIsSmall() ? "print-standard" : "print-large");

  $("printArea").innerHTML = records.map(r => labelHtml(r, "printLabel")).join("");
  previewLabels(records);

  setTimeout(() => {
    window.print();
  }, 100);
}

function exportCsvBackup() {
  const headers = [
    ...ORIGINAL_COLUMNS,
    "DEVICE GROUP", "MTN", "ASSET TAG / T#"
  ];
  const rows = project.records.map(r => [
    r.date, r.vendor, r.qty, r.model, r.typeOfDevice, r.reason,
    r.userName, r.department, r.imei, r.iccid, r.deviceGroup, r.mtn, r.assetTag
  ]);
  const csv = [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `CDIR_${todayISO()}_backup.csv`);
}

function csvCell(value) {
  const s = String(value ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportXlsx() {
  const phoneRows = project.records
    .filter(r => (r.deviceGroup || "").toLowerCase() !== "hot spot")
    .map(toOriginalRow);

  const hotspotRows = project.records
    .filter(r => (r.deviceGroup || "").toLowerCase() === "hot spot")
    .map(toOriginalRow);

  const files = {
    "[Content_Types].xml": contentTypesXml(),
    "_rels/.rels": rootRelsXml(),
    "xl/workbook.xml": workbookXml(),
    "xl/_rels/workbook.xml.rels": workbookRelsXml(),
    "xl/styles.xml": stylesXml(),
    "xl/worksheets/sheet1.xml": sheetXml("E-CYCLE", ORIGINAL_COLUMNS, phoneRows),
    "xl/worksheets/sheet2.xml": sheetXml("E-CYCLE - HOT SPOTS", ORIGINAL_COLUMNS, hotspotRows)
  };

  const blob = zipStore(files);
  downloadBlob(blob, `CDIR_${todayISO()}_Final.xlsx`);
}

function toOriginalRow(r) {
  return [
    r.date || "",
    r.vendor || "",
    r.qty || 1,
    r.model || "",
    r.typeOfDevice || "",
    r.reason || "",
    r.userName || "",
    r.department || "",
    r.imei || "",
    r.iccid || ""
  ];
}

function clearAll() {
  if (!confirm("Clear all loaded records from the app? This does not delete your saved JSON unless you save after clearing.")) return;
  project.records = [];
  selectedPrintIndexes = new Set();
  project.updated = new Date().toISOString();
  renderRecords();
  clearPreview();
  $("formMessage").textContent = "Loaded records cleared. Save Project to write this change to the JSON file.";
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function workbookXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="E-CYCLE" sheetId="1" r:id="rId1"/>
    <sheet name="E-CYCLE - HOT SPOTS" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`;
}

function workbookRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function sheetXml(name, headers, rows) {
  const allRows = [headers, ...rows];
  const colWidths = [14, 14, 8, 30, 18, 16, 24, 22, 20, 24];
  const cols = colWidths.map((w, i) => `<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join("");
  const data = allRows.map((row, rIdx) => {
    const cells = row.map((v, cIdx) => cellXml(rIdx + 1, cIdx + 1, v, rIdx === 0)).join("");
    return `<row r="${rIdx + 1}">${cells}</row>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${cols}</cols>
  <sheetData>${data}</sheetData>
</worksheet>`;
}

function cellXml(row, col, value, header=false) {
  const ref = colName(col) + row;
  if (typeof value === "number") return `<c r="${ref}"${header ? ' s="1"' : ""}><v>${value}</v></c>`;
  return `<c r="${ref}" t="inlineStr"${header ? ' s="1"' : ""}><is><t>${xmlEsc(String(value ?? ""))}</t></is></c>`;
}

function colName(n) {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function xmlEsc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

function zipStore(fileMap) {
  const enc = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [name, content] of Object.entries(fileMap)) {
    const nameBytes = enc.encode(name);
    const data = enc.encode(content);
    const crc = crc32(data);
    const local = concatArrays([
      u32(0x04034b50), u16(20), u16(0), u16(0),
      u16(0), u16(0), u32(crc), u32(data.length), u32(data.length),
      u16(nameBytes.length), u16(0), nameBytes, data
    ]);
    localParts.push(local);

    const central = concatArrays([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0),
      u16(0), u16(0), u32(crc), u32(data.length), u32(data.length),
      u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(offset), nameBytes
    ]);
    centralParts.push(central);
    offset += local.length;
  }

  const centralStart = offset;
  const centralBlob = concatArrays(centralParts);
  const centralSize = centralBlob.length;
  const count = Object.keys(fileMap).length;

  const end = concatArrays([
    u32(0x06054b50), u16(0), u16(0), u16(count), u16(count),
    u32(centralSize), u32(centralStart), u16(0)
  ]);

  return new Blob([...localParts, centralBlob, end], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

function u16(n) {
  const a = new Uint8Array(2);
  new DataView(a.buffer).setUint16(0, n, true);
  return a;
}

function u32(n) {
  const a = new Uint8Array(4);
  new DataView(a.buffer).setUint32(0, n >>> 0, true);
  return a;
}

function concatArrays(arrays) {
  const len = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(len);
  let pos = 0;
  arrays.forEach(a => { out.set(a, pos); pos += a.length; });
  return out;
}

let crcTable = null;
function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    table[n] = c >>> 0;
  }
  return table;
}

function crc32(data) {
  if (!crcTable) crcTable = makeCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

document.addEventListener("DOMContentLoaded", () => {
  $("date").value = todayISO();
  setDefaultsForGroup();
  renderRecords();

  $("deviceGroup").addEventListener("change", setDefaultsForGroup);
  $("newProjectBtn").addEventListener("click", createProject);
  $("openProjectBtn").addEventListener("click", openProject);
  $("saveProjectBtn").addEventListener("click", () => saveProject(true));
  $("downloadJsonBtn").addEventListener("click", downloadJson);
  $("applyScanBtn").addEventListener("click", applyScan);
  $("quickScan").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyScan();
    }
  });
  $("addBtn").addEventListener("click", addRecord);
  $("clearBtn").addEventListener("click", clearForm);
  $("selectAllBtn").addEventListener("click", selectAllLabels);
  $("selectNoneBtn").addEventListener("click", selectNoLabels);
  $("previewSelectedBtn").addEventListener("click", previewSelectedLabels);
  $("printSelectedBtn").addEventListener("click", printSelectedLabels);
  $("printAllBtn").addEventListener("click", printAllLabels);
  $("clearPreviewBtn").addEventListener("click", clearPreview);
  $("exportXlsxBtn").addEventListener("click", exportXlsx);
  $("exportCsvBtn").addEventListener("click", exportCsvBackup);
  $("clearAllBtn").addEventListener("click", clearAll);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }

  updateStatus(window.showSaveFilePicker
    ? "Ready. Create or open a project file."
    : "Ready. Browser may require JSON download/upload fallback.");
});
