document.addEventListener('DOMContentLoaded', async ()=>{
  // products stored in localStorage; fallback to /data/products.csv
  let products = Storage.get('products', null);
  if(!products){
    try{
      const res = await fetch('data/products.csv');
      if(res.ok){
        const txt = await res.text();
        products = csvParse(txt);
        Storage.set('products', products);
      } else products = [];
    } catch(e){ products = []; }
  }

  const list = document.getElementById('productList');
  const exportBtn = document.getElementById('exportProducts');
  const importInput = document.getElementById('productImport');
  const addSample = document.getElementById('addSampleProducts');

  function render(){
    list.innerHTML = '';
    products.forEach(p=>{
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${p.name}</strong><div class="muted">${p.sku} • ${p.category} • ${p.price} PLN • stock: ${p.stock}</div></div>
                      <div><button class="btn small ghost" data-del="${p.product_id}">Видалити</button></div>`;
      list.appendChild(li);
    });
    document.getElementById('statPending').textContent = products.filter(x=> x.stock>0).length;
    document.getElementById('statPicked').textContent = Storage.get('scans',[]).length;
  }

  list.addEventListener('click', (e)=>{
    const del = e.target.closest('[data-del]');
    if(!del) return;
    const id = del.dataset.del;
    products = products.filter(p=> p.product_id !== id);
    Storage.set('products', products);
    render();
  });

  exportBtn.addEventListener('click', ()=>{
    if(!products.length) return alert('Немає товарів для експорту');
    const csv = csvStringify(products);
    downloadFile('products_export.csv', csv);
  });

  importInput.addEventListener('change', (e)=>{
    const f = e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = csvParse(reader.result);
      products = products.concat(parsed);
      Storage.set('products', products);
      render();
      alert('Імпортовано локально');
    };
    reader.readAsText(f);
  });

  addSample.addEventListener('click', async ()=>{
    // re-load from /data/products.csv
    try{
      const res = await fetch('data/products.csv');
      const txt = await res.text();
      products = csvParse(txt);
      Storage.set('products', products);
      render();
      alert('Завантажено з data/products.csv');
    } catch(e){ alert('Не вдалось завантажити'); }
  });

  document.getElementById('exportScanAll').addEventListener('click', ()=>{
    const scans = Storage.get('scans', []);
    if(!scans.length) return alert('Нема історії для експорту');
    downloadFile('scan_history.csv', csvStringify(scans));
  });
  document.getElementById('clearScanAll').addEventListener('click', ()=>{
    if(!confirm('Очистити історію сканів?')) return;
    Storage.set('scans', []);
    alert('Історія очищена');
  });

  render();
});
