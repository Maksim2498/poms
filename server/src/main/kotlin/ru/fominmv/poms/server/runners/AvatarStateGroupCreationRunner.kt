package ru.fominmv.poms.server.runners

import org.slf4j.LoggerFactory

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Service

import ru.fominmv.poms.server.configs.ApplicationConfig
import ru.fominmv.poms.server.services.AvatarStateGroupService

import jakarta.transaction.Transactional

@Service
@Transactional
@Order(AvatarStateGroupCreationRunner.ORDER)
class AvatarStateGroupCreationRunner(
    private val applicationConfig: ApplicationConfig,
    private val avatarStateGroupService: AvatarStateGroupService,
) : ApplicationRunner {
    companion object {
        const val ORDER = 0
    }

    private val logger = LoggerFactory.getLogger(javaClass)

    override fun run(args: ApplicationArguments) {
        for (group in applicationConfig.init.avatarStateGroups) {
            logger.debug("Trying to create avatar state group {}...", group)

            if (group.id?.let(avatarStateGroupService::existsById) == true) {
                logger.debug("Avatar state group with id {} already exists. Skipped", group.id)
                continue
            }

            if (avatarStateGroupService.existsByReference(group.reference)) {
                logger.debug("Avatar state group with reference {} already exists. Skipped", group.reference)
                continue
            }

            avatarStateGroupService.create(
                id = group.id,

                reference = group.reference,

                name = group.reference,
                description = group.description,
            )
        }
    }
}
