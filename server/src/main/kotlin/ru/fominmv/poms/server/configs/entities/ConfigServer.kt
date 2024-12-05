package ru.fominmv.poms.server.configs.entities

import ru.fominmv.poms.libs.commons.text.strings.*
import ru.fominmv.poms.server.model.interfaces.mutable.*
import ru.fominmv.poms.server.validation.constraints.*

import java.util.*

data class ConfigServer(
    override var id: UUID? = null,

    @field:Reference
    override var login: String = "server",

    @Secret
    @field:ShortText
    override var password: String = "",

    @field:ShortText
    var publicAddress: String? = null,

    @field:ShortText
    override var name: String? = null,

    @field:ShortText
    override var description: String? = null,

    @field:ReferenceOrUuid
    var avatarStateGroup: String? = null,
) :
    MutableIdentifiable<UUID?>,
    MutableWithCredentials,
    MutableDescribed<String?>
{
    override fun toString(): String =
        toObjectString()
}
