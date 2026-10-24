// Docs-site chrome: syntax highlighting for <pre><code> blocks.
// Requires vendor/hljs.min.js (highlight.js core + xml/css/javascript/bash/json).
// Uses the HTML highlighter auto-detect (hljs.highlightElement) so each page
// needs no per-block language attribute.
//
// The color theme lives in docs.css (.hljs-* rules on --ui-* tokens): it
// follows the light/dark theme without a second stylesheet.

if (window.hljs) {
  for (const block of document.querySelectorAll('pre code')) {
    window.hljs.highlightElement(block);
  }
}
