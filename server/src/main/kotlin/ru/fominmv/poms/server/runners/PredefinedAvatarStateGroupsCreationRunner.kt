package ru.fominmv.poms.server.runners

import org.slf4j.LoggerFactory

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

import ru.fominmv.poms.libs.commons.log.slf4.ext.tryOrWarn
import ru.fominmv.poms.server.configs.ApplicationConfig
import ru.fominmv.poms.server.services.model.AvatarStateGroupService
import ru.fominmv.poms.server.configs.entities.AvatarStateGroupConfig
import ru.fominmv.poms.server.model.entities.AvatarStateGroup

@Service
@Transactional
@Order(PredefinedAvatarStateGroupsCreationRunner.ORDER)
class PredefinedAvatarStateGroupsCreationRunner(
    private val applicationConfig: ApplicationConfig,
    private val avatarStateGroupService: AvatarStateGroupService,
) : ApplicationRunner {
    companion object {
        const val ORDER = 0
    }

    private val logger = LoggerFactory.getLogger(javaClass)

    override fun run(args: ApplicationArguments) {
        if (applicationConfig.init.avatarStateGroups.isEmpty())
            return

        logger.info("Creating/updating predefined avatar state groups...")

        for (config in applicationConfig.init.avatarStateGroups) {
            logger.info("Processing {}...", config)

            if (config.update)
                update(config)
            else
                create(config)
        }

        logger.info("Done")
    }

    private fun update(config: AvatarStateGroupConfig) {
        config.id?.let { id ->
            logger.tryOrWarn {
                update(avatarStateGroupService.getById(id), config)
            }
        }

        logger.tryOrWarn {
            update(avatarStateGroupService.getByReference(config.reference), config)
        }

        logger.warn("Skipped")
    }

    private fun update(group: AvatarStateGroup, config: AvatarStateGroupConfig) {
        group.reference = config.reference
        group.name = config.name
        group.description = config.description
    }

    private fun create(config: AvatarStateGroupConfig) {
        logger.tryOrWarn {
            avatarStateGroupService.create(
                reference = config.reference,
                name = config.name,
                description = config.description,
                id = config.id,
            )
        }
    }
}
