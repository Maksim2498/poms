# POMS Bukkit Plugin (__WIP__)

![Logo](./images/logo.png)

## Table of Contents

- [Table of Contents](#table-of-contents);
- [About](#about);
- [Building](#building);
- [Installation](#installation);
- [Documentation](#documentation).

## About

This is a Bukkit plugin for the [POMS project](../README.md). It connects your Minecraft server
to the [POMS server](../server/README.md) and sets first under second's control. It relies on
the REST API of POMS server and completely uselsess without it.

## Building

__Windows__:

Double click on `build.bat` file or run the following command in your terminal:

```sh
build.bat
```

__Unix-Like__:

Run the following command in your terminal:

```sh
./build.sh
```

__Other__:

This method is universal. Run the following command in your terminal:

```sh
mvn verify
```

Result `.jar` file will be created in the `target` folder.

## Installation

First, [build plugin](#building). Next, move built `.jar` file from `target` folder to `plugins` folder in
your server's root folder.

## Documentation

Comming soon...
