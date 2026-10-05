# gq-theme

A placeholder WordPress theme for [GETQUICK](https://getquick.io) sites managed
with [gq-site](https://github.com/Quick-Release/gq-site).

One shared theme is used for all site variants for now. This is **not** the site
frontend: its template deliberately outputs nothing. It has no frontend assets,
asset enqueues, hooks, or dependencies.

## Install

Copy this directory to `wp-content/themes/gq-theme`, or upload a ZIP containing
the `gq-theme/` directory in **Appearance → Themes → Add New → Upload Theme**.
Activate **gq-theme**.

The WordPress theme details show the GETQUICK author credits and version from
`style.css`. Public WordPress theme-rendered pages are intentionally blank;
WordPress administration and REST API remain available.

## Version

Current version: **0.15.2**, from the `Version` header in `style.css`. The theme
is versioned on its own, independently of `gq-site` and the GETQUICK plugins.
It has no Git tags or GitHub releases and isn't published to the GETQUICK
Composer registry, so it is installed from this repository as described above.
To change the version, update the `Version` header in `style.css` and this
README together. It labels this theme only; it says nothing about the deployed
Frontend or any plugin version.

## License

Copyright (C) GETQUICK. Licensed under the GNU General Public License version 2
only (`GPL-2.0-only`). See [LICENSE](LICENSE). Provided without warranty.
