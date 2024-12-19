@file:Suppress("DEPRECATION")

package ru.fominmv.poms.server.configs

import org.springframework.context.annotation.*
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer
import org.springframework.security.config.annotation.web.invoke
import org.springframework.security.crypto.factory.PasswordEncoderFactories
import org.springframework.security.crypto.password.NoOpPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.savedrequest.NullRequestCache

@Configuration
@EnableMethodSecurity
class SecurityConfig {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            cors { disable() }
            csrf { disable() }
            requestCache { requestCache = NullRequestCache() }
        }

        return http.build()
    }

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
