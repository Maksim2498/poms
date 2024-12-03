package ru.fominmv.poms.server.errors.duplicate

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.CONFLICT, reason = "Such id is already in use")
open class IdDuplicateException (
    val id: Any,
    cause: Throwable? = null,
) : RuntimeException("Id $id is already in use", cause)
