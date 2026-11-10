(() => {
  // apca/token-pairs.mjs
  var tokenPairs = [
    // Core text on surfaces
    { fg: "text", bg: "surface", role: "body" },
    { fg: "text", bg: "surface-raised", role: "body" },
    { fg: "text", bg: "surface-tint", role: "body", note: "badge neutral: gray tint" },
    { fg: "text-muted", bg: "surface", role: "fluent" },
    { fg: "text-muted", bg: "surface-raised", role: "fluent" },
    // Base typography (base/typography.css): the inline code family renders at
    // 0.875em (fluent role at 16px body). Blockquote deliberately keeps the
    // text/surface body pair — text-muted fails the body threshold in dark
    { fg: "text", bg: "surface-raised", role: "fluent", note: "inline code, samp, pre" },
    // Hover fill (state model, theme notes): table rows, accordion,
    // outline/ghost buttons. The dark value is the full raised step.
    { fg: "text", bg: "hover", role: "body" },
    // Brand family (filled default button, kbd, switch checked, the default
    // badge pastel and the pastel secondary button). brand-hover is derived
    // toward the on-brand contrast pole; press = the hover fill + translate
    // (uniform model).
    { fg: "on-brand", bg: "brand", role: "body", note: "default button, kbd keycap" },
    { fg: "on-brand", bg: "brand-hover", role: "body" },
    {
      fg: "brand",
      bg: "brand-tint",
      role: "body",
      threshold: 60,
      note: "default badge pastel / secondary button (pastel minimum)"
    },
    {
      fg: "brand",
      bg: "brand-tint-hover",
      role: "body",
      threshold: 60,
      note: "secondary button pastel hover (pastel minimum)"
    },
    {
      fg: "attention",
      bg: "attention-tint-hover",
      role: "body",
      threshold: 60,
      note: "attention chip pastel hover (pastel minimum)"
    },
    // Attention family (the urgency tone: errors, destructive actions,
    // validation failures — formerly danger). Shape mirrors brand.
    { fg: "attention", bg: "surface", role: "body" },
    { fg: "attention", bg: "surface-raised", role: "body" },
    { fg: "on-attention", bg: "attention", role: "body", note: "attention solid button/badge" },
    {
      fg: "on-attention",
      bg: "attention-hover",
      role: "body",
      threshold: 60,
      note: "attention button hover (dark darkens \u2014 60 minimum)"
    },
    // Feedback tint surfaces (Alert, Badge): title/label uses the bare family
    // tone (body), body text uses text (body), 1px border uses the base
    // variant color (nonText). The bare tone on the raw 100-step tint misses
    // the preferred 75 in the light theme by ~3 Lc (it sat on the removed
    // *-strong) — tracked at the documented 60 minimum.
    { fg: "attention", bg: "attention-tint", role: "body", threshold: 60 },
    { fg: "text", bg: "attention-tint", role: "body" },
    { fg: "attention", bg: "attention-tint", role: "nonText" },
    // Base typography spellcheck: the wavy error underline is a text
    // decoration (an indicator, not a text fill) — nonText role.
    { fg: "attention", bg: "surface", role: "nonText", note: "spellcheck wavy underline" },
    // Neutral Alert (the default): the gray border on the gray tint is a
    // non-text boundary pair (surface-tint matches the family tints, the
    // border needs the stronger step to stay visible).
    { fg: "border-strong", bg: "surface-tint", role: "nonText", note: "neutral alert border" },
    // Progress: the fill is the state indicator (WCAG 1.4.11 non-text) —
    // the brand fill on the tint track; the track is a borderless soft
    // surface (the Badge-neutral model), no boundary pair needed.
    { fg: "brand", bg: "surface-tint", role: "nonText", note: "progress fill on track" },
    // Timeline: the marker ring is a non-text boundary (an event marker);
    // the rail is decorative (the divider policy), no pair.
    { fg: "border-strong", bg: "surface", role: "nonText", note: "timeline marker ring" },
    // The state-marker ring/disc pair the Stepper/Avatar comments claim:
    // the entry was missing from the matrix (added 2026-11-09 with the
    // Slider thumb ring — the same registered pair).
    { fg: "brand", bg: "surface", role: "nonText", note: "stepper/avatar/slider marker ring" },
    // Stepper: the state markers are non-text indicators (WCAG 1.4.11) —
    // the done disc and the current ring/dot on the page surface.
    // (The Avatar busy dot reuses the spellcheck pair; the away dot is the
    // border tone — decorative by the border/divider policy.)
    // Utility roles. Link: hyperlink text on the page and raised surfaces.
    // Selection: the tint under the author text color (the same soft-surface
    // pair the neutral Alert uses).
    { fg: "link", bg: "surface", role: "body" },
    { fg: "link", bg: "surface-raised", role: "body" },
    { fg: "text", bg: "selection", role: "body" },
    // Neutral solid badge (the brand-independent inverted gray): the page
    // text as the fill, the page surface as the label.
    { fg: "surface", bg: "text", role: "body", note: "neutral-solid badge" },
    {
      fg: "surface",
      bg: "inverse-hover",
      role: "body",
      note: "neutral-solid chip hover (the inverted fill toward the surface pole)"
    },
    // Focus indicator (non-text contrast): the neutral ring.
    { fg: "focus-ring", bg: "surface", role: "nonText" },
    { fg: "focus-ring", bg: "surface-raised", role: "nonText" },
    // Scrim (--ui-color-scrim, Dialog/Drawer ::backdrop) is a non-text layer:
    // semi-transparent, so it has no direct fg/bg pair here; the readability
    // contract is carried by the content's own pairs against the scrimmed
    // surface (text/surface, body) — spot-checked in browser tests.
    // Headings: display (h1) and headline (h2, dialog/drawer titles) render at
    // large sizes — the `large` role threshold (Lc 45) is the applicable gate.
    // Same pairs as the body entries; the role records the rendered usage.
    { fg: "text", bg: "surface", role: "large", note: "h1 display headings" },
    { fg: "text", bg: "surface-raised", role: "large", note: "h2 headline (dialog, drawer)" },
    // Disabled state (tracked, exempt from conformance, spot readable)
    { fg: "text-muted", bg: "surface", role: "disabled", note: "disabled controls" },
    // Caption position (the xs step ~11-12px): below the fluent
    // size range, so the strict `small` threshold applies. Only full-contrast
    // text pairs ship — text-muted fails Lc 90 in the dark theme (Lc ~63),
    // same policy as blockquote (theme notes). figcaption renders at this
    // step (base/typography.css).
    { fg: "text", bg: "surface", role: "small", note: "caption, figcaption" },
    { fg: "text", bg: "surface-raised", role: "small", note: "caption, figcaption" }
  ];
  var roleThresholds = {
    body: 75,
    fluent: 60,
    small: 90,
    large: 45,
    nonText: 15,
    disabled: 30
  };

  // ../apps/docs/vendor/apca-w3.mjs
  var SA98G = {
    mainTRC: 2.4,
    // 2.4 exponent for emulating actual monitor perception
    // For reverseAPCA
    get mainTRCencode() {
      return 1 / this.mainTRC;
    },
    // sRGB coefficients
    sRco: 0.2126729,
    sGco: 0.7151522,
    sBco: 0.072175,
    // G-4g constants for use with 2.4 exponent
    normBG: 0.56,
    normTXT: 0.57,
    revTXT: 0.62,
    revBG: 0.65,
    // G-4g Clamps and Scalers
    blkThrs: 0.022,
    blkClmp: 1.414,
    scaleBoW: 1.14,
    scaleWoB: 1.14,
    loBoWoffset: 0.027,
    loWoBoffset: 0.027,
    deltaYmin: 5e-4,
    loClip: 0.1,
    ///// MAGIC NUMBERS for UNCLAMP, for use with 0.022 & 1.414 /////
    // Magic Numbers for reverseAPCA
    mFactor: 1.9468554433171,
    get mFactInv() {
      return 1 / this.mFactor;
    },
    mOffsetIn: 0.0387393816571401,
    mExpAdj: 0.283343396420869,
    get mExp() {
      return this.mExpAdj / this.blkClmp;
    },
    mOffsetOut: 0.312865795870758
  };
  function APCAcontrast(txtY, bgY, places = -1) {
    const icp = [0, 1.1];
    if (isNaN(txtY) || isNaN(bgY) || Math.min(txtY, bgY) < icp[0] || Math.max(txtY, bgY) > icp[1]) {
      return 0;
    }
    ;
    let SAPC = 0;
    let outputContrast = 0;
    let polCat = "BoW";
    txtY = txtY > SA98G.blkThrs ? txtY : txtY + Math.pow(SA98G.blkThrs - txtY, SA98G.blkClmp);
    bgY = bgY > SA98G.blkThrs ? bgY : bgY + Math.pow(SA98G.blkThrs - bgY, SA98G.blkClmp);
    if (Math.abs(bgY - txtY) < SA98G.deltaYmin) {
      return 0;
    }
    if (bgY > txtY) {
      SAPC = (Math.pow(bgY, SA98G.normBG) - Math.pow(txtY, SA98G.normTXT)) * SA98G.scaleBoW;
      outputContrast = SAPC < SA98G.loClip ? 0 : SAPC - SA98G.loBoWoffset;
    } else {
      polCat = "WoB";
      SAPC = (Math.pow(bgY, SA98G.revBG) - Math.pow(txtY, SA98G.revTXT)) * SA98G.scaleWoB;
      outputContrast = SAPC > -SA98G.loClip ? 0 : SAPC + SA98G.loWoBoffset;
    }
    if (places < 0) {
      return outputContrast * 100;
    } else if (places == 0) {
      return Math.round(Math.abs(outputContrast) * 100) + "<sub>" + polCat + "</sub>";
    } else if (Number.isInteger(places)) {
      return (outputContrast * 100).toFixed(places);
    } else {
      return 0;
    }
  }
  function sRGBtoY(rgb = [0, 0, 0]) {
    function simpleExp(chan) {
      return Math.pow(chan / 255, SA98G.mainTRC);
    }
    ;
    return SA98G.sRco * simpleExp(rgb[0]) + SA98G.sGco * simpleExp(rgb[1]) + SA98G.sBco * simpleExp(rgb[2]);
  }

  // ../apps/docs/js/site-palette.js
  var KEY = "colors-bases";
  var FAMILIES = [
    {
      name: "Neutral",
      themes: {
        light: [
          { prop: "--ui-base-n-light-l", label: "Page", min: 50, max: 100, step: 1, unit: "%" },
          { prop: "--ui-base-n-light-c", label: "Chroma", min: 0, max: 0.12, step: 1e-3 },
          { prop: "--ui-base-n-light-h", label: "Hue", min: 0, max: 360, step: 1 },
          { prop: "--ui-base-n-light-contrast", label: "Contrast", min: 0, max: 2, step: 0.05 }
        ],
        dark: [
          { prop: "--ui-base-n-dark-l", label: "Page", min: 5, max: 50, step: 1, unit: "%" },
          { prop: "--ui-base-n-dark-c", label: "Chroma", min: 0, max: 0.12, step: 1e-3 },
          { prop: "--ui-base-n-dark-h", label: "Hue", min: 0, max: 360, step: 1 },
          { prop: "--ui-base-n-dark-contrast", label: "Contrast", min: 0, max: 2, step: 0.05 }
        ]
      }
    },
    {
      name: "Brand",
      themes: {
        light: [
          { prop: "--ui-base-brand-light-l", label: "Lightness", min: 0, max: 1, step: 0.01 },
          { prop: "--ui-base-brand-light-c", label: "Chroma", min: 0, max: 0.37, step: 0.01 },
          { prop: "--ui-base-brand-light-h", label: "Hue", min: 0, max: 360, step: 1 },
          { prop: "--ui-base-brand-light-contrast", label: "Contrast", min: 0, max: 2, step: 0.05 }
        ],
        dark: [
          { prop: "--ui-base-brand-dark-l", label: "Lightness", min: 0, max: 1, step: 0.01 },
          { prop: "--ui-base-brand-dark-c", label: "Chroma", min: 0, max: 0.37, step: 0.01 },
          { prop: "--ui-base-brand-dark-h", label: "Hue", min: 0, max: 360, step: 1 },
          { prop: "--ui-base-brand-dark-contrast", label: "Contrast", min: 0, max: 2, step: 0.05 }
        ]
      }
    },
    {
      name: "Link",
      themes: {
        light: [
          { prop: "--ui-base-link-light-l", label: "Lightness", min: 0, max: 1, step: 0.01 },
          { prop: "--ui-base-link-light-c", label: "Chroma", min: 0, max: 0.37, step: 0.01 },
          { prop: "--ui-base-link-light-h", label: "Hue", min: 0, max: 360, step: 1 },
          { prop: "--ui-base-link-light-contrast", label: "Contrast", min: 0, max: 2, step: 0.05 }
        ],
        dark: [
          { prop: "--ui-base-link-dark-l", label: "Lightness", min: 0, max: 1, step: 0.01 },
          { prop: "--ui-base-link-dark-c", label: "Chroma", min: 0, max: 0.37, step: 0.01 },
          { prop: "--ui-base-link-dark-h", label: "Hue", min: 0, max: 360, step: 1 },
          { prop: "--ui-base-link-dark-contrast", label: "Contrast", min: 0, max: 2, step: 0.05 }
        ]
      }
    },
    {
      name: "Attention",
      themes: {
        light: [
          {
            prop: "--ui-base-attention-light-l",
            label: "Lightness",
            min: 0.15,
            max: 0.95,
            step: 0.01
          },
          { prop: "--ui-base-attention-light-c", label: "Chroma", min: 0, max: 0.37, step: 0.01 },
          { prop: "--ui-base-attention-light-h", label: "Hue", min: 0, max: 360, step: 1 },
          {
            prop: "--ui-base-attention-light-contrast",
            label: "Contrast",
            min: 0,
            max: 2,
            step: 0.05
          }
        ],
        dark: [
          {
            prop: "--ui-base-attention-dark-l",
            label: "Lightness",
            min: 0.15,
            max: 0.95,
            step: 0.01
          },
          { prop: "--ui-base-attention-dark-c", label: "Chroma", min: 0, max: 0.37, step: 0.01 },
          { prop: "--ui-base-attention-dark-h", label: "Hue", min: 0, max: 360, step: 1 },
          {
            prop: "--ui-base-attention-dark-contrast",
            label: "Contrast",
            min: 0,
            max: 2,
            step: 0.05
          }
        ]
      }
    }
  ];
  var PROPS = FAMILIES.flatMap(
    (family) => Object.values(family.themes).flatMap((sliders) => sliders.map((slider) => slider.prop))
  );
  var currentTheme = () => document.documentElement.getAttribute("data-theme") ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  var FAMILY_TOKENS = {
    Neutral: [
      "text",
      "text-muted",
      "surface",
      "surface-raised",
      "surface-tint",
      "hover",
      "border",
      "border-strong",
      "focus-ring"
    ],
    Brand: ["brand", "on-brand", "brand-hover", "brand-tint", "brand-tint-hover"],
    Link: ["link", "selection"],
    Attention: ["attention", "on-attention", "attention-hover", "attention-tint"]
  };
  var tablePairs = tokenPairs.filter((pair) => pair.role !== "disabled");
  var tokenFamily = /* @__PURE__ */ new Map();
  for (const [family, tokens] of Object.entries(FAMILY_TOKENS))
    for (const token of tokens) tokenFamily.set(token, family);
  var pairsByFamily = Object.fromEntries(FAMILIES.map((family) => [family.name, []]));
  for (const pair of tablePairs) {
    const [fgFamily, bgFamily] = [tokenFamily.get(pair.fg), tokenFamily.get(pair.bg)];
    pairsByFamily[fgFamily !== "Neutral" ? fgFamily : bgFamily ?? "Neutral"].push(pair);
  }
  var state = {};
  var inputs = /* @__PURE__ */ new Map();
  function valueOf(slider, raw) {
    return `${raw}${slider.unit ?? ""}`;
  }
  function readComputed() {
    const styles = getComputedStyle(document.documentElement);
    const values = {};
    for (const prop of PROPS) values[prop] = styles.getPropertyValue(prop).trim();
    return values;
  }
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw) {
        for (const prop of PROPS) if (raw[prop]) state[prop] = raw[prop];
      }
    } catch {
      state = {};
    }
  }
  function save() {
    if (Object.keys(state).length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(state));
  }
  function apply() {
    const root = document.documentElement;
    for (const prop of PROPS) {
      if (state[prop]) root.style.setProperty(prop, state[prop]);
      else root.style.removeProperty(prop);
    }
  }
  var probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;";
  var D2R = Math.PI / 180;
  function oklabToLinearSrgb([L, a, b]) {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
    ];
  }
  function linearSrgbToOklab([r, g, b]) {
    const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
    const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
    return [
      0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
      1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
      0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
    ];
  }
  var IN_GAMUT_EPS = 5e-5;
  var inGamut = (lin) => lin.every((c) => c >= -IN_GAMUT_EPS && c <= 1 + IN_GAMUT_EPS);
  function gamutMap(L, a, b) {
    const lin = oklabToLinearSrgb([L, a, b]);
    if (inGamut(lin)) return lin;
    if (L >= 1) return [1, 1, 1];
    if (L <= 0) return [0, 0, 0];
    const C = Math.hypot(a, b);
    if (C === 0) return lin.map((c) => Math.min(Math.max(c, 0), 1));
    const cos = Math.cos(Math.atan2(b, a));
    const sin = Math.sin(Math.atan2(b, a));
    let min = 0, max = C;
    while (max - min > 1e-4) {
      const mid = (min + max) / 2;
      if (inGamut(oklabToLinearSrgb([L, mid * cos, mid * sin]))) min = mid;
      else max = mid;
    }
    return oklabToLinearSrgb([L, min * cos, min * sin]);
  }
  var gammaEncode = (lin) => {
    const c = Math.min(Math.max(lin, 0), 1);
    return Math.round((c <= 31308e-7 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255);
  };
  var srgbLinear = (c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  function toSrgb(cssColor) {
    const match = cssColor.match(/^(oklch|oklab|rgba?|color)\(([^)]*)\)$/);
    if (!match) return null;
    const [, kind, raw] = match;
    const parts = raw.split(/[,\s/]+/).filter((s) => s && s !== "none");
    const values = parts.map(parseFloat).filter((n) => !Number.isNaN(n));
    let lin;
    if (kind === "oklch") {
      const [L, C, H = 0] = values;
      lin = gamutMap(L, C * Math.cos(H * D2R), C * Math.sin(H * D2R));
    } else if (kind === "oklab") {
      lin = gamutMap(...values);
    } else if (kind === "color") {
      lin = parts[0] === "srgb-linear" ? values.slice(0, 3) : values.slice(0, 3).map(srgbLinear);
      if (!inGamut(lin)) lin = gamutMap(...linearSrgbToOklab(lin));
    } else {
      lin = values.slice(0, 3).map((v) => srgbLinear(v / 255));
    }
    return lin.map(gammaEncode);
  }
  function wcag(fg, bg) {
    const a = sRGBtoY(fg);
    const b = sRGBtoY(bg);
    const [hi, lo] = a > b ? [a, b] : [b, a];
    return (hi + 0.05) / (lo + 0.05);
  }
  function cssVar(name) {
    return name === "focus-ring" ? "--ui-focus-ring" : `--ui-color-${name}`;
  }
  var tableTokens = [...new Set(tablePairs.flatMap((pair) => [pair.fg, pair.bg]))];
  var registry = /* @__PURE__ */ new Set();
  function updateAllTables() {
    const root = document.documentElement;
    root.style.transition = "none";
    const colors = {};
    for (const name of tableTokens) {
      probe.style.color = `var(${cssVar(name)})`;
      colors[name] = toSrgb(getComputedStyle(probe).color);
    }
    getComputedStyle(root).getPropertyValue("--ui-color-text");
    root.style.transition = "";
    for (const rows of registry) updateTable(rows, colors);
  }
  function updateTable(rows, colors) {
    for (const { pair, cells, pill } of rows) {
      const threshold = pair.threshold ?? roleThresholds[pair.role];
      const fg = colors[pair.fg];
      const bg = colors[pair.bg];
      const value = fg && bg ? { w: wcag(fg, bg), lc: Math.abs(APCAcontrast(sRGBtoY(fg), sRGBtoY(bg))) } : null;
      cells.w.textContent = value ? value.w.toFixed(2) : "\u2014";
      cells.lc.textContent = value ? value.lc.toFixed(1) : "\u2014";
      const status = value ? value.lc >= threshold ? "pass" : "fail" : "broken";
      pill.textContent = value ? status : "n/a";
      pill.dataset.status = status;
    }
  }
  var tableTimer = 0;
  function scheduleUpdate() {
    clearTimeout(tableTimer);
    tableTimer = setTimeout(updateAllTables, 150);
  }
  var rerender = /* @__PURE__ */ new Set();
  function buildSlider(familyName, slider) {
    const row = document.createElement("label");
    row.className = "palette-slider";
    const name = document.createElement("span");
    name.textContent = slider.label;
    const output = document.createElement("output");
    const input = document.createElement("input");
    input.type = "range";
    input.min = slider.min;
    input.max = slider.max;
    input.step = slider.step;
    input.setAttribute("aria-label", `${familyName} ${slider.label}`);
    input.addEventListener("input", () => {
      if (Object.keys(state).length === 0) state = readComputed();
      state[slider.prop] = valueOf(slider, input.value);
      save();
      apply();
      output.textContent = state[slider.prop];
      scheduleUpdate();
    });
    row.append(name, output, input);
    inputs.set(slider.prop, { input, output, slider });
    return row;
  }
  var SitePaletteFamily = class extends HTMLElement {
    connectedCallback() {
      if (this.dataset.chrome) return;
      this.dataset.chrome = "true";
      const family = FAMILIES.find((f) => f.name === this.getAttribute("family"));
      if (!family) return;
      const fieldset = document.createElement("fieldset");
      fieldset.className = "palette-fieldset";
      this.append(fieldset);
      const build = () => {
        fieldset.replaceChildren(
          ...family.themes[currentTheme()].map((s) => buildSlider(family.name, s))
        );
      };
      build();
      rerender.add(build);
    }
  };
  var SitePaletteTable = class extends HTMLElement {
    connectedCallback() {
      if (this.dataset.chrome) return;
      this.dataset.chrome = "true";
      const pairs = pairsByFamily[this.getAttribute("family")] ?? [];
      const build = () => {
        if (this.rows) registry.delete(this.rows);
        const table = document.createElement("table");
        table.className = "palette-table";
        const head = document.createElement("thead");
        const headRow = document.createElement("tr");
        for (const label of ["Pair", "Role", "WCAG", "Lc", "Status"]) {
          const th = document.createElement("th");
          th.scope = "col";
          th.textContent = label;
          headRow.append(th);
        }
        head.append(headRow);
        const body = document.createElement("tbody");
        this.rows = [];
        for (const pair of pairs) {
          const row = document.createElement("tr");
          const name = document.createElement("td");
          const code = document.createElement("code");
          code.textContent = `${pair.fg} / ${pair.bg}`;
          name.append(code);
          const role = document.createElement("td");
          role.textContent = `${pair.role} ${roleThresholds[pair.role]}`;
          const w = document.createElement("td");
          const lc = document.createElement("td");
          const status = document.createElement("td");
          const pill = document.createElement("span");
          pill.className = "palette-pill";
          status.append(pill);
          row.append(name, role, w, lc, status);
          body.append(row);
          this.rows.push({ pair, cells: { w, lc }, pill });
        }
        table.append(head, body);
        this.replaceChildren(table);
        registry.add(this.rows);
      };
      build();
      rerender.add(build);
    }
    /** Synchronous recompute (tests flip the scope attribute directly). */
    refresh() {
      updateAllTables();
    }
  };
  var SitePaletteActions = class extends HTMLElement {
    connectedCallback() {
      if (this.dataset.chrome) return;
      this.dataset.chrome = "true";
      const actions = document.createElement("div");
      actions.className = "palette-actions";
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "ui-button";
      reset.dataset.variant = "attention";
      reset.textContent = "Reset";
      reset.addEventListener("click", () => {
        state = {};
        save();
        apply();
        syncInputs();
        updateAllTables();
      });
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "ui-button";
      copy.textContent = "Copy CSS";
      copy.addEventListener("click", async () => {
        await navigator.clipboard.writeText(exportCss());
        copy.textContent = "Copied";
        setTimeout(() => {
          copy.textContent = "Copy CSS";
        }, 1200);
      });
      actions.append(reset, copy);
      this.append(actions);
    }
  };
  function syncInputs() {
    const computed = readComputed();
    for (const [prop, { input, output, slider }] of inputs) {
      const value = state[prop] ?? computed[prop];
      if (value) {
        input.value = slider.unit ? value.replace("%", "") : value;
        output.textContent = value;
      }
    }
  }
  function exportCss() {
    const computed = readComputed();
    const lines = PROPS.map((prop) => `  ${prop}: ${state[prop] ?? computed[prop]};`);
    return [
      "/* Base tokens for the color derivation (fewlines-css, tokens/derive.css).",
      " * Override these on :root \u2014 the whole palette re-derives.",
      " */",
      ":root {",
      ...lines,
      "}"
    ].join("\n");
  }
  customElements.define("site-palette-family", SitePaletteFamily);
  customElements.define("site-palette-table", SitePaletteTable);
  customElements.define("site-palette-actions", SitePaletteActions);
  document.body.append(probe);
  load();
  syncInputs();
  updateAllTables();
  var onThemeFlip = () => {
    inputs.clear();
    for (const build of rerender) build();
    syncInputs();
    scheduleUpdate();
  };
  new MutationObserver(onThemeFlip).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onThemeFlip);
})();
/** @preserve
/////    CoLoR PaRsLeY  a simple set of color parsing thingies!
/////           Beta 0.1.8   Revision date: June 04, 2022
/////
/////    Functions to parse color values and return array
/////    Copyright (c) 2019-2022 by Andrew Somers. All Rights Reserved.
/////    LICENSE: AGPL 3
/////    CONTACT: Please use the ISSUES or DISCUSSIONS tab at:
/////    https://github.com/Myndex/colorparsley/
/////
///////////////////////////////////////////////////////////////////////////////
/////
/////    IMPORT:
/////    import { colorParsley } from 'colorparsley';
/////
/////    let rgbaArray = colorParsley('#abcdef');
/////
/////    Output as array:  [r,g,b,a,isValid,colorspace]
/////    Example: [123,123,123,1.0,true,'sRGB']
// */
/** @preserve
/////    SAPC APCA - Advanced Perceptual Contrast Algorithm
/////           Beta 0.1.9 W3 • contrast function only
/////           DIST: W3 • Revision date: July 3, 2022
/////    Function to parse color values and determine Lc contrast
/////    Copyright © 2019-2022 by Andrew Somers. All Rights Reserved.
/////    LICENSE: W3 LICENSE
/////    CONTACT: Please use the ISSUES or DISCUSSIONS tab at:
/////    https://github.com/Myndex/SAPC-APCA/
/////
///////////////////////////////////////////////////////////////////////////////
/////
/////    MINIMAL IMPORTS:
/////      import { APCAcontrast, sRGBtoY, displayP3toY,
/////               calcAPCA, fontLookupAPCA } from 'apca-w3';
/////      import { colorParsley } from './colorparsley.mjs';
/////
/////    FORWARD CONTRAST USAGE:
/////      Lc = APCAcontrast( sRGBtoY( TEXTcolor ) , sRGBtoY( BACKGNDcolor ) );
/////    Where the colors are sent as an rgba array [255,255,255,1]
/////
/////    Retrieving an array of font sizes for the contrast:
/////      fontArray = fontLookupAPCA(Lc);
/////
/////    Live Demonstrator at https://www.myndex.com/APCA/
// */
