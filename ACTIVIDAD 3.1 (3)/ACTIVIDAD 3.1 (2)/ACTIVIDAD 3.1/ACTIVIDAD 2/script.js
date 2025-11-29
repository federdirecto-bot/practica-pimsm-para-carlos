// =============================
// BLOQUE 1: Fundamentos del DOM
// =============================
document.addEventListener('DOMContentLoaded', function () {
  // 1. Bienvenida controlada 
  function bienvenidaUsuario() {
    const encabezado = document.querySelector("h1");
    const nombre = prompt("¿Cómo te llamas?");
    if (encabezado && nombre) {
      encabezado.innerText = "Bienvenido/a, " + nombre;
    }
  }
  bienvenidaUsuario();

  // 2. Insertar fecha actual en el footer 
 const footer = document.querySelector("footer");
  if (footer) {
    let span = footer.querySelector('.footer-fecha');
    if (!span) {
      span = document.createElement('span');
      span.className = 'footer-fecha';
      
      const p = footer.querySelector('p');
      if (p) {
        p.appendChild(document.createTextNode(' '));
        p.appendChild(span);
      } else {
        footer.appendChild(span);
      }
    }
    span.textContent = 'Fecha actual: ' + (new Date()).toLocaleDateString();
  }

  // 3. Cambiar color de fondo al pasar el ratón 
  const seccion = document.getElementById("Inicio");
  if (seccion) {
    seccion.addEventListener("mouseover", () => { seccion.style.background = "lightblue"; });
    seccion.addEventListener("mouseout",  () => { seccion.style.background = ""; });
  }

  // 4. Botón modo claro/oscuro 
  const btn = document.getElementById('btn-modo');
  const root = document.body;
  if (localStorage.getItem('modoOscuro') === '1') {
    root.classList.add('modo-oscuro');
    if (btn) { btn.textContent = 'Modo claro'; btn.setAttribute('aria-pressed', 'true'); }
  }
  if (btn) {
    btn.addEventListener('click', function() {
      const activo = root.classList.toggle('modo-oscuro');
      localStorage.setItem('modoOscuro', activo ? '1' : '0');
      btn.setAttribute('aria-pressed', String(activo));
      btn.textContent = activo ? 'Modo claro' : 'Modo oscuro';
    });
  }
});
// =============================
// BLOQUE 2: Interactividad y eventos
// =============================

// 2.  slider o galería simple con botones 
(function initSlider() {
  document.addEventListener('DOMContentLoaded', function () {
    const slides = Array.from(document.querySelectorAll('.slide'));
    if (!slides.length) return;

    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    let idx = 0;
    const AUTOPLAY_MS = 5000;
    let autoplayId = null;

    const show = (i) => {
      slides.forEach((s, j) => {
        const active = j === i;
        s.classList.toggle('active', active);
        s.style.opacity = active ? '1' : '0';
        s.style.transition = 'opacity .4s ease';
        s.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
    };

    const next = () => { idx = (idx + 1) % slides.length; show(idx); };
    const prev = () => { idx = (idx - 1 + slides.length) % slides.length; show(idx); };

    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); next(); });
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); prev(); });

    // navegación con teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });

    // autoplay y pausa en hover/touch
    const startAutoplay = () => { if (autoplayId) clearInterval(autoplayId); autoplayId = setInterval(next, AUTOPLAY_MS); };
    const stopAutoplay = () => { if (autoplayId) { clearInterval(autoplayId); autoplayId = null; } };

    slides.forEach(s => {
      s.addEventListener('mouseenter', stopAutoplay);
      s.addEventListener('mouseleave', startAutoplay);
      s.addEventListener('touchstart', stopAutoplay, { passive: true });
      s.addEventListener('touchend', startAutoplay, { passive: true });
    });
    [prevBtn, nextBtn].forEach(b => {
      if (!b) return;
      b.addEventListener('mouseenter', stopAutoplay);
      b.addEventListener('mouseleave', startAutoplay);
    });

    // inicio
    show(idx);
    startAutoplay();
  });
})();


// =============================
// BLOQUE 3: Formularios dinámicos y validación
// =============================
(function initContactoForm() {
  const form = document.getElementById('contacto-form');
  if (!form) return;

  const nombre = document.getElementById('nombre');
  const email = document.getElementById('email');
  const mensaje = document.getElementById('mensaje');
  const charCount = document.getElementById('char-count');
  const MAX_LEN = 500;

  function setError(el, msg) {
    if (!el) return;
    el.classList.remove('valid'); el.classList.add('invalid');
    const err = document.getElementById('error-' + el.id);
    if (err) err.textContent = msg;
    const icon = el.parentElement.querySelector('.icon');
    if (icon) { icon.textContent = '✖'; icon.classList.add('invalid'); icon.classList.remove('valid'); }
  }
  function setValid(el) {
    if (!el) return;
    el.classList.remove('invalid'); el.classList.add('valid');
    const err = document.getElementById('error-' + el.id);
    if (err) err.textContent = '';
    const icon = el.parentElement.querySelector('.icon');
    if (icon) { icon.textContent = '✓'; icon.classList.add('valid'); icon.classList.remove('invalid'); }
  }

  function validarNombre() {
    if (!nombre.value.trim()) { setError(nombre, 'El nombre es obligatorio'); return false; }
    setValid(nombre); return true;
  }
  function validarEmail() {
    const v = email.value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!v) { setError(email, 'El correo es obligatorio'); return false; }
    if (!re.test(v)) { setError(email, 'Formato de correo no válido'); return false; }
    setValid(email); return true;
  }
  function validarMensaje() {
    const v = mensaje.value.trim();
    if (!v) { setError(mensaje, 'El mensaje no puede estar vacío'); return false; }
    if (v.length > MAX_LEN) { setError(mensaje, `Máximo ${MAX_LEN} caracteres`); return false; }
    setValid(mensaje); return true;
  }

  function actualizarContador() {
    const n = mensaje.value.length;
    charCount.textContent = `${n} / ${MAX_LEN}`;
    charCount.style.color = (n > MAX_LEN ? '#b00020' : (n > MAX_LEN * 0.9 ? '#ff9800' : '#666'));
  }

  // listeners
  nombre.addEventListener('blur', validarNombre);
  email.addEventListener('blur', validarEmail);
  mensaje.addEventListener('input', () => { actualizarContador(); if (mensaje.classList.contains('invalid')) validarMensaje(); });
  mensaje.addEventListener('blur', validarMensaje);
  actualizarContador();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const ok = validarNombre() & validarEmail() & validarMensaje();
    if (!ok) {
      showMessage('Corrige los errores antes de enviar', 'error', 2500);
      return;
    }

    // Simula envío y muestra confirmación animada
    const enviarBtn = document.getElementById('enviar-btn');
    if (enviarBtn) {
      enviarBtn.disabled = true;
      const original = enviarBtn.innerText;
      enviarBtn.innerText = 'Enviando...';
    }

    // aquí iría fetch(...) para enviar datos; simulamos con timeout
    setTimeout(() => {
      form.reset();
      [nombre, email, mensaje].forEach(el => { el.classList.remove('valid'); el.classList.remove('invalid'); const ic = el.parentElement.querySelector('.icon'); if (ic) ic.textContent = ''; });
      actualizarContador();
      showAnimatedConfirmation('Mensaje enviado correctamente');
      if (enviarBtn) { enviarBtn.disabled = false; enviarBtn.innerText = original; }
    }, 900);
  });

  // pequeño helper para mensajes (aparece en esquina)
  function showMessage(text, type = 'info', timeout = 2500) {
    let cont = document.getElementById('mensajes-global');
    if (!cont) { cont = document.createElement('div'); cont.id = 'mensajes-global'; cont.style.position = 'fixed'; cont.style.top = '1rem'; cont.style.right = '1rem'; cont.style.zIndex = '9999'; document.body.appendChild(cont); }
    const msg = document.createElement('div');
    msg.className = 'mensaje mensaje-' + type;
    msg.setAttribute('role', 'alert');
    msg.style.background = (type === 'error' ? '#f44336' : (type === 'success' ? '#2e7d32' : '#333'));
    msg.style.color = '#fff'; msg.style.padding = '.6rem 1rem'; msg.style.borderRadius = '6px'; msg.style.marginTop = '.5rem';
    msg.style.opacity = '0'; msg.style.transition = 'opacity .25s, transform .25s'; msg.style.transform = 'translateY(-6px)';
    msg.textContent = text;
    cont.appendChild(msg);
    requestAnimationFrame(() => { msg.style.opacity = '1'; msg.style.transform = 'translateY(0)'; });
    setTimeout(() => { msg.style.opacity = '0'; msg.style.transform = 'translateY(-6px)'; setTimeout(() => msg.remove(), 300); }, timeout);
  }

  // animación final más visible
  function showAnimatedConfirmation(text = 'Enviado') {
    const layer = document.createElement('div');
    layer.style.position = 'fixed'; layer.style.inset = '0'; layer.style.display = 'flex';
    layer.style.alignItems = 'center'; layer.style.justifyContent = 'center';
    layer.style.background = 'rgba(0,0,0,0.45)'; layer.style.zIndex = '9998';
    const box = document.createElement('div');
    box.style.background = '#fff'; box.style.padding = '1.2rem 1.4rem'; box.style.borderRadius = '8px';
    box.style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)'; box.style.textAlign = 'center';
    box.innerHTML = `<strong style="display:block;margin-bottom:.5rem">${text}</strong><small>Gracias por contactar. Te responderemos pronto.</small>`;
    box.style.opacity = '0'; box.style.transform = 'scale(.95)'; box.style.transition = 'opacity .25s, transform .25s';
    layer.appendChild(box); document.body.appendChild(layer);
    requestAnimationFrame(() => { box.style.opacity = '1'; box.style.transform = 'scale(1)'; });
    setTimeout(() => { box.style.opacity = '0'; box.style.transform = 'scale(.95)'; setTimeout(() => layer.remove(), 350); }, 2200);
  }
})();