// Docs-site chrome: right-hand table of contents, generated from the page's
// h2 sections. Host/tooling JS — the core package stays CSS-only.
//
// Fails open: without JS (or without h2 sections) nothing renders and the
// grid falls back to two columns — the aside element is empty and hidden
// by the docs.css grid rules (no third column reserved when :empty).
//
// Custom elements — autonomous — are baseline high (Can I Use: Chrome 54,
// FF 63, Safari 10.1), above the docs matrix floor.

class SiteToc extends HTMLElement {
  connectedCallback() {
    // Idempotent: connectedCallback re-runs whenever the element is moved.
    if (this.dataset.chrome) return;
    this.dataset.chrome = 'true';

    const heading = document.createElement('h2');
    heading.textContent = 'On this page';
    const list = document.createElement('ul');
    for (const section of document.querySelectorAll('main section:has(> h2)')) {
      const title = section.querySelector('h2');
      // Stable id: derive from the title text (docs pages are static).
      const id =
        (section.id ||= `section-${title.textContent.trim().toLowerCase().replace(/\s+/g, '-')}`);
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${id}`;
      link.textContent = title.textContent;
      item.append(link);
      list.append(item);
    }
    if (!list.children.length) return; // fail open: no sections — no TOC
    this.append(heading, list);
  }
}

customElements.define('site-toc', SiteToc);
