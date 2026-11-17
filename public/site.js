// @ts-check
/** @template {Element} T @param {string} selector @returns {T} */
function element(selector) {
  const found = document.querySelector(selector);
  if (!found) throw new Error(`Missing website element: ${selector}`);
  return /** @type {T} */ (found);
}
const header = /** @type {HTMLElement} */ (element('.header'));
const menu = /** @type {HTMLButtonElement} */ (element('.menu'));
const siteNavigation = /** @type {HTMLElement} */ (element('#navigation'));
const mobile = matchMedia('(max-width: 760px)');
const motion = matchMedia('(prefers-reduced-motion: no-preference)');
/** @param {boolean} open */
function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  header.classList.toggle('menu-open', open);
  siteNavigation.inert = mobile.matches && !open;
}
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
siteNavigation.addEventListener('click', event => {
  if (event.target instanceof Element && event.target.closest('a')) setMenu(false);
});
header.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menu.focus();
  }
});
document.addEventListener('click', event => {
  if (event.target instanceof Node && !header.contains(event.target)) setMenu(false);
});
mobile.addEventListener('change', () => setMenu(false));
setMenu(false);
document.documentElement.classList.add('js');

// Reveal again from either direction. No JS (or reduced motion) keeps every item visible.
const revealTargets = [...document.querySelectorAll('[data-reveal]')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!(entry.target instanceof HTMLElement) || !motion.matches) continue;
      entry.target.dataset.revealState = entry.isIntersecting ? 'visible' :
        entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0) ? 'above' : 'below';
    }
  }, { rootMargin: '-6% 0px -6%', threshold: 0 });
  function resetReveals() {
    observer.disconnect();
    for (const target of revealTargets) {
      if (target instanceof HTMLElement) delete target.dataset.revealState;
      if (motion.matches) observer.observe(target);
    }
  }
  motion.addEventListener('change', resetReveals);
  resetReveals();
}

// On small screens this is a real, keyboard-operable product selector.
const gallery = document.querySelector('[data-home-gallery]');
if (gallery) {
  const controls = /** @type {HTMLElement} */ (gallery.querySelector('.showcase-controls'));
  const tabs = [...controls.querySelectorAll('button')];
  const panels = [...gallery.querySelectorAll('.showcase-screens figure')];
  let selected = 0;
  /** @param {number} index */
  function select(index) {
    selected = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === selected));
      tab.tabIndex = i === selected ? 0 : -1;
    });
    panels.forEach((panel, i) => {
      if (!(panel instanceof HTMLElement)) return;
      panel.dataset.selected = String(i === selected);
      if (mobile.matches) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tabs[i].id);
        panel.setAttribute('aria-hidden', String(i !== selected));
      } else {
        panel.removeAttribute('role');
        panel.removeAttribute('aria-labelledby');
        panel.removeAttribute('aria-hidden');
      }
    });
  }
  tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i)));
  controls.addEventListener('keydown', event => {
    let next = selected;
    if (event.key === 'ArrowRight') next = (selected + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (selected - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    select(next);
    tabs[next].focus();
  });
  mobile.addEventListener('change', () => select(selected));
  controls.hidden = false;
  select(0);
}

// Scroll progression shares a single scheduled frame with the parallax fallback.
const workflow = document.querySelector('.workflow');
const steps = [...document.querySelectorAll('.workflow-step')];
const screens = [...document.querySelectorAll('[data-screen]')];
const progressLabels = [...document.querySelectorAll('[data-progress]')];
const track = document.querySelector('.workflow-track');
const photos = [...document.querySelectorAll('.kitchen-editorial-photo')];
const nativeParallax = CSS.supports('animation-timeline', 'view()');
let queued = false;
let activeStep = -1;
function updateScroll() {
  queued = false;
  const viewport = window.innerHeight;
  if (workflow && track instanceof HTMLElement && steps.length) {
    const rects = steps.map(step => step.getBoundingClientRect());
    let next = 0;
    rects.forEach((rect, i) => { if (rect.top < viewport * .55) next = i; });
    if (next !== activeStep) {
      activeStep = next;
      [...steps, ...screens, ...progressLabels].forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        const index = Number(node.dataset.step ?? node.dataset.screen ?? node.dataset.progress);
        node.dataset.active = String(index === next);
      });
    }
    const bounds = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (viewport * .55 - bounds.top) / bounds.height));
    track.style.setProperty('--progress', String(ratio));
  }
  if (!nativeParallax) photos.forEach(photo => {
    if (!(photo instanceof HTMLElement) || !photo.parentElement) return;
    const bounds = photo.parentElement.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > viewport) return;
    const ratio = Math.max(0, Math.min(1, (viewport - bounds.top) / (viewport + bounds.height)));
    photo.style.transform = motion.matches ? `translateY(${(ratio - .5) * 60}px)` : '';
  });
}
function scheduleScroll() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(updateScroll);
}
window.addEventListener('scroll', scheduleScroll, { passive: true });
window.addEventListener('resize', scheduleScroll);
window.addEventListener('pageshow', () => { setMenu(false); scheduleScroll(); });
motion.addEventListener('change', scheduleScroll);
updateScroll();

// One damped spring drives two distinct device angles in the same perspective.
const stage = document.querySelector('.phone-stage');
const pointer = matchMedia('(hover: hover) and (pointer: fine)');
if (stage instanceof HTMLElement) {
  const heroStage = stage;
  let targetX = 0, targetY = 0, x = 0, y = 0, vx = 0, vy = 0;
  let frame = 0;
  let previous = 0;
  /** @param {number} now */
  function spring(now) {
    if (!motion.matches || !pointer.matches) {
      heroStage.style.removeProperty('--tilt-x');
      heroStage.style.removeProperty('--tilt-y');
      frame = 0;
      previous = 0;
      return;
    }
    const dt = Math.min((now - (previous || now - 16)) / 1000, .033);
    previous = now;
    vx += ((targetX - x) * 150 - vx * 25) * dt;
    vy += ((targetY - y) * 150 - vy * 25) * dt;
    x += vx * dt;
    y += vy * dt;
    heroStage.style.setProperty('--tilt-x', `${x}deg`);
    heroStage.style.setProperty('--tilt-y', `${y}deg`);
    if (Math.abs(targetX-x) + Math.abs(targetY-y) + Math.abs(vx) + Math.abs(vy) > .004) frame = requestAnimationFrame(spring);
    else { frame = 0; previous = 0; }
  }
  stage.addEventListener('pointermove', event => {
    if (!motion.matches || !pointer.matches) return;
    const rect = stage.getBoundingClientRect();
    targetX = -((event.clientY - rect.top) / rect.height - .5) * 14;
    targetY = ((event.clientX - rect.left) / rect.width - .5) * 20;
    if (!frame) frame = requestAnimationFrame(spring);
  });
  stage.addEventListener('pointerleave', () => {
    targetX = targetY = 0;
    if (!frame) frame = requestAnimationFrame(spring);
  });
  motion.addEventListener('change', () => {
    targetX = targetY = x = y = vx = vy = 0;
    if (frame) cancelAnimationFrame(frame);
    frame = previous = 0;
    stage.style.removeProperty('--tilt-x');
    stage.style.removeProperty('--tilt-y');
  });
}

// Pause the hero animation outside the viewport.
const mobileStage = document.querySelector('.home-page .phone-stage');
if (mobileStage instanceof HTMLElement && 'IntersectionObserver' in window) {
  const phoneVisibility = new IntersectionObserver(([entry]) => {
    mobileStage.dataset.mobileDepth = entry.intersectionRatio >= .2 ? 'visible' : 'waiting';
  }, { threshold: .2 });
  phoneVisibility.observe(mobileStage);
}
