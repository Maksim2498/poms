# POMS - Personal Offline Minecraft Server

![Logo](/images/logo.png)

## Index

- [Index](#index);
- [About](#about);
- [Prerequisites](#prerequisites);
- [Installation](#installation);
- [Running](#running);
- [Documentation](#documentation).

## About

This is all-in-one solution for creation and administration of private offline-mode Minecraft server.
It consists of Bukkit plugin for Minecraft server, back-end server with REST API and front-end Web-based interface.

You can get detailed information on project components in the following files:

- [Server](/server/README.md);
- [Site](/site/README.md);
- [Bukkit Plugin](/plugin/README.md).

## Prerequisites

To run and install server and site you need the following software installed on your machine:

- [Node.js](https://nodejs.org/);
- [MySQL](https://www.mysql.com/).

Install all of them if you don't have them already installed.

For building Bukkit plugin you'll also need _JDK 17+_ and [Maven build system](https://maven.apache.org).
You can also just download prebuilt plugin from [releases](https://github.com/Maksim2498/poms/releases)
section on [project's home page](https://github.com/Maksim2498/poms).

## Installation

To install everything follow the steps listed below depending on your operating system.

__Windows__:

Simply double click on `install.bat` batch file or run the following command in your terminal:

```sh
install.bat
```

__Unix-Like__:

Run the following command in your terminal:

```sh
./install.sh
```

__Other__:

This method is universal and isn't dependent on your operating system.

Run the following command in your terminal:

```sh
node install.js
```

## Running

To run POMS follow the steps listed below depending on your operating system.

__Windows__:

Simply double click on `run.bat` file or run the following command in your terminal:

```sh
run.bat
```

__Unix-Like__:

Run the following command in your terminal:

```sh
./run.sh
```

__Other__:

This method is universal and isn't dependent on your operating system.

Run the following commands in your terminal:

```sh
cd server; node start
```

## Documentation

__API__:

- [Configuration](/server/docs/config.md);
- [Database Schema](/server/docs/db-schema.md);
- [API Schema](/server/docs/api-schema.md).

__Site__:

Comming soon...

__Bukkit Plugin__:

Comming soon...
