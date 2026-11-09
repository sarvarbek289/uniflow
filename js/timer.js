/* timer.js — Pomodoro focus timer (keeps running while you browse other pages) */
// FOKUS rejimi (Pomodoro taymer). Boshqa sahifaga o'tganda ham ishlayveradi
const Timer = {
  mode: 'focus',
  total: 1500,
  left: 1500,
  running: false,
  endAt: 0,
  iv: null,
  cycles: 0,
  // Rejim davomiyligi (soniyada) — Sozlamalardan olinadi
  dur(m = this.mode) {
    return Store.get('settings').dur[m] * 60;
  },
  boot() {
    this.total = this.left = this.dur();
  },
  settingsChanged() {
    if (!this.running) {
      this.total = this.left = this.dur();
      this.ui();
    }
  },
  sessions() {
    let s = Store.get('sessions', { date: D.today(), count: 0 });
    if (s.date !== D.today()) s = { date: D.today(), count: 0 };
    return s;
  },
  task() {
    const a = Tasks.all(),
      id = Store.get('focusTask');
    return (
      a.find((x) => x.id === id && x.status !== 'done') ||
      a.find((x) => x.status === 'progress') ||
      a.find((x) => x.status === 'todo')
    );
  },
  // Sahifa HTML'i: rejimlar, aylana, tugmalar, joriy vazifa
  render() {
    const s = Store.get('settings'),
      tk = this.task(),
      C = 2 * Math.PI * 148;
    return `<div class="page-h"><div><h1>${t('focusMode')}</h1><p>${t('focusSub')}</p></div><span class="sess" id="tSess"></span></div>
    <div class="card focus-card"><div class="modes">${['focus', 'short', 'long'].map((m) => `<button class="${this.mode === m ? 'on' : ''}" data-act="tMode" data-m="${m}">${t('m_' + m)}</button>`).join('')}</div>
    <div class="ring"><svg class="r" viewBox="0 0 320 320"><circle cx="160" cy="160" r="148" fill="none" stroke="var(--hover)" stroke-width="9"/><circle id="tArc" cx="160" cy="160" r="148" fill="none" stroke="var(--pu)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0" style="transition:stroke-dashoffset .5s linear"/></svg>
      <div class="rin"><small id="tLbl"></small><div class="tm" id="tTime"></div><p id="tMsg"></p></div></div>
    <div class="ctrls"><button class="icon-btn" data-act="tReset" title="${t('reset')}">${ic('rotate-ccw')}</button><button class="btn btn-p" id="tBtn" data-act="tToggle"></button><button class="icon-btn" data-act="go" data-p="notes" title="${t('nav_notes')}">${ic('file-text')}</button></div>
    <div class="cur"><small>${t('curTask')}</small><div class="box"><div><b>${tk ? esc(seedText(tk, 'title')) : t('noTask')}</b><span>${tk ? `${esc(subjName(tk.subject))} • ${tk.due === D.today() ? t('dueToday') : D.rel(tk.due)}` : '—'}</span></div><button class="icon-btn" data-act="tPick">${ic('ellipsis')}</button></div></div></div>`;
  },
  mount() {
    this.ui();
  },
  // Vaqt, aylana va tugma matnini yangilaydi
  ui() {
    const tm = $('#tTime');
    const mm = String(Math.floor(this.left / 60)).padStart(2, '0'),
      ss = String(this.left % 60).padStart(2, '0');
    document.title = this.running ? `${mm}:${ss} — UniFlow` : 'UniFlow — ' + t('nav_' + App.page);
    if (!tm || App.page !== 'focus') return;
    tm.textContent = `${mm}:${ss}`;
    const C = 2 * Math.PI * 148;
    $('#tArc').style.strokeDashoffset = C * (1 - this.left / this.total);
    $('#tLbl').textContent = t('s_' + this.mode);
    $('#tBtn').innerHTML = this.running
      ? ic('pause') + t('pause')
      : ic('play') +
        (this.left < this.total
          ? t('resume')
          : this.mode === 'focus'
            ? t('startFocus')
            : t('startBreak'));
    $('#tMsg').textContent = this.running
      ? this.mode === 'focus'
        ? t('inFocus')
        : t('onBreak')
      : this.left < this.total
        ? t('paused')
        : t('readyAlex', { n: Store.get('settings').first });
    $('#tSess').textContent = t('sessionsToday', { n: this.sessions().count });
    lucide.createIcons();
  },
  // Boshlash / Pauza
  toggle() {
    if (this.running) {
      this.running = false;
      clearInterval(this.iv);
    } else {
      this.running = true;
      this.endAt = Date.now() + this.left * 1000;
      this.iv = setInterval(() => this.tick(), 250);
    }
    this.ui();
  },
  // Har 0.25 soniyada qolgan vaqtni hisoblaydi
  tick() {
    const l = Math.max(0, Math.ceil((this.endAt - Date.now()) / 1000));
    if (l !== this.left) {
      this.left = l;
      this.ui();
    }
    if (l <= 0) this.finish();
  },
  reset() {
    this.running = false;
    clearInterval(this.iv);
    this.total = this.left = this.dur();
    this.ui();
  },
  setMode(m) {
    this.mode = m;
    this.reset();
    if (App.page === 'focus') App.render();
  },
  // Sessiya tugaganda: statistika yangilanadi, tovush chiqadi, keyingi rejimga o'tadi
  finish() {
    this.running = false;
    clearInterval(this.iv);
    this.beep();
    if (this.mode === 'focus') {
      const mins = Store.get('settings').dur.focus,
        h = mins / 60,
        st = Store.get('study'),
        i = D.wd();
      st[i] = Math.round((st[i] + h) * 100) / 100;
      Store.set('study', st);
      const tk = this.task(),
        sb = Store.get('subjects', {});
      if (tk) {
        const k =
          Object.keys(sb).find((x) => x.toLowerCase() === tk.subject.toLowerCase()) || tk.subject;
        sb[k] = Math.round(((sb[k] || 0) + h) * 100) / 100;
        Store.set('subjects', sb);
      }
      const s = this.sessions();
      s.count++;
      Store.set('sessions', s);
      logActivity('focus', `${mins} min${tk ? ' • ' + subjName(tk.subject) : ''}`);
      this.cycles++;
      toast(t('sessionDone'));
      this.mode = this.cycles % 4 === 0 ? 'long' : 'short';
    } else {
      toast(t('breakDone'));
      this.mode = 'focus';
    }
    this.total = this.left = this.dur();
    if (App.page === 'focus' || App.page === 'overview') App.render();
    else this.ui();
  },
  // Tugash tovushi
  beep() {
    try {
      const c = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25, 0.5].forEach((d) => {
        const o = c.createOscillator(),
          g = c.createGain();
        o.frequency.value = 880;
        o.connect(g);
        g.connect(c.destination);
        g.gain.setValueAtTime(0.001, c.currentTime + d);
        g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d + 0.2);
        o.start(c.currentTime + d);
        o.stop(c.currentTime + d + 0.22);
      });
    } catch (e) {}
  },
};
// ---- Tugmalar ----
Actions.tToggle = () => Timer.toggle();
Actions.tReset = () => Timer.reset();
Actions.tMode = (a) => Timer.setMode(a.dataset.m);
Actions.tPick = (a) => {
  const cur = Timer.task(),
    L = Tasks.all().filter((x) => x.status !== 'done');
  Menu.show(
    a,
    L.length
      ? L.map((x) => ({
          l: seedText(x, 'title'),
          check: cur && cur.id === x.id,
          fn: () => {
            Store.set('focusTask', x.id);
            App.render();
          },
        }))
      : [{ l: t('noTask'), fn: () => {} }],
  );
};