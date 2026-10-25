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
      // Stable id: derived from the title text (docs pages are static). It
      // lives on the '#' anchor inside the heading, not on the section: the
      // anchor is the fragment target AND the copy-link affordance — being
      // focusable, it receives focus on fragment navigation (heading ring),
      // and keyboard users continue Tab from it (accessibility fix for the
      // focus lost on in-page navigation).
      const id =
        (title.dataset.sectionId ||= `section-${title.textContent.trim().toLowerCase().replace(/\s+/g, '-')}`);
      const anchor = document.createElement('a');
      anchor.href = `#${id}`;
      anchor.id = id;
      anchor.className = 'heading-anchor';
      anchor.setAttribute('aria-label', `Copy link to “${title.textContent.trim()}”`);
      anchor.addEventListener('click', () =>
        navigator.clipboard?.writeText(new URL(anchor.href, location.href)),
      );
      anchor.append(document.createTextNode('#'));
      title.append(' ', anchor);
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
