package ru.fominmv.poms.server.errors.duplicate

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.CONFLICT, reason = "Such nickname is already in use")
open class NicknameDuplicateException (
    val nickname: Any,
    cause: Throwable? = null,
) : DuplicateException("Nickname $nickname is already in use", cause)
