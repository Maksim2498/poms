package ru.fominmv.poms.server.api.ws

import org.springframework.web.socket.WebSocketHandler

import ru.fominmv.poms.server.api.PathAware

interface PathAwareWebSocketHandler :
    WebSocketHandler,
    PathAware
