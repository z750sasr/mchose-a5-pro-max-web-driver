# Deployment

## GitHub Pages

The root workflow `.github/workflows/deploy-pages.yml` installs the locked dependencies, runs the static build, uploads `web-driver-app/github-dist`, and deploys it with GitHub's official Pages actions.

One-time repository setup:

1. Open **Settings → Pages**.
2. Select **GitHub Actions** as the source.
3. Make sure Actions are enabled for the repository.
4. Push the workflow and app files to `main`.

The deployment also supports manual runs from **Actions → Deploy WebHID driver to GitHub Pages → Run workflow**.

The Vite configuration detects `GITHUB_REPOSITORY` during the Actions build. It uses `/repository-name/` for a project site and `/` for an `owner.github.io` site, so scripts and images work in either layout.

## Local static verification

```sh
cd web-driver-app
npm ci
npm run build:pages
npm run preview:pages
```

The production files are written to `web-driver-app/github-dist`. This folder is generated and ignored by Git.

## HTTPS requirement

WebHID is restricted to secure browser contexts. GitHub Pages serves HTTPS automatically. If you deploy elsewhere, enable HTTPS; opening the generated files directly from disk is not sufficient for device access.

## Custom domains

Configure the custom domain in GitHub Pages settings. No source change is required for root-domain hosting. If GitHub creates a `CNAME` file, preserve it in the published Pages configuration.

## Hosted preview build

The app also retains its vinext build for the existing hosted preview:

```sh
cd web-driver-app
npm run build
```

The static GitHub build and the hosted preview use the same page, styles, WebHID protocol, and public assets.
