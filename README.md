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
