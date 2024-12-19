package ru.fominmv.poms.server.configs

import org.slf4j.event.Level
import org.slf4j.LoggerFactory

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

import ru.fominmv.poms.libs.commons.booleans.ext.toEnabled
import ru.fominmv.poms.libs.commons.text.strings.objs.Secret
import ru.fominmv.poms.server.configs.entities.*

import jakarta.annotation.PostConstruct
import jakarta.validation.Valid

@Configuration
@ConfigurationProperties("poms")
class ApplicationConfig {
    private val logger = LoggerFactory.getLogger(javaClass)

    var init = Init()
    var development = Development()

    @PostConstruct
    private fun log() {
        Secret.isGloballyExposed = development.isSecretExposureEnabled

        init.log()
        development.log()
    }

    inner class Init {
        @Valid
        var avatarStateGroups: List<AvatarStateGroupConfig> = emptyList()

        @Valid
        var servers: List<ServerConfig> = emptyList()

        @Valid
        var users: List<UserConfig> = emptyList()

        internal fun log() {
            logList(avatarStateGroups, "Predefined avatar state groups:")
            logList(servers, "Predefined servers:")
            logList(users, "Predefined users:")
        }
    }

    inner class Development {
        var isSecretExposureEnabled: Boolean = false

        internal fun log() {
            logger.info("Secret exposure is {}", isSecretExposureEnabled.toEnabled())
        }
    }

    // Util

    private fun logList(
        list: List<*>,
        header: String? = null,
        emptyMessage: String? = null,
        level: Level = Level.INFO,
    ) {
        if (list.isEmpty()) {
            if (emptyMessage != null)
                logger.atLevel(level).log(emptyMessage)

            return
        }

        if (header != null)
            logger.atLevel(level).log(header)

        for (element in list)
            logger.atLevel(level).log(" - {}", element)
    }
}
