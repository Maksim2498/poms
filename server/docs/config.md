# Configuration

## Index

- [Index](#index);
- [About](#about);
- [Schema](#schema);
- [Placeholders](#placeholders);
- [Minimal Config](#minimal-config).

## About

This document contains detailed description of configuration schema.

## Schema

Server configuration is all stored in `poms-config.json` file. This file can be stored anywhere
up in the filesystem tree relative to server launch directory. Server will find it and set it's
directory as it's working directory. By default configuration file isn't created, you must create
it on your own. All available configuration options are listed below (use of any unsupported option
is considered an error):

| Field Path                    | Type          | Default Value                 | Required | Description                                                                        |
|-------------------------------|---------------|-------------------------------|----------|------------------------------------------------------------------------------------|
| `http.prefix`                 | Path `string` | `"/api"`                      | No       | HTTP path prefix of all API-requests                                               |
| `http.host`                   | `string`      | `"localhost"`                 | No       | HTTP server address                                                                |
| `http.port`                   | Port `number` | `8000`                        | No       | HTTP server port                                                                   |
| `http.socketPath`             | Path `string` | -                             | No       | HTTP server Unix-socket path. When used `api.port` and `api.host` is ignored       |
| `http.serveStatic`            | `boolean`     | `true`                        | No       | If `true` HTTP server will serve static content from `http.staticPath`             |
| `http.staticPath`             | Path `string` | `<SITE_PATH>/build`           | No       | Path to static content HTTP server to serve                                        |
| `http.error404Path`           | Path `string` | `<SITE_PATH>/public/404.html` | No       | Path to 404-error page                                                             |
| `http.error500Path`           | Path `string` | `<SITE_PATH>/public/500.html` | No       | Path to 500-error page                                                             |
| `mysql.database`              | `string`      | `poms`                        | No       | Name of database to use                                                            |
| `mysql.host`                  | `string`      | `"localhost"`                 | No       | MySQL server address                                                               |
| `mysql.port`                  | Port `number` | `3306`                        | No       | MySQL server port                                                                  |
| `mysql.socketPath`            | Path `string` | -                             | No       | MySQL server Unix-socket path. When used `mysql.host` and `mysql.port` are ignored |
| `mysql.login`                 | `string`      | -                             | Yes (1)  | MySQL user login                                                                   |
| `msyql.password`              | `string`      | -                             | Yes (1)  | MySQL user password                                                                |
| `mysql.init.login`            | `string`      | -                             | No  (2)  | MySQL initialization user login                                                    |
| `mysql.init.password`         | `string`      | -                             | No  (2)  | MySQL initialization user password                                                 |
| `mysql.serve.login`           | `string`      | -                             | No  (2)  | MySQL serving user login                                                           |
| `mysql.serve.password`        | `string`      | -                             | No  (2)  | MySQL serving user password                                                        |
| `mysql.validateTables`        | `boolean`     | `true`                        | No       | Enables database tables validation                                                 |
| `mysql.recreateInvalidTables` | `boolean`     | `false`                       | No       | Enables dropping of invalid tables and their recreation                            |
| `mysql.reconnectInterval`     | `number`      | `5`                           | No       | Number of seconds between automatic reconnections to the database                  |
| `logic.createAdmin`           | `boolean`     | `true`                        | No       | Create default admin account on database initialization                            |
| `logic.maxTokens`             | `number`      | `10`                          | No       | Maximum number of tokens per user                                                  |
| `logic.maxNicknames`          | `number`      | `5`                           | No       | Maximum number of nicknames per user                                               |
| `logic.buildStatic`           | `boolean`     | `true`                        | No       | Build static conent if `http.staticPath` is empty or doesn't exits                 |
| `logic.buildStaticPath`       | Path `string` | `<SITE_PATH>`                 | No       | Path for running `npm run build` to build static content if needed                 |

 1) Are required if any of the following options are omitted:

    - `mysql.init.login`;
    - `mysql.init.password`;
    - `mysql.serve.login`;
    - `mysql.serve.password`.

 2) Are required if `mysql.login` and `mysql.password` are omitted.

## Placeholders

Configuration options representing filesystem paths can contain placeholders
starting with `<` and ending with `>`. You can escape `<` using `\` like this: `\<'.

Those are all available placeholders:

- `<POM_PATH_PATH>` - path to the POMS root directory;
- `<PLUGIN_PATH>`   - path to the Bukkit plugin directory;
- `<SERVER_PATH>`   - path to the server directory;
- `<SITE_PATH>`     - path to the site directory.

## Minimal Config

Minimal valid config is following:

```json
{
    "mysql": {
        "login":    "your MySQL user login",
        "password": "your MySQL user password"
    }
}
```
