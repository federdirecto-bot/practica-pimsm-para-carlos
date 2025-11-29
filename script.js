// Script principal del proyecto: navegación, menú, formularios, localStorage y fetch.

(() => {
  // --- Constantes y referencias DOM ---
  const LS_MENU = 'restaurantMenu_v1';
  const LS_RES = 'restaurantReservations_v1';
  const LS_REV = 'restaurantReviews_v1';
  const LS_CONTACT = 'restaurantContact_v1';
  const DATA_JSON = 'data.json';

  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section');
  const toastEl = document.getElementById('toast');

  // Contenedores y formularios 
  const menuListEl = document.getElementById('menu-list');
  const loadingEl = document.getElementById('loading');
  const searchEl = document.getElementById('search');
  const categoryEl = document.getElementById('category');
  const addForm = document.getElementById('add-form');

  const reservationForm = document.getElementById('reservation-form');
  const reservationsList = document.getElementById('reservations-list');

  const reviewForm = document.getElementById('review-form');
  const reviewsList = document.getElementById('reviews-list');

  const chefsList = document.getElementById('chefs-list');
  const contactForm = document.getElementById('contact-form');

  const galleryRoot = document.getElementById('gallery-root');

  // Estado in-memory
  const state = { menu: [], reservations: [], reviews: [] };

  // --- Utilidades pequeñas ---
  const uid = () => 'id' + Math.random().toString(36).slice(2,9);

  function showToast(msg, ms = 2200) {
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.classList.add('show');
    // pequeña animación extra en toast
    toastEl.animate([{ transform: 'translateY(8px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 220 });
    setTimeout(() => toastEl.classList.remove('show'), ms);
    setTimeout(() => toastEl.hidden = true, ms + 300);
  }

  function saveLS(key, data){
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage', e);
    }
  }
  function loadLS(key){ try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e){ return []; } }

  // --- cargar datos desde localStorage o fetch(data.json) ---
  async function loadMenuData(){
    // localStorage
    const stored = loadLS(LS_MENU);
    if(stored && stored.length){
      state.menu = stored;
      return;
    }
    // si no hay nada en localStorage,fetch de data.json
    if(loadingEl) loadingEl.textContent = 'Cargando datos…';
    try {
      const res = await fetch(DATA_JSON, {cache: "no-store"});
      if(!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      state.menu = data.map(d => ({ id: d.id || uid(), name: d.name, price: d.price, category: d.category, image: d.image || '' }));
      saveLS(LS_MENU, state.menu);
      if(loadingEl) loadingEl.textContent = '';
    } catch(err){
      console.warn('No se pudo cargar data.json:', err);
      if(loadingEl) loadingEl.textContent = 'Error cargando datos. Comprueba data.json o añade platos manualmente.';
      showToast('No se pudieron cargar los datos del menú');
    }
  }
  /* ---------- Render seguro del menú (sin innerHTML) ----------
     Humano: "Aquí construyo las tarjetas del menú de forma segura.
     No inyecto HTML que venga del usuario; uso textContent/atributos."
  */
  function renderMenu(list = state.menu){
    if(!menuListEl) return;
    menuListEl.innerHTML = '';
    if(!list || !list.length){
      const li = document.createElement('li');
      li.className = 'loading';
      li.textContent = 'No hay platos para mostrar.';
      menuListEl.appendChild(li);
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach(item => {
      const li = document.createElement('li');
      li.className = 'menu-card';
      li.dataset.id = item.id;

      const img = document.createElement('img');
      img.src = item.image || ('https://picsum.photos/seed/'+encodeURIComponent(item.id)+'/600/400');
      img.alt = item.name;
      img.loading = 'lazy';

      const body = document.createElement('div');
      body.className = 'card-body';

      const infoWrap = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = item.name;

      const meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.textContent = `${item.category} • €${Number(item.price).toFixed(2)}`;

      infoWrap.appendChild(title);
      infoWrap.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'card-actions';

      const btnView = document.createElement('button');
      btnView.className = 'view';
      btnView.setAttribute('aria-label', `Ver ${item.name}`);
      btnView.textContent = 'Ver';

      const btnDelete = document.createElement('button');
      btnDelete.className = 'delete';
      btnDelete.setAttribute('aria-label', `Eliminar ${item.name}`);
      btnDelete.textContent = 'Eliminar';

      actions.appendChild(btnView);
      actions.appendChild(btnDelete);

      body.appendChild(infoWrap);
      body.appendChild(actions);

      li.appendChild(img);
      li.appendChild(body);

      frag.appendChild(li);
      // pequeña animación de aparición
      requestAnimationFrame(() => { li.style.opacity = 1; });
    });
    menuListEl.appendChild(frag);
  }
  // Aplicar filtros y búsqueda: lee valores de los inputs (si existen) y filtra state.menu antes de renderizar.
  function applyFilters(){
    // Lee valores de inputs y filtra state.menu
    if(!menuListEl) return;
    const q = (searchEl ? searchEl.value.trim().toLowerCase() : '');
    const cat = (categoryEl ? categoryEl.value : '');
    const filtered = state.menu.filter(i => {
      // matchesQ: busca por nombre o categoría
      const matchesQ = !q || i.name.toLowerCase().includes(q) || (i.category && i.category.toLowerCase().includes(q));
      const matchesCat = !cat || i.category === cat;
      return matchesQ && matchesCat;
    });
    renderMenu(filtered);
  }

  // --- Formularios y lógica de UI ---

  // addForm: agrega platos nuevos al estado y los guarda en localStorage.
  // Se hace validación básica antes de guardar.
  if(addForm){
    addForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      // obtener campos (IDs en el HTML: nombre, precio, categoria, imagenes)
      const name = addForm.name.value.trim();
      const price = parseFloat(addForm.price.value);
      const category = addForm.category.value;
      const image = addForm.image.value.trim();

      if(!name || !category || Number.isNaN(price)){
        showToast('Rellena correctamente nombre, categoría y precio');
        return;
      }
      const newItem = { id: uid(), name, price: Number(price), category, image };
      state.menu.unshift(newItem);
      saveLS(LS_MENU, state.menu);
      addForm.reset();
      applyFilters();
      showToast('Plato guardado');
    });
  }

  // Delegación en lista de menú: ver / eliminar
  // Busca la tarjeta (li) más cercana del evento y actúa según el botón (view/delete).
  if(menuListEl){
    menuListEl.addEventListener('click', (e) => {
      // Buscar la tarjeta (li) más cercana al evento
      const li = e.target.closest('.menu-card');
      if(!li) return;
      const id = li.dataset.id;
      if(e.target.classList.contains('delete')){
        // Eliminar: pequeño efecto visual antes de actualizar el estado y localStorage
        li.classList.add('fade-out');
        setTimeout(() => {
          state.menu = state.menu.filter(m => m.id !== id);
          saveLS(LS_MENU, state.menu); // persistir cambio
          applyFilters(); // volver a renderizar la lista filtrada 
          showToast('Plato eliminado');
        }, 180);
      } else if(e.target.classList.contains('view')){
        // Ver: mostrar información rápida en toast 
        const item = state.menu.find(m => m.id === id);
        if(item) showToast(`${item.name} — €${Number(item.price).toFixed(2)}`);
      }
    });
  }

  // --- Reservas ---
  state.reservations = loadLS(LS_RES);
  /* ---------- Render reservas sin innerHTML ----------
     Humano: "Construyo cada fila de reserva con elementos, y el botón tiene data-id."
  */
  function renderReservations(){
    if(!reservationsList) return;
    reservationsList.innerHTML = '';
    if(!state.reservations.length){
      const li = document.createElement('li');
      li.textContent = 'No hay reservas.';
      reservationsList.appendChild(li);
      return;
    }
    const frag = document.createDocumentFragment();
    state.reservations.forEach(r => {
      const li = document.createElement('li');

      const strong = document.createElement('strong');
      strong.textContent = r.name;

      const meta = document.createTextNode(` — ${new Date(r.date).toLocaleString()} — ${r.guests} invitados `);

      const btn = document.createElement('button');
      btn.className = 'small del-res';
      btn.dataset.id = r.id;
      btn.textContent = 'Eliminar';

      li.appendChild(strong);
      li.appendChild(meta);
      li.appendChild(btn);
      frag.appendChild(li);
    });
    reservationsList.appendChild(frag);
  }
  renderReservations();

  if(reservationForm){
    reservationForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = reservationForm.resName.value.trim();
      const date = reservationForm.resDate.value;
      const guests = parseInt(reservationForm.resGuests.value, 10);
      if(!name || !date || Number.isNaN(guests) || guests < 1){
        showToast('Por favor completa los datos de la reserva');
        return;
      }
      const newRes = { id: uid(), name, date, guests };
      state.reservations.unshift(newRes);
      saveLS(LS_RES, state.reservations);
      reservationForm.reset();
      renderReservations();
      showToast('Reserva creada');
    });

    reservationsList.addEventListener('click', (e) => {
      if(e.target.classList.contains('del-res')){
        const id = e.target.dataset.id;
        state.reservations = state.reservations.filter(r => r.id !== id);
        saveLS(LS_RES, state.reservations);
        renderReservations();
        showToast('Reserva eliminada');
      }
    });
  }

  // --- Opiniones ---
  state.reviews = loadLS(LS_REV);
  // Añade un contador al textarea de opiniones y persiste cada opinión en localStorage.
  if(reviewForm){
    // añadir contador de caracteres para textarea (muestra en UI si se desea)
    const textarea = reviewForm.revText;
    const counter = document.createElement('div');
    counter.style.fontSize = '0.85rem';
    counter.style.color = '#666';
    counter.textContent = `0 / 500`;
    textarea.parentNode.appendChild(counter);
    textarea.addEventListener('input', () => {
      counter.textContent = `${textarea.value.length} / 500`;
    });

    // Manejo del envío: validar, persistir y actualizar la lista
    reviewForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = reviewForm.revName.value.trim();
      const text = reviewForm.revText.value.trim();
      if(!name || !text){ showToast('Escribe tu nombre y opinión'); return; }
      const newRev = { id: uid(), name, text, created: Date.now() };
      state.reviews.unshift(newRev);
      saveLS(LS_REV, state.reviews);
      reviewForm.reset();
      renderReviews();
      showToast('Opinión añadida. ¡Gracias!');
    });

    reviewsList.addEventListener('click', (e) => {
      if(e.target.classList.contains('del-rev')){
        const id = e.target.dataset.id;
        state.reviews = state.reviews.filter(r => r.id !== id);
        saveLS(LS_REV, state.reviews);
        renderReviews();
        showToast('Opinión eliminada');
      }
    });
  }

  /* ---------- Render opiniones (safe) ----------
     Humano: "Aquí muestro las opiniones. No uso innerHTML para evitar XSS."
  */
  function renderReviews(){
    if(!reviewsList) return;
    reviewsList.innerHTML = '';
    if(!state.reviews.length){
      const li = document.createElement('li');
      li.textContent = 'No hay opiniones aún.';
      reviewsList.appendChild(li);
      return;
    }
    const frag = document.createDocumentFragment();
    state.reviews.forEach(r => {
      const li = document.createElement('li');
      li.className = 'review-item';
      li.dataset.id = r.id;

      const head = document.createElement('div');
      const nameEl = document.createElement('strong');
      nameEl.textContent = r.name;
      const dateEl = document.createElement('span');
      dateEl.style.marginLeft = '0.5rem';
      dateEl.style.fontSize = '0.9rem';
      dateEl.style.color = 'var(--muted)';
      dateEl.textContent = new Date(r.created).toLocaleString();

      head.appendChild(nameEl);
      head.appendChild(dateEl);

      const textEl = document.createElement('div');
      textEl.className = 'review-text';
      textEl.textContent = r.text;

      const btn = document.createElement('button');
      btn.className = 'del-rev';
      btn.dataset.id = r.id;
      btn.setAttribute('aria-label', `Eliminar opinión de ${r.name}`);
      btn.textContent = 'Eliminar';

      li.appendChild(head);
      li.appendChild(textEl);
      li.appendChild(btn);

      frag.appendChild(li);
    });
    reviewsList.appendChild(frag);
  }

  // --- Chefs ---
  // renderChefs: muestra las tarjetas del equipo (estático, editable en el array chefsData).
  const chefsData = [
    { id: 'c1', name: 'Sofía Morales', role: 'Chef Ejecutiva', bio: 'Especialista en cocina tradicional con toque moderno.', img: 'imagenes/OIP.webp' },
    { id: 'c2', name: 'Andrés Ruiz', role: 'Pastelero', bio: 'Amante de los postres y las texturas suaves.', img: 'imagenes/OIP (8).webp' },
    { id: 'c3', name: 'jose Carlos', role: 'Sous-chef', bio: 'Control de calidad y sabores intensos, le gusta el aceite.', img: 'imagenes/Gordon-Ramsay-696x522.jpeg' }
  ];
  /* ---------- Render chefs (safe) ----------
     Humano: "Tarjetas del equipo. Igual: createElement y textContent."
  */
  function renderChefs(){
    if(!chefsList) return;
    chefsList.innerHTML = '';
    const frag = document.createDocumentFragment();
    chefsData.forEach(c => {
      const card = document.createElement('div');
      card.className = 'menu-card';

      const img = document.createElement('img');
      img.src = c.img;
      img.alt = `Foto de ${c.name}`;
      img.loading = 'lazy';

      const body = document.createElement('div');
      body.className = 'card-body';

      const nameEl = document.createElement('div');
      nameEl.className = 'card-title';
      nameEl.textContent = c.name;

      const roleEl = document.createElement('div');
      roleEl.className = 'card-meta';
      roleEl.textContent = c.role;

      const bioEl = document.createElement('p');
      bioEl.textContent = c.bio;

      body.appendChild(nameEl);
      body.appendChild(roleEl);
      body.appendChild(bioEl);

      card.appendChild(img);
      card.appendChild(body);

      frag.appendChild(card);
    });
    chefsList.appendChild(frag);
  }
  renderChefs();

  // --- Contacto: validación, contador y guardado  ---
  // Guarda nombre/email en localStorage para autocompletar próximos envíos.
  if(contactForm){
    // rellenar con datos almacenados si existen
    const savedContact = loadLS(LS_CONTACT);
    if(savedContact && savedContact.name) contactForm.contactName.value = savedContact.name;
    if(savedContact && savedContact.email) contactForm.contactEmail.value = savedContact.email;

    // contador para mensaje
    const msgArea = contactForm.contactMsg;
    const cnt = document.createElement('div');
    cnt.style.fontSize = '0.85rem';
    cnt.style.color = '#666';
    cnt.textContent = `${msgArea.value.length} / 800`;
    msgArea.parentNode.appendChild(cnt);
    msgArea.addEventListener('input', () => { cnt.textContent = `${msgArea.value.length} / 800`; });

    contactForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = contactForm.contactName.value.trim();
      const email = contactForm.contactEmail.value.trim();
      const msg = contactForm.contactMsg.value.trim();
      // validación simple de email
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if(!name || !email || !msg){ showToast('Completa todos los campos'); return; }
      if(!emailOk){ showToast('Formato de correo inválido'); return; }
      // guardar nombre/email en localStorage como opcional útil
      saveLS(LS_CONTACT, { name, email });
      // animación de confirmación: usamos toast y también un breve highlight en el form
      contactForm.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 400 });
      contactForm.reset();
      showToast('Mensaje enviado. Gracias por contactar');
    });
  }

  // --- Galería: slider simple ---
  // renderGallery: crea un slider básico con prev/next.
  if(galleryRoot){
    const images = [
      'imagenes/OIP (4).webp',
      'imagenes/OIP (3).webp',
      'imagenes/R.jpg'
    ];
    let idx = 0;
    /* ---------- Galería: render con DOM (mejor manejo del fade) ----------
       Humano: "Construyo el slider y aplico una clase fade cuando cambio imagen."
    */
    function renderGallery(){
      if(!galleryRoot) return;
      const images = galleryRoot._images || ['imagenes/OIP (4).webp','imagenes/OIP (3).webp','imagenes/R.jpg'];
      let idx = 0;

      function build(){
        galleryRoot.innerHTML = '';
        const frame = document.createElement('div');
        frame.className = 'gallery-frame';

        const btnPrev = document.createElement('button');
        btnPrev.id = 'prev-g';
        btnPrev.setAttribute('aria-label','Anterior');
        btnPrev.textContent = '◀';

        const img = document.createElement('img');
        img.id = 'gallery-img';
        img.src = images[idx];
        img.alt = `Galería imagen ${idx+1}`;

        const btnNext = document.createElement('button');
        btnNext.id = 'next-g';
        btnNext.setAttribute('aria-label','Siguiente');
        btnNext.textContent = '▶';

        frame.appendChild(btnPrev);
        frame.appendChild(img);
        frame.appendChild(btnNext);
        galleryRoot.appendChild(frame);

        btnPrev.addEventListener('click', () => { change(-1); });
        btnNext.addEventListener('click', () => { change(1); });

        function change(delta){
          img.classList.add('fade');
          setTimeout(() => {
            idx = (idx + delta + images.length) % images.length;
            img.src = images[idx];
            img.alt = `Galería imagen ${idx+1}`;
            img.classList.remove('fade');
          }, 180);
        }
      }

      // permitir que otros módulos inyecten imágenes si lo desean
      galleryRoot._images = galleryRoot._images || images;
      build();
    }
    renderGallery();
  }

  // --- Navegación: resaltar según página/scroll y soporte accesible ---
  // setActiveLink + IntersectionObserver para mantener el estado activo en el menú.
  function setActiveLink(targetId){
    navLinks.forEach(a => a.classList.toggle('active', a.dataset.target === targetId));
  }

  // Si hay secciones (misma página) usamos IntersectionObserver para resaltar
  if(sections && sections.length){
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(en => { if(en.isIntersecting) setActiveLink(en.target.id); });
    }, { threshold: 0.45 });
    sections.forEach(s => obs.observe(s));
  }

  // Enlaces de nav: si apuntan a otras páginas, no interferimos; si apuntan a ancla local, hacemos scroll suave y focus.
  navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if(href.startsWith('#')) {
        // enlace local dentro de la misma página
        e.preventDefault();
        const targetId = href.slice(1);
        const target = document.getElementById(targetId);
        if(target){ target.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(()=> target.focus({preventScroll:true}), 400); }
      } else {
        // normal navigation — permitimos que el navegador cambie de página
        // small improvement: set active class for visual feedback
        navLinks.forEach(x => x.classList.remove('active'));
        a.classList.add('active');
      }
    });
  });

  // Shortcuts: Alt+B para volver al inicio
  document.addEventListener('keydown', (e) => {
    if(e.altKey && e.key.toLowerCase() === 'b'){ window.location.href = 'INICIO.html'; showToast('Volviendo al inicio'); }
  });

  // --- Tema: detección, aplicación y persistencia ---
  const THEME_KEY = 'restaurantTheme';
  // botón de tema puede no existir en todas las páginas
  const btnTheme = document.getElementById('btn-theme');

  // aplica el tema: 'dark' o 'light'
  function applyTheme(theme) {
    if(theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // actualizar estado del botón si existe
    if(btnTheme){
      const isDark = theme === 'dark';
      btnTheme.setAttribute('aria-pressed', String(isDark));
      btnTheme.textContent = isDark ? '☀️' : '🌙';//use estos iconos sugeridos por chatgpt pero me agrdaron y preferi no cambiarlos
    }
  }

  // detectar preferencia del sistema
  function detectPreferredTheme(){
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch(e) {
      return 'light';
    }
  }

  // alternar tema y persistir
  function toggleTheme(){
    const current = localStorage.getItem(THEME_KEY) || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    showToast(next === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado');
  }

  // inicializa tema al cargar
  function initTheme(){
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || detectPreferredTheme();
    applyTheme(theme);
    // conectar evento del botón
    if(btnTheme){
      btnTheme.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
      });
    }
    // atajo: Alt+T para alternar tema
    document.addEventListener('keydown', (e) => {
      if(e.altKey && e.key.toLowerCase() === 't'){ e.preventDefault(); toggleTheme(); }
    });
  }

  // --- Footer: insertar fecha actual en todos los documentos que tengan #site-date ---
  function initFooter(){
    const el = document.getElementById('site-date');
    if(!el) return;
    const now = new Date();
    // formato legible: 17 de noviembre de 2025 (día de mes de año) — adaptado a locale ES
    const formatted = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    el.textContent = formatted;
    el.setAttribute('datetime', now.toISOString());
  }

  // --- Visitor welcome: pedir/guardar nombre y mostrar saludo en la página ---
  const VISITOR_KEY = 'restaurantVisitor_v1';
  const welcomeForm = document.getElementById('welcome-form');
  const visitorInput = document.getElementById('visitor-name');
  const greetingEl = document.getElementById('greeting');
  const changeBtn = document.getElementById('change-name');
  const heroTitle = document.querySelector('#inicio h2');

  function setVisitorName(name, silent = false){
    if(!name) return;
    try { localStorage.setItem(VISITOR_KEY, name); } catch(e){}
    if(greetingEl){
      greetingEl.style.display = ''; // show
      greetingEl.textContent = `¡Bienvenido, ${name}!`;
    }
    if(welcomeForm) welcomeForm.style.display = 'none';
    if(changeBtn) changeBtn.style.display = '';
    if(heroTitle){
      // actualizar título de la portada para personalizar la página
      heroTitle.textContent = `Bienvenidos a La Sazón — ${name}`;
    }
    if(!silent) showToast(`Hola ${name}`);
  }

  function clearVisitorUI(){
    if(greetingEl) { greetingEl.style.display = 'none'; greetingEl.textContent = ''; }
    if(welcomeForm) welcomeForm.style.display = '';
    if(changeBtn) changeBtn.style.display = 'none';
    if(heroTitle) heroTitle.textContent = 'Bienvenidos a La Sazón';
    if(visitorInput) visitorInput.value = '';
  }

  function initWelcome(){
    try {
      const saved = localStorage.getItem(VISITOR_KEY);
      if(saved) {
        setVisitorName(saved, true);
      } else {
        // mostrar formulario (por defecto ya visible en HTML)
        if(welcomeForm) welcomeForm.style.display = '';
        if(changeBtn) changeBtn.style.display = 'none';
      }
    } catch(e){
      if(welcomeForm) welcomeForm.style.display = '';
    }

    if(welcomeForm){
      welcomeForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const name = (visitorInput && visitorInput.value.trim()) || '';
        if(!name){ showToast('Escribe tu nombre por favor'); return; }
        setVisitorName(name);
      });
    }

    if(changeBtn){
      changeBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        // permitir cambiar nombre
        clearVisitorUI();
      });
    }
  }

  // --- Inicialización general ---
  // carga datos y conecta eventos
  (async function init(){
    // Inicializar tema antes de renderizar para evitar parpadeo
    initTheme();

    // inicializar welcome cuanto antes para que el usuario vea el prompt
    initWelcome();

    await loadMenuData(); // carga el menú antes de renderizar
    // inicializar footer (fecha actual)
    initFooter();
    // si la página actual contiene la lista del menú, renderizamos y conectamos filtros
    if(menuListEl) {
      renderMenu();
      if(searchEl) searchEl.addEventListener('input', applyFilters);
      if(categoryEl) categoryEl.addEventListener('change', applyFilters);
    }
    // aplicar render a otras secciones ya cargadas
    renderChefs(); renderReservations(); renderReviews();
    // set active nav link en base a URL (por si venimos de otra página)
    const path = location.pathname.split('/').pop().toLowerCase();
    if(path.includes('menu.html')) setActiveLink('menu-section');
    else if(path.includes('contacto.html')) setActiveLink('contacto');
    else if(path.includes('acerca.html')) setActiveLink('chefs');
    else if(path.includes('galeria.html')) setActiveLink('galeria');
    else setActiveLink('inicio');
  })();

  // Exponer estado para depuración (opcional)
  window.__restaurantState = state;

})();