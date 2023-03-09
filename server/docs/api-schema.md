# API Schema

<img src="../images/api-logo.png" width="600" height="600" />

## Table of Contents

- [Table of Contents](#table-of-contents);
- [About](#about);
- [Error Handling](#error-handling);
- [Methods](#methods);
  - [Authentication](#authentication);
  - [Deauthentication](#deauthentication);
  - [Get All Users Info](#get-all-users-info);
  - [Get User Info](#get-user-info);
  - [Check If User Is Administrator](#check-if-user-is-administrator);
  - [Check If User Is Online](#check-if-user-is-online);
  - [Get User Registration Info](#get-user-registration-info);
  - [Get User Registration Time](#get-user-registration-time);
  - [Get User Registrar](#get-user-registrar);
  - [Get User Name](#get-user-name);
  - [Get User Nicknames](#get-user-nicknames);
  - [Get Server Status](#get-server-status);
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

## Error Handling

If server gets invalid request it sends `4xx` error to client. If something unexpected happends
on the server side it sends `5xx` error. Else, if user send's structurally valid but logically
invalid data (e.g. invalid login and password combination) server send's back a `200` code with
JSON body of following the structure:

```ts
{
    error:       string
    needRefresh: boolean
}
```

`needRefresh` field here indicates that error reason is expired or unregistered access token
sent to server. After receiving a JSON with `needRefresh` set to `true` client should try to
reauthenticate using [`/reauth`](#reauthenticate) method.

Request is treated structurally invalid in the following cases:

- Missing required header;
- Required header's format is invalid;
- Missing required body;
- Required body format is invalid.

## Methods

Every API method URI shown here is relative to
`http.apiPrefix` configuration option which defaults to `/api`. Data interchange format is _JSON_.
Server will respond with JSON on every structurally valid request. Request and response JSON structure
is described here as _TypeScript_ data type. The following is a complete API method list.

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
Authorization: Bearer <access token>
Accept: application/json
```

__Response__:

```ts
{
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
Authorization: Bearer <access token>
Accept: application/json
```

__Response__:

```ts
{
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

### __Check If User Is Administrator__

Returns boolean value indicating weather is specified user administrator.

__Request__:

```http
GET /users/<user>/is-admin
```

```http
Authorization: Bearer <access token>
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
GET /users/<user>/is-online
```

```http
Authorization: Bearer <access token>
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
Authorization: Bearer <access token>
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
Authorization: Bearer <access token>
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
Authorization: Bearer <access token>
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
Authorization: Bearer <access token>
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
Authorization: Bearer <access token>
Accept: application/json
```

__Response__:

```ts
string[]
```

<hr />

### __Get Server Status__

Returns current server status.

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
            id:       string
            nickname: string
            login:    string
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
{}
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
{}
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
PUT /users/<user>/is-admin
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
