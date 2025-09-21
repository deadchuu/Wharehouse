document.addEventListener('DOMContentLoaded', async ()=>{
  // tasks derived from orders + scans -> simple mock
  let orders = Storage.get('orders', []);
  let tasks = Storage.get('tasks', null);
  if(!tasks){
    // generate tasks from first 8 orders
    tasks = (orders.slice(0,12)||[]).map((o,i)=>({
      id: 't'+(1000+i),
      name: `Picklist #${1000+i}`,
      order_id: o.order_number || o.order_id || `ORD${1000+i}`,
      items: Math.floor(Math.random()*6)+1,
      status: 'pending',
      assigned_to: Storage.get('session',{}).username || 'demo'
    }));
    Storage.set('tasks', tasks);
  }

  const tasksList = document.getElementById('tasksList');
  const details = document.getElementById('taskDetails');
  const taskInfo = document.getElementById('taskInfo');
  const markPicked = document.getElementById('markPicked');
  const markPartial = document.getElementById('markPartial');

  function render(){
    tasksList.innerHTML='';
    tasks.filter(t=> t.assigned_to === Storage.get('session',{}).username || true).forEach(t=>{
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${t.name}</strong> — ${t.items} шт. <div class="muted">Статус: ${t.status}</div></div>
                      <div><button class="btn small" data-id="${t.id}">Відкрити</button></div>`;
      tasksList.appendChild(li);
    });
  }

  tasksList.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-id]'); if(!btn) return;
    const id = btn.dataset.id;
    const t = tasks.find(x=>x.id === id);
    taskInfo.innerHTML = `<pre>${JSON.stringify(t, null, 2)}</pre>`;
    details.classList.remove('hidden');
    details.dataset.current = id;
  });

  markPicked.addEventListener('click', ()=>{
    const id = details.dataset.current;
    if(!id) return;
    const t = tasks.find(x=>x.id === id); t.status='picked';
    Storage.set('tasks', tasks);
    render();
    alert('Позначено як зібране');
  });

  markPartial.addEventListener('click', ()=>{
    const id = details.dataset.current;
    if(!id) return;
    const t = tasks.find(x=>x.id === id); t.status='partial';
    Storage.set('tasks', tasks);
    render();
    alert('Позначено як частково зібране');
  });

  document.getElementById('refreshTasks').addEventListener('click', render);
  render();
});
