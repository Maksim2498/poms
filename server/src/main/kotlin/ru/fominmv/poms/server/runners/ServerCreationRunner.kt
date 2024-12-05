package ru.fominmv.poms.server.runners

import org.slf4j.LoggerFactory

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Service

import ru.fominmv.poms.libs.commons.text.strings.ext.toUuidOrNull
import ru.fominmv.poms.server.model.entities.AvatarStateGroup
import ru.fominmv.poms.server.configs.ApplicationConfig
import ru.fominmv.poms.server.services.AvatarStateGroupService
import ru.fominmv.poms.server.services.ServerService

import jakarta.transaction.Transactional

@Service
@Transactional
@Order(ServerCreationRunner.ORDER)
class ServerCreationRunner(
    private val applicationConfig: ApplicationConfig,
    private val avatarStateGroupService: AvatarStateGroupService,
    private val serverService: ServerService,

) : ApplicationRunner {
    companion object {
        const val ORDER = AvatarStateGroupCreationRunner.ORDER + 1
    }

    private val logger = LoggerFactory.getLogger(javaClass)

    override fun run(args: ApplicationArguments) {
        for (server in applicationConfig.init.servers) {
            logger.info("Trying to create server {}...", server)

            if (server.id?.let(serverService::existsById) == true) {
                logger.warn("Server with id {} already exists. Skipped", server.id)
                continue
            }

            if (serverService.existsByLogin(server.login)) {
                logger.warn("Server with login {} already exists. Skipped", server.login)
                continue
            }

            val avatarStateGroupReferenceOrId = server.avatarStateGroup

            if (avatarStateGroupReferenceOrId == null) {
                logger.warn("Avatar state group wasn't specified. Skipped")
                continue
            }

            val avatarStateGroup: AvatarStateGroup?
            val avatarStateGroupId = avatarStateGroupReferenceOrId.toUuidOrNull()

            if (avatarStateGroupId != null) {
                avatarStateGroup = avatarStateGroupService.getByIdOrNull(avatarStateGroupId)

                if (avatarStateGroup == null) {
                    logger.warn("No avatar state group with id {}. Skipped", avatarStateGroupId)
                    continue
                }
            } else {
                avatarStateGroup = avatarStateGroupService.getByReferenceOrNull(avatarStateGroupReferenceOrId)

                if (avatarStateGroup == null) {
                    logger.debug("No avatar state group with reference {}. Skipped", avatarStateGroupReferenceOrId)
                    continue
                }
            }

            serverService.create(
                id = server.id,

                login = server.login,
                password = server.password,

                avatarStateGroup = avatarStateGroup,

                publicAddress = server.publicAddress,
                name = server.name,
                description = server.description,
            )

            logger.info("Created")
        }
    }
}
