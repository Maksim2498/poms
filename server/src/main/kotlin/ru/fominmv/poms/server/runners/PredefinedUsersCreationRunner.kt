package ru.fominmv.poms.server.runners

import org.slf4j.LoggerFactory

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

import ru.fominmv.poms.libs.commons.log.slf4.ext.tryOrWarn
import ru.fominmv.poms.server.configs.ApplicationConfig
import ru.fominmv.poms.server.services.model.UserService
import ru.fominmv.poms.server.services.model.NicknameService
import ru.fominmv.poms.server.configs.entities.UserConfig
import ru.fominmv.poms.server.model.entities.User

@Service
@Transactional
class PredefinedUsersCreationRunner(
    private val applicationConfig: ApplicationConfig,
    private val userService: UserService,
    private val nicknameService: NicknameService,
    private val passwordEncoder: PasswordEncoder,
) : ApplicationRunner {
    private val logger = LoggerFactory.getLogger(javaClass)

    override fun run(args: ApplicationArguments) {
        if (applicationConfig.init.users.isEmpty())
            return

        logger.info("Creating/updating predefined users...")

        for (config in applicationConfig.init.users) {
            logger.info("Processing {}...", config)

            if (config.update)
                update(config)
            else
                create(config)
        }

        logger.info("Done")
    }

    private fun update(config: UserConfig) {
        config.id?.let { id ->
            logger.tryOrWarn {
                update(userService.getById(id), config)
            }
        }

        logger.tryOrWarn {
            update(userService.getByReference(config.reference), config)
        }

        logger.warn("Skipped")
    }

    private fun update(user: User, config: UserConfig) {
        user.reference = config.reference

        user.password = if (config.encodePassword)
            passwordEncoder.encode(config.password)
        else
            config.password

        for (nickname in config.nicknames)
            logger.tryOrWarn {
                nicknameService.create(nickname, user)
            }

        user.maxNicknames = config.maxNicknames
        user.rights = config.rights.copy()
        user.isBlocked = config.isBlocked
    }

    private fun create(config: UserConfig) {
        logger.tryOrWarn {
            userService.create(
                reference = config.reference,
                password = config.password,
                encodePassword = config.encodePassword,

                nicknames = config.nicknames,
                maxNicknames = config.maxNicknames,

                id = config.id,
            )
        }
    }
}
