# API Schema

## Index

- [Index](#index);
- [About](#about);
- [Format](#format);
- [Methods](#methods);
  - [Authenticate](#authenticate);
  - [Get All Users Info](#get-all-users-info);
  - [Get User Info](#get-user-info);
  - [Get User Registration Info](#get-user-registration-info);
  - [Get User Registration Time](#get-user-registration-time);
  - [Get User Registrar](#get-user-registrar);
  - [Get User Name](#get-user-name);
  - [Get User Canonical Names](#get-user-canonical-names);
  - [Delete All Users](#delete-all-users);
  - [Delete User](#delete-user);
  - [Delete All User Canonical Names](#delete-all-user-canonical-names);
  - [Delete User Canonical Name](#delete-user-canonical-name);
  - [Update User Name](#update-user-name);
  - [Update User Password](#update-user-password);
  - [Add User Canonical Name](#add-user-canonical-name);
  - [Add User](#add-user).

## About

This document contains detailed description on all supported API methods and their format.

## Format

## Methods

The following is a complete API method list.

### Authenticate

Used for initial token reception and for it's refreshing.

__Request__:

```http
POST /auth
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
GET /users
```

__Response__:

```ts
{
    name:   string
    cnames: string[]

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
GET /users/`login`
```

__Response__:

```ts
{
    name:   string
    cnames: string[]

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
GET /users/`login`/reg
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
GET /users/`login`/reg/time
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
GET /users/`login`/reg/user
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
GET /users/`login`/name
```

__Response__:

```ts
{
    name: string
}
```

### Get User Canonical Names

Returns list of user canonical names.

__Request__:

```http
GET /users/`login`/cnames/
```

__Response__:

```ts
string[]
```

### Delete All Users

Deletes all users!

__Request__:

```http
DELETE /users
```

__Response__:

```ts

```

### Delete User

Deletes specified user.

__Request__:

```http
DELETE /users/`user`
```

__Response__:

```ts

```

### Delete All User Canonical Names

Deletes all canonical names of specified user.

__Request__:

```http
DELETE /users/`user`/cnames
```

__Response__:

```ts

```

### Delete User Canonical Name

Deletes specified canonical name of given user.

__Request__:

```http
DELETE /users/`user`/cnames/`cname`
```

__Response__:

```ts

```

### Update User Name

Updates specified user name.

__Request__:

```http
PUT /users/`user`/name
```

__Response__:

```ts

```

### Update User Password

Updates specified user password.

__Request__:

```http
PUT /users/`user`/password
```

__Response__:

```ts

```

### Add User Canonical Name

Adds canonical name to the user.

__Request__:

```http
POST /users/`user`/cnames/`cname`
```

__Response__:

```ts

```

### Add User

Adds new user.

__Request__:

```http
POST /users/`user`
```

__Response__:

```ts

```