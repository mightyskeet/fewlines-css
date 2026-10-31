// Docs-site chrome: fixed header (brand, theme toggle) + navigation
// sidebar, rendered by one custom element (<site-sidebar> is the single
// mount point in every page's markup).
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
// wide ones, clipped below the header (--site-header-size).
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
  { href: 'pages/divider.html', label: 'Divider', group: 'Foundation' },
  { href: 'pages/button.html', label: 'Button', group: 'Forms' },
  { href: 'pages/choice.html', label: 'Choice', group: 'Forms' },
  { href: 'pages/field.html', label: 'Field', group: 'Forms' },
  { href: 'pages/fieldset.html', label: 'Fieldset', group: 'Forms' },
  { href: 'pages/switch.html', label: 'Switch', group: 'Forms' },
  { href: 'pages/dialog.html', label: 'Dialog', group: 'Overlays' },
  { href: 'pages/popover.html', label: 'Popover', group: 'Overlays' },
  { href: 'pages/menu.html', label: 'Menu', group: 'Overlays' },
  { href: 'pages/drawer.html', label: 'Drawer', group: 'Overlays' },
  { href: 'pages/tooltip.html', label: 'Tooltip', group: 'Overlays' },
  { href: 'pages/alert.html', label: 'Alert', group: 'Indicators' },
  { href: 'pages/badge.html', label: 'Badge', group: 'Indicators' },
  { href: 'pages/skeleton.html', label: 'Skeleton', group: 'Indicators' },
  { href: 'pages/progress.html', label: 'Progress', group: 'Indicators' },
  { href: 'pages/timeline.html', label: 'Timeline', group: 'Indicators' },
  { href: 'pages/stepper.html', label: 'Stepper', group: 'Indicators' },
  { href: 'pages/breadcrumbs.html', label: 'Breadcrumbs', group: 'Navigation' },
  { href: 'pages/tabs.html', label: 'Tabs', group: 'Navigation' },
  { href: 'pages/accordion.html', label: 'Accordion', group: 'Navigation' },
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

    this.append(this.#header(), this.#nav());
  }

  // Fixed header spanning the viewport: brand left, theme toggle right.
  #header() {
    const header = document.createElement('header');
    header.className = 'site-header';
    header.append(this.#brand(), this.#themeToggle());
    return header;
  }

  #brand() {
    const link = document.createElement('a');
    link.className = 'site-brand';
    link.href = `${base}index.html`;
    link.textContent = 'fewlines-css';
    return link;
  }

  #nav() {
    // Links are plain relative paths (see `base` above) — the site works
    // from file:// and any static host, no clean-URL rewriting needed.
    const current =
      location.pathname
        .split('/')
        .pop()
        .replace(/\.html$/, '') || 'index';
    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Documentation');
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
    return nav;
  }

  #themeToggle() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ui-button theme-toggle';
    button.textContent = 'Toggle theme';
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
}

customElements.define('site-sidebar', SiteSidebar);
