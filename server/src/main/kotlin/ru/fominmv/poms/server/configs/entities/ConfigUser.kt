package ru.fominmv.poms.server.configs.entities

import ru.fominmv.poms.libs.commons.text.strings.*
import ru.fominmv.poms.server.model.embedabbles.UserRights
import ru.fominmv.poms.server.model.entities.User
import ru.fominmv.poms.server.model.interfaces.mutable.*
import ru.fominmv.poms.server.validation.constraints.*

import jakarta.validation.constraints.PositiveOrZero

import java.util.UUID

data class ConfigUser(
    override var id: UUID? = null,

    @field:Reference
    override var login: String = "user",

    @Secret
    @field:ShortText
    override var password: String = "",

    var nicknames: Set<@Nickname String> = emptySet(),

    @field:PositiveOrZero
    var maxNicknames: Int = User.DEFAULT_MAX_NICKNAMES,

    var rights: UserRights = UserRights(),

    var isBlocked: Boolean = false,
) :
    MutableIdentifiable<UUID?>,
    MutableWithCredentials
{
    override fun toString(): String =
        toObjectString()
}
