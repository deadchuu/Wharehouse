document.addEventListener('DOMContentLoaded', async ()=>{
  const container = document.getElementById('picklistsContainer');
  async function loadPicklists(){
    container.innerHTML = 'Ładowanie...';
    try {
      const r = await fetch('api/picklists.php');
      if(!r.ok) throw new Error('fetch error');
      const data = await r.json();
      renderPicklists(data);
    } catch(e){
      container.innerHTML = '<p class="muted">Nie można pobrać list (sprawdź backend).</p>';
    }
  }

  function renderPicklists(data){
    container.innerHTML = '';
    if(!Array.isArray(data) || !data.length){
      container.innerHTML = '<p class="muted">Brak aktywnych list.</p>';
      return;
    }
    data.forEach(pl => {
      // compute progress: scanned_count / total_skus
      const total = pl.items.reduce((acc,i)=> acc + (i.qty?parseInt(i.qty||1):1), 0);
      const scanned = pl.items.reduce((acc,i)=> acc + (i.scanned_count?parseInt(i.scanned_count||0):0), 0);
      const pct = total ? Math.round(100 * scanned / total) : 0;
      const card = document.createElement('div');
      card.className = 'card';
      card.style.marginBottom='12px';
      card.innerHTML = `<div style="display:flex;justify-content:space-between">
          <div><strong>${pl.name}</strong><div class="small muted">ID: ${pl.id} · operator: ${pl.operator || '-'}</div></div>
          <div><strong>${pct}%</strong></div>
        </div>
        <div style="height:10px;background:#eee;border-radius:8px;margin-top:8px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--accent-weak),var(--accent));"></div>
        </div>
        <div class="small muted" style="margin-top:8px">Zamówień: ${pl.items.length} · Pozycji: ${total} · Zeskanowano: ${scanned}</div>
        <div style="margin-top:8px"><button class="btn outline small" data-id="${pl.id}" onclick="window.location.href='pack.html?picklist_id=${pl.id}'">Otwórz</button></div>`;
      container.appendChild(card);
    });
  }

  loadPicklists();
});
