# Website

This website is built using [Docusaurus 3](https://docusaurus.io/), a modern static website generator.

Requires Node.js 20 or newer.

### Installation

```
$ npm install
```

### Local Development

```
$ npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

The dev server only runs one locale at a time. To preview Korean:

```
$ npm start -- --locale ko
```

### Writing posts

Blog posts and announcements can be written in the browser at `/write` (for example https://mirai.urlate.coupy.dev/write). It commits the English and Korean files, plus any uploaded images, straight to `main` or opens a pull request through the GitHub API, so the site redeploys on its own.

On first use it asks for a fine-grained personal access token limited to this repository with **Contents** and **Pull requests** set to read and write. The token is kept only in that browser's local storage.

The preview and the pre-publish check run the same Markdown pipeline as the site build (admonitions, heading IDs, emoji, math, Mermaid, code block options, `<details>`, inline TOC), and theme components such as `@theme/Tabs` or `@theme/CodeBlock` can be imported as usual. The **＋ 넣기** menu inserts these blocks.

### Build

```
$ npm run build
```

This command generates static content for every locale into the `build` directory and can be served using any static contents hosting service.

```
$ npm run serve
```

### Deployment

Using SSH:

```
$ USE_SSH=true npm run deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> npm run deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
