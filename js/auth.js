// Загальні утиліти: CSV parse/stringify, storage helpers
const Storage = {
  get(key, fallback=null){
    try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; }
  },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
};

function csvParse(text){
  // Простий CSV-парсер (роздільник кома, не обробляє рядки зі складними лапками)
  const lines = text.trim().split(/\r?\n/);
  if(lines.length===0) return [];
  const headers = lines[0].split(',').map(h=>h.trim());
  return lines.slice(1).map(l=>{
    const cols = l.split(',').map(c=>c.trim());
    const obj = {};
    headers.forEach((h,i)=> obj[h]=cols[i]??'');
    return obj;
  });
}

function csvStringify(arr){
  if(!arr || !arr.length) return '';
  const headers = Object.keys(arr[0]);
  const lines = [headers.join(',')];
  arr.forEach(o=>{
    const row = headers.map(h=> {
      let v = (o[h]===undefined||o[h]===null) ? '' : String(o[h]).replace(/\n/g,' ').replace(/,/g,';');
      return v;
    }).join(',');
    lines.push(row);
  });
  return lines.join('\n');
}

function downloadFile(filename, content, mime='text/csv'){
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a);
  a.click(); a.remove(); URL.revokeObjectURL(url);
}

function humanTime(ts){ const d=new Date(ts); return d.toLocaleString(); }
