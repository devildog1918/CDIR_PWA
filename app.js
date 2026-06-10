/* CDIR v15 clean build */

const ORIGINAL_COLUMNS = [
  "DATE", "VENDOR", "QTY", "MODEL", "TYPE OF DEVICE",
  "REASON", "USER NAME", "DEPARTMENT", "IMEI", "ICCID"
];

let project = {
  app: "Cellular Device Intake and Recycle",
  version: 15,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  records: []
};

let fileHandle = null;
let selected = new Set();

const $ = id => document.getElementById(id);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function init() {
  $("date").value = todayISO();
  setDefaultsForGroup();
  applyLabelSize();
  renderRecords();

  $("deviceGroup").addEventListener("change", setDefaultsForGroup);
  $("labelSize").addEventListener("change", applyLabelSize);
  $("labelDensity").addEventListener("change", () => previewRecords(getCurrentPreviewRecords()));

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

  $("selectAllBtn").addEventListener("click", selectAll);
  $("selectNoneBtn").addEventListener("click", selectNone);

  $("previewSelectedBtn").addEventListener("click", previewSelected);
  $("printSelectedBtn").addEventListener("click", printSelected);
  $("printAllBtn").addEventListener("click", printAll);
  $("previewSelectedQrBtn").addEventListener("click", previewSelectedQr);
  $("printSelectedQrBtn").addEventListener("click", printSelectedQr);
  $("printAllQrBtn").addEventListener("click", printAllQr);
  $("clearPreviewBtn").addEventListener("click", clearPreview);

  $("exportXlsxBtn").addEventListener("click", exportXlsx);
  $("exportCsvBtn").addEventListener("click", exportCsvBackup);
  $("clearAllBtn").addEventListener("click", clearAll);

  // Old versions used service workers. Remove them to stop stale app.js behavior.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(regs => regs.forEach(reg => reg.unregister()))
      .catch(() => {});
  }

  updateStatus("Ready. Create or open a project file.");
}

function setDefaultsForGroup() {
  const group = $("deviceGroup").value;
  $("typeOfDevice").value = group === "Hot Spot" ? "Hot Spot" : "Cell Phone";
}

function applyLabelSize() {
  document.body.classList.remove("label-large", "label-standard");
  document.body.classList.add($("labelSize").value === "standard" ? "label-standard" : "label-large");
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
    imei: digitsOnly($("imei").value),
    iccid: digitsOnly($("iccid").value),
    mtn: formatMtn($("mtn").value),
    assetTag: $("assetTag").value.trim().toUpperCase()
  };
}

function loadRecordToForm(r) {
  $("deviceGroup").value = r.deviceGroup || "Phone";
  $("date").value = r.date || todayISO();
  $("vendor").value = r.vendor || "e-Cycle";
  $("qty").value = r.qty || 1;
  $("model").value = r.model || "";
  $("typeOfDevice").value = r.typeOfDevice || "";
  $("reason").value = r.reason || "Recycle";
  $("userName").value = r.userName || "";
  $("department").value = r.department || "";
  $("imei").value = r.imei || "";
  $("iccid").value = r.iccid || "";
  $("mtn").value = r.mtn || "";
  $("assetTag").value = r.assetTag || "";
}

function clearForm() {
  const keepGroup = $("deviceGroup").value;
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
  $("deviceGroup").value = keepGroup;
  setDefaultsForGroup();
  $("quickScan").focus();
}

async function addRecord() {
  const r = formRecord();
  ensureCdirId(r);
  const warnings = validate(r);
  project.records.push(r);
  selected.add(project.records.length - 1);
  project.updated = new Date().toISOString();

  renderRecords();
  await saveProject(false);

  $("formMessage").textContent = warnings.length
    ? "Added with warning: " + warnings.join("; ")
    : "Device added.";
  clearForm();
}

function validate(r) {
  const warnings = [];
  if (!r.model) warnings.push("Model blank");
  if (!r.imei) warnings.push("IMEI blank");
  if (r.imei && r.imei.length !== 15) warnings.push("IMEI should be 15 digits");
  if (r.iccid && !r.iccid.startsWith("89")) warnings.push("ICCID usually starts with 89");
  return warnings;
}

function renderRecords() {
  const tbody = $("recordsTable").querySelector("tbody");
  tbody.innerHTML = "";

  project.records.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="printCheck" type="checkbox" data-select="${i}" ${selected.has(i) ? "checked" : ""}></td>
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
        <button class="secondary" data-print="${i}">Print</button>
        <button class="secondary" data-edit="${i}">Edit</button>
        <button class="danger" data-delete="${i}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-select]").forEach(cb => {
    cb.addEventListener("change", () => {
      const i = Number(cb.dataset.select);
      cb.checked ? selected.add(i) : selected.delete(i);
    });
  });

  tbody.querySelectorAll("[data-preview]").forEach(btn => {
    btn.addEventListener("click", () => previewRecords([project.records[Number(btn.dataset.preview)]]));
  });

  tbody.querySelectorAll("[data-print]").forEach(btn => {
    btn.addEventListener("click", () => printRecords([project.records[Number(btn.dataset.print)]]));
  });

  tbody.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => editRecord(Number(btn.dataset.edit)));
  });

  tbody.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => deleteRecord(Number(btn.dataset.delete)));
  });

  $("counter").textContent = `${project.records.length} record${project.records.length === 1 ? "" : "s"}`;
}

function selectAll() {
  selected = new Set(project.records.map((_, i) => i));
  renderRecords();
}

function selectNone() {
  selected = new Set();
  renderRecords();
}

function getSelectedRecords() {
  return [...selected].sort((a,b) => a-b).map(i => project.records[i]).filter(Boolean);
}

function getCurrentPreviewRecords() {
  const labels = Array.from(document.querySelectorAll("#labelPreview .deviceLabel"));
  if (!labels.length) return [];
  return getSelectedRecords();
}

function previewSelected() {
  const rows = getSelectedRecords();
  if (!rows.length) {
    alert("No records selected.");
    return;
  }
  previewRecords(rows);
}

function printSelected() {
  const rows = getSelectedRecords();
  if (!rows.length) {
    alert("No records selected.");
    return;
  }
  printRecords(rows);
}

function printAll() {
  if (!project.records.length) {
    alert("No records to print.");
    return;
  }
  printRecords(project.records);
}

function previewRecords(records) {
  applyLabelSize();
  $("labelPreview").innerHTML = records.map(labelHtml).join("");
  requestAnimationFrame(() => autofitLabels());
}

function printRecords(records) {
  previewRecords(records);
  setTimeout(() => {
    autofitLabels();
    window.print();
  }, 250);
}


function autofitLabels() {
  const labels = Array.from(document.querySelectorAll("#labelPreview .deviceLabel"));

  labels.forEach(label => {
    const top = label.querySelector(".labelTop");
    const rows = Array.from(label.querySelectorAll(".labelDataRow"));
    const bottom = label.querySelector(".labelBottom");

    let sizes = {
      top: 9.8,
      model: 8.7,
      user: 8.8,
      imei: 9.4,
      iccid: 8.7,
      bottom: 8.4
    };

    const minimums = {
      top: 7.2,
      model: 6.8,
      user: 6.8,
      imei: 8.0,
      iccid: 7.4,
      bottom: 7.2
    };

    function apply() {
      top.style.fontSize = sizes.top + "pt";
      if (rows[0]) rows[0].style.fontSize = sizes.model + "pt";
      if (rows[1]) rows[1].style.fontSize = sizes.user + "pt";
      if (rows[2]) rows[2].style.fontSize = sizes.imei + "pt";
      if (rows[3]) rows[3].style.fontSize = sizes.iccid + "pt";
      bottom.style.fontSize = sizes.bottom + "pt";
    }

    apply();

    // Fit horizontal content per row without shrinking critical rows unless needed.
    fitElement(top, "top");
    if (rows[0]) fitElement(rows[0], "model");
    if (rows[1]) fitElement(rows[1], "user");
    if (rows[2]) fitElement(rows[2], "imei");
    if (rows[3]) fitElement(rows[3], "iccid");
    fitElement(bottom, "bottom");

    // If vertical overflow remains, shrink non-critical rows first.
    let guard = 0;
    while (guard < 80 && label.scrollHeight > label.clientHeight + 1) {
      if (sizes.top > minimums.top) sizes.top -= 0.15;
      else if (sizes.model > minimums.model) sizes.model -= 0.15;
      else if (sizes.user > minimums.user) sizes.user -= 0.15;
      else if (sizes.bottom > minimums.bottom) sizes.bottom -= 0.15;
      else if (sizes.iccid > minimums.iccid) sizes.iccid -= 0.10;
      else if (sizes.imei > minimums.imei) sizes.imei -= 0.10;
      apply();
      guard++;
    }

    function fitElement(el, key) {
      let attempts = 0;
      while (attempts < 80 && el.scrollWidth > el.clientWidth + 1 && sizes[key] > minimums[key]) {
        sizes[key] -= 0.15;
        apply();
        attempts++;
      }
    }
  });
}


function clearPreview() {
  $("labelPreview").innerHTML = '<p class="hint">No preview yet. Select records and click Preview Selected Labels.</p>';
}

function labelHtml(r) {
  const title = ($("labelTitle").value.trim() || "RECYCLE").toUpperCase();
  const group = (r.typeOfDevice || r.deviceGroup || "").toUpperCase();
  const bottom = [r.mtn, r.assetTag, shortDate(r.date)].filter(Boolean).join("   ");

  return `
    <section class="deviceLabel" data-autofit="1">
      <div class="labelTop">
        <div class="labelTopLeft">${esc(title)}</div>
        <div class="labelTopRight">${esc(group)}</div>
      </div>
      ${dataRow("MODEL", r.model)}
      ${dataRow("USER", r.userName)}
      ${dataRow("IMEI", r.imei)}
      ${dataRow("ICCID", r.iccid)}
      <div class="labelBottom">${esc(bottom)}</div>
    </section>
  `;
}

function dataRow(label, value) {
  return `<div class="labelDataRow"><span class="key">${esc(label)}:</span> ${esc(value || "")}</div>`;
}

function shortDate(value) {
  if (!value) return "";
  const text = String(value).trim();
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[2]}/${m[3]}/${m[1].slice(2)}`;
  return text;
}


function dataRow(label, value) {
  return `<div class="labelDataRow"><span class="key">${esc(label)}:</span> ${esc(value || "")}</div>`;
}




function editRecord(i) {
  const r = project.records[i];
  if (!r) return;
  loadRecordToForm(r);
  project.records.splice(i, 1);
  normalizeSelected(i);
  renderRecords();
  saveProject(false);
  $("formMessage").textContent = "Loaded record for editing. Click Add Device to save it back.";
}

async function deleteRecord(i) {
  if (!confirm("Delete this record?")) return;
  project.records.splice(i, 1);
  normalizeSelected(i);
  project.updated = new Date().toISOString();
  renderRecords();
  await saveProject(false);
}

function normalizeSelected(deletedIndex) {
  const next = new Set();
  selected.forEach(i => {
    if (i < deletedIndex) next.add(i);
    if (i > deletedIndex) next.add(i - 1);
  });
  selected = next;
}

function applyScan() {
  const raw = $("quickScan").value.trim();
  if (!raw) return;

  const cleaned = raw.replace(/\s+/g, "");
  const digits = digitsOnly(cleaned);

  if (/^T\d{5,}$/i.test(cleaned)) {
    $("assetTag").value = cleaned.toUpperCase();
  } else if (digits.length === 15) {
    $("imei").value = digits;
  } else if (digits.length >= 18 && digits.length <= 22 && digits.startsWith("89")) {
    $("iccid").value = digits;
  } else if (digits.length === 10) {
    $("mtn").value = formatMtn(digits);
  } else {
    $("model").value = $("model").value ? `${$("model").value} ${raw}` : raw;
  }

  $("quickScan").value = "";
  $("formMessage").textContent = `Applied scan: ${raw}`;
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatMtn(value) {
  const d = digitsOnly(value);
  return d.length === 10 ? `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}` : String(value || "").trim();
}

async function createProject() {
  project = {
    app: "Cellular Device Intake and Recycle",
    version: 15,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    records: [],
    nextCdirNumber: 1
  };
  selected = new Set();
  fileHandle = null;
  renderRecords();
  clearPreview();
  clearForm();

  if (window.showSaveFilePicker) {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: `CDIR_Project_${todayISO()}_capture_data.json`,
      types: [{ description: "JSON Project File", accept: { "application/json": [".json"] } }]
    });
    await saveProject(true);
  } else {
    downloadJson();
    updateStatus("File picker unavailable. Use JSON download backup.");
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
    assignMissingCdirIds();
    selected = new Set(project.records.map((_, i) => i));
    renderRecords();
    clearPreview();
    updateStatus(`Open: ${file.name}`);
  } else {
    alert("Open file picker unavailable in this browser. Use Chrome or Edge.");
  }
}

async function saveProject(showMessage = true) {
  project.updated = new Date().toISOString();

  if (fileHandle && window.showSaveFilePicker) {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(project, null, 2));
    await writable.close();
    updateStatus("Saved project file");
    if (showMessage) $("formMessage").textContent = "Project saved.";
  } else {
    updateStatus("No writable project file selected");
    if (showMessage) $("formMessage").textContent = "No project file selected.";
  }
}

function downloadJson() {
  downloadBlob(
    new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }),
    `CDIR_Project_${todayISO()}_capture_data.json`
  );
}

function updateStatus(text) {
  $("saveStatus").textContent = text;
}



function ensureCdirId(record) {
  if (record.cdirId) return record.cdirId;

  if (!project.nextCdirNumber || project.nextCdirNumber < 1) {
    project.nextCdirNumber = nextCdirNumberFromRecords();
  }

  record.cdirId = "CDIR-" + String(project.nextCdirNumber).padStart(6, "0");
  project.nextCdirNumber += 1;
  return record.cdirId;
}

function assignMissingCdirIds() {
  if (!Array.isArray(project.records)) return;
  if (!project.nextCdirNumber || project.nextCdirNumber < 1) {
    project.nextCdirNumber = nextCdirNumberFromRecords();
  }

  project.records.forEach(record => ensureCdirId(record));
}

function nextCdirNumberFromRecords() {
  let max = 0;
  (project.records || []).forEach(record => {
    const match = String(record.cdirId || "").match(/^CDIR-(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  });
  return max + 1;
}

function previewSelectedQr() {
  const rows = getSelectedRecords();
  if (!rows.length) {
    alert("No records selected.");
    return;
  }
  previewQrRecords(rows);
}

function printSelectedQr() {
  const rows = getSelectedRecords();
  if (!rows.length) {
    alert("No records selected.");
    return;
  }
  printQrRecords(rows);
}

function printAllQr() {
  if (!project.records.length) {
    alert("No records to print.");
    return;
  }
  printQrRecords(project.records);
}

function printQrRecords(records) {
  previewQrRecords(records);
  setTimeout(() => window.print(), 500);
}

function previewQrRecords(records) {
  records.forEach(record => ensureCdirId(record));
  project.updated = new Date().toISOString();
  saveProject(false);
  $("labelPreview").innerHTML = records.map(qrOnlyLabelHtml).join("");
  renderRealQrCodes();
}

function qrOnlyLabelHtml(r) {
  const group = (r.typeOfDevice || r.deviceGroup || "").toUpperCase();
  const bottom = [r.mtn, r.assetTag, shortDate(r.date)].filter(Boolean).join("   ");
  const id = ensureCdirId(r);
  const qrSvg = ""; // QR is rendered by renderRealQrCodes into .qrOnlyBox

  return `
    <section class="qrOnlyLabel">
      <div class="qrOnlyBox" data-qr="${escAttr(id)}"></div>
      <div class="qrOnlyText">
        <div class="qrOnlyTitle"><span>QR RECORD</span><span>${esc(group)}</span></div>
        <div class="qrOnlyId">${esc(id)}</div>
        <div class="qrOnlyLine">MODEL: ${esc(r.model || "")}</div>
        <div class="qrOnlyLine">IMEI: ${esc(r.imei || "")}</div>
        <div class="qrOnlyLine">${esc(bottom)}</div>
      </div>
    </section>
  `;
}


function qrPayload(r) {
  return ensureCdirId(r);
}

function renderRealQrCodes() {
  if (typeof QRCode === "undefined") {
    alert("QR library did not load. Confirm qrcode.min.js is uploaded with the app files.");
    return;
  }

  document.querySelectorAll(".qrOnlyBox[data-qr]").forEach(box => {
    const text = box.getAttribute("data-qr") || "";
    box.innerHTML = "";
    new QRCode(box, {
      text: text,
      width: 260,
      height: 260,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.L
    });
  });
}

function escAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


function exportCsvBackup() {
  const headers = [...ORIGINAL_COLUMNS, "DEVICE GROUP", "MTN", "ASSET TAG / T#"];
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
    "xl/worksheets/sheet1.xml": sheetXml(ORIGINAL_COLUMNS, phoneRows),
    "xl/worksheets/sheet2.xml": sheetXml(ORIGINAL_COLUMNS, hotspotRows)
  };

  downloadBlob(zipStore(files), `CDIR_${todayISO()}_Final.xlsx`);
}

function toOriginalRow(r) {
  return [r.date || "", r.vendor || "", r.qty || 1, r.model || "", r.typeOfDevice || "", r.reason || "", r.userName || "", r.department || "", r.imei || "", r.iccid || ""];
}

function clearAll() {
  if (!confirm("Clear all loaded records? This does not delete the saved JSON unless you save after clearing.")) return;
  project.records = [];
  selected = new Set();
  renderRecords();
  clearPreview();
  $("formMessage").textContent = "Records cleared.";
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
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

/* Minimal XLSX generator */
function contentTypesXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;}
function rootRelsXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;}
function workbookXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="E-CYCLE" sheetId="1" r:id="rId1"/><sheet name="E-CYCLE - HOT SPOTS" sheetId="2" r:id="rId2"/></sheets></workbook>`;}
function workbookRelsXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;}
function stylesXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;}

function sheetXml(headers, rows) {
  const allRows = [headers, ...rows];
  const data = allRows.map((row, ri) => `<row r="${ri+1}">${row.map((v, ci) => cellXml(ri+1, ci+1, v, ri===0)).join("")}</row>`).join("");
  const widths = [14,14,8,30,18,16,24,22,20,24].map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${widths}</cols><sheetData>${data}</sheetData></worksheet>`;
}

function cellXml(row, col, value, header=false) {
  const ref = colName(col) + row;
  if (typeof value === "number") return `<c r="${ref}"${header ? ' s="1"' : ""}><v>${value}</v></c>`;
  return `<c r="${ref}" t="inlineStr"${header ? ' s="1"' : ""}><is><t>${xmlEsc(String(value ?? ""))}</t></is></c>`;
}

function colName(n){let s="";while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26);}return s;}
function xmlEsc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

function zipStore(fileMap) {
  const enc = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [name, content] of Object.entries(fileMap)) {
    const nameBytes = enc.encode(name);
    const data = enc.encode(content);
    const crc = crc32(data);
    const local = concatArrays([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),nameBytes,data]);
    localParts.push(local);
    const central = concatArrays([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nameBytes]);
    centralParts.push(central);
    offset += local.length;
  }

  const centralStart = offset;
  const centralBlob = concatArrays(centralParts);
  const end = concatArrays([u32(0x06054b50),u16(0),u16(0),u16(Object.keys(fileMap).length),u16(Object.keys(fileMap).length),u32(centralBlob.length),u32(centralStart),u16(0)]);
  return new Blob([...localParts, centralBlob, end], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function u16(n){const a=new Uint8Array(2);new DataView(a.buffer).setUint16(0,n,true);return a;}
function u32(n){const a=new Uint8Array(4);new DataView(a.buffer).setUint32(0,n>>>0,true);return a;}
function concatArrays(arrays){const len=arrays.reduce((sum,a)=>sum+a.length,0);const out=new Uint8Array(len);let pos=0;arrays.forEach(a=>{out.set(a,pos);pos+=a.length;});return out;}

let crcTable = null;
function makeCrcTable(){const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=((c&1)?(0xedb88320^(c>>>1)):(c>>>1));table[n]=c>>>0;}return table;}
function crc32(data){if(!crcTable)crcTable=makeCrcTable();let c=0xffffffff;for(let i=0;i<data.length;i++)c=crcTable[(c^data[i])&0xff]^(c>>>8);return(c^0xffffffff)>>>0;}

document.addEventListener("DOMContentLoaded", init);
