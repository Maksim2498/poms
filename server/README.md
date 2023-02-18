# Server

\<There will be an image>

## Index

- [Index](#index);
- [About](#about);
- [Requirements](#requirements);
- [Setup](#setup);
- [Running](#running);
- [Documentation](#documentation).

## About

This is a server with REST API for [POMS](../README.md). It can work whether as stand-alone
application or as back-end behind some front-end Web-server like [nginx](https://nginx.org/).
This API is an essential part of POMS project, site and plugin are both completely built upon it.

## Requirements

To run this application you need the following software:

- [Node.js](https://nodejs.org/);
- [npm](https://www.npmjs.com/);
- [MySQL](https://www.mysql.com/).

Install all of them if you don't have them already installed on your machine.

## Setup

Firstly, simply install all required packages running the following command
in your terminal:

```sh
npm i
```

If nothing went wrong you now have all required packages installed and you can
proceed to the second setup step - configuration. All configuration is done
through `config.json` file in the subproject root directory (the directory where
this README.md is situated). Create this file and provide minumum set of options:
MySQL user login and password. Here is an example:

```json
{
    "mysql": {
        "login":    "your MySQL user login",
        "password": "your MySQL user password"
    }
}
```

After finishing all the steps described above you have application setup and ready for work.

## Running

After [setup](#setup) simply run the following command in your terminal:

```sh
npm run server
```

Or the following to make Node.js working in the production environment:

```sh
npm run server:prod
```

## Documentation

All project documentation can be found in `/docs` folder. It contains documentation
on such topics as:

- [API Schema](./docs/api-schema.md);
- [Configuration](./docs/config.md);
- [Database Schema](./docs/db-schema.md).
