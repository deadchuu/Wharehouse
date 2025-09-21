// scan_flow.js
document.addEventListener('DOMContentLoaded', async ()=>{
  // expects query param picklist_id and optional operator
  function q(name){ const p = new URLSearchParams(location.search); return p.get(name); }
  const picklistId = q('picklist_id');
  const operator = q('operator') || localStorage.getItem('session') ? (JSON.parse(localStorage.getItem('session')||'{}').username || '') : '';

  if(!picklistId) {
    alert('Brak picklist_id w URL. Wróć do panelu i wybierz listę.');
    window.location.href = 'dashboard.html';
    return;
  }

  // load picklist details from backend
  const plRes = await fetch('api/picklists.php?id=' + encodeURIComponent(picklistId));
  if(!plRes.ok){ alert('Nie można pobrać picklist.'); window.location.href='dashboard.html'; return; }
  const pl = await plRes.json();

  document.getElementById('plName').textContent = `Picklist: ${pl.name} (${pl.id})`;
  document.getElementById('plMeta').textContent = `Operator: ${pl.operator || '-'} · Utworzono: ${pl.created_at || '-'}`;

  // prepare orders list (items from pl.items)
  let items = pl.items || [];
  // Convert item skus to array for easier matching
  items = items.map(it => {
    it.skuList = (it.skus || '').split('|').filter(Boolean);
    it.assigned = !!it.bin_number;
    return it;
  });

  const plOrders = document.getElementById('plOrders');
  function renderOrders(){
    plOrders.innerHTML = '';
    items.forEach(it=>{
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${it.order_id}</strong> <div class="small muted">${it.skus} · qty:${it.qty} · status:${it.status} ${it.bin_number?('· bin:'+it.bin_number):''}</div></div>
                      <div>${it.assigned ? '<span class="muted">Przypisane</span>' : '<button class="btn outline small" data-order="'+it.order_id+'">Man. przypisz</button>'}</div>`;
      plOrders.appendChild(li);
    });
  }

  renderOrders();

  // picking controls
  const binStartInput = document.getElementById('binStart');
  const binEndInput = document.getElementById('binEnd');
  const startBtn = document.getElementById('startPicking');
  const pickingArea = document.getElementById('pickingArea');
  const currentBinEl = document.getElementById('currentBin');
  const scanInput = document.getElementById('scanInput');
  const confirmBinBtn = document.getElementById('confirmBinBtn');
  const nextBinBtn = document.getElementById('nextBinBtn');
  const operatorName = document.getElementById('operatorName');

  operatorName.textContent = operator || pl.operator || '—';

  let binStart = null, binEnd = null, currentBin = null;

  startBtn.addEventListener('click', ()=>{
    binStart = parseInt(binStartInput.value,10);
    binEnd = parseInt(binEndInput.value,10);
    if(isNaN(binStart) || isNaN(binEnd) || binStart > binEnd){ alert('Niepoprawny zakres binów'); return; }
    currentBin = binStart;
    currentBinEl.textContent = currentBin;
    pickingArea.classList.remove('hidden');
    binStartInput.disabled = binEndInput.disabled = startBtn.disabled = true;
    scanInput.focus();
  });

  // helper to save assignment to backend (updates picklist_items.csv bin_number and writes scan entry)
  async function assignOrderToBin(order_id, sku){
    // find item in items
    const it = items.find(x=> x.order_id === order_id);
    if(!it) return false;
    it.bin_number = currentBin;
    it.assigned = true;
    it.scanned_count = (parseInt(it.scanned_count||0,10) + 1);
    // write update to backend: simple approach => rewrite picklist_items.csv: we'll POST small update endpoint?
    // but we already have api/scan.php that increments scanned_count. Use that to record scan and update.
    try{
      const payload = { picklist_id: picklistId, order_code: it.order_code, order_id: it.order_id, sku: sku, user: operatorName.textContent || 'unknown', bin_number: currentBin, action: 'assign' };
      const res = await fetch('api/scan.php', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const json = await res.json();
      if(json.success) {
        renderOrders();
        return true;
      } else {
        alert('Błąd zapisu: ' + (json.message || ''));
        return false;
      }
    } catch(e){
      alert('Błąd sieci podczas zapisu skanu');
      return false;
    }
  }

  // when scanning SKU:
  scanInput.addEventListener('keydown', async (e)=>{
    if(e.key !== 'Enter') return;
    const value = scanInput.value.trim();
    if(!value) return;
    const sku = value;
    // find first order in items which contains this sku and not assigned fully
    const candidate = items.find(it => (it.skuList.includes(sku) || (it.skus||'').includes(sku)) && !it.assigned);
    if(!candidate){
      alert('Nie znaleziono zamówienia zawierającego ten SKU lub już przypisane.');
      scanInput.value=''; scanInput.focus(); return;
    }
    // Now show modal to confirm bin number — expected currentBin
    showModal(`Potwierdź numer skrzyni: ${currentBin}`, `Wprowadź numer skrzyni ${currentBin} aby przypisać zamówienie ${candidate.order_id}`, async (val)=>{
      if(String(val) !== String(currentBin)){ alert('Numer skrzyni niezgodny'); return false; }
      // assign
      const ok = await assignOrderToBin(candidate.order_id, sku);
      if(ok){
        // increment bin? keep same bin until operator scans bin number manually or presses next
        // spec: after each assign, operator scans bin number and may continue — we'll keep same bin until operator confirms bin close with modal
        alert('Przypisano zamówienie ' + candidate.order_id + ' do skrzyni ' + currentBin);
      }
      scanInput.value=''; scanInput.focus();
      return true;
    });
  });

  // confirm bin manually button (also acts as closing bin)
  confirmBinBtn.addEventListener('click', ()=> {
    showModal('Potwierdź zamknięcie skrzyni', `Wprowadź numer skrzyni ${currentBin} aby potwierdzić jej zamknięcie i przejść dalej.`, async (val)=>{
      if(String(val) !== String(currentBin)){ alert('Numer niezgodny'); return false; }
      // log closure as scan action
      try{
        const res = await fetch('api/scan.php',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ picklist_id: picklistId, order_code:'', order_id:'', sku:'', user: operatorName.textContent || 'unknown', bin_number: currentBin, action:'close_bin' })});
        const j = await res.json();
        if(j.success){
          alert('Skrzynia potwierdzona: ' + currentBin);
          if(currentBin < binEnd) { currentBin++; currentBinEl.textContent = currentBin; }
          else { alert('Koniec zakresu skrzyń'); }
          return true;
        } else { alert('Błąd: ' + (j.message||'')); return false; }
      }catch(e){ alert('Błąd sieci'); return false; }
    });
  });

  nextBinBtn.addEventListener('click', ()=>{
    if(currentBin < binEnd){ currentBin++; currentBinEl.textContent = currentBin; }
    else alert('Jesteś na końcu zakresu');
  });

  // manual assign button in orders list
  plOrders.addEventListener('click', async (e)=>{
    const btn = e.target.closest('button[data-order]');
    if(!btn) return;
    const orderId = btn.dataset.order;
    // prompt for SKU (in case multiple)
    const sku = prompt('Wprowadź SKU do przypisania (potwierdzenie bin wymagane później):');
    if(!sku) return;
    // require modal confirmation as above
    showModal(`Potwierdź numer skrzyni: ${currentBin}`, `Wprowadź numer skrzyni ${currentBin}`, async (val)=>{
      if(String(val) !== String(currentBin)){ alert('Numer skrzyni niezgodny'); return false; }
      const ok = await assignOrderToBin(orderId, sku);
      if(ok) alert('Przypisano ręcznie');
      return ok;
    });
  });

  // simple modal implementation
  const modal = document.getElementById('modal');
  const modalInput = document.getElementById('modalInput');
  document.getElementById('modalCancel').addEventListener('click', ()=> hideModal());
  document.getElementById('modalOk').addEventListener('click', ()=> {
    if(typeof modal._resolve === 'function') modal._resolve(modalInput.value.trim());
  });

  function showModal(title, text, onOk){
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').textContent = text;
    modalInput.value = '';
    modal.classList.remove('hidden');
    modalInput.focus();
    return new Promise((resolve)=>{
      modal._resolve = async (val) => {
        // call onOk validator (may be async)
        const ok = await onOk(val);
        if(ok){ hideModal(); resolve(true); } else { /* keep modal open */ }
      };
    });
  }
  function hideModal(){ modal.classList.add('hidden'); if(typeof modal._resolve === 'function') { modal._resolve = null; } }

});
