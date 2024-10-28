package ru.fominmv.poms.server.config

import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class WebConfig(private val environment: Environment) : WebMvcConfigurer {
    override fun addCorsMappings(registry: CorsRegistry) {
        if (environment.matchesProfiles(ApplicationProfile.DEVELOPMENT_DISPLAY_NAME))
            registry
                .addMapping("/**")
                .allowedOriginPatterns("*")
                .allowCredentials(true)
    }
}
