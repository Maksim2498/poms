# POMS - Personal Offline-mode Minecraft Server administration system

## Table of Contents

- [About](#about);
- [Features](#features);
- [How to Use](#how-to-use);
- [Documentation](#documentation);
- [Roadmap](#roadmap);
- [Architecture](#architecture);
- [Project Structure](#project-structure);
- [Gallery](#gallery).

## About

Ever wanted to host a *Minecraft* server to play with friends, but some of them (for some reason 😉)
cannot join the server with `online-mode` set to `true`, and you don't want to set up *VPN* or
something like this to play safe don't being aware of world-crapping bots walking all over the
internet which will find your server and destroy everything you've built there with your friends no
matter using you *non-standard ports*, *whitelists* or some other standard mechanisms Minecraft
offers beyond `online-mode: true` or not. If you rely only on this standard mechanisms Minecraft
provides - believe me, bots will find and destroy your server one day, sooner or later (in case you
are using non-standard ports). But don't be afraid! I'm here to help you. The *POMS* is the solution
of your (and all of us) problem.

**POMS** (**P**ersonal **O**ffline-**Mo**de Minecraft **S**erver administration system) was
initially created to provide easy-to-use way to add authentication and authorization mechanisms to
any *Bukkit*-based Minecraft server with `online-mode` set to `false` in its configuration file.
Beyond that POMS adds many more quality-of-life [features](#features) about which you can read
further. One of these features is **Site** which allows for players and servers management without
event launching Minecraft and joining the Server and learning all the **Plugin**'s commands.

## Features

***WIP***

## How to Use

***WIP***

## Documentation

***WIP***

## Roadmap

***WIP***

## Architecture

![Architecture](./docs/architecture.svg)

The architecture is pretty simple. **Server** communicates with user's browser using **HTTP** and
**WebSockets** protocols. With **Plugin** it communicates using **WebSockets** protocol solely.
It also uses **Elastic Search** as search engine.

Details on the communication protocols used can be found in the
[Documentation section](#documentation).

## Project Structure

The project consists of the several subprojects which names are mostly self-explanatory:

- [server](./server);
- [plugin](./plugin);
- [site](./site);
- [libs](./libs):
  - [commons](./libs/commons);
  - [mc](./libs/mc):
    - [commands](./libs/mc/commands);
    - [commons](./libs/mc/commons);
    - [nbt](./libs/mc/nbt);
    - [protocol](./libs/mc/protocol);
    - [status](./libs/mc/status).

Other directories not mentioned above contain either documentation and images, either some
build-related data.

## Gallery

***WIP***
