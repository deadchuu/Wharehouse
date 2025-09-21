document.addEventListener('DOMContentLoaded', ()=>{
  const sess = Storage.get('session', {username:'gość', role:'scanner'});
  document.getElementById('sessionUser').textContent = `${sess.username} · ${sess.role}`;
  if(sess.role !== 'admin'){
    const adminCard = document.getElementById('adminCard'); if(adminCard) adminCard.style.display = 'none';
  }
  document.getElementById('logoutBtn').addEventListener('click', ()=>{ localStorage.removeItem('session'); window.location.href='index.html'; });
});
