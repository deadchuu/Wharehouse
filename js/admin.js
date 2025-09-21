document.addEventListener('DOMContentLoaded', async ()=>{
  const ordersContainer = document.getElementById('adminOrdersList');
  const productsList = document.getElementById('adminProductsList');

  async function loadOrders(){
    ordersContainer.innerHTML = 'Ładowanie...';
    try {
      const r = await fetch('api/orders.php');
      const json = await r.json();
      ordersContainer.innerHTML = '';
      json.forEach(o => {
        const el = document.createElement('div'); el.className='list-row'; el.style.padding='8px'; el.innerHTML = `<div><strong>${o.order_number||o.order_id}</strong><div class="small muted">${o.customer} • ${o.total}</div></div>`; ordersContainer.appendChild(el);
      });
    } catch(e){ ordersContainer.innerHTML = '<p class="muted">Błąd ładowania</p>'; }
  }

  async function loadProducts(){
    productsList.innerHTML = 'Ładowanie...';
    try {
      const r = await fetch('api/products.php');
      const json = await r.json();
      productsList.innerHTML = '';
      json.forEach(p => {
        const li = document.createElement('li'); li.innerHTML = `<div><strong>${p.name}</strong><div class="small muted">${p.sku} • ${p.category} • ${p.price}</div></div>`; productsList.appendChild(li);
      });
    } catch(e){ productsList.innerHTML = '<p class="muted">Błąd ładowania</p>'; }
  }

  document.getElementById('reloadOrders').addEventListener('click', loadOrders);
  document.getElementById('reloadProducts').addEventListener('click', loadProducts);

  // upload products CSV -> POST to api/products.php (endpoint może nadpisać CSV)
  document.getElementById('productCsvImport').addEventListener('change', async (e)=>{
    const f = e.target.files[0]; if(!f) return;
    const form = new FormData(); form.append('file', f);
    try {
      const r = await fetch('api/products.php', {method:'POST', body: form});
      const j = await r.json();
      if(j.success){ alert('Produkty załadowane'); loadProducts(); }
      else alert('Błąd: ' + (j.message||''));
    } catch(err){ alert('Błąd sieci'); }
  });

  document.getElementById('openCreateFromAdmin').addEventListener('click', ()=> window.location.href='scan_select.html');

  loadOrders(); loadProducts();
});
