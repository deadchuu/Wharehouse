// dashboard.js
// renderuje bloki w zależności od roli i obsługuje wybór (active card)

// przykładowe definicje bloków (id, title, description, tag, href)
const ALL_BLOCKS = [
  { id:'sort', title:'Sortowanie paczek', desc:'Skanuj kody paczek — system wskaże właściwy dział/kurier.', tag:'Magazyn', href:'scan_select.html' },
  { id:'packcost', title:'Koszt spakowania paczki', desc:'Oblicz koszt pakowania uwzględniając materiały i czas.', tag:'Magazyn', href:'pack.html' },
  { id:'efficiency', title:'Oszczędność przy wzroście pickrate', desc:'Symuluj oszczędności przy wyższej wydajności kompletacji.', tag:'Analizy', href:'#' },
  { id:'percent', title:'Kalkulator procentów', desc:'Narzędzia procentowe i szybkie kalkulacje dla operacji.', tag:'Narzędzia', href:'#' },
  { id:'products', title:'Produkty', desc:'Zarządzanie katalogiem produktów (tylko admin).', tag:'Administracja', href:'admin.html' },
  { id:'stats', title:'Statystyki', desc:'Przegląd statystyk skanów, zbiórek i efektywności.', tag:'Administracja', href:'admin.html?tab=stats' }
];

// dostęp bloków wg ról
const ROLE_MAP = {
  admin: ['sort','packcost','efficiency','percent','products','stats'],
  picker: ['sort','packcost','efficiency','percent'],
  sorter: ['sort','packcost','percent'],
  scanner: ['sort','percent']
};

document.addEventListener('DOMContentLoaded', ()=>{
  const sess = Storage.get('session', {username:'gość', role:'scanner'});
  const role = (sess && sess.role) ? sess.role : 'scanner';
  document.getElementById('sessionUser').textContent = `${sess.username} · ${role}`;

  // logout
  const logout = document.getElementById('logoutBtn');
  logout.addEventListener('click', ()=> { localStorage.removeItem('session'); window.location.href='index.html'; });

  // compute allowed blocks
  const allowedIds = ROLE_MAP[role] || ROLE_MAP['scanner'];
  const blocks = ALL_BLOCKS.filter(b=> allowedIds.includes(b.id));

  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = '';

  // create DOM nodes for blocks
  blocks.forEach(b=>{
    const card = document.createElement('a');
    card.className = 'block-card';
    card.href = b.href || '#';
    card.setAttribute('role','button');
    card.setAttribute('data-id', b.id);
    card.innerHTML = `
      <div class="title-row">
        <div class="card-icon" aria-hidden="true">${b.id.substring(0,2).toUpperCase()}</div>
        <div>
          <h3>${b.title}</h3>
          <div class="tag">${b.tag}</div>
        </div>
      </div>
      <p class="muted">${b.desc}</p>
    `;
    // click handler: mark active and follow link after small delay (so user sees scale)
    card.addEventListener('click', (ev)=>{
      // prevent default immediate navigation to allow animation
      ev.preventDefault();
      // clear other active cards
      document.querySelectorAll('.block-card.active').forEach(x=>x.classList.remove('active'));
      card.classList.add('active');

      // small delay for effect, then navigate (if href not '#')
      const href = card.getAttribute('href');
      setTimeout(()=> {
        if(href && href !== '#') window.location.href = href;
        else card.classList.remove('active'); // no navigation -> remove active after effect
      }, 260);
    });

    // keyboard accessibility: Enter triggers click
    card.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });

    grid.appendChild(card);
  });

  // Accessibility: focus first card
  const firstCard = grid.querySelector('.block-card');
  if(firstCard) firstCard.tabIndex = 0;
  grid.querySelectorAll('.block-card').forEach((c,i)=> { c.tabIndex = 0; });
});
