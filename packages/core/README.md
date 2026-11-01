# fewlines-css

Platform-native CSS UI system: semantic HTML, modern CSS, **zero runtime
JavaScript**.

The library does not invent a runtime on top of the browser — it uses what
HTML and CSS can already do, and adds a unified visual language, theming, an
accessibility contract and a predictable API. Built for plain HTML and for
applications developed by coding agents.

## Install

```sh
pnpm add fewlines-css
```

```css
/* whole package (bundler: Vite etc.) */
@import 'fewlines-css';

/* tokens only */
@import 'fewlines-css/tokens';
```

Theming: the default follows the system preference (`light-dark()` +
`color-scheme`); an explicit override is `data-theme="light|dark"` on the
root element. Recolor the system by overriding seed tokens (e.g.
`--ui-color-brand`); semantic colors recompute on their own.

## Documentation

Components, canonical markup and live examples:
[fewlines-css documentation](https://mightyskeet.github.io/fewlines-css/).
An agent skill (`SKILL.md` + per-component references) ships in the
repository under `skills/fewlines-css/`.

## License

MIT
