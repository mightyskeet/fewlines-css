// Docs-site chrome: shared sidebar (brand, page navigation, theme toggle).
// This is host/tooling JS — the core package stays CSS-only
// (overview notes, «Не является целью»).
//
// Theme persistence: the click handler below writes localStorage['theme'];
// restoring it before first paint is a tiny inline <script> in every page's
// <head> (after the viewport meta) — deferred scripts would flash the wrong
// theme for one frame. Keep the two in sync when renaming the key.
//
// Adding a docs page = one entry in PAGES below; every sidebar picks up the
// link automatically. The page title/description are static markup inside
// <main> (header.page-header), so they render even if this script never
// loads — the sidebar itself fails open (nav simply missing).
//
// Layout contract (docs.css): flex column on wide screens (sticky grid
// sidebar), wrap row on narrow ones.
//
// Light DOM on purpose: page styles apply to the rendered chrome.
// Custom elements — autonomous — are baseline high (Can I Use: Chrome 54,
// FF 63, Safari 10.1), above the docs matrix floor.

/** Single source of truth for docs navigation. */
const PAGES = [
  { href: '/', label: 'Overview' },
  { href: '/colors', label: 'Colors' },
  { href: '/typography', label: 'Typography' },
  { href: '/button', label: 'Button' },
  { href: '/choice', label: 'Choice' },
  { href: '/field', label: 'Field' },
  { href: '/fieldset', label: 'Fieldset' },
  { href: '/dialog', label: 'Dialog' },
  { href: '/popover', label: 'Popover' },
  { href: '/drawer', label: 'Drawer' },
  { href: '/accordion', label: 'Accordion' },
  { href: '/alert', label: 'Alert' },
  { href: '/badge', label: 'Badge' },
  { href: '/divider', label: 'Divider' },
  { href: '/progress', label: 'Progress' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/switch', label: 'Switch' },
  { href: '/tooltip', label: 'Tooltip' },
  { href: '/table', label: 'Table' },
];

/* The current-page check is extensionless: links use the clean URLs the
 * static server serves directly (no redirect on click), and visits may
 * still land on either form. */
const pageName = (href) => href.replace(/^\//, '') || 'index';

class SiteSidebar extends HTMLElement {
  connectedCallback() {
    // Idempotent: connectedCallback re-runs whenever the element is moved.
    if (this.dataset.chrome) return;
    this.dataset.chrome = 'true';

    this.append(this.#brand(), this.#nav(), this.#themeToggle());
  }

  #brand() {
    const link = document.createElement('a');
    link.className = 'site-brand';
    link.href = '/';
    link.textContent = '@fewlines/css';
    return link;
  }

  #nav() {
    // Links use the clean URLs the static server serves directly — no
    // redirect between the click and the page, which cross-document view
    // transitions require (compatibility notes, 2026-10-29).
    const current =
      location.pathname
        .replace(/\.html$/, '')
        .split('/')
        .pop() || 'index';
    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Documentation');
    const list = document.createElement('ul');
    for (const { href, label } of PAGES) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      if (pageName(href) === current) link.setAttribute('aria-current', 'page');
      item.append(link);
      list.append(item);
    }
    nav.append(list);
    return nav;
  }

  #themeToggle() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ui-button theme-toggle';
    button.textContent = 'Toggle theme';
    button.addEventListener('click', () => {
      // Host concern (theme notes 7.2): persistence is the host's job.
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
