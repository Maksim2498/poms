package ru.fominmv.poms.server.configs

import org.slf4j.LoggerFactory

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

import ru.fominmv.poms.server.configs.entities.*

import jakarta.annotation.PostConstruct
import jakarta.validation.Valid

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
        @Valid
        var avatarStateGroups: List<ConfigAvatarStateGroup> = emptyList()

        @Valid
        var servers: List<ConfigServer> = emptyList()

        @Valid
        var users: List<ConfigUser> = emptyList()

        internal fun log() {
            logList(avatarStateGroups, "Predefined avatar state groups:")
            logList(servers, "Predefined servers:")
            logList(users, "Predefined users:")
        }

        private fun logList(list: List<*>, header: String? = null) {
            if (list.isEmpty())
                return

            if (header != null)
                logger.info(header)

            for (element in list)
                logger.info(" - {}", element)
        }
    }
}
