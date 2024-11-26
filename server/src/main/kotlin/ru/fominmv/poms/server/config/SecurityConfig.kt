@file:Suppress("DEPRECATION")

package ru.fominmv.poms.server.config

import org.springframework.context.annotation.*
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer
import org.springframework.security.crypto.factory.PasswordEncoderFactories
import org.springframework.security.crypto.password.NoOpPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder

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

    @Bean
    @Profile("!${ApplicationProfile.DEVELOPMENT_DISPLAY_NAME}")
    fun nonDevelopmentPasswordEncoder(): PasswordEncoder =
        PasswordEncoderFactories.createDelegatingPasswordEncoder()

    @Bean
    @Profile(ApplicationProfile.DEVELOPMENT_DISPLAY_NAME)
    fun developmentPasswordEncoder(): PasswordEncoder =
        NoOpPasswordEncoder.getInstance()
}
