/* analytics.js — Analytics page powered by Chart.js */
// TAHLIL sahifasi
const Analytics = {
  charts: [],
  range: Store.get('range', 30),
  // Davr tanlanganda (7/30/90 kun) raqamlarni ko'paytiradigan koeffitsiyent
  mult() {
    return { 7: 0.25, 30: 1, 90: 2.8 }[this.range];
  },
  destroy() {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  },
  // Statistika kartalari va grafik joylari (HTML)
  render() {
    const tasks = Tasks.all(),
      done = tasks.filter((x) => x.status === 'done').length,
      study = Store.get('study'),
      sum = study.reduce((a, b) => a + b, 0),
      goal = Store.get('settings').goal,
      m = this.mult(),
      focus = Math.round(42.8 * m * 10) / 10 + Math.round(Math.max(0, sum - 32.5) * 10) / 10,
      prod = tasks.length ? Math.round((done / tasks.length) * 100) : 0,
      pct = Math.min(100, Math.round((sum / goal) * 100)),
      away = Math.max(0, Math.round((goal - sum) * 10) / 10),
      sb = Store.get('subjects', {}),
      mx = Math.max(1, ...Object.values(sb)),
      sc = ['var(--pu)', 'var(--bl)', 'var(--or)', 'var(--gr)', 'var(--rd)'],
      stats = [
        ['clock', 'c-pu', 'totalFocus', focus.toFixed(1) + 'h', '14%'],
        ['square-check-big', 'c-bl', 'tasksDone', Math.round(64 * m) + done, '22%'],
        ['chart-column', 'c-gr', 'avgProd', Math.round((84 + prod) / 2) + '%', '7%'],
        ['layout-grid', 'c-or', 'streak', 12 + ' ' + t('days'), '3 ' + t('days')],
      ];
    return `<div class="page-h"><div><h1>${t('analytics')}</h1><p>${t('anSub')}</p></div><button class="select" data-act="anRange">${t('r' + this.range)}${ic('chevron-down')}</button></div>
    <div class="grid4">${stats.map((s) => `<div class="card stat"><div class="si ${s[1]}">${ic(s[0])}</div><div><div class="lbl">${t(s[2])}</div><div class="num">${s[3]}</div><div class="tr"><b>↗︎ ${s[4]}</b> ${t('fromLast')}</div></div></div>`).join('')}</div>
    <div class="an2"><div class="card"><div class="ch"><div><h3>${t('studyH')}</h3><p>${t('focusedAll')}</p></div><div class="legend"><button data-act="anLeg" data-i="0"><i style="background:var(--pu)"></i>${t('thisWeek')}</button><button data-act="anLeg" data-i="1" class="off"><i style="background:#3a4560"></i>${t('lastWeek')}</button></div></div>
      <div class="big"><b>${Math.round(sum * 10) / 10}</b><span>${t('hours')}</span><span class="pill">↗︎ 18.2%</span></div><div class="cw"><canvas id="cStudy"></canvas></div></div>
    <div class="card"><div class="ch"><div><h3>${t('weeklyGoal')}</h3><p>${t('goalOf', { a: Math.round(sum * 10) / 10, b: goal })}</p></div></div><div class="donut"><canvas id="cGoal"></canvas><div class="c"><b>${pct}%</b><span>${t('pctDone')}</span></div></div>
      <p class="muted sm" style="text-align:center;margin:6px 0 14px">${away ? t('awayGoal', { h: `<b style="color:var(--tx)">${away}</b>` }) : t('goalReached')}</p><button class="btn btn-g btn-w" data-act="anGoal">${t('adjustGoal')}</button></div></div>
    <div class="an2"><div class="card"><div class="ch"><div><h3>${t('timeBySubject')}</h3><p>${t('whereFocus')}</p></div></div>${Object.entries(
      sb,
    )
      .sort((a, b) => b[1] - a[1])
      .map(
        ([k, v], i) =>
          `<div class="sbar"><div class="t"><b><i style="background:${sc[i % 5]}"></i>${esc(subjName(k))}</b><span class="muted">${Math.round(v * 10) / 10}h</span></div><div class="tr"><div style="width:${(v / mx) * 100}%;background:${sc[i % 5]}"></div></div></div>`,
      )
      .join('')}</div>
    <div class="card"><div class="ch"><div><h3>${t('taskCompletion')}</h3><p>${t('lastFour')}</p></div></div><div class="cw"><canvas id="cWeeks"></canvas></div></div></div>`;
  },
  // Chart.js grafiklari SHU YERDA chiziladi (ranglar, o'qlar, ustunlar)
  mount() {
    if (!window.Chart) return;
    const css = getComputedStyle(document.documentElement),
      mu = css.getPropertyValue('--mu').trim(),
      ln = css.getPropertyValue('--line').trim(),
      pu = css.getPropertyValue('--pu').trim(),
      hv = css.getPropertyValue('--hover').trim();
    Chart.defaults.font.family = "'DM Sans',sans-serif";
    Chart.defaults.color = mu;
    const g = $('#cStudy').getContext('2d'),
      gr = g.createLinearGradient(0, 0, 0, 230);
    gr.addColorStop(0, '#A78BFA');
    gr.addColorStop(1, '#6D4FD8');
    const study = Store.get('study'),
      last = Store.get('lastWeek');
    this.charts.push(
      new Chart($('#cStudy'), {
        type: 'bar',
        data: {
          labels: t('dow'),
          datasets: [
            {
              label: t('thisWeek'),
              data: study,
              backgroundColor: gr,
              borderRadius: 8,
              maxBarThickness: 36,
            },
            {
              label: t('lastWeek'),
              data: last,
              backgroundColor: '#3a4560',
              borderRadius: 8,
              maxBarThickness: 36,
              hidden: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y}h` } },
          },
          scales: {
            y: {
              min: 0,
              max: 8,
              ticks: { stepSize: 2, callback: (v) => v + 'h' },
              grid: { color: ln },
              border: { display: false },
            },
            x: { grid: { display: false }, border: { color: ln } },
          },
        },
      }),
    );
    const sum = study.reduce((a, b) => a + b, 0),
      goal = Store.get('settings').goal;
    this.charts.push(
      new Chart($('#cGoal'), {
        type: 'doughnut',
        data: {
          datasets: [
            {
              data: [Math.min(sum, goal), Math.max(goal - sum, 0)],
              backgroundColor: [pu, hv],
              borderWidth: 0,
              borderRadius: 10,
            },
          ],
        },
        options: {
          cutout: '82%',
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
        },
      }),
    );
    const w = Store.get('weeks'),
      tk = Tasks.all(),
      all = [...w, { d: tk.filter((x) => x.status === 'done').length, t: tk.length }];
    this.charts.push(
      new Chart($('#cWeeks'), {
        type: 'bar',
        data: {
          labels: [t('week1'), t('week2'), t('week3'), t('week4')],
          datasets: [
            {
              label: t('completed'),
              data: all.map((x) => x.d),
              backgroundColor: pu,
              borderRadius: 8,
              maxBarThickness: 30,
              stack: 's',
            },
            {
              label: '—',
              data: all.map((x) => Math.max(x.t - x.d, 0)),
              backgroundColor: hv,
              borderRadius: 8,
              maxBarThickness: 30,
              stack: 's',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { stacked: true, display: false },
            x: { stacked: true, grid: { display: false }, border: { display: false } },
          },
        },
      }),
    );
  },
};
// ---- Tugmalar ----
Actions.anRange = (a) =>
  Menu.show(
    a,
    [7, 30, 90].map((r) => ({
      l: t('r' + r),
      check: Analytics.range === r,
      fn: () => {
        Analytics.range = r;
        Store.set('range', r);
        App.render();
      },
    })),
  );
Actions.anLeg = (a) => {
  const c = Analytics.charts[0],
    i = +a.dataset.i;
  if (!c) return;
  const h = c.isDatasetVisible(i);
  c.setDatasetVisibility(i, !h);
  c.update();
  a.classList.toggle('off', h);
};
Actions.anGoal = () =>
  Modal.form(
    t('adjustGoal'),
    [{ n: 'goal', l: t('goalHours'), type: 'number', min: 1, req: 1 }],
    { goal: Store.get('settings').goal },
    {
      onSave: (o) => {
        const s = Store.get('settings');
        s.goal = Math.max(1, +o.goal || 40);
        Store.set('settings', s);
        App.render();
      },
    },
  );