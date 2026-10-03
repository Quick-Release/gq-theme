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

Current version: **0.15.2**, matching the current `gq-site` package release.
Update the `Version` header in `style.css` and this README when aligning with a
new site release. This metadata is a release label, not automatic detection of
the deployed frontend or a plugin version.

## License

Copyright (C) GETQUICK. Licensed under the GNU General Public License version 2
only (`GPL-2.0-only`). See [LICENSE](LICENSE). Provided without warranty.
