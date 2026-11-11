// Docs-site chrome: fixed header (brand, version badge, GitHub link, theme
// toggle, mobile hamburger) + navigation sidebar, rendered by one custom
// element (<site-sidebar> is the single mount point in every page's markup).
// This is host/tooling JS — the core package stays CSS-only
// and is not a library goal.
//
// Theme persistence: the click handler below writes localStorage['theme'];
// restoring it before first paint is a tiny inline <script> in every page's
// <head> (after the viewport meta) — deferred scripts would flash the wrong
// theme for one frame. Keep the two in sync when renaming the key.
//
// Adding a docs page = one entry in PAGES below; every sidebar picks up the
// link automatically. The page title/description are static markup inside
// <main> (header.page-header), so they render even if this script never
// loads — the chrome itself fails open (header and nav simply missing).
//
// Layout contract (docs.css): .site-header is fixed across the viewport;
// site-sidebar is in flow on narrow screens and a sticky grid sidebar on
// wide ones, clipped below the header (--site-header-size). On narrow
// screens the nav renders a second time inside a Drawer (ui-drawer +
// popover, zero JS — the hamburger trigger is popovertarget); docs.css
// hides the in-flow copy there and collapses the header actions to icon
// squares (the label spans return on wide screens).
//
// Light DOM on purpose: page styles apply to the rendered chrome.
// Custom elements — autonomous — are baseline high (Can I Use: Chrome 54,
// FF 63, Safari 10.1), above the docs matrix floor.

/** Single source of truth for docs navigation. Pages must stay ordered by
 * group: #nav() starts a new (heading + list) section whenever `group`
 * changes. Overview has no group and renders without a heading. */
const PAGES = [
  { href: 'index.html', label: 'Overview' },
  { href: 'pages/colors.html', label: 'Colors', group: 'Foundation' },
  { href: 'pages/typography.html', label: 'Typography', group: 'Foundation' },
  { href: 'pages/lists.html', label: 'Lists', group: 'Foundation' },
  { href: 'pages/divider.html', label: 'Divider', group: 'Foundation' },
  { href: 'pages/button.html', label: 'Button', group: 'Forms' },
  { href: 'pages/chip.html', label: 'Chip', group: 'Forms' },
  { href: 'pages/choice.html', label: 'Choice', group: 'Forms' },
  { href: 'pages/rating.html', label: 'Rating', group: 'Forms' },
  { href: 'pages/field.html', label: 'Field', group: 'Forms' },
  { href: 'pages/fieldset.html', label: 'Fieldset', group: 'Forms' },
  { href: 'pages/switch.html', label: 'Switch', group: 'Forms' },
  { href: 'pages/slider.html', label: 'Slider', group: 'Forms' },
  { href: 'pages/dialog.html', label: 'Dialog', group: 'Overlays' },
  { href: 'pages/popover.html', label: 'Popover', group: 'Overlays' },
  { href: 'pages/menu.html', label: 'Menu', group: 'Overlays' },
  { href: 'pages/drawer.html', label: 'Drawer', group: 'Overlays' },
  { href: 'pages/tooltip.html', label: 'Tooltip', group: 'Overlays' },
  { href: 'pages/alert.html', label: 'Alert', group: 'Indicators' },
  { href: 'pages/badge.html', label: 'Badge', group: 'Indicators' },
  { href: 'pages/avatar.html', label: 'Avatar', group: 'Indicators' },
  { href: 'pages/skeleton.html', label: 'Skeleton', group: 'Indicators' },
  { href: 'pages/progress.html', label: 'Progress', group: 'Indicators' },
  { href: 'pages/timeline.html', label: 'Timeline', group: 'Indicators' },
  { href: 'pages/stepper.html', label: 'Stepper', group: 'Indicators' },
  { href: 'pages/breadcrumbs.html', label: 'Breadcrumbs', group: 'Navigation' },
  { href: 'pages/pagination.html', label: 'Pagination', group: 'Navigation' },
  { href: 'pages/tabs.html', label: 'Tabs', group: 'Navigation' },
  { href: 'pages/accordion.html', label: 'Accordion', group: 'Navigation' },
  { href: 'pages/tree.html', label: 'Tree', group: 'Navigation' },
  { href: 'pages/table.html', label: 'Table', group: 'Data' },
];

/* Pages live at the site root and in pages/; every link gets a base
 * prefix so the plain relative hrefs resolve from either depth — and so
 * the whole site works from file:// with no static server. */
const base = location.pathname.includes('/pages/') ? '../' : './';
/* Current-page check compares file names only, so it matches from both
 * depths (index.html, pages/badge.html → badge). */
const pageName = (href) =>
  href
    .split('/')
    .pop()
    .replace(/\.html$/, '') || 'index';

class SiteSidebar extends HTMLElement {
  connectedCallback() {
    // Idempotent: connectedCallback re-runs whenever the element is moved.
    if (this.dataset.chrome) return;
    this.dataset.chrome = 'true';

    this.append(this.#header(), this.#nav(), this.#drawer());
  }

  // Fixed header spanning the viewport: brand + version badge left,
  // GitHub link and theme toggle right (icon squares on narrow screens —
  // docs.css), the drawer hamburger rightmost.
  #header() {
    const header = document.createElement('header');
    header.className = 'site-header';
    const start = document.createElement('div');
    start.className = 'site-header-start';
    start.append(this.#brand());
    const badge = this.#versionBadge();
    if (badge) start.append(badge);
    const end = document.createElement('div');
    end.className = 'site-header-end';
    end.append(this.#githubLink(), this.#themeToggle(), this.#navToggle());
    header.append(start, end);
    return header;
  }

  #brand() {
    const link = document.createElement('a');
    link.className = 'site-brand';
    link.href = `${base}index.html`;
    link.textContent = 'fewlines-css';
    return link;
  }

  // Version badge: filled by the committed js/site-version.js (release
  // artifact, see scripts/skill-catalog.mjs). Missing script → no badge.
  #versionBadge() {
    if (typeof SITE_VERSION === 'undefined') return null;
    const badge = document.createElement('span');
    badge.className = 'ui-badge';
    badge.setAttribute('data-solid', '');
    badge.textContent = `v${SITE_VERSION}`;
    return badge;
  }

  // In-flow navigation: the sticky sidebar column on wide screens, hidden
  // on narrow ones (docs.css) — the drawer carries the links there.
  #nav() {
    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Documentation');
    this.#navLinks(nav);
    return nav;
  }

  // Group headings + link lists, shared by the in-flow nav and the drawer.
  #navLinks(nav) {
    // Links are plain relative paths (see `base` above) — the site works
    // from file:// and any static host, no clean-URL rewriting needed.
    const current =
      location.pathname
        .split('/')
        .pop()
        .replace(/\.html$/, '') || 'index';
    // Start values that never match a real (possibly undefined) group,
    // so the first page always opens a list.
    let list = null;
    let group = null;
    for (const { href, label, group: section } of PAGES) {
      if (section !== group) {
        group = section;
        // Separator before each new section once the nav has content.
        if (nav.children.length) nav.append(document.createElement('hr'));
        if (group) {
          const heading = document.createElement('h2');
          heading.className = 'site-nav-group';
          heading.textContent = group;
          nav.append(heading);
        }
        list = document.createElement('ul');
        nav.append(list);
      }
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `${base}${href}`;
      link.textContent = label;
      if (pageName(href) === current) link.setAttribute('aria-current', 'page');
      item.append(link);
      list.append(item);
    }
  }

  // Mobile navigation drawer: the nav element itself is the drawer host
  // (ui-drawer + popover — top layer, light dismiss and Escape natively);
  // the close button is the declarative hide trigger, autofocus moves
  // focus into the panel on open. Zero JS.
  #drawer() {
    const nav = document.createElement('nav');
    nav.className = 'ui-drawer site-nav';
    nav.id = 'site-nav-drawer';
    nav.setAttribute('popover', '');
    nav.setAttribute('data-variant', 'drawer-end');
    nav.setAttribute('aria-label', 'Documentation');
    const head = document.createElement('div');
    head.className = 'site-drawer-head';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'ui-button';
    close.setAttribute('data-variant', 'ghost');
    close.setAttribute('data-size', 'icon');
    close.setAttribute('popovertarget', 'site-nav-drawer');
    close.setAttribute('popovertargetaction', 'hide');
    close.setAttribute('aria-label', 'Close navigation');
    close.autofocus = true;
    close.innerHTML =
      '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    head.append(close);
    nav.append(head);
    this.#navLinks(nav);
    return nav;
  }

  // External link styled as an outline button; opens in a new tab.
  // The label span collapses to an icon square on narrow screens (docs.css),
  // so the accessible name does not rely on the hidden text.
  #githubLink() {
    const link = document.createElement('a');
    link.className = 'ui-button';
    link.setAttribute('data-variant', 'outline');
    link.setAttribute('aria-label', 'GitHub');
    link.href = 'https://github.com/mightyskeet/fewlines-css';
    link.target = '_blank';
    link.rel = 'noopener';
    link.innerHTML =
      '<svg aria-hidden="true" focusable="false" class="site-github-mark" viewBox="0 0 24 24" fill="currentColor"><path d="M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943"></path></svg><span class="site-button-label">GitHub</span>';
    return link;
  }

  #themeToggle() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ui-button theme-toggle';
    button.setAttribute('aria-label', 'Toggle theme');
    button.innerHTML =
      '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/></svg><span class="site-button-label">Toggle theme</span>';
    button.addEventListener('click', () => {
      // Host concern (theme tokens 7.2): persistence is the host's job.
      const root = document.documentElement;
      const current =
        root.getAttribute('data-theme') ??
        (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
    return button;
  }

  // Hamburger: declarative trigger for the nav drawer (hidden on wide
  // screens, docs.css). popovertarget exposes aria-expanded natively.
  #navToggle() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ui-button site-nav-toggle';
    button.setAttribute('data-variant', 'ghost');
    button.setAttribute('data-size', 'icon');
    button.setAttribute('popovertarget', 'site-nav-drawer');
    button.setAttribute('aria-label', 'Open navigation');
    button.innerHTML =
      '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    return button;
  }
}

customElements.define('site-sidebar', SiteSidebar);
