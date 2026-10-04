// =========================================================================
// TAQA Gas HR - Reports Center
// Loads the whole employee set once, then builds every analysis client-side
// so the filters react instantly and the printed PDF matches the screen.
// =========================================================================
(function() {

  // ---------------------------------------------------------------- guard
  if (window.AuthManager && !window.AuthManager.isAuthenticated()) {
    window.location.replace('index.html');
    return;
  }

  const els = {
    loader: document.getElementById('rep-loader'),
    error: document.getElementById('rep-error'),
    errorText: document.getElementById('rep-error-text'),
    report: document.getElementById('report'),
    btnPrint: document.getElementById('btn-print'),
    fLocation: document.getElementById('rf-location'),
    fCompany: document.getElementById('rf-company'),
    fSector: document.getElementById('rf-sector'),
    fDivision: document.getElementById('rf-division'),
    fStatus: document.getElementById('rf-status'),
    fReset: document.getElementById('rf-reset')
  };

  let ALL = [];

  // ------------------------------------------------------------- helpers
  // TAQA Gas brand colours (sampled from the company logo) plus supporting
  // tints, so charts with up to 12 slices stay distinguishable and on-brand.
  const PALETTE = ['#0b9444', '#1e6ca6', '#59595c', '#fad213', '#5bae45', '#0f4c70', '#b7b7ba', '#c98a00',
                   '#237bb4', '#3b9c45', '#8a8a8d', '#8a5c00'];

  // Arabic names for the governorates / sites used in the sheet
  const LOCATION_AR = {
    'Cairo': 'القاهرة',
    'Giza': 'الجيزة',
    'Alexandria': 'الإسكندرية',
    'Minya': 'المنيا',
    'Assuit': 'أسيوط',
    'Asyut': 'أسيوط',
    'Bani Suef': 'بني سويف',
    'Beni Suef': 'بني سويف',
    'Kafr El Sheikh': 'كفر الشيخ',
    'Suez': 'السويس',
    'Damietta': 'دمياط',
    'Red Sea': 'البحر الأحمر',
    'New Valley': 'الوادي الجديد',
    'Qaluibia': 'القليوبية',
    'Qalubia': 'القليوبية',
    'Ismailia': 'الإسماعيلية',
    'Fayoum': 'الفيوم',
    'Dakahlia': 'الدقهلية',
    'Sharkia': 'الشرقية',
    'Port Said': 'بورسعيد',
    'Luxor': 'الأقصر',
    'Aswan': 'أسوان',
    'Sohag': 'سوهاج',
    'Qena': 'قنا',
    'Beheira': 'البحيرة',
    'Gharbia': 'الغربية',
    'Monufia': 'المنوفية',
    'Saudi Arabia': 'السعودية',
    'Qatar': 'قطر',
    'TAQA EC': 'TAQA EC'
  };

  const locAr = v => LOCATION_AR[String(v || '').trim()] || String(v || '').trim() || 'غير محدد';
  const n = v => Number(v || 0).toLocaleString('ar-EG');
  const pct = (part, whole) => whole ? (part * 100 / whole).toFixed(1) + '%' : '—';
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const clean = v => {
    const s = String(v == null ? '' : v).trim();
    if (!s || s === '-' || s === '--' || /^-+$/.test(s) || s.includes('#REF!') || s.includes('#VALUE!')) return '';
    return s;
  };

  function parseDate(val) {
    const s = clean(val);
    if (!s) return null;
    if (s.includes('/')) {
      const p = s.split('/');
      if (p.length === 3) {
        const d = new Date(+p[2], +p[1] - 1, +p[0]);
        return isNaN(d.getTime()) ? null : d;
      }
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function ageOf(emp) {
    const d = parseDate(emp.birth_date);
    if (d) {
      const diff = Date.now() - d.getTime();
      const years = diff / (365.25 * 24 * 3600 * 1000);
      if (years > 15 && years < 80) return Math.floor(years);
    }
    const stored = parseFloat(clean(emp.age));
    return (!isNaN(stored) && stored > 15 && stored < 80) ? Math.floor(stored) : null;
  }

  function yoeOf(emp) {
    const start = parseDate(emp.start_date);
    if (start) {
      const end = parseDate(emp.resignation_date) || new Date();
      const years = (end.getTime() - start.getTime()) / (365.25 * 24 * 3600 * 1000);
      if (years >= 0 && years < 60) return years;
    }
    const stored = parseFloat(clean(emp.yoe));
    return (!isNaN(stored) && stored >= 0 && stored < 60) ? stored : null;
  }

  const isActive = emp => !clean(emp.resignation_date);

  // Count values of one field, sorted by count desc
  function countBy(rows, field, mapFn) {
    const m = new Map();
    rows.forEach(r => {
      const raw = mapFn ? mapFn(r) : clean(r[field]);
      const key = raw || 'غير محدد';
      m.set(key, (m.get(key) || 0) + 1);
    });
    return Array.from(m.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  // ------------------------------------------------------------- charts
  // SVG is forced to LTR so text-anchor stays predictable; Arabic runs inside
  // each <text> are still shaped and ordered right-to-left by the browser.

  function hBarChart(items, opts) {
    opts = opts || {};
    const rows = items.slice(0, opts.limit || 20);
    const rowH = 24, padTop = 8, padBottom = 6;
    const H = padTop + rows.length * rowH + padBottom;
    const trackStart = 110, trackEnd = 790, labelX = 995;
    const max = Math.max(1, ...rows.map(r => r.value));
    const total = opts.total || rows.reduce((a, r) => a + r.value, 0);

    let svg = `<svg viewBox="0 0 1000 ${H}" role="img" style="direction:ltr" preserveAspectRatio="xMidYMid meet">`;
    rows.forEach((r, i) => {
      const y = padTop + i * rowH;
      const len = Math.max(2, (trackEnd - trackStart) * r.value / max);
      const color = opts.color || PALETTE[i % PALETTE.length];
      svg += `<rect x="${trackStart}" y="${y + 4}" width="${trackEnd - trackStart}" height="13" rx="3" fill="#eef2f7"></rect>`;
      svg += `<rect x="${trackEnd - len}" y="${y + 4}" width="${len}" height="13" rx="3" fill="${color}"></rect>`;
      svg += `<text x="${labelX}" y="${y + 14}" text-anchor="end" font-size="13" font-weight="600" fill="#0b1a2f">${esc(r.label)}</text>`;
      svg += `<text x="${trackEnd - len - 8}" y="${y + 14}" text-anchor="end" font-size="12" fill="#334155">${n(r.value)}`;
      if (total) svg += ` (${pct(r.value, total)})`;
      svg += `</text>`;
    });
    svg += '</svg>';
    return svg;
  }

  function vBarChart(items, opts) {
    opts = opts || {};
    const rows = items.slice(0, opts.limit || 14);
    const W = 1000, H = 300, padL = 40, padR = 20, padT = 20, padB = 58;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const max = Math.max(1, ...rows.map(r => r.value));
    const slot = plotW / Math.max(1, rows.length);
    const barW = Math.min(64, slot * 0.62);

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" style="direction:ltr" preserveAspectRatio="xMidYMid meet">`;
    // grid lines
    for (let g = 0; g <= 4; g++) {
      const y = padT + plotH - (plotH * g / 4);
      svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#e2e8f0" stroke-width="1"></line>`;
      svg += `<text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="#94a3b8">${n(Math.round(max * g / 4))}</text>`;
    }
    rows.forEach((r, i) => {
      const h = Math.max(1, plotH * r.value / max);
      const x = padL + i * slot + (slot - barW) / 2;
      const y = padT + plotH - h;
      const color = opts.colorFor ? opts.colorFor(r, i) : (opts.color || PALETTE[i % PALETTE.length]);
      svg += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="3" fill="${color}"></rect>`;
      svg += `<text x="${x + barW / 2}" y="${y - 5}" text-anchor="middle" font-size="12" font-weight="600" fill="#0b1a2f">${n(r.value)}</text>`;
      svg += `<text x="${x + barW / 2}" y="${padT + plotH + 18}" text-anchor="middle" font-size="12" fill="#475569">${esc(r.label)}</text>`;
      if (r.sub) {
        svg += `<text x="${x + barW / 2}" y="${padT + plotH + 34}" text-anchor="middle" font-size="11" fill="#94a3b8">${esc(r.sub)}</text>`;
      }
    });
    svg += '</svg>';
    return svg;
  }

  function donutChart(items, opts) {
    opts = opts || {};
    const rows = items.slice(0, opts.limit || 8);
    const total = rows.reduce((a, r) => a + r.value, 0) || 1;
    const size = 230, cx = size / 2, cy = size / 2, rOut = 100, rIn = 58;
    let angle = -Math.PI / 2;

    let svg = `<svg viewBox="0 0 ${size} ${size}" role="img" style="direction:ltr;max-width:230px;margin:0 auto" preserveAspectRatio="xMidYMid meet">`;
    rows.forEach((r, i) => {
      const slice = (r.value / total) * Math.PI * 2;
      const end = angle + slice;
      const large = slice > Math.PI ? 1 : 0;
      const x1 = cx + rOut * Math.cos(angle), y1 = cy + rOut * Math.sin(angle);
      const x2 = cx + rOut * Math.cos(end), y2 = cy + rOut * Math.sin(end);
      const x3 = cx + rIn * Math.cos(end), y3 = cy + rIn * Math.sin(end);
      const x4 = cx + rIn * Math.cos(angle), y4 = cy + rIn * Math.sin(angle);
      const color = PALETTE[i % PALETTE.length];
      if (rows.length === 1) {
        svg += `<circle cx="${cx}" cy="${cy}" r="${(rOut + rIn) / 2}" fill="none" stroke="${color}" stroke-width="${rOut - rIn}"></circle>`;
      } else {
        svg += `<path d="M${x1} ${y1} A${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4} Z" fill="${color}"></path>`;
      }
      angle = end;
    });
    svg += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="24" font-weight="800" fill="#0b1a2f">${n(total)}</text>`;
    svg += `<text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="12" fill="#64748b">${esc(opts.centerLabel || 'موظف')}</text>`;
    svg += '</svg>';

    const legend = '<div class="legend">' + rows.map((r, i) =>
      `<span class="legend-item"><span class="legend-swatch" style="background:${PALETTE[i % PALETTE.length]}"></span>
       ${esc(r.label)} — ${n(r.value)} (${pct(r.value, total)})</span>`).join('') + '</div>';

    return svg + legend;
  }

  function cellBar(value, max) {
    const w = max ? Math.max(2, Math.round(92 * value / max)) : 2;
    return `<span class="cell-bar-track"><span class="cell-bar" style="width:${w}px"></span></span>`;
  }

  function panel(target, title, html) {
    document.getElementById(target).innerHTML =
      `<div class="chart-title">${esc(title)}</div>${html}`;
  }

  function table(headers, rows, opts) {
    opts = opts || {};
    let h = '<table class="rep-table"><thead><tr>';
    headers.forEach(x => { h += `<th class="${x.num ? 'num' : ''}">${esc(x.label)}</th>`; });
    h += '</tr></thead><tbody>';
    rows.forEach(r => {
      h += `<tr class="${r.isTotal ? 'total-row' : ''}">`;
      r.cells.forEach((c, i) => {
        const cls = headers[i] && headers[i].num ? 'num' : (i === 0 ? 'name' : '');
        h += `<td class="${cls}">${c}</td>`;
      });
      h += '</tr>';
    });
    return h + '</tbody></table>';
  }

  // ------------------------------------------------------------ analysis
  function paYears() {
    return window.COLUMN_DEFINITIONS
      .filter(c => /^pa_\d{4}$/.test(c.key))
      .map(c => c.key)
      .sort();
  }

  function promoYears() {
    return window.COLUMN_DEFINITIONS
      .filter(c => /^promo_\d{4}$/.test(c.key))
      .map(c => c.key)
      .sort();
  }

  function latestPaYear(rows) {
    const years = paYears().reverse();
    for (const key of years) {
      if (rows.some(r => clean(r[key]))) return key;
    }
    return null;
  }

  function render(rows) {
    const total = rows.length;

    // ---------- meta ----------
    const now = new Date();
    document.getElementById('meta-date').textContent =
      now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('meta-count').textContent = n(total) + ' موظف';
    document.getElementById('footer-stamp').textContent =
      'تاريخ ووقت الإصدار: ' + now.toLocaleString('ar-EG');

    const scopeBits = [];
    if (els.fLocation.value) scopeBits.push('محافظة ' + locAr(els.fLocation.value));
    if (els.fCompany.value) scopeBits.push('شركة ' + els.fCompany.value);
    if (els.fSector.value) scopeBits.push('قطاع ' + els.fSector.value);
    if (els.fDivision.value) scopeBits.push(els.fDivision.value);
    if (els.fStatus.value === 'active') scopeBits.push('على رأس العمل');
    document.getElementById('meta-scope').textContent = scopeBits.length ? scopeBits.join(' · ') : 'كل الموظفين';

    if (!total) {
      els.report.querySelectorAll('.rep-section').forEach(s => { s.style.display = 'none'; });
      document.getElementById('kpi-grid').closest('.rep-section').style.display = '';
      document.getElementById('kpi-grid').innerHTML =
        '<p class="rep-note">لا توجد بيانات مطابقة لهذه الفلاتر.</p>';
      return;
    }
    els.report.querySelectorAll('.rep-section').forEach(s => { s.style.display = ''; });

    // ---------- 1. KPIs ----------
    const ages = rows.map(ageOf).filter(v => v != null);
    const yoes = rows.map(yoeOf).filter(v => v != null);
    const females = rows.filter(r => clean(r.gender).toLowerCase().startsWith('f')).length;
    const hired = rows.filter(r => clean(r.employment_type).toLowerCase() === 'hired').length;
    const outsourced = rows.filter(r => clean(r.employment_type).toLowerCase() === 'outsourcing').length;
    const locations = new Set(rows.map(r => clean(r.locations)).filter(Boolean));
    const companies = new Set(rows.map(r => clean(r.company)).filter(Boolean));
    const depts = new Set(rows.map(r => clean(r.department)).filter(Boolean));
    const active = rows.filter(isActive).length;

    const kpis = [
      { label: 'إجمالي الموظفين', value: n(total), sub: 'في نطاق هذا التقرير' },
      { label: 'على رأس العمل', value: n(active), sub: pct(active, total) + ' من الإجمالي' },
      { label: 'تعيين مباشر (Hired)', value: n(hired), sub: pct(hired, total) },
      { label: 'إسناد خارجي (Outsourcing)', value: n(outsourced), sub: pct(outsourced, total) },
      { label: 'عدد المحافظات', value: n(locations.size), sub: 'موقع جغرافي' },
      { label: 'عدد الشركات', value: n(companies.size), sub: n(depts.size) + ' إدارة' },
      { label: 'متوسط السن', value: avg(ages) ? avg(ages).toFixed(1) : '—', sub: 'سنة' },
      { label: 'متوسط سنوات الخبرة', value: avg(yoes) ? avg(yoes).toFixed(1) : '—', sub: 'سنة داخل الشركة' },
      { label: 'نسبة الإناث', value: pct(females, total), sub: n(females) + ' موظفة' }
    ];
    document.getElementById('kpi-grid').innerHTML = kpis.map(k => `
      <div class="kpi-card">
        <div class="kpi-label">${esc(k.label)}</div>
        <div class="kpi-value">${k.value}</div>
        <div class="kpi-sub">${esc(k.sub)}</div>
      </div>`).join('');

    // ---------- 2. Governorates ----------
    const byLoc = countBy(rows, 'locations', r => locAr(r.locations));
    const top = byLoc[0];
    const topThree = byLoc.slice(0, 3);
    let geoText = `يتوزع <strong>${n(total)}</strong> موظف على <strong>${n(locations.size)}</strong> محافظة. ` +
      `أكبر تجمّع في <strong>${esc(top.label)}</strong> بعدد <strong>${n(top.value)}</strong> موظف (${pct(top.value, total)})`;
    geoText += byLoc.length >= 3
      ? `، وتستحوذ أكبر ثلاث محافظات على <strong>${pct(topThree.reduce((a, x) => a + x.value, 0), total)}</strong> من إجمالي القوى العاملة.`
      : '.';
    document.getElementById('geo-summary').innerHTML = geoText;

    document.getElementById('geo-chart').innerHTML = hBarChart(byLoc, { total: total, limit: 20, color: '#0b9444' });

    const maxLoc = byLoc[0].value;
    const locRows = byLoc.map(l => {
      const sub = rows.filter(r => locAr(r.locations) === l.label);
      const a = avg(sub.map(ageOf).filter(v => v != null));
      const y = avg(sub.map(yoeOf).filter(v => v != null));
      return {
        cells: [
          esc(l.label),
          cellBar(l.value, maxLoc),
          n(l.value),
          pct(l.value, total),
          n(sub.filter(r => clean(r.employment_type).toLowerCase() === 'hired').length),
          n(sub.filter(r => clean(r.employment_type).toLowerCase() === 'outsourcing').length),
          n(sub.filter(r => clean(r.gender).toLowerCase().startsWith('m')).length),
          n(sub.filter(r => clean(r.gender).toLowerCase().startsWith('f')).length),
          a ? a.toFixed(1) : '—',
          y ? y.toFixed(1) : '—',
          n(new Set(sub.map(r => clean(r.sub_location)).filter(Boolean)).size)
        ]
      };
    });
    locRows.push({
      isTotal: true,
      cells: ['الإجمالي', '', n(total), '100%', n(hired), n(outsourced),
        n(total - females), n(females),
        avg(ages) ? avg(ages).toFixed(1) : '—',
        avg(yoes) ? avg(yoes).toFixed(1) : '—',
        n(new Set(rows.map(r => clean(r.sub_location)).filter(Boolean)).size)]
    });
    document.getElementById('geo-table').innerHTML = table([
      { label: 'المحافظة' }, { label: 'التوزيع' }, { label: 'العدد', num: true }, { label: 'النسبة', num: true },
      { label: 'تعيين مباشر', num: true }, { label: 'إسناد', num: true },
      { label: 'ذكور', num: true }, { label: 'إناث', num: true },
      { label: 'متوسط السن', num: true }, { label: 'متوسط الخبرة', num: true },
      { label: 'مواقع فرعية', num: true }
    ], locRows);

    // ---------- governorate x company matrix ----------
    const comps = countBy(rows, 'company').slice(0, 6).map(c => c.label);
    const matrixRows = byLoc.map(l => {
      const sub = rows.filter(r => locAr(r.locations) === l.label);
      const cells = [esc(l.label)];
      comps.forEach(c => {
        const v = sub.filter(r => (clean(r.company) || 'غير محدد') === c).length;
        cells.push(v ? n(v) : '—');
      });
      cells.push(n(l.value));
      return { cells };
    });
    matrixRows.push({
      isTotal: true,
      cells: ['الإجمالي'].concat(
        comps.map(c => n(rows.filter(r => (clean(r.company) || 'غير محدد') === c).length)),
        [n(total)])
    });
    document.getElementById('geo-company-matrix').innerHTML = table(
      [{ label: 'المحافظة' }].concat(comps.map(c => ({ label: c, num: true })), [{ label: 'الإجمالي', num: true }]),
      matrixRows);

    // ---------- top sub-locations ----------
    const bySub = countBy(rows, 'sub_location').filter(s => s.label !== 'غير محدد').slice(0, 15);
    const maxSub = bySub.length ? bySub[0].value : 1;
    document.getElementById('sublocation-table').innerHTML = table([
      { label: 'الموقع الفرعي' }, { label: 'المحافظة' }, { label: 'التوزيع' },
      { label: 'العدد', num: true }, { label: 'النسبة', num: true }
    ], bySub.map(s => {
      const sub = rows.filter(r => clean(r.sub_location) === s.label);
      const loc = countBy(sub, 'locations', r => locAr(r.locations))[0];
      return { cells: [esc(s.label), esc(loc ? loc.label : '—'), cellBar(s.value, maxSub), n(s.value), pct(s.value, total)] };
    }));

    // ---------- 3. Organisation ----------
    panel('chart-company', 'التوزيع حسب الشركة', donutChart(countBy(rows, 'company')));
    panel('chart-sector', 'التوزيع حسب القطاع (Sector)', donutChart(countBy(rows, 'company_sector')));
    panel('chart-division', 'أكبر القطاعات الرئيسية (Division)', hBarChart(countBy(rows, 'division'), { total: total, limit: 8, color: '#1e6ca6' }));
    panel('chart-jobtree', 'أكبر شجرات الوظائف (Job Tree)', hBarChart(countBy(rows, 'job_tree'), { total: total, limit: 8, color: '#0b9444' }));

    const byDept = countBy(rows, 'department');
    const maxDept = byDept[0].value;
    document.getElementById('dept-table').innerHTML = table([
      { label: 'الإدارة' }, { label: 'التوزيع' }, { label: 'العدد', num: true }, { label: 'النسبة', num: true },
      { label: 'أقسام فرعية', num: true }, { label: 'متوسط الخبرة', num: true }
    ], byDept.map(d => {
      const sub = rows.filter(r => (clean(r.department) || 'غير محدد') === d.label);
      const y = avg(sub.map(yoeOf).filter(v => v != null));
      return {
        cells: [esc(d.label), cellBar(d.value, maxDept), n(d.value), pct(d.value, total),
          n(new Set(sub.map(r => clean(r.sub_department)).filter(Boolean)).size), y ? y.toFixed(1) : '—']
      };
    }));

    // ---------- 4. Workforce composition ----------
    panel('chart-gender', 'التوزيع حسب النوع', donutChart(countBy(rows, 'gender', r => {
      const g = clean(r.gender).toLowerCase();
      return g.startsWith('m') ? 'ذكور' : g.startsWith('f') ? 'إناث' : 'غير محدد';
    })));
    panel('chart-hiring', 'طبيعة التعاقد', donutChart(countBy(rows, 'employment_type', r => {
      const t = clean(r.employment_type).toLowerCase();
      return t === 'hired' ? 'تعيين مباشر' : t === 'outsourcing' ? 'إسناد خارجي' : (clean(r.employment_type) || 'غير محدد');
    })));

    const ageBands = [
      { label: 'أقل من ٢٥', test: a => a < 25 },
      { label: '٢٥ – ٣٤', test: a => a >= 25 && a < 35 },
      { label: '٣٥ – ٤٤', test: a => a >= 35 && a < 45 },
      { label: '٤٥ – ٥٤', test: a => a >= 45 && a < 55 },
      { label: '٥٥ فأكثر', test: a => a >= 55 }
    ].map(b => ({ label: b.label, value: ages.filter(b.test).length }));
    panel('chart-age', 'الشرائح العمرية', vBarChart(ageBands, { color: '#1e6ca6' }) +
      `<p class="rep-note" style="margin:0.4rem 0 0">محسوبة من تاريخ الميلاد لعدد ${n(ages.length)} موظف لديهم تاريخ ميلاد مسجل.</p>`);

    const yoeBands = [
      { label: 'أقل من سنة', test: y => y < 1 },
      { label: '١ – ٤', test: y => y >= 1 && y < 5 },
      { label: '٥ – ٩', test: y => y >= 5 && y < 10 },
      { label: '١٠ – ١٤', test: y => y >= 10 && y < 15 },
      { label: '١٥ – ١٩', test: y => y >= 15 && y < 20 },
      { label: '٢٠ فأكثر', test: y => y >= 20 }
    ].map(b => ({ label: b.label, value: yoes.filter(b.test).length }));
    panel('chart-yoe', 'سنوات الخبرة داخل الشركة', vBarChart(yoeBands, { color: '#0b9444' }) +
      `<p class="rep-note" style="margin:0.4rem 0 0">محسوبة من تاريخ التعيين لعدد ${n(yoes.length)} موظف.</p>`);

    const byContract = countBy(rows, 'type_of_contract');
    const byLevel = countBy(rows, 'taqa_level_grade');
    const maxC = byContract[0].value, maxL = byLevel[0].value;
    document.getElementById('contract-table').innerHTML =
      '<div class="chart-row" style="margin-top:0.4rem">' +
      '<div class="chart-cell"><div class="chart-title">نوع العقد</div>' +
      table([{ label: 'النوع' }, { label: '' }, { label: 'العدد', num: true }, { label: 'النسبة', num: true }],
        byContract.map(c => ({ cells: [esc(c.label), cellBar(c.value, maxC), n(c.value), pct(c.value, total)] }))) +
      '</div><div class="chart-cell"><div class="chart-title">الدرجة الوظيفية (TAQA Grade)</div>' +
      table([{ label: 'الدرجة' }, { label: '' }, { label: 'العدد', num: true }, { label: 'النسبة', num: true }],
        byLevel.map(c => ({ cells: [esc(c.label), cellBar(c.value, maxL), n(c.value), pct(c.value, total)] }))) +
      '</div></div>';

    // ---------- 5. Performance & promotions ----------
    const paKey = latestPaYear(rows);
    const paSection = document.getElementById('chart-pa').closest('.rep-section');

    if (paKey) {
      const paYear = paKey.replace('pa_', '');
      const graded = rows.filter(r => clean(r[paKey]));
      const order = ['A', 'B', 'C', 'D', 'E'];
      const paCounts = order.map(g => ({
        label: g,
        value: graded.filter(r => clean(r[paKey]).toUpperCase() === g).length
      })).filter(x => x.value);
      const other = graded.length - paCounts.reduce((a, x) => a + x.value, 0);
      if (other > 0) paCounts.push({ label: 'أخرى', value: other });

      const paColors = { 'A': '#0b9444', 'B': '#5bae45', 'C': '#fad213', 'D': '#f59e0b', 'E': '#ef4444' };
      panel('chart-pa', `توزيع تقييم الأداء لعام ${paYear}`,
        vBarChart(paCounts, { colorFor: r => paColors[r.label] || '#64748b' }) +
        `<p class="rep-note" style="margin:0.4rem 0 0">عدد المقيَّمين: <strong>${n(graded.length)}</strong> من ${n(total)} (${pct(graded.length, total)}).</p>`);

      const topA = graded.filter(r => ['A', 'B'].includes(clean(r[paKey]).toUpperCase())).length;
      document.getElementById('pa-by-location').innerHTML =
        `<p class="rep-note">نسبة التقييمات المتميزة (A أو B) في تقييم ${paYear} على مستوى المحافظات — الإجمالي العام <strong>${pct(topA, graded.length)}</strong>.</p>` +
        table([{ label: 'المحافظة' }, { label: 'عدد المقيَّمين', num: true },
               { label: 'A', num: true }, { label: 'B', num: true }, { label: 'C', num: true },
               { label: 'D / E', num: true }, { label: 'نسبة A+B', num: true }],
          byLoc.map(l => {
            const sub = graded.filter(r => locAr(r.locations) === l.label);
            if (!sub.length) return null;
            const g = k => sub.filter(r => clean(r[paKey]).toUpperCase() === k).length;
            const de = g('D') + g('E');
            return { cells: [esc(l.label), n(sub.length), n(g('A')), n(g('B')), n(g('C')), n(de), pct(g('A') + g('B'), sub.length)] };
          }).filter(Boolean));
    } else {
      panel('chart-pa', 'تقييم الأداء', '<p class="rep-note">لا توجد تقييمات أداء مسجلة لهذه المجموعة.</p>');
      document.getElementById('pa-by-location').innerHTML = '';
    }

    const promos = promoYears().map(k => ({
      label: k.replace('promo_', ''),
      value: rows.filter(r => clean(r[k]).toUpperCase() === 'P').length
    }));
    const promoTotal = promos.reduce((a, x) => a + x.value, 0);
    if (promoTotal) {
      const promoted = rows.filter(r => promoYears().some(k => clean(r[k]).toUpperCase() === 'P')).length;
      panel('chart-promo', 'عدد الترقيات في كل عام',
        vBarChart(promos, { color: '#1e6ca6', limit: 12 }) +
        `<p class="rep-note" style="margin:0.4rem 0 0">إجمالي <strong>${n(promoTotal)}</strong> ترقية شملت <strong>${n(promoted)}</strong> موظف (${pct(promoted, total)} من المشمولين بالتقرير).</p>`);
    } else {
      panel('chart-promo', 'الترقيات', '<p class="rep-note">لا توجد ترقيات مسجلة لهذه المجموعة.</p>');
    }
    if (paSection) paSection.style.display = (paKey || promoTotal) ? '' : 'none';

    // ---------- 6. Completeness ----------
    const fields = ['employee_name_ar', 'national_id', 'mobile_numbers', 'email', 'birth_date', 'start_date',
      'insurance_number', 'bank_name', 'account_numbers', 'manager', 'job_post', 'sub_location'];
    const defs = window.COLUMN_DEFINITIONS.reduce((m, c) => { m[c.key] = c; return m; }, {});
    document.getElementById('completeness-table').innerHTML = table([
      { label: 'الحقل' }, { label: 'الاكتمال' }, { label: 'مملوء', num: true },
      { label: 'ناقص', num: true }, { label: 'النسبة', num: true }
    ], fields.map(f => {
      const filled = rows.filter(r => clean(r[f])).length;
      const d = defs[f];
      return {
        cells: [esc(d ? d.labelAr : f), cellBar(filled, total), n(filled), n(total - filled), pct(filled, total)]
      };
    }).sort((a, b) => parseFloat(b.cells[4]) - parseFloat(a.cells[4])));
  }

  // ------------------------------------------------------------ filtering
  function applyFilters() {
    let rows = ALL;
    if (els.fStatus.value === 'active') rows = rows.filter(isActive);
    if (els.fLocation.value) rows = rows.filter(r => clean(r.locations) === els.fLocation.value);
    if (els.fCompany.value) rows = rows.filter(r => clean(r.company) === els.fCompany.value);
    if (els.fSector.value) rows = rows.filter(r => clean(r.company_sector) === els.fSector.value);
    if (els.fDivision.value) rows = rows.filter(r => clean(r.division) === els.fDivision.value);
    render(rows);
  }

  function fillSelect(select, values, placeholder, labelFn) {
    select.innerHTML = `<option value="">${placeholder}</option>` +
      values.map(v => `<option value="${esc(v)}">${esc(labelFn ? labelFn(v) : v)}</option>`).join('');
  }

  // ---------------------------------------------------------------- boot
  async function init() {
    try {
      ALL = await window.API._fetchAllRows('*');
      if (!ALL || !ALL.length) throw new Error('قاعدة البيانات لا تحتوي على موظفين.');

      const uniq = field => Array.from(new Set(ALL.map(r => clean(r[field])).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, 'ar'));

      fillSelect(els.fLocation, uniq('locations'), 'كل المحافظات', locAr);
      fillSelect(els.fCompany, uniq('company'), 'كل الشركات');
      fillSelect(els.fSector, uniq('company_sector'), 'كل القطاعات');
      fillSelect(els.fDivision, uniq('division'), 'كل القطاعات الرئيسية');

      [els.fLocation, els.fCompany, els.fSector, els.fDivision, els.fStatus]
        .forEach(s => s.addEventListener('change', applyFilters));

      els.fReset.addEventListener('click', () => {
        els.fLocation.value = '';
        els.fCompany.value = '';
        els.fSector.value = '';
        els.fDivision.value = '';
        els.fStatus.value = 'active';
        applyFilters();
      });

      els.btnPrint.addEventListener('click', () => window.print());

      applyFilters();
      els.loader.style.display = 'none';
      els.report.style.display = '';
    } catch (err) {
      els.loader.style.display = 'none';
      els.error.style.display = '';
      els.errorText.textContent = 'تعذر تحميل بيانات التقرير: ' + (err && err.message ? err.message : err);
    }
  }

  init();
})();
