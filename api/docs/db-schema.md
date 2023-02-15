# Database Schema

## Index

- [Index](#index);
- [About](#about);
- [Tables](#tables);
  - [Users](#users);
  - [CNames](#cnames);
  - [Tokens](#tokens);
- [Events](#events);
  - [Clean Up](#clean-up).

## About

This document contains detailed description of used database schema.

## Tables

The following is a complete list of all tables with their detailed description.

### Users

Holds all users with their login, name, password hash, and admin flag.

`password_hash` = UNHEX(SHA2(`login` + ":" + `password`, 512)).

__Definition__:

```sql
CREATE TABLE Users (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    login         VARCHAR(255) NOT NULL UNIQUE,
    name          VARCHAR(255),
    cr_id         BIGINT,
    cr_time       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    password_hash BINARY(64)   NOT NULL,
    is_admin      BOOLEAN      NOT NULL DEFAULT FALSE,

    FOREIGN KEY (cr_id) REFERENCES Users (id) ON DELETE SET NULL
)
```

### CNames

Holds all users' _canonical names_.

_Canonical name_ - user's in-game nickname. One user can have multiple of them.

__Definition__:

```sql
CREATE TABLE CNames (
    user_id BIGINT       NOT NULL,
    cname   VARCHAR(255) NOT NULL UNIQUE,

    PRIMARY KEY (user_id, cname),
    FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE

)
```

### Tokens

Holds all users' access and refresh tokens with expiration date and time.

`id` = CONCAT(RANDOM_BYTES(60), UNHEX(HEX(UNIX_TIMESTAMP()))).

__Definition__:

```sql
CREATE TABLE Tokens (
    id      BINARY(64)                NOT NULL PRIMARY KEY,
    user_id BIGINT                    NOT NULL,
    cr_time TIMESTAMP                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exp     TIMESTAMP                 NOT NULL,
    type    ENUM("access", "refresh") NOT NULL,

    FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
)
```

## Events

The following is a complete list of all events with their detailed description.

### Clean Up

Dayly cleans up all expired events.

__Definition__:

```sql
CREATE EVENT CleanUp
ON SCHEDULE EVERY 1 DAY
DO
    DELETE FROM tokens WHERE exp >= now()
```
