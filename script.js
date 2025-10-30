// Helpers
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

/* Work preview hover/tap/focus swap */
document.addEventListener('DOMContentLoaded', () => {
  const preview = $('#workPreview');
  const links = $$('.work-list .work-link');
  if (preview && links.length) {
    function setActive(link) {
      const li = link.closest('.work-item');
      $$('.work-item').forEach(el => el.classList.remove('active'));
      if (li) li.classList.add('active');

      const src = link.getAttribute('data-image');
      if (!src || preview.getAttribute('data-current') === src) return;

      preview.style.opacity = '0.02';
      const img = new Image();
      img.src = src;
      img.onload = () => {
        preview.src = src;
        preview.setAttribute('data-current', src);
        const titleEl = link.querySelector('.title');
        const title = titleEl ? titleEl.textContent.trim() : link.textContent.trim();
        preview.alt = `Preview — ${title}`;
        requestAnimationFrame(() => { preview.style.opacity = '1'; });
      };
    }
    links.forEach(link => {
      link.addEventListener('mouseenter', () => setActive(link));
      link.addEventListener('focus', () => setActive(link));
      link.addEventListener('touchstart', () => setActive(link), { passive: true });
    });
    const firstActive = $('.work-item.active .work-link') || links[0];
    if (firstActive) setActive(firstActive);
  }
});

/* Experience: promote clicked card to featured (left/big) */
document.addEventListener('DOMContentLoaded', () => {
  const grid = $('.exp-grid');
  if (!grid) return;

  function featureCard(card) {
    const first = grid.firstElementChild;
    if (first === card) return;
    $$('.exp-card', grid).forEach(c => {
      c.classList.toggle('is-featured', c === card);
      c.setAttribute('aria-pressed', c === card ? 'true' : 'false');
    });
    grid.insertBefore(card, first);
  }
  $$('.exp-card', grid).forEach(card => {
    card.addEventListener('click', () => featureCard(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); featureCard(card); }
    });
  });
});

/* JOURNEY reel — seamless looping, bigger aligned squares */
document.addEventListener('DOMContentLoaded', () => {
  const PX_PER_SEC_DEFAULT = 80;

  $$('.reel').forEach(reel => {
    const inner = reel.querySelector('.reel-inner');
    if (!inner) return;

    // Wait for images for proper widths
    const waitForImages = (root) => Promise.all(
      [...root.querySelectorAll('img')].map(img => img.complete ? Promise.resolve() :
        new Promise(res => { img.addEventListener('load', res, {once:true}); img.addEventListener('error', res, {once:true}); }))
    );

    (async () => {
      await waitForImages(inner);

      // Create wrap with two copies for seamless loop
      const wrap = document.createElement('div');
      wrap.className = 'reel-wrap';
      wrap.style.display = 'inline-flex';
      wrap.style.gap = getComputedStyle(inner).gap;

      [...inner.children].forEach(el => wrap.appendChild(el));
      [...wrap.children].forEach(el => wrap.appendChild(el.cloneNode(true))); // second copy
      inner.replaceWith(wrap);

      function applyDuration() {
        const speed = Number(reel.dataset.speed) || PX_PER_SEC_DEFAULT;
        const halfWidth = wrap.scrollWidth / 2;
        const duration = halfWidth / speed;
        wrap.style.animation = `reelScroll ${duration}s linear infinite`;
        wrap.classList.add('is-animating');
      }

      let t;
      window.addEventListener('resize', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          wrap.style.animation = 'none';
          requestAnimationFrame(applyDuration);
        }, 120);
      }, { passive: true });

      applyDuration();
    })();
  });
});

/* Display subtle parallax/tilt on elements with data-tilt (CRED-ish) */
document.addEventListener('DOMContentLoaded', () => {
  const MAX_TILT = 6; // degrees
  const elements = $$('[data-tilt]');
  if (!elements.length) return;

  function handleMove(e) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateX(${(-py*MAX_TILT).toFixed(2)}deg) rotateY(${(px*MAX_TILT).toFixed(2)}deg)`;
  }
  function resetTilt(e){ e.currentTarget.style.transform = 'rotateX(0) rotateY(0)'; }

  elements.forEach(el => {
    el.style.transformStyle = 'preserve-3d';
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', resetTilt);
  });
});

/* Text line animation observer */
document.addEventListener('DOMContentLoaded', () => {
  const titleLines = $$('.about-title .title-line');
  if (titleLines.length) {
    const lineObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Reset the animation by removing and re-adding the class
          entry.target.classList.remove('is-visible');
          // Use requestAnimationFrame to ensure the class is removed before re-adding
          requestAnimationFrame(() => {
            setTimeout(() => {
              entry.target.classList.add('is-visible');
            }, index * 200); // 200ms delay between each line
          });
        } else {
          // When scrolled out of view, prepare for the next animation
          entry.target.classList.remove('is-visible');
        }
      });
    }, {
      threshold: 0.8, // Trigger when 80% of the line is visible
      rootMargin: '-10% 0px -10% 0px' // Shrink the root margin for more precise triggering
    });

    titleLines.forEach((line, index) => {
      line.style.transitionDelay = `${index * 0.1}s`;
      lineObserver.observe(line);
    });
  }

  const items = $$('.reveal-up');
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-inview');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(el => io.observe(el));
});

/* Work Title Cursor Effect */
document.addEventListener('DOMContentLoaded', () => {
  const workTitle = document.getElementById('workTitle');
  if (!workTitle) return;

  // Split text into spans for each character
  const text = workTitle.textContent;
  workTitle.innerHTML = '';
  
  // Create a wrapper for the text
  const wrapper = document.createElement('span');
  wrapper.className = 'text-wrapper';
  
  // Add each character as a span
  text.split('').forEach((char, i) => {
    const span = document.createElement('span');
    span.className = 'text-char';
    span.textContent = char === ' ' ? '\u00A0' : char; // Preserve spaces
    wrapper.appendChild(span);
  });
  
  workTitle.appendChild(wrapper);
  
  // Handle mouse move with requestAnimationFrame for better performance
  const chars = workTitle.querySelectorAll('.text-char');
  const radius = 120; // Slightly larger radius for better interaction
  let animationFrame;
  
  workTitle.addEventListener('mousemove', (e) => {
    // Cancel any pending animation frame
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    
    // Use requestAnimationFrame for smoother animations
    animationFrame = requestAnimationFrame(() => {
      const rect = workTitle.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      chars.forEach(char => {
        const charRect = char.getBoundingClientRect();
        const charX = charRect.left + charRect.width / 2 - rect.left;
        const charY = charRect.top + charRect.height / 2 - rect.top;
        
        const distance = Math.sqrt(Math.pow(x - charX, 2) + Math.pow(y - charY, 2));
        
        if (distance < radius) {
          // Calculate intensity based on distance
          const intensity = 1 - (distance / radius);
          // Add highlight class for CSS transitions to handle
          char.classList.add('highlight');
          // Let CSS handle the actual animation
        } else {
          char.classList.remove('highlight');
        }
      });
    });
  });
  
  // Reset on mouse leave
  workTitle.addEventListener('mouseleave', () => {
    // Cancel any pending animation frame
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    
    // Reset all characters
    chars.forEach(char => {
      char.classList.remove('highlight');
    });
  });
});

/* Magnetic CTA button */
document.addEventListener('DOMContentLoaded', () => {
  const btn = $('.magnet');
  if (!btn) return;
  const strength = 24;

  function move(e){
    const r = btn.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width/2);
    const y = e.clientY - (r.top + r.height/2);
    btn.style.transform = `translate(${x/6}px, ${y/6}px)`;
  }
  function leave(){ btn.style.transform = 'translate(0,0)'; }

  btn.addEventListener('mousemove', move);
  btn.addEventListener('mouseleave', leave);
});

/* Hero spotlight follows cursor */
document.addEventListener('mousemove', (e) => {
  const root = document.documentElement;
  root.style.setProperty('--mx', `${e.clientX}px`);
  root.style.setProperty('--my', `${e.clientY}px`);
}, { passive: true });

/* Respect reduced motion globally (stop some JS-driven bits) */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // disable tilt and magnetic effects
  $$('.tilt').forEach(el => {
    el.onmousemove = null;
    el.onmouseleave = null;
    el.style.transform = 'none';
  });
  const btn = $('.magnet');
  if (btn) {
    btn.onmousemove = null;
    btn.onmouseleave = null;
    btn.style.transform = 'none';
  }
}