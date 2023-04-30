# Configuration

## Table of Contents

- [Table of Contents](#table-of-contents);
- [About](#about);
- [Schema](#schema);
- [Placeholders](#placeholders);
- [Minimal Configuration](#minimal-configuration);
- [Format](#format);
  - [Port Number](#port-number);
  - [Path String](#path-string);
  - [Duration Strings](#duration-strings);
  - [Size String](#size-strings).

## About

This document contains detailed description of configuration schema.

## Schema

Server configuration is all stored in `poms-config.json` file. This file can be stored anywhere
up in the filesystem tree relative to server launch directory. Server will find it and set it's
directory as it's working directory. By default configuration file isn't created, you must create
it on your own. All available configuration options are listed below (use of any unsupported option
is considered an error):

| Field Path                   | Type                    | Default Value                  | Required | Description                                                                        |
|------------------------------|-------------------------|--------------------------------|----------|------------------------------------------------------------------------------------|
| `http.proxied`               | `boolean`               | `false`                        | No       | Indicates that server is behind a proxy and that it should use X-proxy-headers     |
| `http.apiPrefix`             | Path `string`           | `"/api"`                       | No       | HTTP path prefix of all API-requests                                               |
| `http.maxBodySize`           | Size `string`           | `"22mb"`                       | No       | Maximim allowed sized of HTTP request's body                                       |
| `http.host`                  | `string` or 'null'      | `null'                         | No       | HTTP server address                                                                |
| `http.port`                  | Port `number`           | `8000`                         | No       | HTTP server port                                                                   |
| `http.socketPath`            | Path `string` or `null` | `null`                         | No       | HTTP server Unix-socket path. When used `api.port` and `api.host` is ignored       |
| `http.serveStatic`           | `boolean`               | `true`                         | No       | If `true` HTTP server will serve static content from `http.staticPath`             |
| `http.staticPath`            | Path `string`           | `"<SITE_PATH>/build"`          | No       | Path to static content HTTP server to serve                                        |
| `http.error.404Path`         | Path `string`           | `"<SITE_PATH>/build/404.html"` | No       | Path to 404-error page                                                             |
| `http.error.500Path`         | Path `string`           | `"<SITE_PATH>/build/500.html"` | No       | Path to 500-error page                                                             |
| `ws.prefix`                  | Path `string`           | `"/ws"`                        | No       | WebSocket URL path prefix                                                          |
| `mysql.database`             | `string`                | `"poms"`                       | No       | Name of database to use                                                            |
| `mysql.host`                 | `string`                | `"localhost"`                  | No       | MySQL server address                                                               |
| `mysql.port`                 | Port `number`           | `3306`                         | No       | MySQL server port                                                                  |
| `mysql.socketPath`           | Path `string` or `null` | `null`                         | No       | MySQL server Unix-socket path. When used `mysql.host` and `mysql.port` are ignored |
| `mysql.login`                | `string` or `null`      | `null`                         | Yes (1)  | MySQL user login                                                                   |
| `msyql.password`             | `string` or `null`      | `null`                         | Yes (1)  | MySQL user password                                                                |
| `msyql.connectionLimit`      | Unsigned `number`       | `10`                           | Yes (1)  | Maximum number of MySQL connections                                                |
| `mysql.init.login`           | `string` or `null`      | `null`                         | No  (2)  | MySQL initialization user login                                                    |
| `mysql.init.password`        | `string` or `null`      | `null`                         | No  (2)  | MySQL initialization user password                                                 |
| `mysql.serve.login`          | `string` or `null`      | `null`                         | No  (2)  | MySQL serving user login                                                           |
| `mysql.serve.password`       | `string` or `null`      | `null`                         | No  (2)  | MySQL serving user password                                                        |
| `logic.admin.create`         | `boolean`               | `true`                         | No       | Create default admin account on database initialization                            |
| `logic.admin.login`          | `string`                | `admin`                        | No       | Default admin login                                                                |
| `logic.admin.password`       | `string`                | `admin`                        | No       | Default admin password. Will be set only on creation                               |
| `logic.admin.name`           | `string` or `null`      | `"Administrator"`              | No       | Default admin name                                                                 |
| `logic.maxTokens`            | Unsigned `number`       | `10`                           | No       | Maximum number of tokens per user                                                  |
| `logic.maxNicknames`         | Unsigned `number`       | `5`                            | No       | Maximum number of nicknames per user                                               |
| `logic.static.build`         | `boolean`               | `true`                         | No       | Build static conent if `http.staticPath` is empty or doesn't exits                 |
| `logic.static.buildPath`     | Path `string`           | `"<SITE_PATH>"`                | No       | Path for running `npm run build` to build static content if needed                 |
| `logic.static.forceBuild`    | `boolean`               | `true`                         | No       | Forces static content rebuild on every startup when `logic.static.build` is `true` |
| `logic.openBrowser`          | `boolean`               | `true`                         | No       | If `true` opens browser after server start                                         |
| `logic.aTokenLifetime`       | Duration `string`       | `"30m"`                        | No       | Access token lifetime. Should not be too long                                      |
| `logic.rTokenLifetime`       | Duration `string`       | `"1w"`                         | No       | Refresh token lifetime. Should be much longer than access token lifetime           |
| `logic.allowAnonymousAccess` | `boolean`               | `true`                         | No       | Allowes access to most API methods without authorization                           |
| `logic.authDelay`            | Durcation `string`      | `"2s"`                         | No       | Synthetic delay of `/auth` API method to prevent brute force                       |
| `logic.noAuthDelayInDev`     | `boolean`               | `true`                         | No       | Disables synthetic delay for `/auth` API method while not in `production` mode     |
| `rcon.enable`                | `boolean`               | `false`                        | No       | Enables RCON console                                                               |
| `rcon.host`                  | `string`                | Value of `mc.host`             | No       | RCON server's address                                                              |
| `rcon.port`                  | Port `number`           | `25575`                        | No       | RCON server's port                                                                 |
| `rcon.password`              | `string` or `null`      | `null`                         | No       | RCON server's password                                                             |
| `mc.publicAddress`           | `string` or `null`      | `null`                         | No       | Minecraft server's public address                                                  |
| `mc.host`                    | `string`                | `"localhost"`                  | No       | Minecraft server's address                                                         |
| `mc.port`                    | Port `number`           | `25565`                        | No       | Minecraft server's port                                                            |
| `mc.statusLifetime`          | Duration `string`       | `"10s"`                        | No       | Minecraft server's status cache lifetime                                           |

 1) Are required if any of the following options are omitted:

    - `mysql.init.login`;
    - `mysql.init.password`;
    - `mysql.serve.login`;
    - `mysql.serve.password`.

 2) Are required if `mysql.login` and `mysql.password` are omitted.

## Placeholders

Configuration options representing filesystem paths can contain placeholders
starting with `<` and ending with `>`. You can escape `<` using `\` like this: `\<`.

Those are all available placeholders:

- `<POM_PATH>`    - path to the POMS root directory;
- `<PLUGIN_PATH>` - path to the Bukkit plugin directory;
- `<SERVER_PATH>` - path to the server directory;
- `<SITE_PATH>`   - path to the site directory.

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

## Format

This section will provide description of different types' format

### Port Number

Just a number in range [0, 65535].

### Path String

A valid file system path.

### Duration Strings

Duration strings are parsed with [_parse-duration_](https://github.com/jkroso/parse-duration#readme)
npm package. Every string that is valid for parse-duration package is valid for POMS server.

### Size Strings

Size strings are parsed with [_bytes_](https://www.npmjs.com/package/bytes)
npm package. Every string that is valid for bytes package is valid for POMS server.
