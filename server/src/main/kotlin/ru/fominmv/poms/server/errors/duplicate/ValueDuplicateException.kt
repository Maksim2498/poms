package ru.fominmv.poms.server.errors.duplicate

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.CONFLICT, reason = "Such entity is already in use")
class ValueDuplicateException (
    val value: Any,
    cause: Throwable? = null,
) : DuplicateException("Value $value is already in use", cause)
