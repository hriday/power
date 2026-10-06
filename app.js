/* How Big Is a Gigawatt? — interactive power explainer.
   All numbers are rounded, approximate figures meant for building intuition. */
(function () {
  'use strict';

  const SVGNS = 'http://www.w3.org/2000/svg';
  const $ = (id) => document.getElementById(id);

  /* ---------------- Data ---------------- */

  const CITIES = [
    { id: 'reddeer', name: 'Red Deer', prov: 'Alberta', size: 'Small city', pop: '≈ 110,000 people', avgMW: 90, peakMW: 140,
      note: 'Central Alberta\'s hub, halfway between Calgary and Edmonton.', buildings: 8, height: 0.32 },
    { id: 'calgary', name: 'Calgary', prov: 'Alberta', size: 'Medium city', pop: '≈ 1.7 million people', avgMW: 1100, peakMW: 1700,
      note: 'Peaks on cold winter evenings, when lights, ovens and furnace fans all run at once.', buildings: 18, height: 0.7, landmark: 'calgary' },
    { id: 'toronto', name: 'Toronto', prov: 'Ontario', size: 'Large city', pop: '≈ 3.3 million people', avgMW: 2900, peakMW: 4800,
      note: 'Peaks on hot summer afternoons, when air conditioners run flat out.', buildings: 26, height: 0.95, landmark: 'toronto' },
    { id: 'tokyo', name: 'Greater Tokyo', prov: 'Japan', size: 'Mega city · world\'s largest', pop: '≈ 37 million people', avgMW: 30000, peakMW: 55000,
      note: 'Figures cover the Tokyo power company\'s whole region (about 45 million people). It peaks on sweltering summer afternoons.', buildings: 34, height: 0.42, landmark: 'tokyo' },
  ];

  // Illustrative winter-weekday shape (relative to average). Normalised below so the mean is exactly 1.
  const RAW_SHAPE = [0.82, 0.79, 0.77, 0.76, 0.77, 0.82, 0.92, 1.03, 1.07, 1.06, 1.05, 1.04,
                     1.03, 1.02, 1.03, 1.06, 1.13, 1.19, 1.18, 1.14, 1.08, 1.01, 0.93, 0.87];
  const SHAPE = (() => { const m = RAW_SHAPE.reduce((a, b) => a + b, 0) / RAW_SHAPE.length; return RAW_SHAPE.map((v) => v / m); })();

  const CATS = {
    dev: { label: 'Devices & homes', color: 'var(--dev)' },
    ai: { label: 'Data centres & AI', color: 'var(--ai)' },
    place: { label: 'Places', color: 'var(--place)' },
    gen: { label: 'Power sources', color: 'var(--gen)' },
  };

  const LADDER = [
    { id: 'phone', ico: '📱', name: 'Phone charging', w: 5, cat: 'dev' },
    { id: 'led', ico: '💡', name: 'LED light bulb', sub: 'the modern, efficient kind', w: 10, cat: 'dev' },
    { id: 'laptop', ico: '💻', name: 'Laptop', w: 50, cat: 'dev' },
    { id: 'incand', ico: '💡', name: 'Old-style light bulb', sub: 'incandescent', w: 60, cat: 'dev' },
    { id: 'tv', ico: '📺', name: 'Big-screen TV', w: 150, cat: 'dev' },
    { id: 'gaming', ico: '🎮', name: 'Gaming PC', sub: 'while gaming', w: 500, cat: 'dev' },
    { id: 'gpu', ico: '🧠', name: 'One AI chip', sub: 'Nvidia H100, just the chip', w: 700, cat: 'ai' },
    { id: 'home', ico: '🏠', name: 'Average home', sub: 'averaged over a whole year', w: 1000, cat: 'dev' },
    { id: 'micro', ico: '🍿', name: 'Microwave', w: 1100, cat: 'dev' },
    { id: 'kettle', ico: '☕', name: 'Kettle', w: 1500, cat: 'dev' },
    { id: 'rooftop', ico: '☀️', name: 'Rooftop solar', sub: 'a sunny noon, typical home system', w: 7000, cat: 'gen' },
    { id: 'evhome', ico: '🔌', name: 'Electric car charging at home', w: 7200, cat: 'dev' },
    { id: 'rack', ico: '🗄️', name: 'One AI server rack', sub: 'fridge-sized cabinet, 72 AI chips', w: 130e3, cat: 'ai' },
    { id: 'fast', ico: '⚡', name: 'Highway fast charger', sub: 'one stall', w: 150e3, cat: 'dev' },
    { id: 'turbine', ico: '🌬️', name: 'Wind turbine', sub: 'at full speed (averages ~1.2 MW)', w: 3.5e6, cat: 'gen' },
    { id: 'hospital', ico: '🏥', name: 'Large hospital', w: 5e6, cat: 'place' },
    { id: 'cloud', ico: '🏢', name: 'Typical cloud data centre', sub: 'pre-AI era', w: 20e6, cat: 'ai' },
    { id: 'reddeer', ico: '🏘️', name: 'Red Deer', sub: 'average use', w: 90e6, cat: 'place' },
    { id: 'travers', ico: '☀️', name: 'Huge solar farm', sub: 'Travers, Alberta, at full sun', w: 465e6, cat: 'gen' },
    { id: 'aicampus', ico: '🏭', name: 'Giant AI data centre campus', sub: 'the 2025–26 frontier', w: 1e9, cat: 'ai' },
    { id: 'reactor', ico: '⚛️', name: 'Large nuclear reactor', w: 1e9, cat: 'gen' },
    { id: 'calgary', ico: '🏙️', name: 'Calgary', sub: 'average use', w: 1.1e9, cat: 'place' },
    { id: 'toronto', ico: '🌆', name: 'Toronto', sub: 'average use', w: 2.9e9, cat: 'place' },
    { id: 'bruce', ico: '⚛️', name: 'Bruce nuclear station', sub: 'Ontario, 8 reactors, one of the world\'s largest', w: 6.5e9, cat: 'gen' },
    { id: 'wonder', ico: '🏗️', name: 'Proposed AI mega-campus', sub: 'Wonder Valley, Alberta (proposal)', w: 7.5e9, cat: 'ai' },
    { id: 'alberta', ico: '🗺️', name: 'All of Alberta', sub: 'record peak', w: 12e9, cat: 'place' },
    { id: 'tokyo', ico: '🗼', name: 'Greater Tokyo', sub: 'average use, world\'s largest city', w: 30e9, cat: 'place' },
    { id: 'canada', ico: '🍁', name: 'All of Canada', sub: 'average', w: 65e9, cat: 'place' },
    { id: 'usa', ico: '🇺🇸', name: 'United States', sub: 'average', w: 470e9, cat: 'place' },
    { id: 'world', ico: '🌍', name: 'The whole world', sub: 'average electricity use', w: 3.4e12, cat: 'place' },
  ];

  const CHIPS = {
    server: { label: 'Regular servers', noun: 'servers', kw: 0.5,
      help: 'Ordinary computers that run websites, email, banking and storage. About 0.5 kW each.' },
    h100: { label: 'AI chips (2023)', noun: 'AI chips', kw: 1.3,
      help: 'An Nvidia H100-class GPU. The chip draws ~700 W, about 1.3 kW once you add its share of the server around it.' },
    blackwell: { label: 'AI chips (2025)', noun: 'AI chips', kw: 1.9,
      help: 'An Nvidia Blackwell-class GPU. About 1.9 kW all-in. Newer chips do more work, but each one also draws more power.' },
  };

  const PRESETS = [
    { id: 'closet', ico: '🗄️', label: 'Office server closet', chip: 'server', n: 20, util: 50, pue: 1.8, cool: 'dry' },
    { id: 'cloud', ico: '☁️', label: 'Typical cloud data centre', chip: 'server', n: 50000, util: 60, pue: 1.4, cool: 'evap' },
    { id: 'cluster', ico: '🧠', label: '100,000-chip AI cluster', chip: 'h100', n: 100000, util: 85, pue: 1.3, cool: 'evap' },
    { id: 'giga', ico: '🏭', label: 'Gigawatt AI campus', chip: 'blackwell', n: 500000, util: 85, pue: 1.2, cool: 'evap' },
    { id: 'wonder', ico: '🏗️', label: 'Proposed 7.5 GW Alberta campus', chip: 'blackwell', n: 3700000, util: 85, pue: 1.25, cool: 'hybrid' },
  ];

  // wue: litres of water evaporated per kWh of computer (IT) energy. dPue: extra power overhead vs evaporative.
  const COOLING = {
    evap: { label: 'Evaporative (uses water)', wue: 1.8, dPue: 0,
      help: 'Water evaporates to carry the heat away, the way sweat cools you. It saves electricity but uses up a lot of water, most of all on hot days.' },
    hybrid: { label: 'Outside air + water on hot days', wue: 0.4, dPue: 0.05,
      help: 'Uses cold outside air most of the year and only evaporates water when it\'s hot. This works well in cool, dry places like Alberta.' },
    dry: { label: 'Closed loop (almost no water)', wue: 0.05, dPue: 0.15,
      help: 'Coolant circulates in sealed pipes, like a car radiator, and big fans or chillers blow the heat away. It uses almost no water but more electricity. Watch the overhead slider go up when you pick it.' },
  };

  const DEVICES = [
    { n: '💡 LED bulb', w: 10 },
    { n: '💡 Old-style (incandescent) bulb', w: 60 },
    { n: '📱 Phone charging', w: 5 },
    { n: '💻 Laptop', w: 50 },
    { n: '📺 Big-screen TV', w: 150 },
    { n: '🎮 Gaming PC', w: 500 },
    { n: '🧊 Fridge (averaged over the day)', w: 45 },
    { n: '🍿 Microwave', w: 1100 },
    { n: '☕ Kettle', w: 1500 },
    { n: '🔥 Space heater', w: 1500 },
    { n: '🚗 Electric car charging at home', w: 7200 },
  ];

  const HOME_KW = 1;           // average home, kW
  const LED_W = 10;
  const REACTOR_MW = 1000;
  const TURBINE_AVG_MW = 1.2;  // 3.5 MW turbine at ~35% capacity factor
  const PRICE_PER_KWH = 0.08;  // rough large-customer price, CAD
  const CHAT_WH = 0.3;         // one AI chatbot question, rough estimate
  const GRID_WUE = 4.5;        // litres consumed at power plants per kWh (recent US-grid average)
  const POOL_L = 2.5e6;        // Olympic swimming pool
  const PERSON_L_DAY = 223;    // Canadian residential use per person per day (StatCan 2021)
  const CALGARY_L_DAY = 600e6; // Calgary's typical daily water use

  /* ---------------- Helpers ---------------- */

  function el(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function rng(seed) { // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function trim(v) {
    if (v >= 100) return Math.round(v).toLocaleString('en-CA');
    if (v >= 10) return (Math.round(v * 10) / 10).toString();
    return (Math.round(v * 100) / 100).toString();
  }

  function fmtW(w) {
    const units = [['TW', 1e12], ['GW', 1e9], ['MW', 1e6], ['kW', 1e3]];
    for (const [u, f] of units) if (w >= f) return trim(w / f) + ' ' + u;
    return trim(w) + ' W';
  }

  function fmtWh(wh) {
    const units = [['TWh', 1e12], ['GWh', 1e9], ['MWh', 1e6], ['kWh', 1e3]];
    for (const [u, f] of units) if (wh >= f) return trim(wh / f) + ' ' + u;
    return trim(wh) + ' Wh';
  }

  // Friendly counts: "120,000", "3.4 million", "1.2 billion"
  function fmtCount(n) {
    if (n < 1) return (Math.round(n * 100) / 100).toString();
    if (n < 10) return (Math.round(n * 10) / 10).toString();
    const s = Number(n.toPrecision(2));
    if (s < 1e6) return Math.round(s).toLocaleString('en-CA');
    const words = [['trillion', 1e12], ['billion', 1e9], ['million', 1e6]];
    for (const [w, f] of words) if (s >= f) return trim(s / f) + ' ' + w;
    return s.toString();
  }

  function fmtMoney(d) {
    if (d < 1) return Math.round(d * 100) + '¢';
    if (d < 1000) return '$' + d.toFixed(d < 10 ? 2 : 0);
    if (d < 1e6) return '$' + Math.round(d).toLocaleString('en-CA');
    return '$' + fmtCount(d);
  }

  function fmtL(l) {
    if (l < 1000) return Math.round(l) + ' L';
    if (l < 1e6) return Number(l.toPrecision(2)).toLocaleString('en-CA') + ' L';
    return fmtCount(l) + ' L';
  }

  function hourLabel(h) {
    h = ((h % 24) + 24) % 24;
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? h + ' AM' : (h - 12) + ' PM';
  }

  function niceCeil(v) {
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.2, 1.6, 2, 2.4, 3, 4, 6, 8, 10]) if (m * mag >= v) return m * mag;
    return 10 * mag;
  }

  function setSeg(container, value, attr) {
    container.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset[attr] === String(value))));
  }

  /* ---------------- Theme ---------------- */

  function initTheme() {
    const btn = $('themeToggle');
    const label = btn.querySelector('.tt-label');
    const sync = () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      label.textContent = dark ? 'Night' : 'Day';
      btn.setAttribute('aria-pressed', String(dark));
    };
    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
      sync();
    });
    sync();
  }

  /* ---------------- Hero scene ---------------- */

  function addWindows(parent, x, top, w, h, r) {
    const cols = Math.max(1, Math.floor((w - 6) / 7));
    const rows = Math.max(1, Math.floor((h - 10) / 10));
    const offX = x + (w - (cols * 7 - 3)) / 2;
    for (let c = 0; c < cols; c++) {
      for (let k = 0; k < rows; k++) {
        const on = r() < 0.62;
        const rect = el('rect', { x: offX + c * 7, y: top + 6 + k * 10, width: 4, height: 5, class: on ? 'win on' : 'win' }, parent);
        if (on) rect.style.setProperty('--d', (r() * 1.4).toFixed(2) + 's');
      }
    }
  }

  function towerPath(x, base) {
    return `M${x - 11} ${base} L${x} ${base - 100} L${x + 11} ${base}` +
      ` M${x - 7} ${base - 30} L${x + 7} ${base - 30} M${x - 4} ${base - 60} L${x + 4} ${base - 60}` +
      ` M${x - 16} ${base - 86} L${x + 16} ${base - 86} M${x - 10} ${base - 74} L${x + 10} ${base - 74}` +
      ` M${x - 7} ${base - 30} L${x + 4} ${base - 60} M${x + 7} ${base - 30} L${x - 4} ${base - 60}`;
  }

  function turbine(s, x, groundY, height, blade, dur) {
    const hubY = groundY - height;
    el('polygon', { class: 'turbine-pole', points: `${x - 3},${groundY} ${x + 3},${groundY} ${x + 1.2},${hubY} ${x - 1.2},${hubY}` }, s);
    const g = el('g', { class: 'blades' }, s);
    g.style.transformBox = 'view-box';
    g.style.transformOrigin = `${x}px ${hubY}px`;
    g.style.animationDuration = dur + 's';
    for (const a of [0, 120, 240]) {
      el('path', { class: 'turbine-pole', transform: `rotate(${a} ${x} ${hubY})`,
        d: `M${x} ${hubY} Q${x + 5} ${hubY - blade * 0.5} ${x} ${hubY - blade} Q${x - 3} ${hubY - blade * 0.5} ${x} ${hubY} Z` }, g);
    }
    el('circle', { class: 'turbine-pole', cx: x, cy: hubY, r: 3.5 }, s);
  }

  // Substation: steps the voltage down before power goes into the city.
  function substation(s, x, base) {
    el('rect', { class: 'b2', x: x - 13, y: base - 18, width: 10, height: 18, rx: 1.5 }, s);
    el('rect', { class: 'b2', x: x + 3, y: base - 18, width: 10, height: 18, rx: 1.5 }, s);
    el('path', { class: 'tower', d: `M${x - 8} ${base - 18} L${x - 8} ${base - 30} M${x + 8} ${base - 18} L${x + 8} ${base - 30} M${x - 14} ${base - 30} L${x + 14} ${base - 30}` }, s);
    el('rect', { class: 'fence', x: x - 18, y: base - 12, width: 36, height: 12 }, s);
  }

  function buildScene() {
    const s = $('scene');
    const r = rng(11);
    const BASE = 372;

    const defs = el('defs', null, s);
    const grad = el('linearGradient', { id: 'skyGrad', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0', class: 'sky-top' }, grad);
    el('stop', { offset: '1', class: 'sky-bot' }, grad);
    el('rect', { x: 0, y: 0, width: 1200, height: 420, fill: 'url(#skyGrad)' }, s);

    // Stars
    const stars = el('g', { class: 'stars' }, s);
    for (let i = 0; i < 110; i++) {
      const c = el('circle', { cx: (r() * 1200).toFixed(1), cy: (r() * 250).toFixed(1), r: (r() * 1.3 + 0.3).toFixed(2), fill: '#fff' }, stars);
      if (r() < 0.4) { c.setAttribute('class', 'twinkle'); c.style.animationDelay = (r() * 3).toFixed(2) + 's'; }
    }

    // Sun + moon
    el('circle', { class: 'sun-glow', cx: 960, cy: 100, r: 78 }, s);
    el('circle', { class: 'sun', cx: 960, cy: 100, r: 42 }, s);
    const moon = el('g', { class: 'moon' }, s);
    el('circle', { cx: 960, cy: 92, r: 34, fill: '#f3efdf' }, moon);
    el('circle', { cx: 948, cy: 84, r: 7, fill: '#dcd5bd' }, moon);
    el('circle', { cx: 972, cy: 102, r: 5, fill: '#dcd5bd' }, moon);
    el('circle', { cx: 967, cy: 78, r: 3.5, fill: '#dcd5bd' }, moon);

    // Rockies
    el('path', { class: 'm-far', d: 'M0 300 L80 240 L150 270 L240 185 L320 250 L400 200 L470 255 L560 212 L640 262 L720 192 L800 250 L880 206 L960 258 L1050 218 L1130 255 L1200 228 L1200 420 L0 420 Z' }, s);
    for (const [px, py] of [[240, 185], [400, 200], [720, 192], [880, 206], [1050, 218]]) {
      el('path', { class: 'snow', d: `M${px} ${py} L${px - 17} ${py + 14} L${px - 7} ${py + 10} L${px} ${py + 17} L${px + 7} ${py + 10} L${px + 15} ${py + 15} Z` }, s);
    }
    el('path', { class: 'm-near', d: 'M0 335 L120 285 L210 312 L330 265 L430 318 L540 292 L650 322 L780 278 L900 320 L1010 292 L1120 322 L1200 302 L1200 420 L0 420 Z' }, s);

    // Ground + hill for turbines
    el('rect', { class: 'ground', x: 0, y: BASE - 2, width: 1200, height: 60 }, s);
    el('path', { class: 'ground', d: 'M960 374 Q1080 328 1200 342 L1200 420 L960 420 Z' }, s);

    // Power plant (cooling tower) on the left
    el('path', { class: 'b3', d: `M88 ${BASE} Q110 310 100 252 L160 252 Q150 310 172 ${BASE} Z` }, s);
    el('rect', { class: 'b2', x: 172, y: BASE - 40, width: 44, height: 40 }, s);
    const steam = el('g', null, s);
    [[130, 236, 14, 0], [118, 220, 18, 2], [140, 206, 20, 4]].forEach(([cx, cy, rr, d]) => {
      const c = el('circle', { class: 'steam-puff', cx, cy, r: rr }, steam);
      c.style.animationDelay = d + 's';
    });

    // Power path: plant / turbines → transmission tower → substation → city.
    // Every wire is drawn in the direction power flows, so the dashes animate the right way.
    el('path', { class: 'tower', d: towerPath(262, BASE) }, s);
    el('path', { class: 'tower', d: towerPath(950, BASE) }, s);
    substation(s, 306, BASE);
    substation(s, 894, BASE);
    const wires = [
      `M196 ${BASE - 40} Q225 ${BASE - 70} 246 ${BASE - 86}`,  // plant → tower
      `M278 ${BASE - 86} Q296 ${BASE - 60} 300 ${BASE - 30}`,  // tower → left substation
      `M1062 ${BASE - 26} Q1020 ${BASE - 60} 966 ${BASE - 86}`, // turbines → tower
      `M934 ${BASE - 86} Q906 ${BASE - 60} 900 ${BASE - 30}`,  // tower → right substation
      `M306 ${BASE + 6} L600 ${BASE + 6}`,                      // left substation → city streets
      `M894 ${BASE + 6} L600 ${BASE + 6}`,                      // right substation → city streets
    ];
    wires.forEach((d) => el('path', { class: 'wire', d }, s));
    wires.forEach((d) => el('path', { class: 'flow', d }, s));

    // Calgary Tower (drawn before buildings so they overlap its base)
    el('polygon', { class: 'b3', points: `552,${BASE} 568,${BASE} 564,150 556,150` }, s);
    el('rect', { class: 'b2', x: 536, y: 130, width: 48, height: 20, rx: 7 }, s);
    el('rect', { class: 'b3', x: 544, y: 121, width: 32, height: 10, rx: 3 }, s);
    el('rect', { class: 'b2', x: 559, y: 94, width: 2, height: 28 }, s);
    el('circle', { class: 'beacon', cx: 560, cy: 93, r: 3 }, s);
    const podWins = el('g', null, s);
    for (let i = 0; i < 6; i++) el('rect', { class: 'win on', x: 541 + i * 7, y: 137, width: 4, height: 5 }, podWins);

    // Downtown skyline
    let x = 330;
    for (;;) {
      const w = 22 + r() * 30;
      if (x + w > 872) break; // leave room for the right-hand substation
      const centre = 1.25 - Math.abs(x + w / 2 - 600) / 420;
      const h = Math.max(28, (40 + r() * 150) * centre);
      if (x > 520 && x < 600 && h > 200) { x += 4; continue; } // keep the tower visible
      const cls = ['b1', 'b2', 'b3'][Math.floor(r() * 3)];
      el('rect', { class: cls, x: x.toFixed(1), y: (BASE - h).toFixed(1), width: w.toFixed(1), height: h.toFixed(1) }, s);
      addWindows(s, x, BASE - h, w, h, r);
      x += w + 2 + r() * 4;
    }

    // Wind turbines on the hill
    turbine(s, 1070, 350, 120, 52, 5);
    turbine(s, 1140, 343, 95, 42, 3.8);
  }

  /* ---------------- City mini skylines ---------------- */

  function miniSkyline(city) {
    const svg = el('svg', { viewBox: '0 0 320 120', preserveAspectRatio: 'xMidYMax slice', class: 'scene', 'aria-hidden': 'true' });
    const r = rng(city.name.length * 97);
    const BASE = 108;
    el('rect', { x: 0, y: 0, width: 320, height: 120, fill: 'url(#skyGrad)' }, svg);
    const stars = el('g', { class: 'stars' }, svg);
    for (let i = 0; i < 18; i++) el('circle', { cx: r() * 320, cy: r() * 60, r: r() * 1 + 0.3, fill: '#fff' }, stars);
    if (city.landmark === 'tokyo') {
      // Mount Fuji on the horizon
      el('path', { class: 'm-far', d: 'M150 104 L222 44 Q232 38 242 44 L314 104 Z' }, svg);
      el('path', { class: 'snow', d: 'M222 44 Q232 38 242 44 L254 54 L246 52 L240 58 L232 51 L224 58 L218 52 L210 54 Z' }, svg);
    } else if (city.id !== 'toronto') {
      el('path', { class: 'm-far', d: 'M0 85 L50 55 L95 75 L150 45 L205 72 L260 50 L320 70 L320 120 L0 120 Z' }, svg);
    } else {
      el('rect', { class: 'm-far', x: 0, y: 96, width: 320, height: 24 }, svg); // Lake Ontario-ish horizon
    }
    el('rect', { class: 'ground', x: 0, y: BASE, width: 320, height: 12 }, svg);

    if (city.landmark === 'calgary') {
      el('polygon', { class: 'b3', points: `206,${BASE} 212,${BASE} 210.5,40 207.5,40` }, svg);
      el('rect', { class: 'b2', x: 200, y: 33, width: 18, height: 8, rx: 3 }, svg);
      el('rect', { class: 'b2', x: 208.5, y: 22, width: 1, height: 12 }, svg);
    }
    if (city.landmark === 'toronto') {
      el('polygon', { class: 'b3', points: `228,${BASE} 236,${BASE} 233,10 231,10` }, svg);
      el('ellipse', { class: 'b2', cx: 232, cy: 44, rx: 10, ry: 6 }, svg);
      el('ellipse', { class: 'b2', cx: 232, cy: 30, rx: 4, ry: 3 }, svg);
    }

    if (city.landmark === 'tokyo') {
      // Tokyo Tower: orange lattice A-frame
      const tx = 64, tower = '#e8542f';
      el('polygon', { points: `${tx - 11},${BASE} ${tx - 1.5},14 ${tx + 1.5},14 ${tx + 11},${BASE}`, fill: tower }, svg);
      el('rect', { x: tx - 6, y: 58, width: 12, height: 5, fill: '#f4f1ea' }, svg);
      el('rect', { x: tx - 3.5, y: 34, width: 7, height: 4, fill: '#f4f1ea' }, svg);
      el('rect', { x: tx - 0.5, y: 4, width: 1, height: 11, fill: tower }, svg);
    }

    const n = city.buildings;
    const span = 260;
    const start = (320 - span) / 2;
    for (let i = 0; i < n; i++) {
      const w = span / n - 2;
      const bx = start + i * (span / n);
      const centre = 1 - Math.abs(i - n / 2) / n;
      const h = Math.max(10, (14 + r() * 80) * city.height * (0.5 + centre));
      if (city.landmark === 'tokyo' && Math.abs(bx + w / 2 - 64) < 14) continue; // keep Tokyo Tower clear
      const cls = ['b1', 'b2', 'b3'][Math.floor(r() * 3)];
      if (city.id === 'reddeer' && r() < 0.5) {
        // little houses with roofs
        const hh = 12 + r() * 6;
        el('rect', { class: cls, x: bx, y: BASE - hh, width: w, height: hh }, svg);
        el('polygon', { class: 'b2', points: `${bx - 1},${BASE - hh} ${bx + w / 2},${BASE - hh - 8} ${bx + w + 1},${BASE - hh}` }, svg);
        el('rect', { class: r() < 0.7 ? 'win on' : 'win', x: bx + w / 2 - 2, y: BASE - hh + 4, width: 4, height: 4 }, svg);
        continue;
      }
      el('rect', { class: cls, x: bx, y: BASE - h, width: w, height: h }, svg);
      addWindows(svg, bx, BASE - h, w, h, r);
    }
    return svg;
  }

  function buildCities() {
    const wrap = $('cityCards');
    CITIES.forEach((c) => {
      const card = document.createElement('article');
      card.className = 'card city';
      card.appendChild(miniSkyline(c));
      const body = document.createElement('div');
      body.className = 'city-body';
      body.innerHTML = `
        <div class="city-size">${c.size}</div>
        <h3>${c.name}<span class="muted" style="font-size:.9rem;font-family:var(--font-body);font-weight:500">, ${c.prov}</span></h3>
        <div class="pop">${c.pop}</div>
        <div class="city-nums">
          <div><b>${fmtW(c.avgMW * 1e6)}</b><span>average use</span></div>
          <div><b>${fmtW(c.peakMW * 1e6)}</b><span>busiest hour of the year</span></div>
        </div>
        <p class="city-note">${c.note} On average that's about <strong>${fmtCount((c.avgMW * 1e6) / LED_W)}</strong> LED bulbs left on.</p>`;
      card.appendChild(body);
      wrap.appendChild(card);
    });
  }

  /* ---------------- Dots ---------------- */

  const DOT_CAPTIONS = [
    'If the orange dot is <strong>1 watt</strong> (a tiny night-light), all 1,000 dots together are <strong>1 kilowatt</strong>, about what an average home uses.',
    'If the orange dot is <strong>1 kilowatt</strong> (one home), all 1,000 dots are <strong>1 megawatt</strong>, a neighbourhood of about 1,000 homes.',
    'If the orange dot is <strong>1 megawatt</strong> (about 1,000 homes), all 1,000 dots are <strong>1 gigawatt</strong>. That\'s about all of Calgary, or one large nuclear reactor.',
  ];

  function buildDots() {
    const dots = $('dots');
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 1000; i++) {
      const d = document.createElement('i');
      if (i === 0) d.className = 'first';
      d.style.setProperty('--d', (i * 0.7) + 'ms');
      frag.appendChild(d);
    }
    dots.appendChild(frag);
    const seg = $('dotSeg');
    const show = (step) => {
      setSeg(seg, step, 'step');
      $('dotCaption').innerHTML = DOT_CAPTIONS[step];
      dots.classList.remove('sweep');
      requestAnimationFrame(() => requestAnimationFrame(() => dots.classList.add('sweep')));
    };
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) show(Number(b.dataset.step));
    });
    // Start the sweep when the dots scroll into view.
    $('dotCaption').innerHTML = DOT_CAPTIONS[2];
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) { show(2); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(dots);
  }

  /* ---------------- Ladder ---------------- */

  const TIERS = [
    [1, 'W', 'Watts: things in your home'],
    [1e3, 'kW', 'Kilowatts (thousands): homes, cars, a server rack'],
    [1e6, 'MW', 'Megawatts (millions): buildings, towns, data centres'],
    [1e9, 'GW', 'Gigawatts (billions): cities and big power plants'],
    [1e12, 'TW', 'Terawatts (trillions): the whole planet'],
  ];

  function buildLadder() {
    const legend = $('ladderLegend');
    for (const k in CATS) legend.insertAdjacentHTML('beforeend', `<span><i style="background:${CATS[k].color}"></i>${CATS[k].label}</span>`);

    const list = $('ladderList');
    const sorted = LADDER.slice().sort((a, b) => a.w - b.w);
    const MAXLOG = 12.6;
    let tierIdx = -1;
    sorted.forEach((it) => {
      while (tierIdx + 1 < TIERS.length && it.w >= TIERS[tierIdx + 1][0]) {
        tierIdx++;
        const li = document.createElement('li');
        li.className = 'tier';
        li.innerHTML = `<b>${TIERS[tierIdx][1]}</b><span>${TIERS[tierIdx][2]}</span>`;
        list.appendChild(li);
      }
      const li = document.createElement('li');
      li.className = 'rung';
      const pct = Math.max(2, (Math.log10(it.w) / MAXLOG) * 100);
      li.innerHTML = `
        <span class="ico" aria-hidden="true">${it.ico}</span>
        <span class="nm">${it.name}${it.sub ? `<small>${it.sub}</small>` : ''}</span>
        <span class="track"><span class="fill" style="width:${pct.toFixed(1)}%;background:${CATS[it.cat].color}"></span></span>
        <span class="val">${fmtW(it.w)}</span>`;
      list.appendChild(li);
    });

    // Compare tool
    const a = $('cmpA'), b = $('cmpB');
    sorted.forEach((it) => {
      const label = `${it.ico} ${it.name}${it.sub ? ' (' + it.sub + ')' : ''} · ${fmtW(it.w)}`;
      a.add(new Option(label, it.id));
      b.add(new Option(label, it.id));
    });
    a.value = 'led';
    b.value = 'reactor';
    const byId = Object.fromEntries(LADDER.map((it) => [it.id, it]));
    const update = () => {
      const A = byId[a.value], B = byId[b.value];
      const out = $('cmpOut');
      if (A.id === B.id) { out.innerHTML = 'Exactly <strong>one</strong>. Pick two different things!'; return; }
      const ratio = B.w / A.w;
      if (ratio >= 1) {
        out.innerHTML = `It takes about <strong>${fmtCount(ratio)}</strong> × ${A.ico} ${A.name.toLowerCase()} to equal one ${B.ico} ${B.name.toLowerCase()}.`;
      } else {
        out.innerHTML = `Turn it around: one ${A.ico} ${A.name.toLowerCase()} is as much as <strong>${fmtCount(1 / ratio)}</strong> × ${B.ico} ${B.name.toLowerCase()}.`;
      }
    };
    a.addEventListener('change', update);
    b.addEventListener('change', update);
    update();
  }

  /* ---------------- Data centre lab ---------------- */

  const N_MIN = 10, N_MAX = 5e6;
  const LMIN = Math.log10(N_MIN), LMAX = Math.log10(N_MAX);
  const state = { chip: 'h100', n: 100000, util: 85, pue: 1.3, cool: 'evap', offsite: false, preset: 'cluster', city: 'calgary' };

  const sliderToN = (v) => Number(Math.pow(10, LMIN + (v / 1000) * (LMAX - LMIN)).toPrecision(2));
  const nToSlider = (n) => Math.round(((Math.log10(n) - LMIN) / (LMAX - LMIN)) * 1000);
  const totalMW = () => (state.n * CHIPS[state.chip].kw * (state.util / 100) * state.pue) / 1000;

  function verdict(mw) {
    if (mw < 1) return 'Small: about a street or a neighbourhood\'s worth.';
    if (mw < 10) return 'About a small town\'s worth of power.';
    if (mw < 50) return 'Like a large town. Noticeable on the grid, but manageable.';
    if (mw < 250) return 'In the same league as all of Red Deer. That\'s a serious load for one building.';
    if (mw < 1000) return 'A big slice of a major city. This needs a dedicated power plant.';
    if (mw < 2900) return 'As much as all of Calgary, or more. One building using a city\'s worth of power.';
    if (mw < 30000) return 'More than all of Toronto. This would reshape a province\'s whole grid, though it\'s still a slice of Greater Tokyo.';
    return 'More than all of Greater Tokyo, the world\'s largest city.';
  }

  function closestRung(w) {
    let best = null, bestD = Infinity;
    LADDER.forEach((it) => { const d = Math.abs(Math.log10(it.w) - Math.log10(w)); if (d < bestD) { bestD = d; best = it; } });
    return best;
  }

  function buildLab() {
    // Presets
    const pWrap = $('presets');
    PRESETS.forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset';
      b.dataset.id = p.id;
      b.innerHTML = `<span aria-hidden="true">${p.ico}</span>${p.label}`;
      b.addEventListener('click', () => {
        Object.assign(state, { chip: p.chip, n: p.n, util: p.util, pue: p.pue, cool: p.cool, preset: p.id });
        syncControls();
        renderLab();
      });
      pWrap.appendChild(b);
    });

    // Chip type
    const chipSeg = $('chipSeg');
    for (const k in CHIPS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.dataset.chip = k;
      b.textContent = CHIPS[k].label;
      chipSeg.appendChild(b);
    }
    chipSeg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      state.chip = b.dataset.chip; state.preset = null;
      syncControls(); renderLab();
    });

    // Log ticks positioned to match the log slider
    const ticks = document.querySelector('#lab .ticks');
    ticks.innerHTML = '';
    ticks.style.position = 'relative';
    ticks.style.height = '16px';
    [[10, '10'], [1000, '1,000'], [100000, '100,000'], [5e6, '5 million']].forEach(([v, t], i, arr) => {
      const s = document.createElement('span');
      s.textContent = t;
      s.style.position = 'absolute';
      s.style.left = (nToSlider(v) / 10) + '%';
      s.style.transform = i === 0 ? 'none' : i === arr.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)';
      ticks.appendChild(s);
    });

    $('chips').addEventListener('input', (e) => { state.n = sliderToN(Number(e.target.value)); state.preset = null; syncControls(false); renderLab(); });
    $('util').addEventListener('input', (e) => { state.util = Number(e.target.value); state.preset = null; syncControls(false); renderLab(); });
    $('pue').addEventListener('input', (e) => { state.pue = Number(e.target.value); state.preset = null; syncControls(false); renderLab(); });

    // City picker for the daily chart
    const daySeg = $('daySeg');
    CITIES.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.dataset.city = c.id;
      b.textContent = c.name;
      daySeg.appendChild(b);
    });
    daySeg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      state.city = b.dataset.city;
      setSeg(daySeg, state.city, 'city');
      drawDay();
    });
    setSeg(daySeg, state.city, 'city');

    // Cooling type: changing it trades water for electricity (moves the overhead slider).
    const coolSeg = $('coolSeg');
    for (const k in COOLING) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.dataset.cool = k;
      b.textContent = COOLING[k].label;
      coolSeg.appendChild(b);
    }
    coolSeg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.dataset.cool === state.cool) return;
      const next = b.dataset.cool;
      const pue = state.pue - COOLING[state.cool].dPue + COOLING[next].dPue;
      state.pue = Math.round(Math.max(1.05, Math.min(2, pue)) * 100) / 100;
      state.cool = next; state.preset = null;
      syncControls(); renderLab();
    });
    $('offsite').addEventListener('change', (e) => { state.offsite = e.target.checked; renderWater(totalMW()); });

    initDayInteraction();
    syncControls();
    renderLab();
  }

  function syncControls(moveSliders = true) {
    const chip = CHIPS[state.chip];
    if (moveSliders) {
      $('chips').value = nToSlider(state.n);
      $('util').value = state.util;
      $('pue').value = state.pue;
    }
    setSeg($('chipSeg'), state.chip, 'chip');
    $('chipHelp').textContent = chip.help;
    setSeg($('coolSeg'), state.cool, 'cool');
    $('coolHelp').textContent = COOLING[state.cool].help;
    $('chipNoun').textContent = chip.noun;
    $('chipsOut').textContent = fmtCount(state.n);
    $('utilOut').textContent = state.util + '%';
    $('pueOut').textContent = state.pue.toFixed(2) + ' (+' + Math.round((state.pue - 1) * 100) + '%)';
    document.querySelectorAll('.preset').forEach((b) => b.classList.toggle('active', b.dataset.id === state.preset));
  }

  function renderLab() {
    const mw = totalMW();
    const w = mw * 1e6;
    $('rBig').textContent = fmtW(w);
    const near = closestRung(w);
    $('rVerdict').innerHTML = `${verdict(mw)} <span class="muted">Closest thing on the ladder: ${near.ico} ${near.name} (${fmtW(near.w)}).</span>`;
    $('sHomes').textContent = fmtCount(w / (HOME_KW * 1000));
    $('sBulbs').textContent = fmtCount(w / LED_W);
    $('sTurbines').textContent = fmtCount(mw / TURBINE_AVG_MW);
    $('sReactors').textContent = fmtCount(mw / REACTOR_MW);

    const yearWh = w * 8760;
    $('sYear').textContent = fmtWh(yearWh);
    $('sCost').textContent = fmtMoney((yearWh / 1000) * PRICE_PER_KWH);

    renderReactors(mw / REACTOR_MW);
    renderBars(mw);
    renderWater(mw);
    drawDay();
  }

  function renderWater(mw) {
    const cool = COOLING[state.cool];
    const itKWhDay = (mw / state.pue) * 1000 * 24;      // computer energy per day
    const onsite = itKWhDay * cool.wue;
    const offsite = state.offsite ? mw * 1000 * 24 * GRID_WUE : 0;
    const total = onsite + offsite;
    const pctCalgary = (total / CALGARY_L_DAY) * 100;

    $('wBig').textContent = fmtL(total);
    const perSec = total / 86400;
    $('wSub').textContent = perSec >= 1
      ? `About ${fmtCount(perSec)} litres every second, all day and night.`
      : `About ${fmtCount(total / 24)} litres an hour.`;
    $('wPools').textContent = fmtCount(total / POOL_L);
    $('wPeople').textContent = fmtCount(total / PERSON_L_DAY);
    $('wCalgary').textContent = pctCalgary < 0.01 ? 'under 0.01%' : pctCalgary >= 10 ? Math.round(pctCalgary) + '%' : pctCalgary.toFixed(pctCalgary < 1 ? 2 : 1) + '%';
    $('wYear').textContent = fmtCount(total * 365);

    const split = $('wSplit');
    if (state.offsite && total > 0) {
      const a = (onsite / total) * 100;
      split.innerHTML = `
        <div class="w-split-bar"><span class="w-on" style="width:${a}%"></span><span class="w-off" style="width:${100 - a}%"></span></div>
        <div class="w-split-lbl"><span><i class="sw w-on"></i>Cooling at the data centre: ${fmtL(onsite)}</span><span><i class="sw w-off"></i>At the power plants: ${fmtL(offsite)}</span></div>`;
    } else {
      split.innerHTML = '<p class="help">This counts cooling water at the data centre only. Flip the switch to add the water power plants use to make its electricity.</p>';
    }

    const fill = $('wBarFill');
    fill.style.width = Math.min(100, Math.max(0.4, pctCalgary)) + '%';
    fill.classList.toggle('over', pctCalgary > 100);
    $('wNote').textContent = pctCalgary > 100
      ? `That's ${fmtCount(pctCalgary / 100)}× Calgary's entire daily water supply. These are rough estimates: real use swings with the weather, with much more on hot, dry days.`
      : 'Rough estimates. Real use swings with the weather: much more on hot, dry summer days, much less in winter.';
  }

  function renderReactors(count) {
    const row = $('reactorRow');
    row.innerHTML = '';
    if (count < 0.01) return;
    const MAX = 10;
    const shown = Math.min(Math.ceil(count), MAX);
    for (let i = 0; i < shown; i++) {
      const frac = Math.min(1, count - i);
      const svg = el('svg', { viewBox: '0 0 40 44' });
      const d = 'M7 44 Q14 26 10 8 L30 8 Q26 26 33 44 Z';
      el('path', { d, fill: 'var(--surface-2)', stroke: 'var(--line)' }, svg);
      const f = el('path', { d, fill: 'var(--gen)' }, svg);
      f.style.clipPath = `inset(0 ${(100 - frac * 100).toFixed(1)}% 0 0)`;
      el('circle', { cx: 16, cy: 5, r: 4, fill: 'var(--line)' }, svg);
      el('circle', { cx: 24, cy: 3, r: 3, fill: 'var(--line)' }, svg);
      row.appendChild(svg);
    }
    if (count > MAX) row.insertAdjacentHTML('beforeend', `<span class="more">+ ${fmtCount(count - MAX)} more</span>`);
    row.insertAdjacentHTML('beforeend', `<span class="more" style="font-weight:500;font-size:.8rem;flex-basis:100%">Each tower = one large nuclear reactor running flat out</span>`);
  }

  function renderBars(mw) {
    const rows = CITIES.map((c) => ({ name: c.name, sub: c.size, v: c.avgMW, dc: false }))
      .concat([{ name: 'Your data centre', sub: CHIPS[state.chip].label, v: mw, dc: true }]);
    const max = Math.max(...rows.map((r) => r.v));
    const wrap = $('cityBars');
    if (!wrap.children.length) {
      rows.forEach((r) => {
        wrap.insertAdjacentHTML('beforeend', `
          <div class="bar-row${r.dc ? ' dc' : ''}">
            <div class="bar-name"></div>
            <div class="bar-track"><div class="bar-fill"></div><span class="bar-val"></span></div>
          </div>`);
      });
    }
    [...wrap.children].forEach((rowEl, i) => {
      const r = rows[i];
      const pct = (r.v / max) * 100;
      const pctOfCity = (mw / r.v) * 100;
      rowEl.querySelector('.bar-name').innerHTML = r.dc
        ? `${r.name}<small>${r.sub}</small>`
        : pctOfCity >= 200
          ? `${r.name}<small>data centre = <strong>${fmtCount(mw / r.v)}×</strong> this</small>`
          : `${r.name}<small>data centre = <strong>${pctOfCity < 0.01 ? 'under 0.01' : pctOfCity >= 10 ? Math.round(pctOfCity) : pctOfCity.toFixed(pctOfCity < 1 ? 2 : 1)}%</strong> of this</small>`;
      rowEl.querySelector('.bar-fill').style.width = pct + '%';
      const val = rowEl.querySelector('.bar-val');
      val.textContent = fmtW(r.v * 1e6);
      if (pct > 72) {
        val.style.left = 'auto';
        val.style.right = (100 - pct) + '%';
        val.style.paddingRight = '10px';
        val.style.color = '#fff';
      } else {
        val.style.right = 'auto';
        val.style.left = `calc(${pct}% + 8px)`;
        val.style.paddingRight = '0';
        val.style.color = 'var(--ink)';
      }
    });
  }

  /* ---------------- Day chart ---------------- */

  const DAY = { W: 760, H: 300, l: 64, r: 16, t: 26, b: 34, hover: 18 };

  function drawDay() {
    const svg = $('dayChart');
    svg.innerHTML = '';
    // Size the drawing to its container so text stays readable on phones.
    const cw = svg.parentNode.clientWidth || 760;
    DAY.W = Math.max(320, Math.min(760, cw));
    DAY.H = DAY.W < 520 ? 280 : 300;
    DAY.l = DAY.W < 520 ? 54 : 64;
    svg.setAttribute('viewBox', `0 0 ${DAY.W} ${DAY.H}`);
    const city = CITIES.find((c) => c.id === state.city);
    const dc = totalMW();
    const cityVals = SHAPE.map((s) => s * city.avgMW);
    const vals = cityVals.concat([cityVals[0]]); // 0..24
    const maxY = niceCeil(Math.max(...cityVals) + dc);
    const pw = DAY.W - DAY.l - DAY.r, ph = DAY.H - DAY.t - DAY.b;
    const x = (h) => DAY.l + (h / 24) * pw;
    const y = (v) => DAY.t + (1 - v / maxY) * ph;

    // Night bands (winter: dark before ~8 AM and after ~5 PM)
    [[0, 8], [17, 24]].forEach(([a, b]) => el('rect', { class: 'night', x: x(a), y: DAY.t, width: x(b) - x(a), height: ph }, svg));
    [[4, '🌙'], [12.5, '☀️'], [20.5, '🌙']].forEach(([h, t]) => {
      const tx = el('text', { x: x(h), y: DAY.t - 8, 'text-anchor': 'middle', 'font-size': 14 }, svg);
      tx.textContent = t;
    });

    // Grid + y labels
    for (let i = 0; i <= 4; i++) {
      const v = (maxY * i) / 4;
      el('line', { class: 'grid', x1: DAY.l, x2: DAY.W - DAY.r, y1: y(v), y2: y(v) }, svg);
      const t = el('text', { class: 'axis', x: DAY.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, svg);
      t.textContent = fmtW(v * 1e6);
    }
    for (const h of [0, 6, 12, 18, 24]) {
      const t = el('text', { class: 'axis', x: x(h), y: DAY.H - 10, 'text-anchor': h === 0 ? 'start' : h === 24 ? 'end' : 'middle' }, svg);
      t.textContent = hourLabel(h);
    }

    // City area
    let d = `M${x(0)} ${y(0)}`;
    vals.forEach((v, h) => { d += ` L${x(h).toFixed(1)} ${y(v).toFixed(1)}`; });
    d += ` L${x(24)} ${y(0)} Z`;
    el('path', { class: 'a-city', d }, svg);

    // Data centre stacked on top
    let top = '';
    vals.forEach((v, h) => { top += `${h ? ' L' : 'M'}${x(h).toFixed(1)} ${y(v + dc).toFixed(1)}`; });
    let back = '';
    for (let h = 24; h >= 0; h--) back += ` L${x(h).toFixed(1)} ${y(vals[h]).toFixed(1)}`;
    el('path', { class: 'a-dc', d: top + back + ' Z' }, svg);

    // Hover cursor + tooltip
    const h = DAY.hover;
    const cv = cityVals[h];
    el('line', { class: 'cursor', x1: x(h), x2: x(h), y1: DAY.t, y2: DAY.t + ph }, svg);
    el('circle', { cx: x(h), cy: y(cv + dc), r: 4, fill: 'var(--accent)' }, svg);
    el('circle', { cx: x(h), cy: y(cv), r: 4, fill: 'var(--city)' }, svg);
    const tw = 196, th = 80;
    let tx = x(h) + 12;
    if (tx + tw > DAY.W - DAY.r) tx = x(h) - 12 - tw;
    const ty = DAY.t + ph - th - 10;
    el('rect', { class: 'tip-bg', x: tx, y: ty, width: tw, height: th, rx: 8 }, svg);
    const lines = [
      [hourLabel(h), 'tip'],
      [`${city.name}: ${fmtW(cv * 1e6)}`, 'tip-sub'],
      [`+ Data centre: ${fmtW(dc * 1e6)}`, 'tip-sub'],
      [`= ${fmtW((cv + dc) * 1e6)} (${dc / cv >= 2 ? fmtCount((cv + dc) / cv) + '× the city' : '+' + fmtCount((dc / cv) * 100) + '%'})`, 'tip'],
    ];
    lines.forEach(([txt, cls], i) => {
      const t = el('text', { class: cls, x: tx + 12, y: ty + 20 + i * 17 }, svg);
      t.textContent = txt;
    });
  }

  function initDayInteraction() {
    const svg = $('dayChart');
    const move = (e) => {
      const rect = svg.getBoundingClientRect();
      const vx = ((e.clientX - rect.left) / rect.width) * DAY.W;
      const h = Math.round(((vx - DAY.l) / (DAY.W - DAY.l - DAY.r)) * 24);
      const clamped = Math.max(0, Math.min(23, h));
      if (clamped !== DAY.hover) { DAY.hover = clamped; drawDay(); }
    };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerdown', move);
    let lastW = svg.parentNode.clientWidth;
    window.addEventListener('resize', () => {
      const w = svg.parentNode.clientWidth;
      if (w !== lastW) { lastW = w; drawDay(); }
    });
  }

  /* ---------------- Energy calculator ---------------- */

  function buildEnergy() {
    const dev = $('ecDevice');
    DEVICES.forEach((d, i) => dev.add(new Option(`${d.n} · ${fmtW(d.w)}`, i)));
    dev.value = '9'; // space heater
    const hours = $('ecHours');
    hours.value = '4';
    const price = $('ecPrice');
    const update = () => {
      const d = DEVICES[Number(dev.value)];
      const hrs = Number(hours.value);
      const cents = Math.max(0, Number(price.value) || 0);
      $('ecHoursOut').textContent = hrs + (hrs === 1 ? ' hour' : ' hours');
      const dayWh = d.w * hrs;
      const yearWh = dayWh * 365;
      const cost = (yearWh / 1000) * (cents / 100);
      const dcSeconds = (yearWh / 100e6) * 3600;
      $('ecOut').innerHTML = `
        <div><b>${fmtW(d.w)}</b><span>power (how fast)</span></div>
        <div><b>${fmtWh(dayWh)}</b><span>energy per day</span></div>
        <div><b>${fmtWh(yearWh)}</b><span>energy per year</span></div>
        <div><b>${fmtMoney(cost)}</b><span>cost per year</span></div>
        <p>A whole year of this is about the same energy as <strong>${fmtCount(yearWh / CHAT_WH)}</strong> AI chatbot questions, or what a 100 MW data centre uses in <strong>${dcSeconds < 60 ? fmtCount(dcSeconds) + ' seconds' : fmtCount(dcSeconds / 60) + ' minutes'}</strong>.</p>`;
    };
    [dev, hours, price].forEach((e) => e.addEventListener('input', update));
    update();
  }

  /* ---------------- Boot ---------------- */

  initTheme();
  buildScene();
  buildDots();
  buildLadder();
  buildCities();
  buildLab();
  buildEnergy();
})();
