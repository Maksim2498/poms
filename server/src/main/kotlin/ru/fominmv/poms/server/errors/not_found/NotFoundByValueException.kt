package ru.fominmv.poms.server.errors.not_found

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.NOT_FOUND, reason = "No such entity")
class NotFoundByValueException(
    val value: Any,
    cause: Throwable? = null
) : NotFoundException("No entity $value", cause)
