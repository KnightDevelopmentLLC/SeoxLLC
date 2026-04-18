/* ============================================================
   SEOX, LLC — Global JavaScript
   Handles: cursor, loading, nav, page transitions,
            reveal animations, 3D background, marquee
   ============================================================ */

// ─── Custom Cursor ────────────────────────────────────────
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});

// Smooth cursor ring follow
function animateCursorRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(animateCursorRing);
}
animateCursorRing();

// Hover state
document.querySelectorAll('a, button, .btn, .artist-card, .feature-card, .contact-card').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// ─── Loading Screen ────────────────────────────────────────
const loadingScreen = document.getElementById('loading-screen');

function hideLoading() {
  if (!loadingScreen) return;
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
  }, 2000);
}

window.addEventListener('load', hideLoading);
// Fallback
setTimeout(hideLoading, 3000);

// ─── Navbar ────────────────────────────────────────────────
const navbar    = document.getElementById('navbar');
const hamburger = document.querySelector('.nav-hamburger');
const mobileNav = document.querySelector('.nav-mobile');

// Scroll shrink
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Mobile toggle
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });

  // Close on link click
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
    });
  });
}

// Active nav link
(function setActiveNavLink() {
  const path = window.location.pathname;
  document.querySelectorAll('#navbar .nav-links a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && path.endsWith(href)) a.classList.add('active');
  });
})();

// ─── Page Transitions ──────────────────────────────────────
const pageTransition = document.getElementById('page-transition');

function navigateTo(url) {
  if (!pageTransition) { window.location.href = url; return; }
  pageTransition.classList.add('out');
  setTimeout(() => { window.location.href = url; }, 500);
}

// Intercept internal links
document.querySelectorAll('a[href]').forEach(a => {
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
  a.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(href);
  });
});

// Page-in animation on load
window.addEventListener('DOMContentLoaded', () => {
  if (pageTransition) {
    pageTransition.classList.add('in');
    setTimeout(() => pageTransition.classList.remove('in'), 600);
  }
});

// ─── Scroll Reveal ─────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger delay based on siblings
      const delay = entry.target.dataset.delay || (
        Array.from(entry.target.parentNode?.children || []).indexOf(entry.target) * 80
      );
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, Math.min(delay, 400));
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el);
});

// ─── 3D Particle Background ────────────────────────────────
function initParticleBackground(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
  script.onload = () => createParticleScene(canvas);
  document.head.appendChild(script);
}

function createParticleScene(canvas) {
  if (typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
  camera.position.z = 80;

  // Particles
  const particleCount = window.innerWidth < 768 ? 600 : 1200;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const sizes     = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 300;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
    sizes[i] = Math.random() * 1.5 + 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float size;
      varying float vAlpha;
      void main() {
        vAlpha = size / 2.0;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha * (1.0 - d * 2.0) * 0.6);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Mouse parallax
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;

  window.addEventListener('mousemove', e => {
    targetRotY = (e.clientX / window.innerWidth  - 0.5) * 0.15;
    targetRotX = (e.clientY / window.innerHeight - 0.5) * 0.1;
  });

  // Resize
  window.addEventListener('resize', () => {
    const w = canvas.parentElement?.offsetWidth || window.innerWidth;
    const h = canvas.parentElement?.offsetHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Animate
  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    frame++;

    currentRotX += (targetRotX - currentRotX) * 0.04;
    currentRotY += (targetRotY - currentRotY) * 0.04;

    particles.rotation.x = currentRotX + frame * 0.0002;
    particles.rotation.y = currentRotY + frame * 0.0003;

    renderer.render(scene, camera);
  }
  animate();
}

// ─── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Start 3D bg on pages that have bg-canvas
  if (document.getElementById('bg-canvas')) {
    initParticleBackground('bg-canvas');
  }
});
