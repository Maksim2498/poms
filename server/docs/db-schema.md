# Database Schema

## Table of Contents

- [Table of Contents](#table-of-contents);
- [About](#about);
- [Tables](#tables);
  - [Users](#users);
  - [Nicknames](#nicknames);
  - [Tokens](#tokens);
- [Events](#events);
  - [Clean Up](#clean-up).

## About

This document contains detailed description of the used database schema.

## Tables

The following is a complete list of all tables with their detailed description.

### Users

Holds all users with their basic information.

Password hash for all users is evaluated as follows:

```sql
password_hash = UNHEX(SHA2(LOWER(login) + ":" + password, 512))
```

__Definition__:

```sql
CREATE TABLE Users (
    id            BIGINT                                   NOT NULL AUTO_INCREMENT PRIMARY KEY,
    login         VARCHAR(255)                             NOT NULL UNIQUE,
    name          VARCHAR(255),
    icon          MEDIUMBLOB,
    cr_id         BIGINT,
    cr_time       TIMESTAMP                                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    mod_time      TIMESTAMP                                NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    password_hash BINARY(64)                               NOT NULL,
    role          ENUM('user','moderator','admin','owner') NOT NULL DEFAULT 'user',
    is_online     BOOLEAN                                  NOT NULL DEFAULT FALSE,

    FOREIGN KEY (cr_id) REFERENCES Users (id) ON DELETE SET NULL
)
```

### Nicknames

Holds all users' nicknames.

__Definition__:

```sql
CREATE TABLE Nicknames (
    user_id  BIGINT       NOT NULL,
    nickname VARCHAR(255) NOT NULL UNIQUE,

    PRIMARY KEY (user_id, nickname),
    FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
)
```

### Tokens

Holds all tokens for both users and server (those with `user_id` set to `NULL`).

__Definition__:

```sql
CREATE TABLE Tokens (
    access_id        BINARY(64) NOT NULL UNIQUE DEFAULT (RANDOM_BYTES(64)),
    refresh_id       BINARY(64) NOT NULL UNIQUE DEFAULT (RANDOM_BYTES(64)),
    user_id          BIGINT,
    cr_time          TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    access_exp_time  TIMESTAMP  NOT NULL,
    refresh_exp_time TIMESTAMP  NOT NULL,

    FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
)
```

## Events

The following is a complete list of all events with their detailed description.

### Clean Up

Dayly cleans up all expired tokens.

__Definition__:

```sql
CREATE EVENT CleanUp
ON SCHEDULE EVERY 1 DAY
DO
    DELETE FROM Tokens WHERE refresh_exp_time <= now()
```
