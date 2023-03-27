# API Schema

## Table of Contents

- [Table of Contents](#table-of-contents);
- [About](#about);
- [Authorization](#authoriztion);
- [Error Handling](#error-handling);
- [Methods](#methods);
  - [Is Anonymous Access Allowed](#is-anonymous-access-allowed);
  - [Get Max Nicknames](#get-max-nicknames);
  - [Get Max Toknes](#get-max-tokens);
  - [Authentication](#authoriztion);
  - [Reauthentication](#reauthenticate);
  - [Deauthentication](#deauthentication);
  - [Get All Users Info](#get-all-users-info);
  - [Get User Info](#get-user-info);
  - [Get User Login](#get-user-login);
  - [Check If User Is Administrator](#check-if-user-is-administrator);
  - [Check If User Is Online](#check-if-user-is-online);
  - [Get User Registration Info](#get-user-registration-info);
  - [Get User Registration Time](#get-user-registration-time);
  - [Get User Registrar](#get-user-registrar);
  - [Get User Name](#get-user-name);
  - [Get User Nicknames](#get-user-nicknames);
  - [Get Server Status](#get-server-status);
  - [Get Server Version](#get-server-version);
  - [Get Server Version Name](#get-server-version-name);
  - [Get Server Version Protocol](#get-server-version-protocol);
  - [Get Server Players](#get-server-players);
  - [Get Server Players Count](#get-server-players-count);
  - [Get Server Online Players](#get-server-online-players);
  - [Get Server Max Players](#get-server-max-players);
  - [Get Server Players Sample](#get-server-players-sample);
  - [Get Server MOTD](#get-server-motd);
  - [Get Server Raw MOTD](#get-server-raw-motd);
  - [Get Server Clean MOTD](#get-server-clean-motd);
  - [Get Server HTML MOTD](#get-server-html-motd);
  - [Get Server Favicon](#get-server-favicon);
  - [Delete All Users](#delete-all-users);
  - [Delete User](#delete-user);
  - [Delete All User Nickname](#delete-all-user-nicknames);
  - [Delete User Nickname](#delete-user-nickname);
  - [Update User Name](#update-user-name);
  - [Update User Password](#update-user-password);
  - [Update User Permissions](#update-user-permissions);
  - [Add User Canonical Name](#add-user-nickname);
  - [Add User](#add-user).

## About

This document contains detailed description on all supported API methods and their format.

## Authoriztion

Almost all API methods require `Authorization` header to be set but when `logic.allowAnonymousAccess`
configuration option is set to `true` all `GET`-methods (except [`/anonymous-access-allowed`](#is-anonymous-access-allowed))
doesn't require it anymore. When `Authorization` header is required for `GET`-methods it must contain
user's `access-token`.

## Error Handling

If server gets invalid request it sends `4xx` error to client. If something unexpected happends
on the server side it sends `5xx` error. Else, if user sends structurally valid but logically
invalid data (e.g. invalid login and password combination) server send's back a `200` code with
JSON body of the following structure:

```ts
{
    error:       string
    needRefresh: boolean
}
```

`needRefresh` field here indicates that the error reason is expired or unregistered access token
sent to server. After receiving a JSON with `needRefresh` set to `true` client should try to
reauthenticate using [`/reauth`](#reauthenticate) method.

Request is treated structurally invalid in the following cases:

- Missing required header;
- Required header's format is invalid;
- Missing required body;
- Required body format is invalid.

## Methods

Every API method URI shown here is relative to `http.apiPrefix` configuration option which defaults
to `/api`. Data interchange format is _JSON_. Server will respond with JSON on every structurally
valid request. Request and response JSON structure is described here as _TypeScript_ data type. The
following is a complete API method list.

<hr />

### __Is Anonymous Access Allowed__

Returns the value indicating whether anonymous access to `GET`-methods is allowed

__Request__:

```http
GET /anonym-access-allowed
```

```http
Accept: application/json
```

__Response__:

```ts
{
    allowed: boolean
}
```

<hr />

### __Get Max Nicknames__

Returns maximum allowed number of nicknames per user.

__Request__:

```http
GET /max-nicknames
```

```http
Accept: application/json
```

__Response__:

```ts
{
    max: number
}
```

<hr />

### __Get Max Tokens__

Returns maximum allowed number of tokens per user.

__Request__:

```http
GET /max-tokens
```

```http
Accept: application/json
```

__Response__:

```ts
{
    max: number
}
```

<hr />

### __Authentication__

Used for initial token pair reception.

__Request__:

```http
POST /auth
```

```http
Authorization: Basic <base64 encoded login>:<base64 encoded password>
Accept: application/json
```

__Response__:

```ts
{
    access: {
        id:  string // token hex string
        exp: string // In ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
    }

    refresh: {
        id:  string // token hex string
        exp: string // In ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
    }
}
```

<hr />

### __Reauthenticate__

Used for access token renewal.

__Request__:

```http
POST /auth
```

```http
Authorization: Bearer <refresh token>
Accept: application/json
```

__Response__:

```ts
{
    access: {
        id:  string // token hex string
        exp: string // In ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
    }

    refresh: {
        id:  string // token hex string
        exp: string // In ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
    }
}
```

<hr />

### __Deauthentication__

Used for access and refresh token pair deactivation.

__Request__:

```http
POST /deauth
```

```http
Authorization: Bearer <access token>
Accept: application/json
```

__Response__:

```ts
{}
```

<hr />

### __Get All Users Info__

Returns full information on all users.

__Request__:

```http
GET /users?[nicknames]
```

```http
Accept: application/json
```

__Response__:

```ts
{
    login:     string
    name:      string   | null
    nicknames: string[] | null // Added if <nicknames> option is set
    isAdmin:   boolean
    isOnline:  boolean

    reg: {
        time:  string          // In ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
        login: string | null
    }
}[]
```

<hr />

### __Get User Info__

Returns full information on specified user.

__Request__:

```http
GET /users/<user>?[nicknames]
```

```http
Accept: application/json
```

__Response__:

```ts
{
    login:     string
    name:      string   | null
    nicknames: string[] | null // Not null if <nicknames> option is set
    isAdmin:   boolean
    isOnline:  boolean

    reg: {
        time:  string          // In ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
        login: string | null
    }
}
```

<hr />

### __Get User Login__

Returns specified user login

__Request__:

```http
GET /users/<user>/login
```

```http
Accept: application/json
```

__Responese__:

```ts
{
    login: string
}
```

<hr />

### __Check If User Is Administrator__

Returns boolean value indicating weather is specified user administrator.

__Request__:

```http
GET /users/<user>/admin
```

```http
Accept: application/json
```

__Responese__:

```ts
{
    isAdmin: boolean
}
```

<hr />

### __Check If User Is Online__

Returns boolean value indicating weather is specified user online.

__Request__:

```http
GET /users/<user>/online
```

```http
Accept: application/json
```

__Responese__:

```ts
{
    isOnline: boolean
}
```

<hr />

### __Get User Registration Info__

Returns full registration information on specified user.

__Request__:

```http
GET /users/<user>/reg
```

```http
Accept: application/json
```

__Responese__:

```ts
{
    time:  string        // In ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
    login: string | null
}
```

<hr />

### __Get User Registration Time__

Returns user registration time.

__Request__:

```http
GET /users/<user>/reg/time
```

```http
Accept: application/json
```

__Responese__:

```ts
{
    time: string // In ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
}
```

<hr />

### __Get User Registrar__

Returns user registrar or null if user was registered by the system.

__Request__:

```http
GET /users/<user>/reg/user
```

```http
Accept: application/json
```

__Responese__:

```ts
{
    login: string | null
}
```

<hr />

### __Get User Name__

Returns name of specified user.

__Request__:

```http
GET /users/<user>/name
```

```http
Accept: application/json
```

__Response__:

```ts
{
    name: string
}
```

<hr />

### __Get User Nicknames__

Returns list of user nicknames.

__Request__:

```http
GET /users/<user>/nicknames/
```

```http
Accept: application/json
```

__Response__:

```ts
string[]
```

<hr />

### __Get Server Status__

Returns server's status.

__Request__:

```http
GET /server
```

```http
Accept: application/json
```

__Response__:

```ts
{
    version: {
        name:         string
        protocol:     number
    }

    players: {
        online:       number
        max:          number,
        sample: {
            nickname: string
            login:    string | null
        }[]
    }

    motd: {
        raw:          string
        clean:        string
        html:         string
    }

    favicon:          string | null // "data:image/png;base64,..."
}
```

<hr />

### __Get Server Version__

Returns server's version.

__Request__:

```http
GET /server/version
```

```http
Accept: application/json
```

__Response__:

```ts
{
    name:     string
    protocol: number
}
```

<hr />

### __Get Server Version Name__

Returns server's version name.

__Request__:

```http
GET /server/version/name
```

```http
Accept: application/json
```

__Response__:

```ts
{
    name: string
}
```

<hr />

### __Get Server Version Protocol__

Returns server's version protocol.

__Request__:

```http
GET /server/version/protocol
```

```http
Accept: application/json
```

__Response__:

```ts
{
    protocol: number
}
```

<hr />

### __Get Server Players__

Returns server's players.

__Request__:

```http
GET /server/players
```

```http
Accept: application/json
```

__Response__:

```ts
{
    online:       number
    max:          number,
    sample: {
        nickname: string
        login:    string | null
    }[]
}
```

<hr />

### __Get Server Players Count__

Returns server's online and offline players count.

__Request__:

```http
GET /server/players/count
```

```http
Accept: application/json
```

__Response__:

```ts
{
    online: number
    max:    number
}
```

<hr />

### __Get Server Online Players__

Returns server's online players count.

__Request__:

```http
GET /server/players/online
```

```http
Accept: application/json
```

__Response__:

```ts
{
    online: number
}
```

<hr />

### __Get Server Max Players__

Returns server's maximum number of players.

__Request__:

```http
GET /server/players/max
```

```http
Accept: application/json
```

__Response__:

```ts
{
    max: number,
}
```

<hr />

### __Get Server Players Sample__

Returns server's players sample.

__Request__:

```http
GET /server/players/sample
```

```http
Accept: application/json
```

__Response__:

```ts
{
    nickname: string
    login:    string | null
}[]
```

<hr />

### __Get Server MOTD__

Returns server's Message Of The Day (MOTD).

__Request__:

```http
GET /server/motd
```

```http
Accept: application/json
```

__Response__:

```ts
{
    raw:   string
    clean: string
    html:  string
}
```

<hr />

### __Get Server Raw MOTD__

Returns server's raw Message Of The Day (MOTD).

__Request__:

```http
GET /server/motd/raw
```

```http
Accept: application/json
```

__Response__:

```ts
{
    raw: string
}
```

<hr />

### __Get Server Clean MOTD__

Returns server's clean Message Of The Day (MOTD).

__Request__:

```http
GET /server/motd/clean
```

```http
Accept: application/json
```

__Response__:

```ts
{
    clean: string
}
```

<hr />

### __Get Server HTML MOTD__

Returns server's HTML Message Of The Day (MOTD).

__Request__:

```http
GET /server/motd/html
```

```http
Accept: application/json
```

__Response__:

```ts
{
    html: string
}
```

<hr />

### __Get Server Favicon__

Returns server's favicon.

__Request__:

```http
GET /server/favicon
```

```http
Accept: application/json
```

__Response__:

```ts
{
    favicon: string | null // "data:image/png;base64,..."
}
```

<hr />

### __Delete All Users__

Deletes all users! This method is for administators only.

__Request__:

```http
DELETE /users
```

```http
Authorization: Bearer <access token>
Accept: application/json
```

__Response__:

```ts
{
    count: number
}
```

<hr />

### __Delete User__

Deletes specified user. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
DELETE /users/<user>
```

```http
Authorization: Bearer <access token>
Accept: application/json
```

<hr />

### __Delete All User nicknames__

Deletes all nicknames of specified user. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
DELETE /users/<user>/nicknames
```

```http
Authorization: Bearer <access token>
Accept: application/json
```

__Response__:

```ts
{
    count: number
}
```

<hr />

### __Delete User Nickname__

Deletes specified nickname of given user. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
DELETE /users/<user>/nicknames/<nickname>
```

```http
Authorization: Bearer <access token>
Accept: application/json
```

__Response__:

```ts
{}
```

<hr />

### __Update User Name__

Updates specified user name. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
PUT /users/<user>/name
```

```http
Authorization: Bearer <access token>
Content-Type: application/json
Accept: application/json
```

```ts
{
    name: string | null
}
```

__Response__:

```ts
{}
```

<hr />

### __Update User Password__

Updates specified user password. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
PUT /users/<user>/password
```

```http
Authorization: Bearer <access token>
Content-Type: application/json
Accept: application/json
```

```ts
{
    password: string
}
```

__Response__:

```ts
{}
```

<hr />

### __Update User Permissions__

Changes whether is specified user is administrator or not. This method is for administators only.

__Request__:

```http
PUT /users/<user>/admin
```

```http
Authorization: Bearer <access token>
Content-Type: application/json
Accept: application/json
```

```ts
{
    isAdmin: boolean
}
```

__Response__:

```ts
{}
```

<hr />

### __Add User Nickname__

Adds nickname to the user. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
POST /users/<user>/nicknames/<nickname>
```

```http
Authorization: Bearer <access token>
Accept: application/json
```

__Response__:

```ts
{}
```

<hr />

### __Add User__

Adds new user. This method is for administators only.

__Request__:

```http
POST /users/<user>
```

```http
Authorization: Bearer <access token>
Content-Type: application/json
Accept: application/json
```

```ts
{
    password: string
    name?:    string
    isAdmin?: boolean
}
```

__Response__:

```ts
{}
```
