// js/common.js (оновлено)
const Storage = {
  get(key, fallback=null){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
};

function csvParse(text){
  if(!text) return [];
  const lines = text.trim().split(/\r?\n/).filter(l=>l.trim());
  if(lines.length === 0) return [];
  const headers = lines[0].split(',').map(h=>h.trim());
  return lines.slice(1).map(l=>{
    const cols = l.split(',');
    const obj = {};
    headers.forEach((h,i)=> obj[h] = (cols[i] !== undefined) ? cols[i].trim() : '');
    return obj;
  });
}

function csvStringify(arr){
  if(!Array.isArray(arr) || !arr.length) return '';
  const headers = Object.keys(arr[0]);
  const lines = [headers.join(',')];
  arr.forEach(o=>{
    const row = headers.map(h=>{
      let v = (o[h] === undefined || o[h] === null) ? '' : String(o[h]);
      v = v.replace(/\n/g,' ').replace(/,/g,';');
      return v;
    }).join(',');
    lines.push(row);
  });
  return lines.join('\n');
}

function downloadFile(filename, content, mime='text/csv'){
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function humanTime(ts){ return new Date(ts).toLocaleString(); }

/* Auto-load CSV data from api endpoints (if available) OR from data/ files.
   Сторінки мають доступ до Storage.get('orders') / Storage.get('products') / Storage.get('users') */
async function autoLoadData(){
  // try API endpoints first (php backend)
  try {
    const rp = await fetch('api/products.php'); if(rp.ok){ const jp = await rp.json(); Storage.set('products', jp); }
  } catch(e){}
  try {
    const ro = await fetch('api/orders.php'); if(ro.ok){ const jo = await ro.json(); Storage.set('orders', jo); }
  } catch(e){}
  try {
    const ru = await fetch('data/users.csv'); if(ru.ok){ const txt = await ru.text(); const parsed = csvParse(txt); Storage.set('users', parsed); }
  } catch(e){}
  // fallback: attempt to load raw CSV files from /data/ if endpoints not present
  // products
  try {
    const r = await fetch('data/products.csv'); if(r.ok){ const txt = await r.text(); Storage.set('products', csvParse(txt)); }
  } catch(e){}
  try {
    const r2 = await fetch('data/orders.csv'); if(r2.ok){ const txt = await r2.text(); Storage.set('orders', csvParse(txt)); }
  } catch(e){}
}
// run auto load on DOMContentLoaded
document.addEventListener('DOMContentLoaded', ()=>{ autoLoadData(); });
