package ru.fominmv.poms.server.configs

import org.slf4j.LoggerFactory

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

import ru.fominmv.poms.server.configs.entities.ConfigUser

import jakarta.annotation.PostConstruct

@Configuration
@ConfigurationProperties("poms")
class ApplicationConfig {
    private val logger = LoggerFactory.getLogger(javaClass)

    var init = Init()

    @PostConstruct
    private fun log() {
        init.log()
    }

    inner class Init {
        var users: List<ConfigUser> = emptyList()

        internal fun log() {
            if (users.isNotEmpty()) {
                logger.info("Users to precreate:")

                for (user in users)
                    logger.info(" - {}", user)
            }
        }
    }
}
