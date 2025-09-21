document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('loginForm');
  const demo = document.getElementById('demoBtn');

  form.addEventListener('submit', e=>{
    e.preventDefault();
    const username = document.getElementById('loginUser').value.trim();
    let role = 'scanner';
    if(username.toLowerCase().includes('admin')) role = 'admin';
    else if(username.toLowerCase().includes('pick')) role = 'picker';
    Storage.set('session', {username, role});
    window.location.href = 'dashboard.html';
  });

  demo.addEventListener('click', ()=>{
    Storage.set('session', {username:'demo_admin', role:'admin'});
    window.location.href = 'dashboard.html';
  });
});
