package ru.fominmv.poms.server.configs.entities

import ru.fominmv.poms.libs.api.validation.constraints.*
import ru.fominmv.poms.libs.commons.text.strings.objs.*
import ru.fominmv.poms.server.model.embedabbles.UserRights
import ru.fominmv.poms.server.model.entities.User
import ru.fominmv.poms.server.model.interfaces.mutable.*

import jakarta.validation.constraints.PositiveOrZero

import java.util.UUID

data class UserConfig(
    // Credentials

    override var id: UUID? = null,

    @field:Reference
    override var reference: String = User.DEFAULT_REFERENCE,

    @Secret
    @field:ShortText
    override var password: String = User.DEFAULT_PASSWORD,

    var encodePassword: Boolean = true,

    // Nicknames

    var nicknames: Set<@Nickname String> = emptySet(),

    @field:PositiveOrZero
    var maxNicknames: Int = User.DEFAULT_MAX_NICKNAMES,

    // Rights

    var rights: UserRights = UserRights(),

    override var isBlocked: Boolean = User.DEFAULT_IS_BLOCKED,

    // Meta

    var update: Boolean = false,
) :
    MutableIdentified<UUID?>,
    MutableCredentialed<String>,
    MutableBlockable
{
    override fun toString(): String =
        toObjString()
}
