// Anrop mot Apps Script-API:t
async function api(params) {
  const u = new URL(window.HALLOWEEN.API_URL);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  u.searchParams.set('_', Date.now());
  const r = await fetch(u, { redirect: 'follow' });
  if (!r.ok) throw new Error('Servern svarade inte (' + r.status + ').');
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j;
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
