package ru.fominmv.poms.server.configs.entities

import ru.fominmv.poms.libs.api.validation.constraints.Nickname
import ru.fominmv.poms.server.model.embedabbles.UserRights
import ru.fominmv.poms.server.model.interfaces.mutable.MutableIdentified
import ru.fominmv.poms.server.model.entities.Invite

import jakarta.validation.Valid

import java.time.Instant
import java.util.UUID

data class InviteConfig(
    override var id: UUID? = null,

    @field:Nickname
    var nickname: String,

    @field:Valid
    var rights: UserRights = UserRights(),

    var expiresAt: Instant = Instant.now().plus(Invite.DEFAULT_DURATION),
) : MutableIdentified<UUID?>
