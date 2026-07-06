// ===== Sneaker Bucket List =====
(function () {
  'use strict';

  const KEY = 'sneaker_bucket_list';
  let sneakers = [];
  let activeFilter = 'all';   // all | want | copped | maybe
  let activeBrand = null;     // null = no brand filter
  let editingId = null;

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  const dom = {
    list: $('#list'), empty: $('#empty'),
    filterPills: $('#filterPills'),
    cntAll: $('#cntAll'), cntCopped: $('#cntCopped'),
    // detail
    detailOverlay: $('#detailOverlay'), detailBody: $('#detailBody'),
    // edit
    editOverlay: $('#editOverlay'), editTitle: $('#editTitle'),
    editClose: $('#editClose'), editSave: $('#editSave'), editForm: $('#editForm'),
    deleteBtn: $('#deleteBtn'),
    fName: $('#fName'), fBrand: $('#fBrand'), fImage: $('#fImage'),
    fPrice: $('#fPrice'), fSize: $('#fSize'), fStore: $('#fStore'),
    fLink: $('#fLink'), fColors: $('#fColors'), fStatus: $('#fStatus'),
    fPriority: $('#fPriority'), fNotes: $('#fNotes'),
    fCoppedDate: $('#fCoppedDate'), fPricePaid: $('#fPricePaid'),
    fCoppedDateWrap: $('#fCoppedDateWrap'), fPricePaidWrap: $('#fPricePaidWrap'),
    toast: $('#toast')
  };

  // ===== DATA =====
  function load() {
    // clear old keys from previous versions
    localStorage.removeItem('sneakervault_data');

    const raw = localStorage.getItem(KEY);
    sneakers = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_SNEAKERS));
    if (!raw) save();
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(sneakers)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

  // ===== RENDER =====
  function render() {
    dom.cntAll.textContent = sneakers.length;
    dom.cntCopped.textContent = sneakers.filter(s => s.status === 'copped').length;
    renderList();
  }

  function getFiltered() {
    let list = [...sneakers];
    if (activeFilter !== 'all') list = list.filter(s => s.status === activeFilter);
    if (activeBrand) list = list.filter(s => s.brand === activeBrand);
    // always sort by priority desc
    list.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return list;
  }

  function renderList() {
    const list = getFiltered();
    if (!list.length) { dom.list.innerHTML = ''; dom.empty.classList.remove('hidden'); return; }
    dom.empty.classList.add('hidden');

    dom.list.innerHTML = list.map((s, i) => `
      <div class="card" data-id="${s.id}" style="animation-delay:${i * .03}s">
        <div class="card-img">
          ${s.image
            ? `<img src="${esc(s.image)}" alt="${esc(s.name)}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=ph><span class=ph-emoji>👟</span><span class=ph-brand>${esc(s.brand)}</span></div>'">`
            : `<div class="ph"><span class="ph-emoji">👟</span><span class="ph-brand">${esc(s.brand)}</span></div>`}
          <span class="card-dot ${s.status}"></span>
        </div>
        <div class="card-body">
          <div class="card-brand">${esc(s.brand)}</div>
          <div class="card-name">${esc(s.name)}</div>
          <div class="card-color">${s.colors?.length ? esc(s.colors[0]) : ''}</div>
          <div class="card-price">$${(s.price || 0).toLocaleString('en-AU')} AUD</div>
          <span class="card-chevron">›</span>
        </div>
      </div>
    `).join('');
  }

  // ===== DETAIL =====
  function showDetail(id) {
    const s = sneakers.find(x => x.id === id);
    if (!s) return;
    dom.detailBody.innerHTML = `
      <div class="d-img">
        ${s.image
          ? `<img src="${esc(s.image)}" alt="${esc(s.name)}" onerror="this.parentNode.innerHTML='<div class=ph style=font-size:0><span class=ph-emoji style=font-size:56px>👟</span><span class=ph-brand>${esc(s.brand)}</span></div>'">`
          : `<div class="ph"><span class="ph-emoji" style="font-size:56px">👟</span><span class="ph-brand">${esc(s.brand)}</span></div>`}
      </div>
      <div class="d-header">
        <span class="d-brand">${esc(s.brand)}</span>
        <span class="d-tag tag-${s.status}">${statusLabel(s.status)}</span>
      </div>
      <h2 class="d-name">${esc(s.name)}</h2>

      <div class="d-section">
        <div class="d-row"><span class="d-row-l">Price</span><span class="d-row-v">$${(s.price || 0).toLocaleString('en-AU')} AUD</span></div>
        ${s.pricePaid ? `<div class="d-row"><span class="d-row-l">Paid</span><span class="d-row-v" style="color:var(--copped)">$${s.pricePaid.toLocaleString('en-AU')}</span></div>` : ''}
        <div class="d-row"><span class="d-row-l">Size</span><span class="d-row-v">${esc(s.size || '—')}</span></div>
        <div class="d-row"><span class="d-row-l">Priority</span><span class="d-row-v">${'★'.repeat(s.priority || 0)}${'☆'.repeat(5 - (s.priority || 0))}</span></div>
        <div class="d-row"><span class="d-row-l">Added</span><span class="d-row-v">${fmtDate(s.dateAdded)}</span></div>
        ${s.datePurchased ? `<div class="d-row"><span class="d-row-l">Purchased</span><span class="d-row-v" style="color:var(--copped)">${fmtDate(s.datePurchased)}</span></div>` : ''}
      </div>

      ${s.colors?.length ? `<div class="d-section"><div class="d-colors-wrap"><span class="d-row-l">Colors</span><div class="d-colors">${s.colors.map(c => `<span class="d-color-tag">${esc(c)}</span>`).join('')}</div></div></div>` : ''}
      ${s.notes ? `<div class="d-section"><div class="d-notes">${esc(s.notes)}</div></div>` : ''}

      ${s.storeLink ? `<a href="${esc(s.storeLink)}" target="_blank" rel="noopener" class="d-store-link">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 8v4a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 2 12V5a1.5 1.5 0 0 1 1.5-1.5H8"/><polyline points="9 1 13 1 13 5"/><line x1="6" y1="8" x2="13" y2="1"/></svg>
        ${esc(s.store || 'Store')}
      </a>` : ''}

      <div class="d-actions">
        <button class="d-btn btn-edit" onclick="window._edit('${s.id}')">Edit</button>
        ${s.status !== 'copped'
          ? `<button class="d-btn btn-cop" onclick="window._cop('${s.id}')">Copped It</button>`
          : `<button class="d-btn btn-want" onclick="window._uncop('${s.id}')">Back to Want</button>`}
      </div>
    `;
    dom.detailOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() { dom.detailOverlay.classList.add('hidden'); document.body.style.overflow = ''; }

  // ===== EDIT =====
  function openEdit(id) {
    closeDetail();
    editingId = id || null;
    if (id) {
      const s = sneakers.find(x => x.id === id);
      if (!s) return;
      dom.editTitle.textContent = 'Edit Sneaker';
      dom.fName.value = s.name; dom.fBrand.value = s.brand;
      dom.fImage.value = s.image || ''; dom.fPrice.value = s.price || '';
      dom.fSize.value = s.size || ''; dom.fStore.value = s.store || '';
      dom.fLink.value = s.storeLink || '';
      dom.fColors.value = (s.colors || []).join(', ');
      dom.fNotes.value = s.notes || '';
      dom.fCoppedDate.value = s.datePurchased || '';
      dom.fPricePaid.value = s.pricePaid || '';
      setSeg(s.status); setStar(s.priority || 3);
      dom.deleteBtn.classList.remove('hidden');
    } else {
      dom.editTitle.textContent = 'Add Sneaker';
      dom.editForm.reset(); setSeg('want'); setStar(3);
      dom.deleteBtn.classList.add('hidden');
      dom.fCoppedDate.value = ''; dom.fPricePaid.value = '';
    }
    toggleCoppedFields();
    dom.editOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeEdit() { dom.editOverlay.classList.add('hidden'); document.body.style.overflow = ''; editingId = null; }

  function getSeg() { return dom.fStatus.querySelector('.seg-btn.active')?.dataset.v || 'want'; }
  function setSeg(v) { dom.fStatus.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.v === v)); toggleCoppedFields(); }
  function getStar() { return parseInt(dom.fPriority.querySelector('.star.active')?.dataset.v || '3'); }
  function setStar(v) { dom.fPriority.querySelectorAll('.star').forEach(b => b.classList.toggle('active', parseInt(b.dataset.v) === v)); }
  function toggleCoppedFields() {
    const show = getSeg() === 'copped';
    dom.fCoppedDateWrap.classList.toggle('hidden', !show);
    dom.fPricePaidWrap.classList.toggle('hidden', !show);
  }

  function saveSneaker() {
    const name = dom.fName.value.trim();
    const brand = dom.fBrand.value;
    if (!name || !brand) { toast('Fill in name and brand'); return; }
    const data = {
      name, brand,
      image: dom.fImage.value.trim(),
      price: parseFloat(dom.fPrice.value) || 0,
      size: dom.fSize.value.trim(),
      store: dom.fStore.value.trim(),
      storeLink: dom.fLink.value.trim(),
      colors: dom.fColors.value.split(',').map(c => c.trim()).filter(Boolean),
      status: getSeg(), priority: getStar(),
      notes: dom.fNotes.value.trim(),
      datePurchased: dom.fCoppedDate.value || null,
      pricePaid: parseFloat(dom.fPricePaid.value) || null
    };
    if (editingId) {
      const i = sneakers.findIndex(s => s.id === editingId);
      if (i >= 0) sneakers[i] = { ...sneakers[i], ...data };
      toast('Updated');
    } else {
      data.id = uid(); data.dateAdded = new Date().toISOString().split('T')[0];
      sneakers.push(data); toast('Added');
    }
    save(); closeEdit(); render();
  }

  function deleteSneaker() {
    if (!editingId || !confirm('Remove this sneaker?')) return;
    sneakers = sneakers.filter(s => s.id !== editingId);
    save(); closeEdit(); render(); toast('Removed');
  }

  // ===== ACTIONS =====
  window._edit = id => openEdit(id);
  window._cop = id => {
    const s = sneakers.find(x => x.id === id);
    if (!s) return;
    s.status = 'copped'; s.datePurchased = new Date().toISOString().split('T')[0];
    if (!s.pricePaid) s.pricePaid = s.price;
    save(); closeDetail(); render(); toast('Nice pickup!');
  };
  window._uncop = id => {
    const s = sneakers.find(x => x.id === id);
    if (!s) return;
    s.status = 'want'; s.datePurchased = null; s.pricePaid = null;
    save(); closeDetail(); render(); toast('Back on the list');
  };

  // ===== TOAST =====
  let tt;
  function toast(msg) {
    clearTimeout(tt);
    dom.toast.textContent = msg;
    dom.toast.classList.remove('hidden');
    requestAnimationFrame(() => dom.toast.classList.add('show'));
    tt = setTimeout(() => { dom.toast.classList.remove('show'); setTimeout(() => dom.toast.classList.add('hidden'), 300); }, 2200);
  }

  // ===== HELPERS =====
  function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function statusLabel(s) { return { want: 'Want', copped: 'Bought', maybe: 'Maybe' }[s] || s; }
  function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); }

  // ===== EVENTS =====
  function bind() {
    // pills — status + brand in one row
    dom.filterPills.addEventListener('click', e => {
      const p = e.target.closest('.pill');
      if (!p) return;

      if (p.dataset.filter) {
        // status pill
        activeFilter = p.dataset.filter;
        activeBrand = null;
        // update active states
        dom.filterPills.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
        p.classList.add('active');
      } else if (p.dataset.brand) {
        // brand pill — toggle
        if (activeBrand === p.dataset.brand) {
          // deselect brand, go back to current status
          activeBrand = null;
          p.classList.remove('active');
        } else {
          // select brand
          activeBrand = p.dataset.brand;
          // remove active from all brand pills, add to this one
          dom.filterPills.querySelectorAll('.pill[data-brand]').forEach(b => b.classList.remove('active'));
          p.classList.add('active');
        }
      }
      render();
    });

    dom.list.addEventListener('click', e => {
      const c = e.target.closest('.card');
      if (c) showDetail(c.dataset.id);
    });

    dom.detailOverlay.addEventListener('click', e => { if (e.target === dom.detailOverlay) closeDetail(); });
    dom.editOverlay.addEventListener('click', e => { if (e.target === dom.editOverlay) closeEdit(); });
    dom.editClose.addEventListener('click', closeEdit);
    dom.editSave.addEventListener('click', saveSneaker);
    dom.deleteBtn.addEventListener('click', deleteSneaker);

    dom.fStatus.addEventListener('click', e => {
      const b = e.target.closest('.seg-btn'); if (!b) return;
      setSeg(b.dataset.v);
    });
    dom.fPriority.addEventListener('click', e => {
      const b = e.target.closest('.star'); if (!b) return;
      setStar(parseInt(b.dataset.v));
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!dom.editOverlay.classList.contains('hidden')) closeEdit();
        else if (!dom.detailOverlay.classList.contains('hidden')) closeDetail();
      }
    });
  }

  function init() { load(); bind(); render(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
