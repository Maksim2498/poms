# Configuration

## Index

- [Index](#index);
- [About](#about);
- [Schema](#schema);
- [Minimal Config](#minimal-config).

## About

This document contains detailed description of configuration schema.

## Schema

API configuration is stored in `config.json` file in `/api` folder.
By default this file doesn't exist and you have to create it on your
own. It has the following available options (use of not supported any
option is considered an error):

| Field Path             | Type          | Default Value | Required | Description                                                                        |
|------------------------|---------------|---------------|----------|------------------------------------------------------------------------------------|
| `api.prefix`           | Path `string` | `"/api"`      | No       | Path prefix of all API-requests                                                    |
| `api.host`             | `string`      | `"localhost"` | No       | HTTP-server host address                                                           |
| `api.port`             | Port `number` | `8000`        | No       | HTTP-server port                                                                   |
| `api.socketPath`       | Path `string` | -             | No       | HTTP-server Unix-socket path. When used `api.port` is ignored                      |
| `mysql.database`       | `string`      | `poms`        | No       | Name of database to use                                                            |
| `mysql.host`           | `string`      | `"localhost"` | No       | MySQL server address                                                               |
| `mysql.port`           | Port `number` | `3306`        | No       | MySQL server port                                                                  |
| `mysql.socketPath`     | Path `string` | -             | No       | MySQL server Unix-socket path. When used `mysql.host` and `mysql.port` are ignored |
| `mysql.login`          | `string`      | -             | Yes (1)  | MySQL user login                                                                   |
| `msyql.password`       | `string`      | -             | Yes (1)  | MySQL user password                                                                |
| `mysql.init.login`     | `string`      | -             | No  (2)  | MySQL initialization user login                                                    |
| `mysql.init.password`  | `string`      | -             | No  (2)  | MySQL initialization user password                                                 |
| `mysql.serve.login`    | `string`      | -             | No  (2)  | MySQL serving user login                                                           |
| `mysql.serve.password` | `string`      | -             | No  (2)  | MySQL serving user password                                                        |
| `logic.createAdmin`    | `boolean`     | `true`        | No       | Create default admin account on database initialization                            |
| `logic.validateTables` | `boolean`     | `true`        | No       | Enables database tables validation                                                 |

 1) Are required if any of the following options are omitted:

    - `mysql.init.login`;
    - `mysql.init.password`;
    - `mysql.serve.login`;
    - `mysql.serve.password`.

 2) Are required if `mysql.login` and `mysql.password` are omitted.

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
