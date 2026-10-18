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

  const locName = v => String(v || '').trim() || 'Not specified';
  const n = v => Number(v || 0).toLocaleString('en-US');
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
      const key = raw || 'Not specified';
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

    // A narrow viewBox keeps the type large relative to the rendered width:
    // at ~1070px wide these 15px labels land at roughly 17px on screen.
    const W = 620;
    const rowH = 30, padTop = 10, padBottom = 8;
    const H = padTop + rows.length * rowH + padBottom;
    const labelW = 190;              // left column holding the category name
    const trackStart = labelW + 12;
    const trackEnd = W - 96;         // right margin holds the count + percentage
    const max = Math.max(1, ...rows.map(r => r.value));
    const total = opts.total || rows.reduce((a, r) => a + r.value, 0);

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" style="direction:ltr" preserveAspectRatio="xMidYMid meet">`;
    rows.forEach((r, i) => {
      const y = padTop + i * rowH;
      const len = Math.max(2, (trackEnd - trackStart) * r.value / max);
      const color = opts.color || PALETTE[i % PALETTE.length];
      const barY = y + 5, barH = 16;

      svg += `<text x="${labelW}" y="${y + 17}" text-anchor="end" font-size="15" font-weight="600" fill="#0b1a2f">` +
             `${esc(String(r.label).slice(0, 26))}</text>`;
      svg += `<rect x="${trackStart}" y="${barY}" width="${trackEnd - trackStart}" height="${barH}" rx="4" fill="#eef2f7"></rect>`;
      svg += `<rect x="${trackStart}" y="${barY}" width="${len.toFixed(1)}" height="${barH}" rx="4" fill="${color}"></rect>`;

      let valueText = n(r.value);
      if (total) valueText += ` (${pct(r.value, total)})`;
      svg += `<text x="${trackEnd + 8}" y="${y + 17}" text-anchor="start" font-size="14" font-weight="600" fill="#334155">${valueText}</text>`;
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

    // Square viewBox so the ring fills the cell; names live in the legend and
    // the share is written straight onto each slice.
    const S = 300, cx = S / 2, cy = S / 2, rOut = 132, rIn = 76;
    let angle = -Math.PI / 2;

    let svg = `<svg viewBox="0 0 ${S} ${S}" role="img" style="direction:ltr;max-width:300px;margin:0 auto" preserveAspectRatio="xMidYMid meet">`;

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
        svg += `<path d="M${x1} ${y1} A${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4} Z" fill="${color}" stroke="#fff" stroke-width="2"></path>`;
      }

      const share = r.value / total;
      const mid = angle + slice / 2;
      const mr = (rOut + rIn) / 2;
      const tx = cx + mr * Math.cos(mid), ty = cy + mr * Math.sin(mid);

      // Roomy slices carry the name as well as the share; narrow ones take the
      // share alone, and slivers stay clean and rely on the legend.
      if (share >= 0.14) {
        svg += `<text x="${tx.toFixed(1)}" y="${(ty - 3).toFixed(1)}" text-anchor="middle" font-size="15" font-weight="800" fill="#fff">${pct(r.value, total)}</text>`;
        svg += `<text x="${tx.toFixed(1)}" y="${(ty + 12).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="600" fill="#fff" opacity="0.95">${esc(String(r.label).slice(0, 14))}</text>`;
      } else if (share >= 0.05) {
        svg += `<text x="${tx.toFixed(1)}" y="${(ty + 4).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">${pct(r.value, total)}</text>`;
      }
      angle = end;
    });

    svg += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="30" font-weight="800" fill="#0b1a2f">${n(total)}</text>`;
    svg += `<text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="12.5" fill="#64748b">${esc(opts.centerLabel || 'employees')}</text>`;
    svg += '</svg>';

    const legend = '<div class="legend">' + rows.map((r, i) =>
      `<span class="legend-item"><span class="legend-swatch" style="background:${PALETTE[i % PALETTE.length]}"></span>
       <strong>${pct(r.value, total)}</strong>&nbsp;${esc(r.label)}&nbsp;<span style="color:#64748b">(${n(r.value)})</span></span>`).join('') + '</div>';

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
      now.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('meta-count').textContent = n(total) + ' employees';
    document.getElementById('footer-stamp').textContent =
      'Generated: ' + now.toLocaleString('en-GB');

    const scopeBits = [];
    if (els.fLocation.value) scopeBits.push('Governorate: ' + locName(els.fLocation.value));
    if (els.fCompany.value) scopeBits.push('Company: ' + els.fCompany.value);
    if (els.fSector.value) scopeBits.push('Sector: ' + els.fSector.value);
    if (els.fDivision.value) scopeBits.push(els.fDivision.value);
    if (els.fStatus.value === 'active') scopeBits.push('Active employees');
    document.getElementById('meta-scope').textContent = scopeBits.length ? scopeBits.join(' · ') : 'All employees';

    if (!total) {
      els.report.querySelectorAll('.rep-section').forEach(s => { s.style.display = 'none'; });
      document.getElementById('kpi-grid').closest('.rep-section').style.display = '';
      document.getElementById('kpi-grid').innerHTML =
        '<p class="rep-note">No records match the selected filters.</p>';
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
      { label: 'Total employees', value: n(total), sub: 'within this report scope' },
      { label: 'Currently active', value: n(active), sub: pct(active, total) + ' of total' },
      { label: 'Directly hired', value: n(hired), sub: pct(hired, total) },
      { label: 'Outsourced', value: n(outsourced), sub: pct(outsourced, total) },
      { label: 'Governorates', value: n(locations.size), sub: 'geographic locations' },
      { label: 'Companies', value: n(companies.size), sub: n(depts.size) + ' departments' },
      { label: 'Average age', value: avg(ages) ? avg(ages).toFixed(1) : '—', sub: 'years' },
      { label: 'Average tenure', value: avg(yoes) ? avg(yoes).toFixed(1) : '—', sub: 'years with the company' },
      { label: 'Female share', value: pct(females, total), sub: n(females) + ' employees' }
    ];
    document.getElementById('kpi-grid').innerHTML = kpis.map(k => `
      <div class="kpi-card">
        <div class="kpi-label">${esc(k.label)}</div>
        <div class="kpi-value">${k.value}</div>
        <div class="kpi-sub">${esc(k.sub)}</div>
      </div>`).join('');

    // ---------- 2. Governorates ----------
    const byLoc = countBy(rows, 'locations', r => locName(r.locations));
    const top = byLoc[0];
    const topThree = byLoc.slice(0, 3);
    let geoText = `<strong>${n(total)}</strong> employees are spread across <strong>${n(locations.size)}</strong> governorates. ` +
      `The largest concentration is in <strong>${esc(top.label)}</strong> with <strong>${n(top.value)}</strong> employees (${pct(top.value, total)})`;
    geoText += byLoc.length >= 3
      ? `, and the three largest governorates account for <strong>${pct(topThree.reduce((a, x) => a + x.value, 0), total)}</strong> of the total workforce.`
      : '.';
    document.getElementById('geo-summary').innerHTML = geoText;

    document.getElementById('geo-chart').innerHTML = hBarChart(byLoc, { total: total, limit: 20, color: '#0b9444' });

    const maxLoc = byLoc[0].value;
    const locRows = byLoc.map(l => {
      const sub = rows.filter(r => locName(r.locations) === l.label);
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
      cells: ['Total', '', n(total), '100%', n(hired), n(outsourced),
        n(total - females), n(females),
        avg(ages) ? avg(ages).toFixed(1) : '—',
        avg(yoes) ? avg(yoes).toFixed(1) : '—',
        n(new Set(rows.map(r => clean(r.sub_location)).filter(Boolean)).size)]
    });
    document.getElementById('geo-table').innerHTML = table([
      { label: 'Governorate' }, { label: 'Share' }, { label: 'Count', num: true }, { label: '%', num: true },
      { label: 'Hired', num: true }, { label: 'Outsourced', num: true },
      { label: 'Male', num: true }, { label: 'Female', num: true },
      { label: 'Avg age', num: true }, { label: 'Avg tenure', num: true },
      { label: 'Sub-locations', num: true }
    ], locRows);

    // ---------- governorate x company matrix ----------
    const comps = countBy(rows, 'company').slice(0, 6).map(c => c.label);
    const matrixRows = byLoc.map(l => {
      const sub = rows.filter(r => locName(r.locations) === l.label);
      const cells = [esc(l.label)];
      comps.forEach(c => {
        const v = sub.filter(r => (clean(r.company) || 'Not specified') === c).length;
        cells.push(v ? n(v) : '—');
      });
      cells.push(n(l.value));
      return { cells };
    });
    matrixRows.push({
      isTotal: true,
      cells: ['Total'].concat(
        comps.map(c => n(rows.filter(r => (clean(r.company) || 'Not specified') === c).length)),
        [n(total)])
    });
    document.getElementById('geo-company-matrix').innerHTML = table(
      [{ label: 'Governorate' }].concat(comps.map(c => ({ label: c, num: true })), [{ label: 'Total', num: true }]),
      matrixRows);

    // ---------- top sub-locations ----------
    const bySub = countBy(rows, 'sub_location').filter(s => s.label !== 'Not specified').slice(0, 15);
    const maxSub = bySub.length ? bySub[0].value : 1;
    document.getElementById('sublocation-table').innerHTML = table([
      { label: 'Sub-location' }, { label: 'Governorate' }, { label: 'Share' },
      { label: 'Count', num: true }, { label: '%', num: true }
    ], bySub.map(s => {
      const sub = rows.filter(r => clean(r.sub_location) === s.label);
      const loc = countBy(sub, 'locations', r => locName(r.locations))[0];
      return { cells: [esc(s.label), esc(loc ? loc.label : '—'), cellBar(s.value, maxSub), n(s.value), pct(s.value, total)] };
    }));

    // ---------- 3. Organisation ----------
    panel('chart-company', 'Headcount by Company', donutChart(countBy(rows, 'company')));
    panel('chart-sector', 'Headcount by Sector', donutChart(countBy(rows, 'company_sector')));
    panel('chart-division', 'Largest Divisions', hBarChart(countBy(rows, 'division'), { total: total, limit: 8, color: '#1e6ca6' }));
    panel('chart-jobtree', 'Largest Job Trees', hBarChart(countBy(rows, 'job_tree'), { total: total, limit: 8, color: '#0b9444' }));

    const byDept = countBy(rows, 'department');
    const maxDept = byDept[0].value;
    document.getElementById('dept-table').innerHTML = table([
      { label: 'Department' }, { label: 'Share' }, { label: 'Count', num: true }, { label: '%', num: true },
      { label: 'Sub-departments', num: true }, { label: 'Avg tenure', num: true }
    ], byDept.map(d => {
      const sub = rows.filter(r => (clean(r.department) || 'Not specified') === d.label);
      const y = avg(sub.map(yoeOf).filter(v => v != null));
      return {
        cells: [esc(d.label), cellBar(d.value, maxDept), n(d.value), pct(d.value, total),
          n(new Set(sub.map(r => clean(r.sub_department)).filter(Boolean)).size), y ? y.toFixed(1) : '—']
      };
    }));

    // ---------- 4. Workforce composition ----------
    panel('chart-gender', 'Headcount by Gender', donutChart(countBy(rows, 'gender', r => {
      const g = clean(r.gender).toLowerCase();
      return g.startsWith('m') ? 'Male' : g.startsWith('f') ? 'Female' : 'Not specified';
    })));
    panel('chart-hiring', 'Engagement Type', donutChart(countBy(rows, 'employment_type', r => {
      const t = clean(r.employment_type).toLowerCase();
      return t === 'hired' ? 'Directly hired' : t === 'outsourcing' ? 'Outsourced' : (clean(r.employment_type) || 'Not specified');
    })));

    const ageBands = [
      { label: 'Under 25', test: a => a < 25 },
      { label: '25 – 34', test: a => a >= 25 && a < 35 },
      { label: '35 – 44', test: a => a >= 35 && a < 45 },
      { label: '45 – 54', test: a => a >= 45 && a < 55 },
      { label: '55 and over', test: a => a >= 55 }
    ].map(b => ({ label: b.label, value: ages.filter(b.test).length }));
    panel('chart-age', 'Age Bands', vBarChart(ageBands, { color: '#1e6ca6' }) +
      `<p class="rep-note" style="margin:0.4rem 0 0">Calculated from date of birth for ${n(ages.length)} employees with a recorded birth date.</p>`);

    const yoeBands = [
      { label: 'Under 1 year', test: y => y < 1 },
      { label: '1 – 4', test: y => y >= 1 && y < 5 },
      { label: '5 – 9', test: y => y >= 5 && y < 10 },
      { label: '10 – 14', test: y => y >= 10 && y < 15 },
      { label: '15 – 19', test: y => y >= 15 && y < 20 },
      { label: '20 and over', test: y => y >= 20 }
    ].map(b => ({ label: b.label, value: yoes.filter(b.test).length }));
    panel('chart-yoe', 'Years of Service', vBarChart(yoeBands, { color: '#0b9444' }) +
      `<p class="rep-note" style="margin:0.4rem 0 0">Calculated from the hiring date for ${n(yoes.length)} employees.</p>`);

    const byContract = countBy(rows, 'type_of_contract');
    const byLevel = countBy(rows, 'taqa_level_grade');
    const maxC = byContract[0].value, maxL = byLevel[0].value;
    document.getElementById('contract-table').innerHTML =
      '<div class="chart-row" style="margin-top:0.4rem">' +
      '<div class="chart-cell"><div class="chart-title">Contract Type</div>' +
      table([{ label: 'Type' }, { label: '' }, { label: 'Count', num: true }, { label: '%', num: true }],
        byContract.map(c => ({ cells: [esc(c.label), cellBar(c.value, maxC), n(c.value), pct(c.value, total)] }))) +
      '</div><div class="chart-cell"><div class="chart-title">TAQA Grade</div>' +
      table([{ label: 'Grade' }, { label: '' }, { label: 'Count', num: true }, { label: '%', num: true }],
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
      if (other > 0) paCounts.push({ label: 'Other', value: other });

      const paColors = { 'A': '#0b9444', 'B': '#5bae45', 'C': '#fad213', 'D': '#f59e0b', 'E': '#ef4444' };
      panel('chart-pa', `Performance Ratings — ${paYear}`,
        vBarChart(paCounts, { colorFor: r => paColors[r.label] || '#64748b' }) +
        `<p class="rep-note" style="margin:0.4rem 0 0">Employees rated: <strong>${n(graded.length)}</strong> of ${n(total)} (${pct(graded.length, total)}).</p>`);

      const topA = graded.filter(r => ['A', 'B'].includes(clean(r[paKey]).toUpperCase())).length;
      document.getElementById('pa-by-location').innerHTML =
        `<p class="rep-note">Share of high ratings (A or B) in the ${paYear} review by governorate — overall <strong>${pct(topA, graded.length)}</strong>.</p>` +
        table([{ label: 'Governorate' }, { label: 'Rated', num: true },
               { label: 'A', num: true }, { label: 'B', num: true }, { label: 'C', num: true },
               { label: 'D / E', num: true }, { label: 'A+B share', num: true }],
          byLoc.map(l => {
            const sub = graded.filter(r => locName(r.locations) === l.label);
            if (!sub.length) return null;
            const g = k => sub.filter(r => clean(r[paKey]).toUpperCase() === k).length;
            const de = g('D') + g('E');
            return { cells: [esc(l.label), n(sub.length), n(g('A')), n(g('B')), n(g('C')), n(de), pct(g('A') + g('B'), sub.length)] };
          }).filter(Boolean));
    } else {
      panel('chart-pa', 'Performance Ratings', '<p class="rep-note">No performance ratings recorded for this selection.</p>');
      document.getElementById('pa-by-location').innerHTML = '';
    }

    const promos = promoYears().map(k => ({
      label: k.replace('promo_', ''),
      value: rows.filter(r => clean(r[k]).toUpperCase() === 'P').length
    }));
    const promoTotal = promos.reduce((a, x) => a + x.value, 0);
    if (promoTotal) {
      const promoted = rows.filter(r => promoYears().some(k => clean(r[k]).toUpperCase() === 'P')).length;
      panel('chart-promo', 'Promotions per Year',
        vBarChart(promos, { color: '#1e6ca6', limit: 12 }) +
        `<p class="rep-note" style="margin:0.4rem 0 0"><strong>${n(promoTotal)}</strong> promotions covering <strong>${n(promoted)}</strong> employees (${pct(promoted, total)} of those in this report).</p>`);
    } else {
      panel('chart-promo', 'Promotions', '<p class="rep-note">No promotions recorded for this selection.</p>');
    }
    if (paSection) paSection.style.display = (paKey || promoTotal) ? '' : 'none';

    // ---------- 6. Completeness ----------
    const fields = ['employee_name_ar', 'national_id', 'mobile_numbers', 'email', 'birth_date', 'start_date',
      'insurance_number', 'bank_name', 'account_numbers', 'manager', 'job_post', 'sub_location'];
    const defs = window.COLUMN_DEFINITIONS.reduce((m, c) => { m[c.key] = c; return m; }, {});
    document.getElementById('completeness-table').innerHTML = table([
      { label: 'Field' }, { label: 'Completeness' }, { label: 'Filled', num: true },
      { label: 'Missing', num: true }, { label: '%', num: true }
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
      if (!ALL || !ALL.length) throw new Error('The database contains no employees.');

      const uniq = field => Array.from(new Set(ALL.map(r => clean(r[field])).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, 'ar'));

      fillSelect(els.fLocation, uniq('locations'), 'All governorates', locName);
      fillSelect(els.fCompany, uniq('company'), 'All companies');
      fillSelect(els.fSector, uniq('company_sector'), 'All sectors');
      fillSelect(els.fDivision, uniq('division'), 'All divisions');

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
      els.errorText.textContent = 'Could not load the report data: ' + (err && err.message ? err.message : err);
    }
  }

  init();
})();
