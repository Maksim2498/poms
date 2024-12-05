package ru.fominmv.poms.libs.api.requests

import ru.fominmv.poms.libs.api.validation.constraints.Reference
import ru.fominmv.poms.libs.api.validation.constraints.ShortText

data class AuthRequest(
    @field:Reference
    val login: String,

    @field:ShortText
    val password: String,
)
