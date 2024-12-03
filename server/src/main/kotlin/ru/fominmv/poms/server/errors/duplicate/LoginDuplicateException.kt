package ru.fominmv.poms.server.errors.duplicate

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.CONFLICT, reason = "Such login is already in use")
open class LoginDuplicateException (
    val login: Any,
    cause: Throwable? = null,
) : DuplicateException("Login $login is already in use", cause)
