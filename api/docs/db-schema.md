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

Fields:

- id: BIGINT AUTO_INCREMENT PRIMARY KEY;
- login: VARCHAR(255) NOT NULL;
- name: VARCHAR(255);
- password_hash: BINARY(64) NOT NULL;
- is_admin: BOOLEAN NOT NULL DEFAULT FALSE.

### CNames

Holds all users' _canonical names_.

_Canonical name_ - user's in-game nickname. One user can have multiple of them.

Fields:

- user_id: BIGINT PRIMARY KEY;
- cname: VARCHAR(255) NOT NULL.

Constraints:

- FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCASE.

### Tokens

Holds all users' access and refresh tokens with expiration date and time.

`id` = CONCAT(RANDOM_BYTES(60), UNHEX(HEX(UNIX_TIMESTAMP()))).

Fields:

- id: BINARY(64) PRIMARY KEY;
- user_id: BIGINT NOT NULL;
- exp: TIMESTAMP NOT NULL;
- type: ENUM("access", "refresh") NOT NULL.

Constraints:

- FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCASE.

## Events

The following is a complete list of all events with their detailed description.

### Clean Up

Dayly cleans up all expired events.

Definition:

CREATE EVENT clean_up
ON SCHEDULE EVERY 1 DAY
DO
    DELETE FROM tokens WHERE exp >= now();
