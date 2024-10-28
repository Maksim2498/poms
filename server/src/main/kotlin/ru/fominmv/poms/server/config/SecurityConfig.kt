package ru.fominmv.poms.server.config

import org.springframework.context.annotation.*
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer

@Configuration
@EnableMethodSecurity
class SecurityConfig {
    @Bean
    @Profile(ApplicationProfile.DEVELOPMENT_DISPLAY_NAME)
    fun webSecurityCustomizer(): WebSecurityCustomizer =
        WebSecurityCustomizer { web ->
            web.ignoring()
                .requestMatchers("/h2-console/**")
        }
}
