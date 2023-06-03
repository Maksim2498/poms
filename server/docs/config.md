# Configuration

## Table of Contents

- [Table of Contents](#table-of-contents);
- [About](#about);
- [Schema](#schema);
- [Minimal Configuration](#minimal-configuration);
- [Special Types](#special-types);
  - [Port](#port);
  - [Path](#path);
  - [Duration](#duration);
  - [Size](#size).

## About

This document contains detailed description of configuration schema.

## Schema

Server configuration is all stored in `poms-config.json` file. This file can be stored anywhere
up in the filesystem tree relative to server launch directory. Server will find it and set it's
directory as it's working directory. By default configuration file isn't created, you must create
it on your own. All available configuration options are listed below (use of any unsupported option
is considered an error):

| Field Path                   | Type               | Default Value                  | Required | Description                                                                        |
|------------------------------|--------------------|--------------------------------|----------|------------------------------------------------------------------------------------|
| `http.proxied`               | `boolean`          | `false`                        | No       | Indicates that server is behind a proxy and that it should use X-proxy-headers     |
| `http.apiPrefix`             | `path`             | `"/api"`                       | No       | HTTP path prefix of all API-requests                                               |
| `http.maxBodySize`           | `size`             | `"6mb"`                        | No       | Maximim allowed sized of HTTP request's body                                       |
| `http.host`                  | `string` or 'null' | `null'                         | No       | HTTP server address                                                                |
| `http.port`                  | `port`             | `8000`                         | No       | HTTP server port                                                                   |
| `http.socketPath`            | `path` or `null`   | `null`                         | No       | HTTP server Unix-socket path. When used `api.port` and `api.host` is ignored       |
| `http.serveStatic`           | `boolean`          | `true`                         | No       | If `true` HTTP server will serve static content from `http.staticPath`             |
| `http.staticPath`            | `path`             | `"<SITE_PATH>/build"`          | No       | Path to static content HTTP server to serve                                        |
| `http.errorPath[400]`        | `path`             | `"<SITE_PATH>/build/404.html"` | No       | Path to 404-error page                                                             |
| `http.errorPath[500]`        | `path`             | `"<SITE_PATH>/build/500.html"` | No       | Path to 500-error page                                                             |
| `ws.prefix`                  | `path`             | `"/ws"`                        | No       | WebSocket URL path prefix                                                          |
| `mysql.database`             | `string`           | `"Poms"`                       | No       | Name of database to use                                                            |
| `mysql.host`                 | `string`           | `"localhost"`                  | No       | MySQL server address                                                               |
| `mysql.port`                 | `port`             | `3306`                         | No       | MySQL server port                                                                  |
| `mysql.socketPath`           | `string` or `null` | `null`                         | No       | MySQL server Unix-socket path. When used `mysql.host` and `mysql.port` are ignored |
| `mysql.login`                | `string` or `null` | `null`                         | Yes (1)  | MySQL user login                                                                   |
| `msyql.password`             | `string` or `null` | `null`                         | Yes (1)  | MySQL user password                                                                |
| `msyql.connectionLimit`      | `uint`             | `10`                           | Yes (1)  | Maximum number of MySQL connections                                                |
| `mysql.initialize.login`     | `string` or `null` | `null`                         | No  (2)  | MySQL initialization user login                                                    |
| `mysql.initialize.password`  | `string` or `null` | `null`                         | No  (2)  | MySQL initialization user password                                                 |
| `mysql.serve.login`          | `string` or `null` | `null`                         | No  (2)  | MySQL serving user login                                                           |
| `mysql.serve.password`       | `string` or `null` | `null`                         | No  (2)  | MySQL serving user password                                                        |
| `mysql.cacheSize`            | `size`             | `100mb`                        | No       | Cache size for MySQL query results                                                 |
| `logic.owner.create`         | `boolean`          | `true`                         | No       | Create or not a default owner account on database initialization                   |
| `logic.owner.login`          | `string`           | `owner`                        | No       | Default owner login                                                                |
| `logic.owner.password`       | `string`           | `owner`                        | No       | Default owner password                                                             |
| `logic.owner.name`           | `string` or `null` | `"Owner"`                      | No       | Default owner name                                                                 |
| `logic.owner.nicknames`      | `string[]`         | `[]`                           | No       | Default owner nicknames                                                            |
| `logic.maxTokens`            | `uint`             | `10`                           | No       | Maximum number of tokens per user                                                  |
| `logic.maxNicknames`         | `uint`             | `5`                            | No       | Maximum number of nicknames per user                                               |
| `logic.static.build`         | `boolean`          | `true`                         | No       | Build static conent if `http.staticPath` is empty or doesn't exits                 |
| `logic.static.buildPath`     | `path`             | `"<SITE_PATH>"`                | No       | Path for running `npm run build` to build static content if needed                 |
| `logic.static.forceBuild`    | `boolean`          | `true`                         | No       | Forces static content rebuild on every startup when `logic.static.build` is `true` |
| `logic.openBrowser`          | `boolean`          | `true`                         | No       | If `true` opens browser after server start                                         |
| `logic.aTokenLifetime`       | `duration`         | `"30m"`                        | No       | Access token lifetime. Should not be too long                                      |
| `logic.rTokenLifetime`       | `duration`         | `"1w"`                         | No       | Refresh token lifetime. Should be much longer than access token lifetime           |
| `logic.allowAnonymousAccess` | `boolean`          | `true`                         | No       | Allowes access to most API methods without authorization                           |
| `logic.authDelay`            | `duration`         | `"2s"`                         | No       | Synthetic delay of `/auth` API method to prevent brute force                       |
| `logic.noAuthDelayInDev`     | `boolean`          | `true`                         | No       | Disables synthetic delay for `/auth` API method while not in `production` mode     |
| `logic.maxIconSize`    `     | `size`             | `"4mb"`                        | No       | Maximum size of user icon. Must be less than 16MB                                  |
| `rcon.enable`                | `boolean`          | `false`                        | No       | Enables RCON console                                                               |
| `rcon.host`                  | `string`           | Value of `mc.host`             | No       | RCON server's address                                                              |
| `rcon.port`                  | `port`             | `25575`                        | No       | RCON server's port                                                                 |
| `rcon.password`              | `string` or `null` | `null`                         | No       | RCON server's password                                                             |
| `mc.publicAddress`           | `string` or `null` | `null`                         | No       | Minecraft server's public address                                                  |
| `mc.host`                    | `string`           | `"localhost"`                  | No       | Minecraft server's address                                                         |
| `mc.port`                    | `port`             | `25565`                        | No       | Minecraft server's port                                                            |
| `mc.statusLifetime`          | `duration`         | `"10s"`                        | No       | Minecraft server's status cache lifetime                                           |

 1) Are required if any of the following options is omitted:

    - `mysql.init.login`;
    - `mysql.init.password`;
    - `mysql.serve.login`;
    - `mysql.serve.password`.

 2) Are required if `mysql.login` and `mysql.password` are omitted.

## Minimal Configuration

Minimal valid configuration file is the following:

```json
{
    "mysql": {
        "login":    "your MySQL user login",
        "password": "your MySQL user password"
    }
}
```

## Special Types

This section will provide description of different types' format

### Port

Just an unsigned integer in range [0, 65535].

### Path

A valid file system path.

Paths can contain placeholders starting with `<` and ending with `>` symbols.
`<` symbol can be escaped user `\` like this: `\<`.

Those are all available placeholders:

- `<POM_PATH>`    - path to the POMS root directory;
- `<PLUGIN_PATH>` - path to the Bukkit plugin directory;
- `<SERVER_PATH>` - path to the server directory;
- `<SITE_PATH>`   - path to the site directory.

### Duration

`duration` is an unsigned integer representing a number of milliseconds or a string parsed with
[_parse-duration_](https://github.com/jkroso/parse-duration#readme) npm package. Every string
that is valid for parse-duration package is valid for POMS server.

### Size

`size` is an unsigned integer repersenting a number of bytes or a strings parsed with
[_bytes_](https://www.npmjs.com/package/bytes) npm package. Every string that is valid for bytes
package is valid for POMS server.
