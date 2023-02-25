# API Schema

## Table of Contents

- [Table of Contents](#table-of-contents);
- [About](#about);
- [Methods](#methods);
  - [Authentication](#authentication);
  - [Deauthentication](#deauthentication);
  - [Get All Users Info](#get-all-users-info);
  - [Get User Info](#get-user-info);
  - [Get User Registration Info](#get-user-registration-info);
  - [Get User Registration Time](#get-user-registration-time);
  - [Get User Registrar](#get-user-registrar);
  - [Get User Name](#get-user-name);
  - [Get User Nicknames](#get-user-nicknames);
  - [Delete All Users](#delete-all-users);
  - [Delete User](#delete-user);
  - [Delete All User Nickname](#delete-all-user-nicknames);
  - [Delete User Nickname](#delete-user-nickname);
  - [Update User Name](#update-user-name);
  - [Update User Password](#update-user-password);
  - [Add User Canonical Name](#add-user-nickname);
  - [Add User](#add-user).

## About

This document contains detailed description on all supported API methods and their format.

## Methods

The following is a complete API method list. Every API method URI shown here is relative to
`http.apiPrefix` configuration option which defaults to `/api`. Data interchange format is _JSON_.
Server will respond with JSON on every valid request. Request and response JSON structure is
described here as _TypeScript_ data type.

### Authentication

Used for initial token reception and for it's refreshing.

__Request__:

For initial token reception:

```http
POST /auth
```

```http
Authorization: Basic <base64 encoded login>:<base64 encoded password>
Accept: application/json
```

For token refreshing:

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
        token: string // token hex string
        exp:   string // In ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
    }

    refresh: {
        token: string // token hex string
        exp:   string // In ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
    }
}
```

### Deauthentication

Used for token deactivation.

__Request__:

```http
POST /deauth
```

```http
Authorization: Bearer <access or refresh token>
Accept: application/json
```

__Response__:

```ts
{}
```

### Get All Users Info

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
    name:      string   // base64-encoded
    nicknames: string[] // base64-encoded. Added if <nicknames> option is set

    reg: {
        time:  string        // In ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
        login: string | null // base64-encoded
    }
}[]
```

### Get User Info

Returns full information on specified user.

__Request__:

```http
GET /users/<login>?[nicknames]
```

```http
Authorization: Bearer <access token>
Accept: application/json
```

__Response__:

```ts
{
    name:      string   // base64-encoded
    nicknames: string[] // base64-encoded. Added if <nicknames> option is set

    reg: {
        time:  string        // In ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
        login: string | null // base64-encoded
    }
}
```

### Get User Registration Info

Returns full registration information on specified user.

__Request__:

```http
GET /users/<login>/reg
```

```http
Authorization: Bearer <access token>
Accept: application/json
```

__Responese__:

```ts
{
    time:  string        // In ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
    login: string | null // base64-encoded
}
```

### Get User Registration Time

Returns user registration time.

__Request__:

```http
GET /users/<login>/reg/time
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

### Get User Registrar

Returns user registrar or null if user was registered by the system.

__Request__:

```http
GET /users/<login>/reg/user
```

```http
Authorization: Bearer <access token>
Accept: application/json
```

__Responese__:

```ts
{
    login: string | null // base64-encoded
}
```

### Get User Name

Returns name of specified user.

__Request__:

```http
GET /users/<login>/name
```

```http
Authorization: Bearer <access token>
Accept: application/json
```

__Response__:

```ts
{
    name: string // base64-encoded
}
```

### Get User Nicknames

Returns list of user nicknames.

__Request__:

```http
GET /users/<login>/nicknames/
```

```http
Authorization: Bearer <access token>
Accept: application/json
```

__Response__:

```ts
string[] // base64-encoded
```

### Delete All Users

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

### Delete User

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

### Delete All User nicknames

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

### Delete User Nickname

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

### Update User Name

Updates specified user name. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
PUT /users/<user>/name
```

```http
Authorization: Bearer <access token>
Content-Type: application/json
Content-Length: ...
Accept: application/json
```

```ts
{
    name: string // base64-encoded
}
```

__Response__:

```ts
{}
```

### Update User Password

Updates specified user password. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
PUT /users/<user>/password
```

```http
Authorization: Bearer <access token>
Content-Type: application/json
Content-Length: ...
Accept: application/json
```

```ts
{
    password: string // base64-encoded
}
```

__Response__:

```ts
{}
```

### Add User Nickname

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

### Add User

Adds new user. This method is for administators only.

__Request__:

```http
POST /users/<user>
```

```http
Authorization: Bearer <access token>
Content-Type: application/json
Content-Length: ...
Accept: application/json
```

```ts
{
    password: string   // base64-encoded
    name?:    string   // base64-encoded
    isAdmin?: boolean
}
```

__Response__:

```ts
{}
```
