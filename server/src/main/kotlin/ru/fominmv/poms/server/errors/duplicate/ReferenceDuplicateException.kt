package ru.fominmv.poms.server.errors.duplicate

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

import ru.fominmv.poms.libs.commons.text.strings.ext.declaration

@ResponseStatus(HttpStatus.CONFLICT, reason = "Such reference is already in use")
class ReferenceDuplicateException (
    val reference: String,
    cause: Throwable? = null,
) : DuplicateException("Reference ${reference.declaration()} is already in use", cause)
