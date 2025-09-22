// js/scan_flow.js (оновлено)
document.addEventListener('DOMContentLoaded', async ()=> {
  function q(name){ const p = new URLSearchParams(location.search); return p.get(name); }
  const picklistId = q('picklist_id');
  const operator = q('operator') || (Storage.get('session') && Storage.get('session').username) || 'unknown';

  if(!picklistId){ alert('Brak picklist_id w URL'); window.location.href='dashboard.html'; return; }

  // fetch picklist from API
  const r = await fetch('api/picklists.php?id=' + encodeURIComponent(picklistId));
  if(!r.ok){ alert('Nie można pobrać picklist'); window.location.href='dashboard.html'; return; }
  const pl = await r.json();

  // UI nodes
  const plNameEl = document.getElementById('plName');
  const plMeta = document.getElementById('plMeta');
  const binStartInput = document.getElementById('binStart');
  const binEndInput = document.getElementById('binEnd');
  const startBtn = document.getElementById('startPicking');
  const pickingArea = document.getElementById('pickingArea');
  const currentBinEl = document.getElementById('currentBin');
  const scanInput = document.getElementById('scanInput');
  const plOrdersEl = document.getElementById('plOrders');
  const confirmBinBtn = document.getElementById('confirmBinBtn');
  const nextBinBtn = document.getElementById('nextBinBtn');

  plNameEl.textContent = `Picklist: ${pl.name} (${pl.id})`;
  plMeta.textContent = `Operator przypisany: ${pl.operator || '-' } · Utworzono: ${pl.created_at || '-'}`;

  // items array with useful fields
  let items = (pl.items || []).map(it=>{
    const skuList = (it.skus || '').split('|').filter(Boolean);
    return { ...it, skuList, assigned: !!it.bin_number, scanned_count: parseInt(it.scanned_count||0,10), bin_number: it.bin_number || '' };
  });

  function renderItems(){
    plOrdersEl.innerHTML = '';
    items.forEach(it => {
      const li = document.createElement('li');
      li.className = 'order-block' + (it.assigned && it.scanned_count >= (parseInt(it.qty||1,10)) ? ' complete' : '');
      li.innerHTML = `<div>
          <div style="font-weight:700">#${it.order_id}</div>
          <div class="meta small muted">${it.skus} · qty:${it.qty} · scanned:${it.scanned_count}${it.bin_number?(' · bin:'+it.bin_number):''}</div>
        </div>
        <div>
          ${it.assigned ? '<span class="badge">Bin: ' + (it.bin_number||'—') + '</span>' : '<span class="muted small">nieprzypisane</span>'}
        </div>`;
      plOrdersEl.appendChild(li);
    });
  }

  renderItems();

  // state
  let binStart = null, binEnd = null, currentBin = null;
  startBtn.addEventListener('click', ()=>{
    binStart = parseInt(binStartInput.value,10);
    binEnd = parseInt(binEndInput.value,10);
    if(isNaN(binStart) || isNaN(binEnd) || binStart < 0 || binEnd < binStart){ alert('Nieprawidłowy zakres skrzyń'); return; }
    if(binEnd > 999){ alert('Maksymalny numer skrzyni to 999'); return; }
    currentBin = binStart;
    currentBinEl.textContent = currentBin;
    pickingArea.classList.remove('hidden');
    binStartInput.disabled = binEndInput.disabled = startBtn.disabled = true;
    scanInput.focus();
  });

  // modal + toast helpers
  function showModalWithBarcode(orderId, orderCode){
    // build barcode text (we'll show the orderId as barcode string)
    const modalBackdrop = document.createElement('div'); modalBackdrop.className = 'modal-backdrop';
    const modal = document.createElement('div'); modal.className = 'modal';
    modal.innerHTML = `<h3>Zamówienie #${orderId} — gotowe</h3><p class="muted">Kod zamówienia: ${orderCode}</p>
      <div style="display:flex;justify-content:center;margin-top:12px"><div style="padding:18px;border-radius:8px;border:1px dashed rgba(0,0,0,0.06)">${orderCode}</div></div>
      <p class="small muted" style="margin-top:10px">Kliknij poza oknem, aby zamknąć.</p>`;
    modalBackdrop.appendChild(modal);
    document.body.appendChild(modalBackdrop);
    // click outside to close
    modalBackdrop.addEventListener('click', (ev)=>{ if(ev.target === modalBackdrop){ modalBackdrop.remove(); showToast(`Skrzynia: ${currentBin}`); } });
  }
  function showToast(msg, timeout=3000){
    const t = document.createElement('div'); t.className='toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=>{ t.remove(); }, timeout);
  }

  // utility: find first candidate order for SKU not fully collected and not assigned beyond capacity
  function findCandidateForSku(sku){
    // prefer items where sku exists and scanned_count < qty
    return items.find(it => (it.skuList.includes(sku) || (it.skus||'').includes(sku)) && (it.scanned_count < Math.max(1, parseInt(it.qty||1,10))));
  }

  // when scanning SKU
  scanInput.addEventListener('keydown', async (e)=>{
    if(e.key !== 'Enter') return;
    const value = scanInput.value.trim();
    if(!value) return;
    const sku = value;
    const candidate = findCandidateForSku(sku);
    if(!candidate){
      // if no candidate and we have bins left -> alert
      const unassignedLeft = items.filter(it => it.scanned_count < Math.max(1, parseInt(it.qty||1,10))).length;
      const availableBinsLeft = currentBin !== null ? (binEnd - currentBin + 1) : 0;
      if(availableBinsLeft <= 0){
        alert('Brak dostępnych numerów skrzyń — nie można przypisać tego towaru.');
      } else {
        alert('Nie znaleziono zamówienia z tym SKU w aktywnej liście lub wszystkie pozycje tego SKU już zebrano.');
      }
      scanInput.value=''; scanInput.focus(); return;
    }

    // check bins left for new assignments: count unassigned orders remaining vs bins left
    const unassignedOrders = items.filter(it => it.scanned_count < Math.max(1, parseInt(it.qty||1,10)) && !it.bin_number).length;
    const binsLeft = currentBin !== null ? (binEnd - currentBin + 1) : 0;
    if(binsLeft <= 0 && !candidate.bin_number){
      alert('Brak dostępnych skrzyń do przypisania nowych zamówień.');
      scanInput.value=''; scanInput.focus(); return;
    }
    if(binsLeft < unassignedOrders){
      // warn but allow (user wanted smaller)| spec requested alert when bins less than orders
      if(!confirm(`Wybrano mniej skrzyń (${binsLeft}) niż nieprzypisanych zamówień (${unassignedOrders}). Kontynuować?`)) { scanInput.value=''; scanInput.focus(); return; }
    }

    // if candidate has no bin yet, assign currentBin
    if(!candidate.bin_number){
      // assign currentBin
      candidate.bin_number = currentBin;
    }
    // increment scanned_count for that candidate
    candidate.scanned_count = (parseInt(candidate.scanned_count||0,10) + 1);
    candidate.assigned = true;

    // log scan via API: include action 'scan' and bin_number
    try {
      const payload = { picklist_id: picklistId, order_code: candidate.order_code, order_id: candidate.order_id, sku, user: operator, bin_number: candidate.bin_number, action: 'scan' };
      const resp = await fetch('api/scan.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const j = await resp.json();
      if(!j.success) console.warn('Scan API err', j);
    } catch(e){ console.warn('Network scan log error'); }

    renderItems();

    // if order fully collected now -> show modal with barcode and mark green
    if(candidate.scanned_count >= Math.max(1, parseInt(candidate.qty||1,10))){
      candidate.status = 'collected';
      // write updated item bin_number might be done on scan endpoint — but we already updated local copy
      showModalWithBarcode(candidate.order_id, candidate.order_code);
    }

    // do not auto-increment bin; operator will press nextBin or confirm close
    scanInput.value=''; scanInput.focus();
  });

  // confirm bin closure: logs action close_bin and increments currentBin
  confirmBinBtn.addEventListener('click', async ()=>{
    if(currentBin === null){ alert('Brak aktywnej skrzyni'); return; }
    if(!confirm(`Potwierdzić zamknięcie skrzyni ${currentBin}?`)) return;
    try {
      const resp = await fetch('api/scan.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ picklist_id: picklistId, action:'close_bin', user: operator, bin_number: currentBin }) });
      const j = await resp.json();
      if(!j.success) alert('Błąd logu zamknięcia skrzyni');
    } catch(e){ console.warn('Network error close_bin'); }
    // after close: advance bin if possible
    if(currentBin < binEnd) { currentBin++; currentBinEl.textContent = currentBin; }
    else { showToast('Koniec zakresu skrzyń'); }
  });

  nextBinBtn.addEventListener('click', ()=> {
    if(currentBin === null) return;
    if(currentBin < binEnd) { currentBin++; currentBinEl.textContent = currentBin; }
    else showToast('Koniec zakresu skrzyń');
  });

  // keyboard accessibility
  document.addEventListener('keydown', (e)=>{ if(e.key === 'F2'){ scanInput.focus(); } });

});
