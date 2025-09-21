document.addEventListener('DOMContentLoaded', async ()=>{
  // load orders (initial)
  let orders = Storage.get('orders', null);
  if(!orders){
    // try to fetch /data/orders.csv
    try{
      const res = await fetch('data/orders.csv');
      if(res.ok){
        const txt = await res.text();
        orders = csvParse(txt);
        Storage.set('orders', orders);
      } else orders = [];
    } catch(e){ orders = []; }
  }

  let scans = Storage.get('scans', []);
  const input = document.getElementById('scannerInput');
  const scanBtn = document.getElementById('scanBtn');
  const generateBtn = document.getElementById('generateBtn');
  const scanList = document.getElementById('scanList');
  const noHistory = document.getElementById('noHistory');
  const barcodeSvg = document.getElementById('barcode');
  const barcodeValue = document.getElementById('barcodeValue');

  function renderHistory(){
    scanList.innerHTML = '';
    if(!scans.length){ noHistory.style.display='block'; return; }
    noHistory.style.display='none';
    scans.slice().reverse().forEach(s=>{
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${s.order_id}</strong> — ${s.product_sku || ''} <div class="muted">${humanTime(s.ts)}</div></div>
                      <div><button class="btn small ghost" data-id="${s.id}">Видалити</button></div>`;
      scanList.appendChild(li);
    });
  }

  function addScan(obj){
    obj.id = 's' + Date.now() + Math.floor(Math.random()*1000);
    obj.ts = Date.now();
    scans.push(obj);
    Storage.set('scans', scans);
    renderHistory();
  }

  scanBtn.addEventListener('click', ()=>{
    const v = input.value.trim();
    if(!v) return alert('Введіть номер замовлення');
    // знайти замовлення
    const order = orders.find(o => (o.order_number||'').toLowerCase()===v.toLowerCase() || (o.order_id||'')===v);
    const obj = {order_id: order ? order.order_number || order.order_id : v, product_sku: order ? order.sku || '' : '', note:''};
    addScan(obj);
    generateBarcodeFor(obj.order_id);
    input.value='';
  });

  // scan by Enter (keyboard scanner emulation)
  input.addEventListener('keydown', (e)=>{
    if(e.key==='Enter') scanBtn.click();
  });

  // generate barcode from input
  generateBtn.addEventListener('click', ()=>{
    const v = input.value.trim();
    if(!v) return alert('Введіть номер замовлення для генерації штрихкоду');
    generateBarcodeFor(v);
  });

  function generateBarcodeFor(value){
    // Use JsBarcode to render code
    barcodeValue.textContent = value;
    try{
      JsBarcode(barcodeSvg, String(value), {format: "CODE128", width:2, height:60, displayValue:false});
    } catch(e){
      // fallback: show text
      barcodeSvg.innerHTML = '';
      barcodeValue.textContent = value;
    }
  }

  // history actions: delete, export, clear
  scanList.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-id]');
    if(!btn) return;
    const id = btn.dataset.id;
    scans = scans.filter(s=> s.id !== id);
    Storage.set('scans', scans);
    renderHistory();
  });

  document.getElementById('clearHist').addEventListener('click', ()=>{
    if(!confirm('Очистити історію сканування?')) return;
    scans = [];
    Storage.set('scans', scans);
    renderHistory();
  });

  document.getElementById('exportHist').addEventListener('click', ()=>{
    if(!scans.length) return alert('Немає даних для експорту');
    const csv = csvStringify(scans);
    downloadFile('scan_history.csv', csv);
  });

  // tabs
  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click', ()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(tc=>tc.classList.add('hidden'));
      document.getElementById(t.dataset.tab).classList.remove('hidden');
    });
  });

  // rules save
  document.getElementById('saveRules').addEventListener('click', ()=>{
    const prefix = document.getElementById('rulePrefix').value.trim();
    Storage.set('scan_rules', {prefix});
    alert('Правило збережено (локально)');
  });
  document.getElementById('resetRules').addEventListener('click', ()=>{
    Storage.set('scan_rules', {});
    document.getElementById('rulePrefix').value='';
    alert('Правила скинуті');
  });

  renderHistory();
});
