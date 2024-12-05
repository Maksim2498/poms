package ru.fominmv.poms.server.runners

import org.slf4j.LoggerFactory

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.stereotype.Service

import ru.fominmv.poms.server.configs.ApplicationConfig
import ru.fominmv.poms.server.services.UserService
import ru.fominmv.poms.server.services.NicknameService

import jakarta.transaction.Transactional

@Service
@Transactional
class UserCreationRunner(
    private val applicationConfig: ApplicationConfig,
    private val userService: UserService,
    private val nicknameService: NicknameService,
) : ApplicationRunner {
    private val logger = LoggerFactory.getLogger(javaClass)

    override fun run(args: ApplicationArguments) {
        forUsers@
        for (user in applicationConfig.init.users) {
            logger.info("Trying to create user {}...", user)

            if (user.id?.let(userService::existsById) == true) {
                logger.warn("User with id {} already exists. Skipped", user.id)
                continue
            }

            if (userService.existsByLogin(user.login)) {
                logger.warn("User with login {} already exists. Skipped", user.login)
                continue
            }

            for (nickname in user.nicknames)
                if (nicknameService.existsByNickname(nickname)) {
                    logger.warn("Nickname {} is already occupied. Skipped", nickname)
                    continue@forUsers
                }

            userService.create(
                id = user.id,

                login = user.login,
                password = user.password,

                nicknames = user.nicknames,
                maxNicknames = user.maxNicknames,

                rights = user.rights,
                isBlocked = user.isBlocked,
            )

            logger.info("Created")
        }
    }
}
