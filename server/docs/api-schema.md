# API Schema

## Index

- [Index](#index);
- [About](#about);
- [Methods](#methods);
  - [Authentication](#authentication);
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

The following is a complete API method list.

### Authentication

Used for initial token reception and for it's refreshing.

__Request__:

For initial token reception:

```http
POST /auth

Authorization: Bacic <base64 encoded login>:<base64 encoded password>
```

For token refreshing:

```http
POST /auth

Authorization: Bearer <refresh token>
```

__Response__:

```ts
{
    access: {
        token: string // token hex string
        exp:   number // number of seconds before token expiration
    }

    refresh: {
        token: string // token hex string
        exp:   number // number of seconds before token expiration
    }
}
```

### Get All Users Info

Returns full information on all users.

__Request__:

```http
GET /users?[nicknames]

Authorization: Bearer <access token>
```

__Response__:

```ts
{
    name:      string
    nicknames: string[] // if <nicknames> option is set

    reg: {
        time:  string
        login: string | null
    }
}[]
```

### Get User Info

Returns full information on specified user.

__Request__:

```http
GET /users/<login>?[nicknames]

Authorization: Bearer <access token>
```

__Response__:

```ts
{
    name:      string
    nicknames: string[] // if <nicknames> option is set

    reg: {
        time:  string
        login: string | null
    }
}
```

### Get User Registration Info

Returns full registration information on specified user.

__Request__:

```http
GET /users/<login>/reg

Authorization: Bearer <access token>
```

__Responese__:

```ts
{
    time:  string
    login: string | null
}
```

### Get User Registration Time

Returns user registration time.

__Request__:

```http
GET /users/<login>/reg/time

Authorization: Bearer <access token>
```

__Responese__:

```ts
{
    time: string
}
```

### Get User Registrar

Returns user registrar or null if user was registered by the system.

__Request__:

```http
GET /users/<login>/reg/user

Authorization: Bearer <access token>
```

__Responese__:

```ts
{
    login: string | null
}
```

### Get User Name

Returns name of specified user.

__Request__:

```http
GET /users/<login>/name

Authorization: Bearer <access token>
```

__Response__:

```ts
{
    name: string
}
```

### Get User Nicknames

Returns list of user nicknames.

__Request__:

```http
GET /users/<login>/nicknames/

Authorization: Bearer <access token>
```

__Response__:

```ts
string[]
```

### Delete All Users

Deletes all users! This method is for administators only.

__Request__:

```http
DELETE /users

Authorization: Bearer <access token>
```

### Delete User

Deletes specified user. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
DELETE /users/<user>

Authorization: Bearer <access token>
```

### Delete All User nicknames

Deletes all nicknames of specified user. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
DELETE /users/<user>/nicknames

Authorization: Bearer <access token>
```

### Delete User Nickname

Deletes specified nickname of given user. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
DELETE /users/<user>/nicknames/<nickname>

Authorization: Bearer <access token>
```

### Update User Name

Updates specified user name. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
PUT /users/<user>/name

Authorization: Bearer <access token>
```

### Update User Password

Updates specified user password. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
PUT /users/<user>/password

Authorization: Bearer <access token>
```

### Add User Nickname

Adds nickname to the user. If issued with administator's access token
`user` - can be any user's login else can be only token owener's login.

__Request__:

```http
POST /users/<user>/cnames/<nickname>

Authorization: Bearer <access token>
```

### Add User

Adds new user. This method is for administators only.

__Request__:

```http
POST /users/<user>

Authorization: Bearer <access token>
```
