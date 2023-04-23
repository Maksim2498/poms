# Nginx

## Table of Contents

- [Table of Contents](#table-of-contents);
- [About](#about);
- [POMS Configuration](#poms-configuration);
- [Nginx Configuration](#nginx-configuration).

## About

This document contains detailed description of [_Nginx_](https://nginx.org/) configuration
and _POMS_ configuration for making first working as a reverse proxy for second.

## POMS Configuration

The only option need to be set in `poms-config.json` file is `http.proxied`. It should be
set to `true` (`false` by default). This will make POMS to recognise `X-Forwarded-*` headers
(it uses mechanism built in [_Express.js_](https://expressjs.com/)).

You can also use UNIX sockets for proxying. For this you must set `http.socketPath` configuration
option to the desired path in your file system.

## Nginx Configuration

On the Nginx's side configuration may look something like this for `HTTP`:

```nginx
server {
    listen 80;

    server_name ...;

    set $pass http://unix:/tmp/poms.socket; # If using UNIX sockets
    set $pass http://localhost:8000;        # If using TCP (port can be changed via configuration)

    location / {
        proxy_pass       $pass;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /ws/console {
        proxy_pass       $pass;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

}
```

Or something like this for HTTPS:

```nginx
server {
    listen 443 ssl;

    ssl_certificate     /path/to/your/certificate.cert;
    ssl_certificate_key /path/to/your/key.key;

    server_name ...;

    set $pass http://unix:/tmp/poms.socket; # If using UNIX sockets
    set $pass http://localhost:8000;        # If using TCP (port can be changed via configuration)

    location / {
        proxy_pass       $pass;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /ws/console {
        proxy_pass       $pass;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

}
```
