// js/scan_select.js (оновлено)
document.addEventListener('DOMContentLoaded', async ()=> {
  let orders = Storage.get('orders', []);
  // orders come as array of objects with order_id numeric etc.
  const ordersList = document.getElementById('ordersList');
  const selectedCountEl = document.getElementById('selectedCount');
  const selectedPreview = document.getElementById('selectedPreview');
  const picklistName = document.getElementById('picklistName');
  const pickerOperator = document.getElementById('pickerOperator');
  const applyFiltersBtn = document.getElementById('applyFilters');
  const resetFiltersBtn = document.getElementById('resetFilters');
  const autoPanel = document.getElementById('autoPanel');
  const autoParam = document.getElementById('autoParam');
  const autoControls = document.getElementById('autoControls');

  // load users as operators
  const users = Storage.get('users', []);
  pickerOperator.innerHTML = '';
  users.filter(u => u.role === 'picker' || u.role === 'admin').forEach(u=>{
    const opt = document.createElement('option'); opt.value = u.username; opt.textContent = u.full_name; pickerOperator.appendChild(opt);
  });

  // show orders as a dynamic grid of blocks
  const grid = document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns = 'repeat(auto-fit,minmax(280px,1fr))'; grid.style.gap='12px';
  ordersList.appendChild(grid);

  let selected = new Set();

  function renderOrders(list){
    grid.innerHTML = '';
    list.forEach(o=>{
      const ob = document.createElement('div'); ob.className='order-block';
      ob.dataset.id = o.order_id;
      ob.innerHTML = `<div>
          <div style="font-weight:700">#${o.order_id} — ${o.customer}</div>
          <div class="meta small muted">${o.sku} · ${o.items} szt. · ${o.carrier || '-'}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
          <input type="checkbox" class="select-order" data-id="${o.order_id}" ${selected.has(String(o.order_id)) ? 'checked' : ''}/>
          <div class="muted small">ID:${o.order_number}</div>
        </div>`;
      grid.appendChild(ob);
    });
  }

  function refreshPreview(){
    selectedCountEl.textContent = selected.size;
    selectedPreview.innerHTML = '';
    Array.from(selected).slice(0,200).forEach(id=>{
      const li = document.createElement('li'); li.textContent = '#' + id; selectedPreview.appendChild(li);
    });
  }

  // initial render
  orders = orders.map(o => ({...o, items: parseInt(o.items || 1, 10)}));
  renderOrders(orders);
  refreshPreview();

  // delegate selection
  grid.addEventListener('change', (e)=>{
    const cb = e.target.closest('input.select-order');
    if(!cb) return;
    const id = cb.dataset.id;
    if(cb.checked) selected.add(id); else selected.delete(id);
    // update visually
    const node = grid.querySelector('[data-id="'+id+'"]');
    if(node) node.classList.toggle('selected', cb.checked);
    refreshPreview();
  });

  // select all button (add simple button to top)
  const selectAllBtn = document.createElement('button'); selectAllBtn.className='btn outline'; selectAllBtn.textContent='Zaznacz wszystkie';
  ordersList.insertBefore(selectAllBtn, grid);
  selectAllBtn.addEventListener('click', ()=>{
    orders.forEach(o => selected.add(String(o.order_id)));
    renderOrders(orders);
    // check all checkboxes
    grid.querySelectorAll('input.select-order').forEach(i=>i.checked=true);
    refreshPreview();
  });

  // apply filters basic (search by sku/customer)
  applyFiltersBtn.addEventListener('click', ()=>{
    const q = document.getElementById('filterSearch').value.trim().toLowerCase();
    const carrier = document.getElementById('filterCarrier').value;
    const minItems = parseInt(document.getElementById('filterMinItems').value || '0',10);
    const maxItems = parseInt(document.getElementById('filterMaxItems').value || '0',10);
    const filtered = orders.filter(o=>{
      if(q && !(String(o.order_id).includes(q) || (o.customer||'').toLowerCase().includes(q) || (o.sku||'').toLowerCase().includes(q))) return false;
      if(carrier && o.carrier !== carrier) return false;
      if(minItems && o.items < minItems) return false;
      if(maxItems && maxItems>0 && o.items > maxItems) return false;
      return true;
    });
    renderOrders(filtered);
  });
  resetFiltersBtn.addEventListener('click', ()=> { document.getElementById('filterSearch').value=''; document.getElementById('filterCarrier').value=''; document.getElementById('filterMinItems').value=''; document.getElementById('filterMaxItems').value=''; renderOrders(orders); });

  // create picklist (Sortuj) — button appears on right side; create locally via API
  // create UI control: right panel with button and count
  const rightPanel = document.createElement('div'); rightPanel.style.marginTop='12px';
  rightPanel.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">
    <button id="sortBtn" class="btn" disabled>Sortuj (Utwórz listę)</button>
    <div class="muted small">Wybrane zamówienia: <strong id="rightCount">0</strong></div>
  </div>`;
  document.querySelector('section.card:nth-of-type(2)')?.appendChild(rightPanel) || document.body.appendChild(rightPanel);

  const sortBtn = document.getElementById('sortBtn');
  const rightCount = document.getElementById('rightCount');

  function updateRight(){
    rightCount.textContent = selected.size;
    sortBtn.disabled = selected.size === 0;
  }

  // handle click: create picklist via API, but first check stock availability (simple check against products stock)
  sortBtn.addEventListener('click', async ()=>{
    if(selected.size === 0) return;
    const order_ids = Array.from(selected).map(s => Number(s));
    // check stock: load products and aggregate required SKUs counts
    const products = Storage.get('products', []);
    const prodMap = {}; products.forEach(p => prodMap[p.sku] = p);
    const ordersMap = {};
    (Storage.get('orders', []) || []).forEach(o => ordersMap[String(o.order_id)] = o);

    // build needed quantities per sku
    const need = {};
    order_ids.forEach(id => {
      const o = ordersMap[String(id)];
      if(!o) return;
      const skus = (o.sku || '').split(';').map(x=>x.trim()).filter(Boolean);
      skus.forEach(sku => { need[sku] = (need[sku]||0) + 1; });
    });

    // check
    const low = [];
    for(const sku in need){
      const p = prodMap[sku];
      const stock = p ? parseInt(p.stock || 0,10) : 0;
      if(stock < need[sku]) low.push({sku, need:need[sku], stock});
    }

    if(low.length){
      alert('Brak wystarczającej ilości produktów:\n' + low.map(l=>`${l.sku} — wymagane ${l.need}, dostępne ${l.stock}`).join('\n'));
      return;
    }

    // prepare name & operator
    const name = (picklistName.value || `Lista ${Date.now()}`).trim();
    const operator = pickerOperator.value || '';

    // send to backend
    try {
      const res = await fetch('api/picklists.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, operator, order_ids }) });
      const js = await res.json();
      if(js.success){
        // redirect to scan_flow with picklist_id (this page will pick it up)
        window.location.href = `scan_flow.html?picklist_id=${encodeURIComponent(js.picklist_id)}&operator=${encodeURIComponent(operator)}`;
      } else {
        alert('Błąd podczas tworzenia listy: ' + (js.message || ''));
      }
    } catch(e){ alert('Błąd sieci podczas tworzenia listy'); }
  });

  // update right count when selection changes
  setInterval(()=>{ updateRight(); refreshPreview(); }, 300); // легкий polling UI
});
