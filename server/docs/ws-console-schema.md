# WebSocket Console Schema

## Table of Contents

- [Table of Contents](#table-of-contents);
- [About](#about).

## About

This document contains detailed description of WebSocket-based protocol used to proxy RCON.

## Protocol

When user connects to the WebSocket server (by default at path `/ws/console`) he/she needs
to authorized because only users with administrator access rights can get access to the console.
Authorization is pretty straightforward: user sends his/her access token id and if it's a right
administrator access token then server sends back an `ok` string. After this "handshake" client
can send commands to server and server will send back a result if any. All communications are just a plain text.
