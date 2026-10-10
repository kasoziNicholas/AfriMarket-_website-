'use strict';
/* AfriMarket Equities frontend.
 * Security notes: all dynamic text is inserted with textContent (never innerHTML),
 * there are no inline handlers (CSP-friendly), localStorage access is guarded, and
 * CSV export neutralises spreadsheet formula injection. */

(() => {
  /* ---------- helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function h(tag, cls, text, attrs) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = String(text);
    if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }
  function icon(cls) { return h('i', cls); }
  function add(parent, ...children) { children.forEach((c) => c && parent.appendChild(c)); return parent; }
  const cx = (s) => s.split(' ').filter(Boolean);

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, val) { try { localStorage.setItem(key, val); } catch (_) { /* storage unavailable */ } },
    remove(key) { try { localStorage.removeItem(key); } catch (_) { /* ignore */ } }
  };

  function fmtCap(usd) {
    if (usd >= 1e9) return '$' + (usd / 1e9).toFixed(usd >= 1e10 ? 1 : 2).replace(/\.?0+$/, '') + ' B';
    return '$' + Math.round(usd / 1e6) + ' M';
  }
  const fmtChange = (n) => (n > 0 ? '+' : '') + n + '%';

  /* ---------- state ---------- */
  const state = {
    companies: [], exchanges: [], filtered: [], byId: new Map(), exByCode: new Map(),
    watchlist: [], view: 'cards', tab: 'directory', charts: {}, lastFocus: null
  };

  const NAV_ON = cx('bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold');
  const NAV_OFF = cx('text-slate-400 hover:text-slate-100 light:hover:text-slate-900 hover:bg-slate-800/50 font-medium');
  const VIEW_ON = cx('text-emerald-400 bg-slate-800 light:bg-white shadow');
  const VIEW_OFF = cx('text-slate-400 hover:text-slate-200 light:hover:text-slate-800');

  /* ---------- theme ---------- */
  function applyTheme(theme) {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    updateChartTheme();
  }
  function currentTheme() { return document.documentElement.classList.contains('light') ? 'light' : 'dark'; }
  function toggleTheme() {
    const next = currentTheme() === 'light' ? 'dark' : 'light';
    store.set('afri_theme', next);
    applyTheme(next);
  }

  /* ---------- watchlist ---------- */
  function loadWatchlist() {
    try {
      const raw = JSON.parse(store.get('afri_watchlist') || '[]');
      if (Array.isArray(raw)) {
        state.watchlist = raw.filter((id) => typeof id === 'string' && state.byId.has(id)).slice(0, 100);
      }
    } catch (_) { state.watchlist = []; }
  }
  function saveWatchlist() { store.set('afri_watchlist', JSON.stringify(state.watchlist)); }
  function toggleWatchlist(id) {
    if (!state.byId.has(id)) return;
    const i = state.watchlist.indexOf(id);
    if (i > -1) state.watchlist.splice(i, 1); else state.watchlist.push(id);
    saveWatchlist();
    updateBadge();
    if (state.tab === 'directory') renderDirectory();
    if (state.tab === 'watchlist') renderWatchlist();
    if (!$('#company-modal').classList.contains('hidden')) updateModalWatchBtn(id);
  }
  function updateBadge() {
    const b = $('#watchlist-badge');
    b.textContent = state.watchlist.length;
    b.classList.toggle('hidden', state.watchlist.length === 0);
  }

  /* ---------- navigation ---------- */
  function switchTab(name) {
    if (!['directory', 'analytics', 'exchanges', 'watchlist'].includes(name)) return;
    state.tab = name;
    $$('.tab-content').forEach((t) => t.classList.add('hidden'));
    $('#tab-' + name).classList.remove('hidden');
    $$('.nav-btn').forEach((btn) => {
      const on = btn.dataset.tab === name;
      NAV_ON.forEach((c) => btn.classList.toggle(c, on));
      NAV_OFF.forEach((c) => btn.classList.toggle(c, !on));
    });
    if (name === 'watchlist') renderWatchlist();
    if (name === 'analytics') setTimeout(() => Object.values(state.charts).forEach((c) => c.resize()), 50);
    window.scrollTo({ top: 0 });
  }

  function setView(view) {
    state.view = view;
    $('#cards-container').classList.toggle('hidden', view !== 'cards');
    $('#table-container').classList.toggle('hidden', view !== 'table');
    [['cards', '#btn-view-cards'], ['table', '#btn-view-table']].forEach(([v, sel]) => {
      const btn = $(sel);
      VIEW_ON.forEach((c) => btn.classList.toggle(c, v === view));
      VIEW_OFF.forEach((c) => btn.classList.toggle(c, v !== view));
    });
  }

  /* ---------- filters ---------- */
  function fillSelect(sel, values) {
    const el = $(sel);
    values.forEach(([value, label]) => el.appendChild(h('option', '', label, { value })));
  }
  function applyFilters() {
    const q = $('#search-input').value.toLowerCase().trim().slice(0, 60);
    const region = $('#filter-region').value;
    const exchange = $('#filter-exchange').value;
    const sector = $('#filter-sector').value;
    state.filtered = state.companies.filter((c) =>
      (!q || c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)) &&
      (!region || c.region === region) && (!exchange || c.exchange === exchange) && (!sector || c.sector === sector));
    renderDirectory();
    renderFilterTags({ region, exchange, sector });
  }
  function resetFilters() {
    $('#search-input').value = '';
    ['region', 'exchange', 'sector'].forEach((k) => { $('#filter-' + k).value = ''; });
    applyFilters();
  }
  function renderFilterTags(active) {
    const box = $('#active-filter-tags');
    box.replaceChildren();
    const styles = {
      region: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      exchange: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      sector: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    };
    Object.entries(active).forEach(([key, val]) => {
      if (!val) return;
      const tag = h('span', 'px-2 py-0.5 rounded-md border text-[10px] flex items-center gap-1 ' + styles[key], val + ' ');
      const x = h('button', 'hover:text-white', '', { type: 'button', 'data-action': 'remove-filter', 'data-filter': key, 'aria-label': 'Remove ' + val + ' filter' });
      x.appendChild(icon('fa-solid fa-xmark'));
      box.appendChild(add(tag, x));
    });
  }

  /* ---------- directory ---------- */
  function starButton(id, extra) {
    const saved = state.watchlist.includes(id);
    const btn = h('button', extra, '', { type: 'button', 'data-action': 'toggle-watch', 'data-id': id, 'aria-label': (saved ? 'Remove from' : 'Add to') + ' watchlist', 'aria-pressed': String(saved) });
    btn.appendChild(icon((saved ? 'fa-solid text-amber-400' : 'fa-regular') + ' fa-star'));
    return btn;
  }
  function changeBadge(n) {
    const pos = n >= 0;
    const b = h('span', 'px-2 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 ' +
      (pos ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'));
    add(b, icon('fa-solid text-[10px] ' + (pos ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down')), document.createTextNode(' ' + fmtChange(n)));
    return b;
  }

  function companyCard(c) {
    const card = h('div', 'glass-panel rounded-2xl p-5 hover:border-emerald-500/50 transition-all group flex flex-col justify-between');
    const top = h('div');
    const head = h('div', 'flex items-start justify-between gap-3 mb-3');
    const left = h('div', 'flex items-center gap-3');
    left.appendChild(h('div', 'w-11 h-11 rounded-xl bg-slate-900 light:bg-slate-100 flex items-center justify-center font-bold text-xs text-emerald-400 border border-slate-700 light:border-slate-300', c.ticker.slice(0, 4)));
    const names = h('div');
    add(names, h('h4', 'font-bold text-base text-white light:text-slate-900 group-hover:text-emerald-400 transition line-clamp-1', c.name),
      h('span', 'text-xs text-slate-400', c.exchange + ' \u2022 ' + c.country));
    left.appendChild(names);
    add(head, left, starButton(c.id, 'p-2 rounded-lg text-slate-500 hover:text-amber-400 transition'));

    const tags = h('div', 'flex flex-wrap items-center gap-2 my-3');
    add(tags, h('span', 'px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700', c.sector),
      h('span', 'px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/60 light:bg-slate-200 text-slate-400 light:text-slate-600', c.region));
    add(top, head, tags, h('p', 'text-xs text-slate-400 light:text-slate-600 line-clamp-2 mb-4', c.description));

    const foot = h('div', 'pt-3 border-t border-slate-800/80 light:border-slate-200/80 flex items-center justify-between gap-2');
    const cap = h('div'); add(cap, h('span', 'text-[10px] text-slate-400 uppercase font-semibold block', 'Market Cap'), h('span', 'font-bold text-sm text-slate-200 light:text-slate-900', fmtCap(c.marketCapUsd)));
    const price = h('div', 'text-right'); add(price, h('span', 'text-[10px] text-slate-400 uppercase font-semibold block', 'Share Price'), h('span', 'font-semibold text-xs text-slate-300 light:text-slate-700', c.price));
    add(foot, cap, price, changeBadge(c.change1Y));

    const more = h('button', 'mt-4 w-full py-2 rounded-xl bg-slate-800 light:bg-slate-200 group-hover:bg-emerald-500 group-hover:text-slate-950 text-xs font-bold text-slate-300 light:text-slate-800 transition flex items-center justify-center gap-2', 'View details ', { type: 'button', 'data-action': 'open-modal', 'data-id': c.id });
    more.appendChild(icon('fa-solid fa-arrow-right text-[10px]'));
    return add(card, top, foot, more);
  }

  function companyRow(c) {
    const tr = h('tr', 'hover:bg-slate-900/60 light:hover:bg-slate-100 transition cursor-pointer', '', { 'data-action': 'open-modal', 'data-id': c.id, tabindex: '0' });
    const td = (cls) => h('td', 'py-3.5 px-4 ' + (cls || ''));
    const c1 = td('font-semibold text-slate-100 light:text-slate-900');
    const wrap = h('div', 'flex items-center gap-2.5');
    const nm = h('div'); add(nm, h('div', 'font-bold text-sm leading-snug', c.name), h('span', 'text-xs font-mono text-emerald-400', c.ticker));
    add(wrap, h('span', 'w-8 h-8 rounded-lg bg-slate-800 light:bg-slate-200 flex items-center justify-center text-[10px] font-bold text-emerald-400', c.ticker.slice(0, 3)), nm);
    c1.appendChild(wrap);
    const c2 = td('text-xs'); add(c2, h('span', 'font-semibold block', c.exchange), h('span', 'text-slate-400 text-[11px]', c.country));
    const c3 = td('text-xs'); c3.appendChild(h('span', 'px-2 py-0.5 rounded bg-slate-800 light:bg-slate-200 text-[11px]', c.sector));
    const c4 = td('text-xs font-bold text-right'); c4.textContent = fmtCap(c.marketCapUsd);
    const c5 = td('text-xs text-right font-mono'); c5.textContent = c.price;
    const c6 = td('text-xs text-right font-bold ' + (c.change1Y >= 0 ? 'text-emerald-400' : 'text-rose-400')); c6.textContent = fmtChange(c.change1Y);
    const c7 = td('text-center'); c7.appendChild(starButton(c.id, 'p-1.5 rounded text-slate-500 hover:text-amber-400 transition'));
    return add(tr, c1, c2, c3, c4, c5, c6, c7);
  }

  function renderDirectory() {
    const cards = $('#cards-container'); const body = $('#companies-table-body');
    cards.replaceChildren(); body.replaceChildren();
    $('#filtered-count').textContent = state.filtered.length;
    if (!state.filtered.length) {
      const empty = h('div', 'col-span-full py-12 text-center text-slate-400 glass-panel rounded-2xl');
      add(empty, h('p', 'text-base font-semibold text-slate-300', 'No matching equities found'),
        h('p', 'text-xs text-slate-500 mt-1', 'Try a different search or clear the filters.'));
      cards.appendChild(empty);
      return;
    }
    state.filtered.forEach((c) => { cards.appendChild(companyCard(c)); body.appendChild(companyRow(c)); });
  }

  /* ---------- watchlist tab ---------- */
  function renderWatchlist() {
    const grid = $('#watchlist-grid');
    const items = state.watchlist.map((id) => state.byId.get(id)).filter(Boolean);
    $('#watchlist-empty').classList.toggle('hidden', items.length > 0);
    grid.classList.toggle('hidden', items.length === 0);
    $('#clear-watchlist-btn').classList.toggle('hidden', items.length === 0);
    grid.replaceChildren();
    items.forEach((c) => grid.appendChild(companyCard(c)));
  }

  /* ---------- modal ---------- */
  function updateModalWatchBtn(id) {
    const btn = $('#modal-watchlist-btn');
    const saved = state.watchlist.includes(id);
    btn.dataset.id = id; btn.dataset.action = 'toggle-watch';
    btn.className = 'px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ' + (saved
      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
      : 'bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-800 hover:bg-slate-700');
    btn.replaceChildren(icon((saved ? 'fa-solid' : 'fa-regular') + ' fa-star'), document.createTextNode(saved ? ' Saved in watchlist' : ' Add to watchlist'));
  }
  function openModal(id) {
    const c = state.byId.get(id);
    if (!c) return;
    const ex = state.exByCode.get(c.exchange);
    state.lastFocus = document.activeElement;
    $('#modal-logo-box').textContent = c.ticker.slice(0, 4);
    $('#modal-company-name').textContent = c.name;
    $('#modal-ticker').textContent = c.ticker;
    $('#modal-exchange-country').textContent = (ex ? ex.name : c.exchange) + ' (' + c.exchange + ') \u2022 ' + c.country;
    $('#modal-market-cap').textContent = fmtCap(c.marketCapUsd);
    $('#modal-price').textContent = c.price;
    const ch = $('#modal-change');
    ch.textContent = fmtChange(c.change1Y);
    ch.className = 'text-lg font-bold mt-0.5 ' + (c.change1Y >= 0 ? 'text-emerald-400' : 'text-rose-400');
    $('#modal-sector').textContent = c.sector;
    $('#modal-founded').textContent = c.founded;
    $('#modal-hq').textContent = c.headquarters;
    $('#modal-exchange').textContent = ex ? ex.name : c.exchange;
    $('#modal-description').textContent = c.description;
    const ul = $('#modal-highlights'); ul.replaceChildren();
    c.highlights.forEach((t) => ul.appendChild(h('li', '', t)));
    updateModalWatchBtn(c.id);
    $('#company-modal').classList.remove('hidden');
    $('#modal-close').focus();
  }
  function closeModal() {
    $('#company-modal').classList.add('hidden');
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }

  /* ---------- exchanges tab ---------- */
  function renderExchanges() {
    const grid = $('#exchanges-cards-grid'); grid.replaceChildren();
    state.exchanges.forEach((ex) => {
      const card = h('div', 'glass-panel rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition');
      const top = h('div');
      const head = h('div', 'flex items-center gap-3 mb-4');
      const ic = h('div', 'w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl');
      ic.appendChild(icon('fa-solid ' + (/^fa-[a-z0-9-]+$/.test(ex.icon) ? ex.icon : 'fa-landmark')));
      const t = h('div'); add(t, h('span', 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20', ex.code), h('h3', 'font-bold text-base text-white light:text-slate-900 mt-0.5', ex.name));
      add(head, ic, t);
      const rows = h('div', 'space-y-2 border-t border-b border-slate-800/80 light:border-slate-200 py-3 text-xs');
      [['Location', ex.city + ', ' + ex.country], ['Est. market cap', ex.marketCap], ['Listed companies', ex.listedCount], ['Benchmark index', ex.benchmarkIndex], ['Currency', ex.currency]].forEach(([k, v]) => {
        const r = h('div', 'flex justify-between gap-3'); add(r, h('span', 'text-slate-400', k), h('span', 'font-semibold text-slate-200 light:text-slate-800 text-right', v)); rows.appendChild(r);
      });
      add(top, head, h('p', 'text-xs text-slate-400 light:text-slate-600 mb-5 leading-relaxed', ex.description), rows);
      const foot = h('div', 'mt-4 flex items-center justify-between text-xs text-slate-400');
      const hrs = h('span'); add(hrs, icon('fa-regular fa-clock mr-1'), document.createTextNode(ex.tradingHours));
      const link = h('button', 'text-emerald-400 hover:underline font-semibold text-xs', 'View equities ', { type: 'button', 'data-action': 'filter-exchange', 'data-code': ex.code });
      link.appendChild(icon('fa-solid fa-arrow-right text-[10px]'));
      add(foot, hrs, link);
      grid.appendChild(add(card, top, foot));
    });
  }

  /* ---------- analytics ---------- */
  const PALETTE = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];
  const themeColors = () => (currentTheme() === 'light'
    ? { text: '#475569', grid: 'rgba(0,0,0,0.08)', border: '#ffffff' }
    : { text: '#94a3b8', grid: 'rgba(255,255,255,0.05)', border: '#0f172a' });

  function initCharts() {
    if (typeof Chart === 'undefined') return;
    const bySector = {}; const byRegion = {};
    state.companies.forEach((c) => {
      bySector[c.sector] = (bySector[c.sector] || 0) + c.marketCapUsd / 1e9;
      byRegion[c.region] = (byRegion[c.region] || 0) + 1;
    });
    const col = themeColors();
    state.charts.sector = new Chart($('#sectorChart'), {
      type: 'doughnut',
      data: { labels: Object.keys(bySector), datasets: [{ data: Object.values(bySector).map((v) => +v.toFixed(2)), backgroundColor: PALETTE, borderWidth: 2, borderColor: col.border }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: col.text, font: { size: 11 }, padding: 12 } }, tooltip: { callbacks: { label: (ctx) => ' ' + ctx.label + ': $' + ctx.raw + ' B' } } } }
    });
    state.charts.region = new Chart($('#regionalChart'), {
      type: 'bar',
      data: { labels: Object.keys(byRegion), datasets: [{ label: 'Companies', data: Object.values(byRegion), backgroundColor: '#10b981', borderRadius: 8 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: col.grid }, ticks: { color: col.text, precision: 0 } }, x: { grid: { display: false }, ticks: { color: col.text } } }, plugins: { legend: { display: false } } }
    });
  }
  function updateChartTheme() {
    const { sector, region } = state.charts;
    const col = themeColors();
    if (sector) {
      sector.options.plugins.legend.labels.color = col.text;
      sector.data.datasets[0].borderColor = col.border;
      sector.update();
    }
    if (region) {
      region.options.scales.y.ticks.color = col.text; region.options.scales.x.ticks.color = col.text;
      region.options.scales.y.grid.color = col.grid;
      region.update();
    }
  }
  function renderTop10() {
    const body = $('#top10-table-body'); body.replaceChildren();
    [...state.companies].sort((a, b) => b.marketCapUsd - a.marketCapUsd).slice(0, 10).forEach((c, i) => {
      const tr = h('tr', 'hover:bg-slate-900/40 light:hover:bg-slate-100 transition cursor-pointer', '', { 'data-action': 'open-modal', 'data-id': c.id, tabindex: '0' });
      const cell = (cls, txt) => h('td', 'py-3 px-4 ' + cls, txt);
      add(tr, cell('font-extrabold text-sm text-amber-400', '#' + (i + 1)), cell('font-bold text-slate-100 light:text-slate-900', c.name),
        cell('text-xs font-mono text-emerald-400', c.ticker + ' (' + c.exchange + ')'), cell('text-xs text-slate-300 light:text-slate-700', c.sector),
        cell('text-xs font-bold text-right text-slate-100 light:text-slate-900', fmtCap(c.marketCapUsd)),
        cell('text-xs text-right font-bold ' + (c.change1Y >= 0 ? 'text-emerald-400' : 'text-rose-400'), fmtChange(c.change1Y)));
      body.appendChild(tr);
    });
  }

  /* ---------- CSV export (formula-injection safe) ---------- */
  function csvText(v) {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }
  function exportCSV() {
    const head = ['Company', 'Ticker', 'Exchange', 'Country', 'Region', 'Sector', 'Market Cap (USD)', 'Share Price', '1Y Change %'];
    const rows = state.companies.map((c) => [csvText(c.name), csvText(c.ticker), csvText(c.exchange), csvText(c.country), csvText(c.region), csvText(c.sector), c.marketCapUsd, csvText(c.price), c.change1Y]);
    const csv = [head.map(csvText).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = h('a', '', '', { href: url, download: 'african_listed_companies.csv' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------- events (delegation, no inline handlers) ---------- */
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) { switchTab(tabBtn.dataset.tab); return; }
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, id } = el.dataset;
    if (action === 'toggle-watch') { e.stopPropagation(); toggleWatchlist(id); }
    else if (action === 'open-modal') openModal(id);
    else if (action === 'remove-filter') { $('#filter-' + el.dataset.filter).value = ''; applyFilters(); }
    else if (action === 'filter-exchange') { switchTab('directory'); $('#filter-exchange').value = el.dataset.code; applyFilters(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#company-modal').classList.contains('hidden')) closeModal();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-action="open-modal"]')) { e.preventDefault(); openModal(e.target.dataset.id); }
  });
  $('#company-modal').addEventListener('click', (e) => { if (e.target.id === 'company-modal') closeModal(); });
  $('#modal-close').addEventListener('click', closeModal);
  $('#modal-close-2').addEventListener('click', closeModal);
  $('#theme-toggle').addEventListener('click', toggleTheme);
  $('#export-btn').addEventListener('click', exportCSV);
  $('#reset-btn').addEventListener('click', resetFilters);
  $('#btn-view-cards').addEventListener('click', () => setView('cards'));
  $('#btn-view-table').addEventListener('click', () => setView('table'));
  $('#search-input').addEventListener('input', applyFilters);
  ['region', 'exchange', 'sector'].forEach((k) => $('#filter-' + k).addEventListener('change', applyFilters));
  $('#clear-watchlist-btn').addEventListener('click', () => { state.watchlist = []; store.remove('afri_watchlist'); updateBadge(); renderWatchlist(); });

  /* ---------- boot ---------- */
  async function getJson(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctrl.signal, credentials: 'omit' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally { clearTimeout(timer); }
  }
  const validCompany = (c) => c && typeof c.id === 'string' && typeof c.name === 'string' && typeof c.ticker === 'string' &&
    typeof c.marketCapUsd === 'number' && typeof c.change1Y === 'number' && Array.isArray(c.highlights);

  async function boot() {
    applyTheme(store.get('afri_theme') === 'light' ? 'light' : 'dark');
    switchTab('directory'); setView('cards');
    try {
      const [cj, ej] = await Promise.all([getJson('/api/companies'), getJson('/api/exchanges')]);
      state.companies = (cj.companies || []).filter(validCompany);
      state.exchanges = ej.exchanges || [];
      const meta = cj.meta || {};
      const banner = $('#data-banner');
      banner.textContent = meta.dataStatus === 'illustrative'
        ? 'Sample data as of ' + meta.asOf + '. Prices and market caps are illustrative, not live quotes.'
        : 'Data as of ' + (meta.asOf || 'unknown') + '. Quotes may be delayed.';
      banner.classList.remove('hidden');
    } catch (err) {
      const box = $('#load-error');
      box.textContent = 'Could not load market data. Please try again later.';
      box.classList.remove('hidden');
      return;
    }
    state.byId = new Map(state.companies.map((c) => [c.id, c]));
    state.exByCode = new Map(state.exchanges.map((e) => [e.code, e]));
    state.filtered = [...state.companies];
    loadWatchlist(); updateBadge();

    const uniq = (k) => [...new Set(state.companies.map((c) => c[k]))].sort();
    fillSelect('#filter-region', uniq('region').map((v) => [v, v]));
    fillSelect('#filter-exchange', state.exchanges.map((e) => [e.code, e.code + ' (' + e.country + ')']));
    fillSelect('#filter-sector', uniq('sector').map((v) => [v, v]));

    const totalCap = state.companies.reduce((s, c) => s + c.marketCapUsd, 0);
    $('#stat-companies').textContent = state.companies.length;
    $('#stat-exchanges').textContent = new Set(state.companies.map((c) => c.exchange)).size;
    $('#stat-cap').textContent = fmtCap(totalCap);
    $('#stat-sectors').textContent = uniq('sector').length;

    renderDirectory(); renderExchanges(); renderTop10(); initCharts();
  }
  boot();
})();
