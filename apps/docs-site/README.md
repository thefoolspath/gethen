# Gethen Documentation Site

This workspace application is the local Alpha documentation and interactive-demo workbench. The shell is a standalone Angular app and each live grid example renders through the built `@thefoolspath/gethen-angular` package, with Core and Protocol imported only through public package entry points.

Run `pnpm run docs`, then open `http://127.0.0.1:4173/docs/introduction`.

The site is intentionally local-only during Alpha. It does not include a deployment workflow, analytics, authentication, or a CMS.
