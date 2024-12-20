package ru.fominmv.poms.server.configs.entities

import ru.fominmv.poms.libs.api.validation.constraints.*
import ru.fominmv.poms.libs.commons.text.strings.objs.*
import ru.fominmv.poms.server.model.entities.AvatarStateGroup
import ru.fominmv.poms.server.model.entities.Server
import ru.fominmv.poms.server.model.interfaces.mutable.*

import java.util.*

data class ServerConfig(
    // Credentials

    override var id: UUID? = null,

    @field:Reference
    override var reference: String = Server.DEFAULT_REFERENCE,

    @Secret
    @field:ShortText
    override var password: String = Server.DEFAULT_PASSWORD,

    var encodePassword: Boolean = true,

    // About

    @field:ShortText
    var publicAddress: String? = null,

    @field:ShortText
    override var name: String? = null,

    @field:MediumText
    override var description: String? = null,

    // Avatar state group

    @field:ReferenceOrUuid
    var avatarStateGroup: String = AvatarStateGroup.DEFAULT_REFERENCE,

    // Rights

    override var isBlocked: Boolean = Server.DEFAULT_IS_BLOCKED,

    // Meta

    var update: Boolean = false,
) :
    MutableIdentified<UUID?>,
    MutableCredentialed<String>,
    MutableDescribed<String?>,
    MutableBlockable
{
    override fun toString(): String =
        toObjString()
}
