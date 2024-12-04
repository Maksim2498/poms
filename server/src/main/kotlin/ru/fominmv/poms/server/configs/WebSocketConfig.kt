package ru.fominmv.poms.server.configs

import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.*

import ru.fominmv.poms.server.api.ws.PathAwareWebSocketHandler

@Configuration
@EnableWebSocket
class WebSocketConfig(val handlers: List<PathAwareWebSocketHandler>) : WebSocketConfigurer {
    override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
        for (handler in handlers)
            registry
                .addHandler(handler, handler.path)
                .setAllowedOrigins("*")
    }
}
