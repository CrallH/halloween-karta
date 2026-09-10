// Halloween-kartan – Google Apps Script som JSON-API
// Sheet-kolumner: Tidpunkt | Namn | Adress | Läskig | Lat | Lng | Kod
// Anropas från halloween.crall.se med ?action=list | add | remove | mine | status | adminAuth | toggleMap
//
// Admin: sätt ett Script Property "ADMIN_PASSWORD" (Project Settings → Script Properties)
// i Apps Script-projektet. Lösenordet ska INTE skrivas i koden.

const SHEET_NAME = 'Deltagare';

function doGet(e) {
  const p = (e && e.parameter) || {};
  let out;
  try {
    switch (p.action) {
      case 'add':       out = addEntry(p.name, p.address, p.scary === '1'); break;
      case 'remove':    out = removeEntry(p.code); break;
      case 'mine':      out = { entry: getMyEntry(p.code) }; break;
      case 'status':    out = { enabled: isMapEnabled_() }; break;
      case 'adminAuth': out = { ok: checkAdminPassword_(p.password) }; break;
      case 'toggleMap': out = toggleMap(p.password, p.enabled === '1'); break;
      default:          out = { entries: isMapEnabled_() ? getEntries() : [] };
    }
  } catch (err) {
    out = { error: err.message || String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['Tidpunkt', 'Namn', 'Adress', 'Läskig', 'Lat', 'Lng', 'Kod']);
  }
  if (sh.getRange(1, 7).getValue() !== 'Kod') sh.getRange(1, 7).setValue('Kod');
  return sh;
}

function getEntries() {
  const rows = getSheet_().getDataRange().getValues().slice(1);
  return rows
    .filter(r => r[4] && r[5])
    .map(r => ({
      name: String(r[1] || ''),
      address: String(r[2]),
      scary: r[3] === true || String(r[3]).toLowerCase() === 'ja',
      lat: Number(r[4]),
      lng: Number(r[5])
    }));
}

function addEntry(name, address, scary) {
  address = String(address || '').trim();
  if (!address) throw new Error('Skriv in en adress.');

  const res = Maps.newGeocoder().setRegion('se').setLanguage('sv').geocode(address);
  if (!res.results || !res.results.length) {
    throw new Error('Hittade inte adressen. Kontrollera gata och nummer.');
  }
  const hit = res.results[0];
  const loc = hit.geometry.location;
  const code = Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase().replace(/(.{4})/, '$1-');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet_().appendRow([
      new Date(), String(name || '').trim().slice(0, 60), hit.formatted_address,
      scary ? 'Ja' : 'Nej', loc.lat, loc.lng, code
    ]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true, address: hit.formatted_address, code: code };
}

function findRowByCode_(sh, code) {
  code = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length < 8) return -1;
  const codes = sh.getRange(2, 7, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
  for (let i = 0; i < codes.length; i++) {
    if (String(codes[i][0]).replace(/[^A-Z0-9]/g, '') === code) return i + 2;
  }
  return -1;
}

function getMyEntry(code) {
  const sh = getSheet_();
  const row = findRowByCode_(sh, code);
  if (row < 0) return null;
  const r = sh.getRange(row, 1, 1, 7).getValues()[0];
  return { address: String(r[2]), scary: String(r[3]).toLowerCase() === 'ja' };
}

function removeEntry(code) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_();
    const row = findRowByCode_(sh, code);
    if (row < 0) throw new Error('Hittade ingen anmälan med den koden.');
    const address = sh.getRange(row, 3).getValue();
    sh.deleteRow(row);
    return { ok: true, address: String(address) };
  } finally {
    lock.releaseLock();
  }
}

// --- Admin: på/av-knapp för kartan ---

function isMapEnabled_() {
  const v = PropertiesService.getScriptProperties().getProperty('MAP_ENABLED');
  return v !== '0'; // påslagen som standard tills den stängs av explicit
}

function checkAdminPassword_(password) {
  const adminPassword = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!adminPassword) throw new Error('Adminlösenord är inte konfigurerat i Script Properties.');
  if (password !== adminPassword) throw new Error('Fel lösenord.');
  return true;
}

function toggleMap(password, enabled) {
  checkAdminPassword_(password);
  PropertiesService.getScriptProperties().setProperty('MAP_ENABLED', enabled ? '1' : '0');
  return { ok: true, enabled: enabled };
}
