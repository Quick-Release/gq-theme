# gq-theme

A placeholder WordPress theme for [GETQUICK](https://getquick.io) sites managed
with [gq-site](https://github.com/Quick-Release/gq-site).

One shared theme is used for all site variants for now. This is **not** the site
frontend: its template deliberately outputs nothing. It has no frontend assets,
asset enqueues, hooks, or dependencies.

## Install

Requires **WordPress 7.0+** and **PHP 8.4.1+**, matching the GETQUICK platform
support policy. These are supported minimums, not a claim of integration testing;
`Tested up to` will be added only after testing against an actual WordPress release.

Build the release ZIP using the commands below, then upload it in
**Appearance → Themes → Add New → Upload Theme** and activate **gq-theme**.
For manual deployment, copy only `index.php`, `style.css`, `composer.json`,
`LICENSE`, and `README.md` into `wp-content/themes/gq-theme/`. Do not copy the whole checkout:
Git ignore rules do not exclude `.git/`, `.agents/`, or tooling from filesystem
copies or manually created ZIPs.

The WordPress theme details show the GETQUICK author credits and theme version from
`style.css`. Public WordPress theme-rendered pages are intentionally blank;
WordPress administration and REST API remain available.

### Install through the private GETQUICK registry

Sites with GETQUICK registry credentials can use the Composer repository at
`https://proxy.composer.getquick.io`:

```sh
composer require getquick/gq-theme:^0.1
wp theme activate gq-theme
```

The package has type `wordpress-theme` and installer name `gq-theme`.
Bedrock sites should already have `composer/installers` enabled and a
`web/app/themes/{$name}/` installer path for `type:wordpress-theme`. Other
WordPress layouts should configure their equivalent theme directory. Keep
registry credentials in the site's existing Composer authentication setup,
never in this public repository.

This package is independent of the legacy `getquick/getquick-theme` package.
Installing it does not migrate or remove an existing theme automatically.

## Version

Current version: **0.1.0**.

The theme is versioned independently of `gq-site` and other GETQUICK packages.
Bump its version when releasing theme changes, updating the `Version` header in
`style.css`, the version in `package.json`, and this README together. This metadata
identifies the theme release, not the deployed frontend or a plugin version.

## Headless behavior and security

An empty template suppresses theme-rendered output; it does **not** disable
WordPress, restrict access, or prevent indexing. WordPress still boots and queries
content for frontend requests. REST endpoints, feeds, sitemaps, uploads, login,
and plugin-provided routes may remain accessible. WordPress still controls HTTP
status codes; a blank response is not necessarily a 404.

Configure backend access restrictions, indexing policy, and frontend redirects at
the web server or in a site-specific plugin (preferably an MU plugin when the
policy must survive theme changes). Keep required REST/authentication routes,
admin access, and frontend data fetching working. `robots.txt` is crawler guidance,
not access control. Protect private content through authentication and permissions.

The template deliberately does not call `wp_head()` or `wp_footer()`. Plugins
that depend on these frontend hooks will not inject output here; backend hooks
and REST behavior are separate. Do not add rendering hooks merely to emulate a
normal frontend theme.

## Development and releases

Tooling requires Node.js 22+, PHP CLI, Git, `tar`, and the `zip`/`unzip` commands. No npm
installation or frontend build is needed. Run from the repository root:

```sh
npm run format       # Normalize LF endings, final newline, and trailing whitespace.
npm run check        # Formatting, JS/PHP syntax, theme checks, and regression tests.
npm run package      # Produce dist/gq-theme-<version>.zip.
npm run validate:release  # Check ZIP integrity and the exact file allowlist.
```

`npm run lint`, `npm run format:check`, and `npm test` are also available separately.
Checks verify blank template output, required theme headers, and matching versions
in `style.css`, this README, and `package.json`. Update all three when releasing.
The ZIP contains exactly `gq-theme/{index.php,style.css,composer.json,LICENSE,README.md}`;
`.git/`, `.agents/`, tooling, tests, and previous build artifacts are never packaged.
Git/GitHub source archives and Composer archives use the same allowlist.
`composer.json` deliberately omits a version: Composer infers it from the release tag.

### Publish a release

The public source repository is [Quick-Release/gq-theme](https://github.com/Quick-Release/gq-theme).
Checks run on pull requests and pushes to `main`. After updating the theme version,
run the checks, commit and push to `main`, then tag that checked commit:

```sh
git tag v0.1.0
git push origin v0.1.0
```

The GitHub Actions release workflow verifies that the tag matches `package.json`,
then creates a GitHub release with the installable ZIP. Release tags and published
assets are immutable; make a new version for subsequent changes instead of moving
a tag or replacing an asset. The private GETQUICK registry rebuilds hourly to
pick up new releases, or an authorized registry operator can rebuild immediately.
No private registry credentials are needed in this public repository.

Before deployment, smoke-test activation on the supported WordPress/PHP versions
and verify blank frontend responses, admin access, and the REST/authentication
routes used by `gq-site`. Local checks do not replace this integration test.

## License

Copyright (C) GETQUICK. Licensed under the GNU General Public License version 2
only (`GPL-2.0-only`). See [LICENSE](LICENSE). Provided without warranty.
