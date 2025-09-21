document.addEventListener('DOMContentLoaded', async ()=>{
  const sess = Storage.get('session', {username:'guest', role:'scanner'});
  document.getElementById('userRole').textContent = `${sess.username} • ${sess.role}`;

  if(sess.role !== 'admin'){
    document.getElementById('adminCard').style.display = 'none';
  }

  document.getElementById('logoutBtn').addEventListener('click', ()=>{
    localStorage.removeItem('session');
    window.location.href='index.html';
  });
});
