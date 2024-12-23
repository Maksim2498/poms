package ru.fominmv.poms.server.services.model.cleanup

import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

import ru.fominmv.poms.server.services.model.InviteService

@Service
class ExpiredInvitesCleanupService(inviteService: InviteService) : CleanupService {
    private val service = LoggingCleanupService(inviteService)

    @Scheduled(fixedDelayString = "#{@applicationConfig.cleanup.rate.invites}")
    override fun cleanUp(): Long =
        service.cleanUp()
}
