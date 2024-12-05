package ru.fominmv.poms.server.configs.entities

import ru.fominmv.poms.server.model.interfaces.mutable.MutableDescribed
import ru.fominmv.poms.server.validation.constraints.*

import java.util.UUID

data class ConfigAvatarStateGroup(
    var id: UUID? = null,

    @field:Reference
    var reference: String = "group",

    @field:ShortText
    override var name: String? = null,

    @field:ShortText
    override var description: String? = null,
) : MutableDescribed<String?>
