// Docs-site chrome: shared header (page title, description, theme toggle)
// and navigation. This is host/tooling JS — the core package stays CSS-only
// (PROJECT_SPEC.md, раздел 3).
//
// Adding a docs page = one entry in PAGES below; every page picks up the
// link automatically.
//
// Usage (children are page-owned content, kept as-is):
//   <site-header>
//     <h1>Page title</h1>
//     <p>Page description with <code>markup</code>.</p>
//   </site-header>
//
// Light DOM on purpose: page styles apply to the rendered chrome, and the
// page content stays visible even if this script never loads (no shadow
// root, fail open). Custom elements — autonomous — are baseline high
// (Can I Use: Chrome 54, FF 63, Safari 10.1), above the docs matrix floor.

/** Single source of truth for docs navigation. */
const PAGES = [
  { href: 'index.html', label: 'Overview' },
  { href: 'button.html', label: 'Button' },
  { href: 'field.html', label: 'Field' },
  { href: 'dialog.html', label: 'Dialog' },
  { href: 'popover.html', label: 'Popover' },
  { href: 'accordion.html', label: 'Accordion' },
  { href: 'alert.html', label: 'Alert' },
  { href: 'switch.html', label: 'Switch' },
];

class SiteHeader extends HTMLElement {
  connectedCallback() {
    // Idempotent: connectedCallback re-runs whenever the element is moved.
    if (this.dataset.chrome) return;
    this.dataset.chrome = 'true';

    // The element hosts block content and renders the shared chrome; the
    // chrome's own styles are injected here once, so adding a page needs
    // no per-page CSS (page styles can still override — they load first).
    const style = document.createElement('style');
    style.textContent = [
      'site-header{display:block}',
      'site-header .theme-toggle{float:inline-end}',
      '.site-nav ul{display:flex;flex-wrap:wrap;gap:var(--ui-space-sm);padding:0;margin:0 0 var(--ui-space-xl);list-style:none}',
    ].join('\n');
    document.head.append(style);

    const header = document.createElement('header');
    header.append(...this.childNodes, this.#themeToggle());
    this.append(header, this.#nav());
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
      root.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    });
    return button;
  }

  #nav() {
    // The static server serves clean URLs (/alert.html -> /alert), so both
    // sides are normalized to the extensionless page name.
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
      link.href = `./${href}`;
      link.textContent = label;
      if (href.replace(/\.html$/, '') === current) link.setAttribute('aria-current', 'page');
      item.append(link);
      list.append(item);
    }
    nav.append(list);
    return nav;
  }
}

customElements.define('site-header', SiteHeader);
