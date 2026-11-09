/* app.js — router, shared UI (modal, menu, toast, search), Overview and Settings pages */
// MODAL OYNA: Modal.form(sarlavha, maydonlar, qiymatlar, {onSave, onDelete})
const Modal = {
  close() {
    $('#modal-root').innerHTML = '';
  },
  open(title, body) {
    $('#modal-root').innerHTML =
      `<div class="overlay" data-act="mClose"><div class="modal" role="dialog"><h3>${esc(title)}<button class="icon-btn" data-act="mClose">${ic('x')}</button></h3>${body}</div></div>`;
    lucide.createIcons();
  },
  /* fields: [{n,l,type,opts,req}]  vals: object  */
  form(title, fields, vals, { onSave, onDelete, extra = '' }) {
    const f = fields
      .map((x) => {
        const v = vals[x.n] ?? '';
        let c;
        if (x.type === 'select')
          c = `<select class="in" name="${x.n}">${x.opts.map((o) => `<option value="${esc(o[0])}" ${o[0] == v ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
        else if (x.type === 'textarea')
          c = `<textarea class="in" name="${x.n}" rows="6">${esc(v)}</textarea>`;
        else
          c = `<input class="in" name="${x.n}" type="${x.type || 'text'}" value="${esc(v)}" ${x.list ? `list="${x.list}"` : ''} ${x.min ? `min="${x.min}"` : ''}>`;
        return `<div class="fld"><label>${esc(x.l)}</label>${c}</div>`;
      })
      .join('');
    this.open(
      title,
      `<form id="mform" novalidate>${f}${extra}<div class="mf">${onDelete ? `<button type="button" class="btn btn-d" data-act="mDelete">${ic('trash-2')}${t('delete')}</button>` : ''}<span class="sp"></span><button type="button" class="btn btn-g" data-act="mClose">${t('cancel')}</button><button class="btn btn-p">${t('save')}</button></div></form>`,
    );
    const form = $('#mform');
    this._del = onDelete;
    form.onsubmit = (e) => {
      e.preventDefault();
      const o = Object.fromEntries(new FormData(form));
      const bad = fields.find((x) => x.req && !String(o[x.n] || '').trim());
      if (bad) {
        form.elements[bad.n].focus();
        toast(t('required'));
        return;
      }
      onSave(o);
      Modal.close();
    };
    setTimeout(() => form.elements[fields[0].n]?.focus(), 30);
  },
};
Actions.mClose = (a, e) => {
  if (a.classList.contains('overlay') && e.target !== a) return;
  Modal.close();
};
Actions.mDelete = () => {
  const f = Modal._del;
  Modal.close();
  f && f();
};

// Kichik ochiladigan menyu ("..." tugmalari)
const Menu = {
  close() {
    $$('.menu,.bell-p').forEach((m) => m.remove());
  },
  show(anchor, items) {
    this.close();
    const m = document.createElement('div');
    m.className = 'menu';
    m.innerHTML = items
      .map(
        (it, i) =>
          `<button data-mi="${i}" class="${it.danger ? 'dng' : ''}">${it.i ? ic(it.i) : ''}<span>${esc(it.l)}</span>${it.check ? ic('check', 'ck') : ''}</button>`,
      )
      .join('');
    document.body.appendChild(m);
    lucide.createIcons();
    const r = anchor.getBoundingClientRect(),
      w = m.offsetWidth,
      h = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + 'px';
    m.style.top =
      (r.bottom + h + 12 > innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6) + 'px';
    m.onclick = (e) => {
      const b = e.target.closest('[data-mi]');
      if (b) {
        Menu.close();
        items[b.dataset.mi].fn();
      }
    };
  },
};
// Pastda chiqadigan qisqa xabar
function toast(msg) {
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = msg;
  $('#toasts').appendChild(d);
  setTimeout(() => d.remove(), 2600);
}

/* ---------------- Overview ---------------- */
// ---------- UMUMIY KO'RINISH (Dashboard) sahifasi ----------
const Overview = {
  week: 'this', // grafikda qaysi hafta ko'rsatiladi: 'this' yoki 'last'
  render() {
    const s = Store.get('settings'),
      tasks = Store.get('tasks'),
      ev = Store.get('events'),
      td = D.today(),
      now = new Date();
    const done = tasks.filter((x) => x.status === 'done').length,
      total = tasks.length,
      open = total - done;
    const study = Store.get('study'),
      sum = study.reduce((a, b) => a + b, 0),
      prod = total ? Math.round((done / total) * 100) : 0;
    const te = ev.filter((e) => e.date === td).sort((a, b) => a.time.localeCompare(b.time));
    const cls = te.filter((e) => e.type === 'class').length,
      h = now.getHours(),
      max = Math.max(...study);
    // Grafik uchun tanlangan hafta ma'lumoti (Shu hafta / O'tgan hafta)
    const shown = this.week === 'last' ? Store.get('lastWeek') : study,
      shownSum = shown.reduce((a, b) => a + b, 0),
      shownMax = Math.max(...shown);
    const g = h < 12 ? 'gm' : h < 18 ? 'ga' : 'ge',
      col = { class: 'var(--pu)', study: 'var(--bl)', meeting: 'var(--or)', deadline: 'var(--or)' };
    const stats = [
      ['tasks', 'square-check-big', 'c-pu', 'totalTasks', total, '+12%'],
      ['tasks', 'layout-grid', 'c-bl', 'completed', done, '+8%'],
      ['analytics', 'clock', 'c-or', 'studyHours', Math.round(sum * 10) / 10 + 'h', '+18%'],
      ['analytics', 'chart-column', 'c-gr', 'productivity', prod + '%', '+6%'],
    ];
    const dls = tasks
        .filter((x) => x.status !== 'done')
        .sort((a, b) => a.due.localeCompare(b.due))
        .slice(0, 4),
      cc = ['c-pu', 'c-bl', 'c-or', 'c-pu'];
    const acts = Store.get('activity', []).slice(0, 4),
      ai = {
        task: ['square-check-big', 'c-gr'],
        focus: ['clock', 'c-pu'],
        note: ['file-text', 'c-bl'],
        record: ['chart-column', 'c-or'],
      };
    return `<div class="page-h"><div><div class="muted sm" style="font-weight:500">${t('dowLong')[D.wd()]}, ${t('monthsLong')[now.getMonth()]} ${now.getDate()}</div>
      <h1 style="margin-top:10px;font-size:32px">${t(g)}, ${esc(s.first)} <span style="color:var(--pu2)">✦</span></h1><p>${t('youHave', { t: open, c: cls })}</p></div>
      <button class="btn btn-p" data-act="taskNew">${ic('plus')}${t('addNewTask')}</button></div>
    <div class="grid4">${stats.map((x) => `<div class="card stat"><div class="si ${x[2]}">${ic(x[1])}</div><div><div class="lbl">${t(x[3])}</div><div class="num">${x[4]}</div><div class="tr"><b>↗︎ ${x[5]}</b> ${t('fromLast')}</div></div><button class="icon-btn dots" data-act="statMenu" data-p="${x[0]}">${ic('ellipsis')}</button></div>`).join('')}</div>
    <div class="row2"><div class="card"><div class="ch"><div><h3>${t('weeklyProd')}</h3><p>${t('focusedWeek')}</p></div><button class="select" data-act="ovWeek">${t(this.week === 'last' ? 'lastWeek' : 'thisWeek')}${ic('chevron-down')}</button></div>
      <div class="big"><b>${Math.round(shownSum * 10) / 10}</b><span>${t('hours')}</span><span class="pill">↗︎ 18.2%</span></div>
      <div class="bars">${[8, 6, 4, 2, 0].map((v) => `<div class="gl ${v ? '' : 'z'}" style="bottom:${(v / 8) * 100}%"><span>${v}h</span></div>`).join('')}${shown.map((v) => `<div class="bar" style="height:${Math.max((v / 8) * 100, 1)}%">${v === shownMax && v > 0 ? `<em>${Math.round(v * 10) / 10}h</em>` : ''}</div>`).join('')}</div>
      <div class="bx">${t('dow')
        .map((d) => `<span>${d}</span>`)
        .join('')}</div></div>
    <div class="card"><div class="ch"><div><h3>${t('todaySched')}</h3><p>${t('dowLong')[D.wd()]}, ${t('months')[now.getMonth()]} ${now.getDate()}</p></div><button class="link" data-act="go" data-p="calendar">${t('viewCal')}${ic('chevron-right')}</button></div>
      <div class="tl">${
        te.length
          ? te
              .map((e) => {
                const [tm, ap] = D.time(e.time);
                return `<div class="tl-i"><div class="tl-t">${tm}<small>${ap}</small></div><div class="tl-d" style="background:${col[e.type]}"></div><div class="tl-b"><span class="tag ${e.type}">${t(e.type)}</span><b>${esc(seedText(e, 'title'))}</b></div></div>`;
              })
              .join('')
          : `<div class="empty">${t('noEvents')}</div>`
      }</div>
      <button class="cta" data-act="go" data-p="focus"><div class="pi">${ic('play')}</div><div><b>${t('readyFocus')}</b><span>${t('start25', { n: s.dur.focus })}</span></div>${ic('chevron-right', 'muted')}</button></div></div>
    <div class="row2"><div class="card"><div class="ch"><div><h3>${t('deadlines')}</h3><p>${t('stayAhead')}</p></div><button class="link" data-act="go" data-p="tasks">${t('viewAll')}${ic('chevron-right')}</button></div>
      ${
        dls.length
          ? dls
              .map((x, i) => {
                const d = D.parse(x.due);
                return `<div class="dl"><div class="dbox ${cc[i]}">${d.getDate()}<small>${t('months')[d.getMonth()].toUpperCase()}</small></div><div><b>${esc(seedText(x, 'title'))}</b><span>${esc(subjName(x.subject))} • ${D.rel(x.due)}</span></div><span class="tag ${x.priority}">${t(x.priority)}</span></div>`;
              })
              .join('')
          : `<div class="empty">${t('noDeadlines')}</div>`
      }</div>
    <div class="card"><div class="ch"><div><h3>${t('recent')}</h3><p>${t('latest')}</p></div><button class="icon-btn bd" data-act="actMenu">${ic('ellipsis')}</button></div>
      ${acts.length ? acts.map((a) => `<div class="act"><div class="ai ${ai[a.kind][1]}">${ic(ai[a.kind][0])}</div><div><b>${t('act_' + a.kind)}</b><span>${esc(a.sub)}</span></div><small>${D.ago(a.ts)}</small></div>`).join('') : `<div class="empty">${t('noActivity')}</div>`}</div></div>`;
  },
};
// "Shu hafta / O'tgan hafta" tanlash menyusi (Umumiy ko'rinish grafigi)
Actions.ovWeek = (a) =>
  Menu.show(
    a,
    [
      ['this', 'thisWeek'],
      ['last', 'lastWeek'],
    ].map(([k, l]) => ({
      l: t(l),
      check: Overview.week === k,
      fn: () => {
        Overview.week = k;
        App.render();
      },
    })),
  );
Actions.go = (a) => App.go(a.dataset.p);
Actions.statMenu = (a) =>
  Menu.show(a, [
    {
      l: t('openPage', { p: t('nav_' + a.dataset.p) }),
      i: 'arrow-up-right',
      fn: () => App.go(a.dataset.p),
    },
  ]);
Actions.actMenu = (a) =>
  Menu.show(a, [
    {
      l: t('clearAct'),
      i: 'trash-2',
      danger: 1,
      fn: () => {
        Store.set('activity', []);
        App.render();
      },
    },
  ]);

/* ---------------- Settings ---------------- */
// ---------- SOZLAMALAR sahifasi ----------
const Settings = {
  draft: null,
  render() {
    const s = (this.draft = JSON.parse(JSON.stringify(Store.get('settings'))));
    const sw = (k, key) =>
      `<div class="trow"><div><b>${t('n_' + k)}</b><span>${t('n_' + k + '_d')}</span></div><button class="sw ${s.notif[k] ? 'on' : ''}" data-act="swToggle" data-k="${k}" role="switch" aria-checked="${!!s.notif[k]}"></button></div>`;
    const th = (k, i, bg, a, b) =>
      `<button class="th ${s.theme === k ? 'on' : ''}" data-act="setTheme" data-v="${k}"><div class="pv" style="background:${bg}"><i style="width:22%;background:${a}"></i><div style="flex:1;display:flex;flex-direction:column;gap:6px"><i style="height:12px;background:${b}"></i><i style="flex:1;background:${a}"></i></div></div><b>${ic(i)}${t(k)}</b></button>`;
    return `<div class="page-h"><div><h1>${t('settings')}</h1><p>${t('setSub')}</p></div><button class="btn btn-p" data-act="saveSettings">${t('saveChanges')}</button></div>
    <div class="set-l"><div class="sn">${[
      ['profile', 'layout-grid'],
      ['notif', 'bell'],
      ['appear', 'sun'],
      ['pref', 'settings'],
    ]
      .map(
        (x, i) =>
          `<button class="${i ? '' : 'on'}" data-act="secGo" data-s="${x[0]}">${ic(x[1])}${t('sec_' + x[0])}</button>`,
      )
      .join('')}</div>
    <div>
     <div class="card sec" id="sec-profile"><h3>${t('profInfo')}</h3><p>${t('profSub')}</p>
      <div class="prof"><div class="avatar" id="setAv"></div><label class="btn btn-g" style="cursor:pointer">${t('changePhoto')}<input type="file" id="photo" accept="image/png,image/jpeg" hidden></label><button class="rm" data-act="rmPhoto">${t('remove')}</button><small>${t('photoHint')}</small></div>
      <div class="f2"><div class="fld"><label>${t('firstName')}</label><input class="in" data-f="first" value="${esc(s.first)}"></div><div class="fld"><label>${t('lastName')}</label><input class="in" data-f="last" value="${esc(s.last)}"></div></div>
      <div class="fld"><label>${t('email')}</label><input class="in" type="email" data-f="email" value="${esc(s.email)}"></div>
      <div class="fld" style="margin:0"><label>${t('university')}</label><input class="in" data-f="uni" value="${esc(s.uni)}"></div></div>
     <div class="card sec" id="sec-notif"><h3>${t('notifT')}</h3><p>${t('notifSub')}</p>${sw('task')}${sw('classes')}${sw('weekly')}</div>
     <div class="card sec" id="sec-appear"><h3>${t('appearT')}</h3><p>${t('appearSub')}</p><div class="themes">${th('dark', 'moon', '#0B1020', '#1A2238', '#252F4A')}${th('light', 'sun', '#E6EAF3', '#fff', '#fff')}${th('system', 'monitor', 'linear-gradient(135deg,#0B1020 50%,#E6EAF3 50%)', '#2a3350', '#4a5575')}</div></div>
     <div class="card sec" id="sec-pref"><h3>${t('prefT')}</h3><p>${t('prefSub')}</p>
      <div class="fld"><label>${t('language')}</label><select class="in" data-f="lang"><option value="en" ${Lang.cur === 'en' ? 'selected' : ''}>English</option><option value="uz" ${Lang.cur === 'uz' ? 'selected' : ''}>O'zbekcha</option></select></div>
      <div class="f3"><div class="fld"><label>${t('durFocus')}</label><input class="in" type="number" min="1" max="120" data-d="focus" value="${s.dur.focus}"></div><div class="fld"><label>${t('durShort')}</label><input class="in" type="number" min="1" max="60" data-d="short" value="${s.dur.short}"></div><div class="fld"><label>${t('durLong')}</label><input class="in" type="number" min="1" max="90" data-d="long" value="${s.dur.long}"></div></div>
      <button class="btn btn-d" data-act="resetData" style="margin-top:6px">${ic('rotate-ccw')}${t('resetData')}</button></div>
    </div></div>`;
  },
  mount(v) {
    this.avatar();
    $('#photo', v).onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 2 * 1048576) {
        toast(t('photoBig'));
        return;
      }
      const r = new FileReader();
      r.onload = () => {
        this.draft.avatar = r.result;
        this.avatar();
      };
      r.readAsDataURL(f);
    };
    v.oninput = (e) => {
      const el = e.target;
      if (el.dataset.f && el.dataset.f !== 'lang') this.draft[el.dataset.f] = el.value;
      if (el.dataset.d) this.draft.dur[el.dataset.d] = Math.max(1, +el.value || 1);
    };
    $('[data-f=lang]', v).onchange = (e) => {
      Store.set('settings', this.draft);
      Lang.set(e.target.value);
    };
    v.onscroll = () => {
      let cur = 'profile';
      ['profile', 'notif', 'appear', 'pref'].forEach((k) => {
        const el = $('#sec-' + k);
        if (el && el.getBoundingClientRect().top < 180) cur = k;
      });
      $$('.sn button', v).forEach((b) => b.classList.toggle('on', b.dataset.s === cur));
    };
  },
  avatar() {
    const s = this.draft || Store.get('settings');
    const a = $('#setAv');
    if (!a) return;
    a.style.backgroundImage = s.avatar ? `url(${s.avatar})` : '';
    a.textContent = s.avatar ? '' : (s.first[0] || '') + (s.last[0] || '');
  },
};
Actions.swToggle = (a) => {
  const k = a.dataset.k;
  Settings.draft.notif[k] = !Settings.draft.notif[k];
  a.classList.toggle('on', Settings.draft.notif[k]);
  a.setAttribute('aria-checked', Settings.draft.notif[k]);
};
Actions.setTheme = (a) => {
  Settings.draft.theme = a.dataset.v;
  $$('.th').forEach((b) => b.classList.toggle('on', b === a));
  App.applyTheme(a.dataset.v);
};
Actions.rmPhoto = () => {
  Settings.draft.avatar = '';
  Settings.avatar();
};
Actions.secGo = (a) => {
  $('#sec-' + a.dataset.s).scrollIntoView({ behavior: 'smooth', block: 'start' });
};
Actions.saveSettings = () => {
  const s = Settings.draft;
  s.first = s.first.trim() || 'Alex';
  Store.set('settings', s);
  Timer.settingsChanged();
  App.updateChrome();
  toast(t('saved'));
};
Actions.resetData = () => {
  if (confirm(t('resetAsk'))) {
    Store.reset();
    Timer.settingsChanged();
    App.applyTheme('dark');
    App.updateChrome();
    App.render();
    toast(t('resetDone'));
  }
};

/* ---------------- App shell ---------------- */
// ASOSIY DASTUR: sahifalarni almashtirish, mavzu, yon panel, ishga tushirish
const App = {
  page: 'overview',
  pages: {
    overview: Overview,
    tasks: Tasks,
    calendar: Cal,
    focus: Timer,
    notes: Notes,
    analytics: Analytics,
    settings: Settings,
  },
  go(p) {
    if (!this.pages[p]) p = 'overview';
    this.page = p;
    Store.set('page', p);
    history.replaceState(null, '', '#' + p);
    $$('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.page === p));
    this.closeSide();
    this.render();
    $('#view').scrollTop = 0;
  },
  render() {
    const v = $('#view'),
      pg = this.pages[this.page];
    Analytics.destroy();
    Menu.close();
    $('#pageLabel').textContent = t('nav_' + this.page);
    v.onscroll = null;
    v.oninput = null;
    v.innerHTML = pg.render();
    pg.mount && pg.mount(v);
    Lang.apply(v);
    lucide.createIcons();
    this.updateChrome(true);
  },
  updateChrome(skip) {
    const s = Store.get('settings');
    Lang.apply();
    $('#semLabel').textContent = t(Store.get('sem', 'semSpring'));
    $('#taskBadge').textContent = Store.get('tasks', []).filter((x) => x.status !== 'done').length;
    const av = $('#sbAvatar');
    av.style.backgroundImage = s.avatar ? `url(${s.avatar})` : '';
    av.textContent = s.avatar ? '' : (s.first[0] || '') + (s.last[0] || '');
    $('#sbName').textContent = s.first + ' ' + s.last;
    $('#sbMail').textContent = s.email;
    $('#pageLabel').textContent = t('nav_' + this.page);
    $('#bellDot').style.display = Store.get('bellSeen') === D.today() ? 'none' : 'block';
    document.title = 'UniFlow — ' + t('nav_' + this.page);
    $$('.lang-btn').forEach((b) => b.classList.toggle('on', b.dataset.l === Lang.cur));
  },
  applyTheme(m) {
    const dark =
      m === 'dark' || (m === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  },
  closeSide() {
    $('#sidebar').classList.remove('open');
    $('#scrim').classList.remove('show');
  },
  init() {
    Store.init();
    document.documentElement.lang = Lang.cur;
    this.applyTheme(Store.get('settings').theme);
    $$('.nav-item').forEach((b) => (b.onclick = () => this.go(b.dataset.page)));
    $$('.lang-btn').forEach((b) => (b.onclick = () => Lang.set(b.dataset.l)));
    $('#scrim').onclick = () => this.closeSide();
    const g = $('#gsearch');
    g.oninput = () => Search.run(g.value);
    g.onfocus = () => g.value && Search.run(g.value);
    this.go((location.hash || '#' + Store.get('page', 'overview')).slice(1));
    Timer.boot();
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.(
      'change',
      () => Store.get('settings').theme === 'system' && this.applyTheme('system'),
    );
  },
};
// ---- Umumiy tugmalar ----
Actions.toggleSide = () => {
  $('#sidebar').classList.toggle('open');
  $('#scrim').classList.toggle('show');
};
Actions.upgrade = () => {
  Modal.open(
    t('proTitle'),
    `<p class="muted" style="margin:0">${t('proText')}</p><div class="mf"><span class="sp"></span><button class="btn btn-p" data-act="mClose">OK</button></div>`,
  );
};
Actions.wsMenu = (a) =>
  Menu.show(
    a,
    ['semSpring', 'semFall'].map((k) => ({
      l: t('uniSpace') + ' — ' + t(k),
      i: 'graduation-cap',
      check: Store.get('sem', 'semSpring') === k,
      fn: () => {
        Store.set('sem', k);
        App.updateChrome();
      },
    })),
  );
Actions.userMenu = (a) =>
  Menu.show(a, [
    { l: t('nav_settings'), i: 'settings', fn: () => App.go('settings') },
    {
      l: Lang.cur === 'en' ? "O'zbekcha" : 'English',
      i: 'languages',
      fn: () => Lang.set(Lang.cur === 'en' ? 'uz' : 'en'),
    },
    { l: t('resetData'), i: 'rotate-ccw', danger: 1, fn: Actions.resetData },
  ]);
Actions.help = () =>
  Modal.open(
    t('helpT'),
    `<div class="trow" style="border:0"><span class="kbd">Ctrl / ⌘ + K</span><b style="font-weight:500">${t('help1')}</b></div><div class="trow"><span class="kbd">Esc</span><b style="font-weight:500">${t('help2')}</b></div><div class="trow"><span class="kbd">Space</span><b style="font-weight:500">${t('help3')}</b></div>`,
  );
Actions.bell = (a) => {
  Store.set('bellSeen', D.today());
  App.updateChrome();
  const s = Store.get('settings'),
    td = D.today(),
    tm = D.add(1),
    items = [];
  if (s.notif.task)
    Store.get('tasks', [])
      .filter((x) => x.status !== 'done' && x.due <= tm)
      .forEach((x) =>
        items.push([
          'square-check-big',
          t('dueSoon', { x: seedText(x, 'title'), d: D.rel(x.due).toLowerCase() }),
        ]),
      );
  if (s.notif.classes)
    Store.get('events', [])
      .filter((e) => e.date === td && e.type === 'class')
      .forEach((e) =>
        items.push([
          'calendar',
          t('classSoon', { x: seedText(e, 'title'), t: D.time(e.time).join(' ') }),
        ]),
      );
  Menu.close();
  const p = document.createElement('div');
  p.className = 'bell-p';
  const r = a.getBoundingClientRect();
  p.style.top = r.bottom + 8 + 'px';
  p.style.right = Math.max(8, innerWidth - r.right) + 'px';
  p.innerHTML = `<h6>${t('notifications')}</h6>${items.length ? items.map((i) => `<div style="display:flex;gap:10px;align-items:center">${ic(i[0], 'muted')}<span>${esc(i[1])}</span></div>`).join('') : `<div class="muted">${t('noNotif')}</div>`}`;
  document.body.appendChild(p);
  lucide.createIcons();
};

// Yuqoridagi umumiy qidiruv
const Search = {
  run(q) {
    q = q.trim().toLowerCase();
    const box = $('#gres');
    if (!q) {
      box.classList.add('hidden');
      return;
    }
    const m = (s) => String(s).toLowerCase().includes(q),
      sec = (h, arr) => (arr.length ? `<h6>${h}</h6>` + arr.join('') : '');
    const T = Store.get('tasks', [])
      .filter((x) => m(x.title) || m(seedText(x, 'title')) || m(x.subject))
      .slice(0, 4)
      .map(
        (x) =>
          `<button data-act="gGo" data-p="tasks" data-q="${esc(x.title)}">${esc(seedText(x, 'title'))}</button>`,
      );
    const N = Store.get('notes', [])
      .filter((x) => m(x.title) || m(x.body) || m(seedText(x, 'title')))
      .slice(0, 4)
      .map(
        (x) =>
          `<button data-act="gGo" data-p="notes" data-q="${esc(x.title)}">${esc(seedText(x, 'title'))}</button>`,
      );
    const E = Store.get('events', [])
      .filter((x) => m(x.title) || m(seedText(x, 'title')))
      .slice(0, 4)
      .map(
        (x) =>
          `<button data-act="gGo" data-p="calendar">${esc(seedText(x, 'title'))} <span class="muted xs">${D.fmt(x.date)}</span></button>`,
      );
    box.innerHTML =
      sec(t('resTasks'), T) + sec(t('resNotes'), N) + sec(t('resEvents'), E) ||
      `<div class="empty" style="padding:14px">${t('noRes')}</div>`;
    box.classList.remove('hidden');
  },
};
Actions.gGo = (a) => {
  const p = a.dataset.p,
    q = a.dataset.q || '';
  if (p === 'tasks') Tasks.q = q;
  if (p === 'notes') Notes.q = q;
  $('#gres').classList.add('hidden');
  $('#gsearch').value = '';
  App.go(p);
};

// Barcha bosishlarni ushlaydi va data-act bo'yicha Actions'dagi funksiyani ishga tushiradi
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu,.bell-p') && !e.target.closest('[data-act=bell]')) Menu.close();
  if (!e.target.closest('.gsearch')) $('#gres').classList.add('hidden');
  const a = e.target.closest('[data-act]');
  if (a && Actions[a.dataset.act]) {
    // DIQQAT: bu yerda e.preventDefault() bo'lmasligi kerak, aks holda "Saqlash" tugmasi ishlamaydi
    Actions[a.dataset.act](a, e);
  }
});
// Klaviatura: Ctrl+K qidiruv, Esc yopish, Space taymer
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    $('#gsearch').focus();
  }
  if (e.key === 'Escape') {
    Modal.close();
    Menu.close();
    $('#gres').classList.add('hidden');
  }
  if (
    e.code === 'Space' &&
    App.page === 'focus' &&
    !/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName) &&
    !$('.overlay')
  ) {
    e.preventDefault();
    Timer.toggle();
  }
});
window.addEventListener('DOMContentLoaded', () => App.init());