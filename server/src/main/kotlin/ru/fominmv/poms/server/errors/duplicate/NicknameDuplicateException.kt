package ru.fominmv.poms.server.errors.duplicate

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

import ru.fominmv.poms.libs.commons.text.strings.ext.declaration

@ResponseStatus(HttpStatus.CONFLICT, reason = "Such nickname is already in use")
class NicknameDuplicateException (
    val nickname: String,
    cause: Throwable? = null,
) : DuplicateException("Nickname ${nickname.declaration()} is already in use", cause)
