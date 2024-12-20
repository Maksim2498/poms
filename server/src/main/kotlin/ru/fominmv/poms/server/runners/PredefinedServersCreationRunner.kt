package ru.fominmv.poms.server.runners

import org.slf4j.LoggerFactory

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.annotation.Order
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

import ru.fominmv.poms.libs.commons.log.slf4.ext.tryOrWarn
import ru.fominmv.poms.server.configs.entities.ServerConfig
import ru.fominmv.poms.server.configs.ApplicationConfig
import ru.fominmv.poms.server.model.entities.Server
import ru.fominmv.poms.server.services.model.AvatarStateGroupService
import ru.fominmv.poms.server.services.model.ServerService

@Service
@Transactional
@Order(PredefinedServersCreationRunner.ORDER)
class PredefinedServersCreationRunner(
    private val applicationConfig: ApplicationConfig,
    private val avatarStateGroupService: AvatarStateGroupService,
    private val serverService: ServerService,
    private val passwordEncoder: PasswordEncoder,

    ) : ApplicationRunner {
    companion object {
        const val ORDER = PredefinedAvatarStateGroupsCreationRunner.ORDER + 1
    }

    private val logger = LoggerFactory.getLogger(javaClass)

    override fun run(args: ApplicationArguments) {
        if (applicationConfig.init.servers.isEmpty())
            return

        logger.info("Creating/updating predefined servers...")

        for (config in applicationConfig.init.servers) {
            logger.info("Processing {}...", config)

            if (config.update)
                update(config)
            else
                create(config)
        }

        logger.info("Done")
    }

    private fun update(config: ServerConfig) {
        config.id?.let { id ->
            logger.tryOrWarn {
                update(serverService.getById(id), config)
            }
        }

        logger.tryOrWarn {
            update(serverService.getByReference(config.reference), config)
        }

        logger.warn("Skipped")
    }

    private fun update(server: Server, config: ServerConfig) {
        // Credentials

        server.reference = config.reference

        server.password = if (config.encodePassword)
            passwordEncoder.encode(config.password)
        else
            config.password

        // Avatar state group

        server.avatarStateGroup = logger.tryOrWarn {
            avatarStateGroupService.getByReferenceOrId(config.avatarStateGroup)
        }

        // About

        server.publicAddress = config.publicAddress
        server.name = config.name
        server.description = config.description

        // Rights

        server.isBlocked = config.isBlocked
    }

    private fun create(config: ServerConfig) {
        logger.tryOrWarn {
            serverService.create(
                // Credentials

                id = config.id,
                reference = config.reference,
                password = config.password,
                encodePassword = config.encodePassword,

                // Avatar state group

                avatarStateGroup = avatarStateGroupService.getByReferenceOrId(config.avatarStateGroup),

                // About

                publicAddress = config.publicAddress,
                name = config.name,
                description = config.description,

                // Rights

                isBlocked = config.isBlocked,
            )
        }
    }
}
