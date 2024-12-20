package ru.fominmv.poms.server.runners

import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner

import org.springframework.stereotype.Service

import ru.fominmv.poms.server.configs.ApplicationConfig
import ru.fominmv.poms.server.services.model.InviteService

@Service
class PredefinedInvitesCreationRunner(
    private val applicationConfig: ApplicationConfig,
    private val inviteService: InviteService,
) : ApplicationRunner {
    private val logger = LoggerFactory.getLogger(javaClass)

    override fun run(args: ApplicationArguments?) {

    }
}
