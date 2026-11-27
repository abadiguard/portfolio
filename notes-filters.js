(function () {
  'use strict';
  // Selecting several topics shows posts matching any of those topics.
  function matchesTopics(topics, selected) {
    return selected.size === 0 || topics.some(topic => selected.has(topic));
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { matchesTopics };
  if (typeof document === 'undefined') return;
  const dialog = document.getElementById('notes-filter-dialog');
  const catalogNode = document.getElementById('notes-tag-categories');
  if (!dialog || !catalogNode) return;
  const catalog = JSON.parse(catalogNode.textContent);
  const trigger = document.querySelector('.notes-filter-trigger');
  const active = document.querySelector('.notes-active-tags');
  const toolbar = document.querySelector('.notes-filter-toolbar');
  const options = dialog.querySelector('.notes-filter-options');
  const apply = dialog.querySelector('.notes-filter-apply');
  const clear = dialog.querySelector('.notes-filter-clear');
  const close = dialog.querySelector('.notes-filter-close');
  const status = document.getElementById('notes-filter-status');
  const grid = document.querySelector('.notes-page .posts');
  const cards = [...grid.querySelectorAll('.post')].map(el => ({ el, topics: [...el.querySelectorAll('.ptag')].map(tag => tag.textContent.trim()) }));
  const empty = document.createElement('p');
  empty.className = 'notes-filter-empty'; empty.textContent = 'No posts match these topics. Try a different selection.'; empty.hidden = true;
  grid.after(empty);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let applied = new Set(), draft = new Set(), closeTimer, gridMotion, toolbarMotion;
  let chipMotions = [];
  const optionButtons = new Map();
  function cross() {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 12 12'); icon.setAttribute('width', '10'); icon.setAttribute('height', '10'); icon.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(icon.namespaceURI, 'path');
    path.setAttribute('d', 'm2 2 8 8M10 2l-8 8'); path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', '1.4'); path.setAttribute('stroke-linecap', 'round');
    icon.append(path); return icon;
  }
  function tagButton(label, isActive) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'notes-topic';
    const text = document.createElement('span'); text.className = 'notes-topic-label'; text.textContent = label;
    const remove = document.createElement('span'); remove.className = 'notes-topic-remove'; remove.append(cross());
    button.append(text, remove); button.classList.toggle('is-selected', isActive); return button;
  }
  catalog.forEach((category, index) => {
    const section = document.createElement('section'); section.className = 'notes-filter-group';
    const heading = document.createElement('h3'); heading.id = 'notes-filter-group-' + index; heading.textContent = category.name;
    const tags = document.createElement('div'); tags.className = 'notes-filter-tags'; tags.setAttribute('role', 'group'); tags.setAttribute('aria-labelledby', heading.id);
    category.tags.forEach(label => {
      const button = tagButton(label, false); button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        if (draft.has(label)) draft.delete(label); else draft.add(label);
        updateDraft();
        if (!reduced.matches) button.animate([{ transform: 'scale(1)' }, { transform: 'scale(.97)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
      });
      optionButtons.set(label, button); tags.append(button);
    });
    section.append(heading, tags); options.append(section);
  });
  function updateScrollHint() {
    const more = options.scrollHeight - options.clientHeight - options.scrollTop > 2;
    dialog.classList.toggle('has-more-topics', more);
  }
  options.addEventListener('scroll', updateScrollHint, { passive: true });
  const scrollHintObserver = new ResizeObserver(updateScrollHint);
  scrollHintObserver.observe(options);
  [...options.children].forEach(group => scrollHintObserver.observe(group));
  document.fonts.ready.then(updateScrollHint);
  function matchingCount(selection) { return cards.filter(card => matchesTopics(card.topics, selection)).length; }
  function updateDraft() {
    optionButtons.forEach((button, label) => {
      const selected = draft.has(label); button.classList.toggle('is-selected', selected); button.setAttribute('aria-pressed', String(selected));
    });
    const count = matchingCount(draft);
    apply.querySelector('span').textContent = 'Show ' + count + (count === 1 ? ' result' : ' results');
    clear.disabled = draft.size === 0;
  }
  function updateResults() {
    const moving = !reduced.matches;
    // Read current animated positions before cancelling, so fast removals stay smooth.
    const previousHeight = moving ? toolbar.getBoundingClientRect().height : 0;
    const previousChips = new Map(moving ? [...active.children].map(button => [button.querySelector('.notes-topic-label').textContent, button.getBoundingClientRect()]) : []);
    if (toolbarMotion) { toolbarMotion.cancel(); toolbarMotion = null; }
    chipMotions.forEach(motion => motion.cancel()); chipMotions = [];
    let visible = 0;
    cards.forEach(card => { card.el.hidden = !matchesTopics(card.topics, applied); if (!card.el.hidden) visible++; });
    empty.hidden = visible !== 0;
    status.textContent = visible + (visible === 1 ? ' post shown.' : ' posts shown.');
    active.replaceChildren();
    applied.forEach(label => {
      const button = tagButton(label, true); button.setAttribute('aria-label', 'Remove filter: ' + label);
      button.addEventListener('click', () => {
        const index = [...active.children].indexOf(button);
        applied.delete(label); updateResults();
        (active.children[Math.min(index, active.children.length - 1)] || trigger).focus({ preventScroll: true });
      });
      active.append(button);
    });
    active.hidden = applied.size === 0;
    if (!reduced.matches) {
      if (gridMotion) gridMotion.cancel();
      gridMotion = grid.animate([{ opacity: .25, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 300, easing: 'cubic-bezier(.22,.61,.36,1)' });
      const nextHeight = toolbar.getBoundingClientRect().height;
      const timing = { duration: 440, easing: 'cubic-bezier(.22,.61,.36,1)' };
      // Animate real layout height: results follow the collapsing chip area naturally.
      if (Math.abs(previousHeight - nextHeight) > .5) {
        toolbarMotion = toolbar.animate([{ height: previousHeight + 'px' }, { height: nextHeight + 'px' }], timing);
      }
      [...active.children].forEach(button => {
        const label = button.querySelector('.notes-topic-label').textContent;
        const before = previousChips.get(label);
        if (before) {
          const after = button.getBoundingClientRect();
          chipMotions.push(button.animate([
            { transform: 'translate(' + (before.left - after.left) + 'px,' + (before.top - after.top) + 'px)' },
            { transform: 'translate(0,0)' }
          ], timing));
        } else {
          chipMotions.push(button.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 280, easing: timing.easing }));
        }
      });
    }
  }
  function openDialog() {
    clearTimeout(closeTimer); dialog.classList.remove('is-closing'); draft = new Set(applied); updateDraft();
    options.scrollTop = 0; dialog.showModal(); document.body.classList.add('notes-filter-open'); trigger.setAttribute('aria-expanded', 'true');
    updateScrollHint();
  }
  function closeDialog() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (reduced.matches) { dialog.close(); return; }
    dialog.classList.add('is-closing'); closeTimer = setTimeout(() => dialog.close(), 180);
  }
  trigger.addEventListener('click', openDialog);
  close.addEventListener('click', closeDialog);
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog();
  });
  dialog.addEventListener('close', () => {
    clearTimeout(closeTimer); dialog.classList.remove('is-closing'); document.body.classList.remove('notes-filter-open'); trigger.setAttribute('aria-expanded', 'false'); trigger.focus({ preventScroll: true });
  });
  clear.addEventListener('click', () => { draft.clear(); updateDraft(); });
  apply.addEventListener('click', () => { applied = new Set(draft); updateResults(); closeDialog(); });
  updateDraft();
})();
