package ru.fominmv.poms.server.configs.entities

import ru.fominmv.poms.libs.api.validation.constraints.*
import ru.fominmv.poms.server.model.entities.AvatarStateGroup
import ru.fominmv.poms.server.model.interfaces.mutable.*

import java.util.UUID

data class AvatarStateGroupConfig(
    override var id: UUID? = null,

    @field:Reference
    override var reference: String = AvatarStateGroup.DEFAULT_REFERENCE,

    @field:ShortText
    override var name: String? = null,

    @field:MediumText
    override var description: String? = null,

    var update: Boolean = false,
) :
    MutableDescribed<String?>,
    MutableIdentified<UUID?>,
    MutableReferenced<String>
