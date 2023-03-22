# Database Schema

## Table of Contents

- [Table of Contents](#table-of-contents);
- [About](#about);
- [Tables](#tables);
  - [Users](#users);
  - [Nicknames](#nicknames);
  - [ATokens](#atokens);
  - [RTokens](#rtokens);
- [Events](#events);
  - [Clean Up](#clean-up).

## About

This document contains detailed description of used database schema.

## Tables

The following is a complete list of all tables with their detailed description.

### Users

Holds all users with their login, name, password hash, and admin flag.

```sql
password_hash = UNHEX(SHA2(LOWER(login) + ":" + password, 512))
```

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
    is_online     BOOLEAN      NOT NULL DEFAULT FALSE,

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

### ATokens

Holds all users' access tokens with their creation and expiration date and time.

```sql
id = CONCAT(RANDOM_BYTES(60), UNHEX(HEX(UNIX_TIMESTAMP())))
```

__Definition__:

```sql
CREATE TABLE ATokens (
    id       BINARY(64) NOT NULL PRIMARY KEY,
    user_id  BIGINT     NOT NULL,
    cr_time  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exp_time TIMESTAMP  NOT NULL,

    FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
)
```

### RTokens

Holds all users' refresh tokens with their creation and expiration date and time.

```sql
id = CONCAT(RANDOM_BYTES(60), UNHEX(HEX(UNIX_TIMESTAMP())))
```

__Definition__:

```sql
CREATE TABLE RTokens (
    id        BINARY(64) NOT NULL PRIMARY KEY,
    atoken_id BINARY(64) NOT NULL,
    cr_time   TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exp_time  TIMESTAMP  NOT NULL,

    FOREIGN KEY (atoken_id) REFERENCES ATokens (id) ON DELETE CASCADE
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
    DELETE FROM ATokens WHERE id in (
        SELECT atoken_id FROM RTokens WHERE exp_time >= now()
    )
```
