// scan_select.js
document.addEventListener('DOMContentLoaded', async ()=> {
  // pobierz zamówienia z backendu (api/orders.php) lub localStorage
  let orders = Storage.get('orders', []);
  try {
    const r = await fetch('api/orders.php');
    if(r.ok){ orders = await r.json(); Storage.set('orders', orders); }
  } catch(e){ /* fallback do lokalnego */ }

  // carriers (operator dostawy) kolekcja z orders
  const carriers = Array.from(new Set(orders.map(o => o.carrier || '').filter(Boolean)));
  const filterCarrier = document.getElementById('filterCarrier');
  carriers.forEach(c => { const opt = document.createElement('option'); opt.value = c; opt.textContent = c; filterCarrier.appendChild(opt); });
  // picker operators — mock: można rozbudować
  const pickerOperator = document.getElementById('pickerOperator');
  ['Operator A','Operator B','Operator C'].forEach(o => { const opt=document.createElement('option'); opt.value=o; opt.textContent=o; pickerOperator.appendChild(opt); });

  let selected = new Set();
  const ordersList = document.getElementById('ordersList');
  const selectedCount = document.getElementById('selectedCount');
  const selectedPreview = document.getElementById('selectedPreview');

  function renderOrders(list){
    ordersList.innerHTML = '';
    list.forEach(o => {
      const li = document.createElement('div');
      li.className = 'list-row';
      li.style.padding='8px';
      li.style.borderBottom='1px solid #eee';
      li.innerHTML = `<div>
          <strong>${o.order_number || o.order_id}</strong> — ${o.customer || ''} <div class="small muted">${o.total || ''} • ${o.sku || ''}</div>
        </div>
        <div>
          <input type="checkbox" data-id="${o.order_id || o.order_number}" ${selected.has(o.order_id || o.order_number) ? 'checked' : ''}/>
        </div>`;
      ordersList.appendChild(li);
    });
  }

  function refreshPreview(){
    selectedCount.textContent = selected.size;
    selectedPreview.innerHTML = '';
    Array.from(selected).slice(0,100).forEach(id => {
      const li = document.createElement('li'); li.textContent = id; selectedPreview.appendChild(li);
    });
  }

  // initial render
  renderOrders(orders); refreshPreview();

  // delegate click for checkboxes
  ordersList.addEventListener('change', (e)=>{
    const cb = e.target; if(cb.tagName !== 'INPUT') return;
    const id = cb.dataset.id;
    if(cb.checked) selected.add(id); else selected.delete(id);
    refreshPreview();
  });

  // filtering
  document.getElementById('applyFilters').addEventListener('click', ()=>{
    const q = document.getElementById('filterSearch').value.trim().toLowerCase();
    const minItems = parseInt(document.getElementById('filterMinItems').value || '0',10);
    const maxItems = parseInt(document.getElementById('filterMaxItems').value || '0',10);
    const carrier = document.getElementById('filterCarrier').value;
    const filtered = orders.filter(o=>{
      if(q){
        const inText = (o.order_number||'').toLowerCase().includes(q) || (o.customer||'').toLowerCase().includes(q) || (o.sku||'').toLowerCase().includes(q);
        if(!inText) return false;
      }
      const items = parseInt(o.items || '1',10);
      if(minItems && items < minItems) return false;
      if(maxItems && maxItems > 0 && items > maxItems) return false;
      if(carrier && (o.carrier||'') !== carrier) return false;
      return true;
    });
    renderOrders(filtered);
  });
  document.getElementById('resetFilters').addEventListener('click', ()=>{
    document.getElementById('filterSearch').value=''; document.getElementById('filterMinItems').value=''; document.getElementById('filterMaxItems').value=''; document.getElementById('filterCarrier').value='';
    renderOrders(orders);
  });

  // auto panel toggle
  const autoPanel = document.getElementById('autoPanel');
  document.getElementById('autoSelectBtn').addEventListener('click', ()=> { autoPanel.classList.toggle('hidden'); });

  // dynamic auto param UI
  document.getElementById('autoParam').addEventListener('change', (e)=>{
    const v = e.target.value;
    const container = document.getElementById('autoControls');
    container.innerHTML = '';
    if(v === 'items_count' || v === 'distinct_skus' || v === 'total'){
      container.innerHTML = `<label>Min <input id="autoMin" type="number" /></label>
                             <label>Max <input id="autoMax" type="number" /></label>`;
    } else if(v === 'carrier'){
      // build checklist from carriers
      container.innerHTML = carriers.map(c => `<label><input type="checkbox" class="autoCarrier" value="${c}" /> ${c}</label>`).join('');
    } else container.innerHTML = '';
  });

  // apply auto select: choose orders matching criteria
  document.getElementById('applyAutoSelect').addEventListener('click', ()=>{
    const param = document.getElementById('autoParam').value;
    if(!param) return alert('Wybierz parametr');
    let matched = [];
    if(param === 'items_count' || param === 'distinct_skus' || param === 'total'){
      const min = parseFloat(document.getElementById('autoMin').value || '-999999');
      const max = parseFloat(document.getElementById('autoMax').value || '999999');
      matched = orders.filter(o=>{
        const val = param === 'total' ? parseFloat(o.total || 0) : parseFloat(o.items || 1);
        return val >= min && val <= max;
      });
    } else if(param === 'carrier'){
      const checked = Array.from(document.querySelectorAll('.autoCarrier:checked')).map(x=>x.value);
      if(!checked.length) return alert('Wybierz operatorów');
      matched = orders.filter(o => checked.includes(o.carrier || ''));
    }
    // add matched to selected set
    matched.forEach(o => selected.add(o.order_id || o.order_number));
    refreshPreview();
    autoPanel.classList.add('hidden');
    // highlight matched in list (re-render simplified)
    renderOrders(orders);
  });

  // create picklist -> POST to backend api/picklists.php
  document.getElementById('createPicklistBtn').addEventListener('click', async ()=>{
    if(selected.size === 0) return alert('Brak wybranych zamówień');
    const name = document.getElementById('picklistName').value.trim();
    if(!name) return alert('Podaj nazwę listy');
    const operator = document.getElementById('pickerOperator').value || '';
    const order_ids = Array.from(selected);
    // call backend
    try {
        const res = await fetch('api/picklists.php', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({name, operator, order_ids})
    });
    const json = await res.json();
    if(json.success){
        // redirect to flow page with picklist id and operator
        window.location.href = `scan_flow.html?picklist_id=${encodeURIComponent(json.picklist_id)}&operator=${encodeURIComponent(operator)}`;
    } else {
        alert('Błąd utworzenia listy: ' + (json.message || ''));
    }} catch(e){
      alert('Błąd sieci podczas tworzenia listy');
    }
  });

  // Allow clicking order row to toggle selection
  ordersList.addEventListener('click', (e)=>{
    const row = e.target.closest('div');
    if(!row) return;
    // find checkbox inside
    const cb = row.querySelector('input[type=checkbox]');
    if(!cb) return;
    cb.checked = !cb.checked;
    cb.dispatchEvent(new Event('change'));
  });

});
