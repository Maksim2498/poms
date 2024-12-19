package ru.fominmv.poms.server.configs.entities

import ru.fominmv.poms.libs.api.validation.constraints.*
import ru.fominmv.poms.libs.commons.text.strings.objs.*
import ru.fominmv.poms.server.model.embedabbles.UserRights
import ru.fominmv.poms.server.model.entities.User
import ru.fominmv.poms.server.model.interfaces.mutable.*

import jakarta.validation.constraints.PositiveOrZero

import java.util.UUID

data class UserConfig(
    override var id: UUID? = null,

    @field:Reference
    override var reference: String = User.DEFAULT_REFERENCE,

    @Secret
    @field:ShortText
    override var password: String = User.DEFAULT_PASSWORD,

    var encodePassword: Boolean = true,

    var nicknames: Set<@Nickname String> = emptySet(),

    @field:PositiveOrZero
    var maxNicknames: Int = User.DEFAULT_MAX_NICKNAMES,

    var rights: UserRights = UserRights(),

    var isBlocked: Boolean = false,

    var update: Boolean = false,
) :
    MutableIdentified<UUID?>,
    MutableCredentialed<String>
{
    override fun toString(): String =
        toObjString()
}
