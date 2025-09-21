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

// Auto-load from backend endpoints if dostępne
async function autoLoadRemote(){
  // load products and orders via API (if serwer udostępnia)
  try {
    const r1 = await fetch('api/products.php');
    if(r1.ok){ const json = await r1.json(); Storage.set('products', json); }
  } catch(e){ /* ignore */ }
  try {
    const r2 = await fetch('api/orders.php');
    if(r2.ok){ const json = await r2.json(); Storage.set('orders', json); }
  } catch(e){ /* ignore */ }
}
document.addEventListener('DOMContentLoaded', ()=> { autoLoadRemote(); });
