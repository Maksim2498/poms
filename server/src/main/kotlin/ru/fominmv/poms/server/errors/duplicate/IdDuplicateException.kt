package ru.fominmv.poms.server.errors.duplicate

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.CONFLICT, reason = "Such ID is already in use")
class IdDuplicateException (
    val id: Any,
    cause: Throwable? = null,
) : DuplicateException("ID $id is already in use", cause)
