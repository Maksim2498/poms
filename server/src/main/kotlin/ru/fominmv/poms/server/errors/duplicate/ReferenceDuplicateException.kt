package ru.fominmv.poms.server.errors.duplicate

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.CONFLICT, reason = "Such reference is already in use")
open class ReferenceDuplicateException (
    val reference: Any,
    cause: Throwable? = null,
) : DuplicateException("Reference $reference is already in use", cause)
