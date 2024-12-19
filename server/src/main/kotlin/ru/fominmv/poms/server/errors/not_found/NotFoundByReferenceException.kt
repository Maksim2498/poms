package ru.fominmv.poms.server.errors.not_found

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

import ru.fominmv.poms.libs.commons.text.strings.ext.declaration

@ResponseStatus(HttpStatus.NOT_FOUND, reason = "No entity with such reference")
class NotFoundByReferenceException(
    val reference: String,
    cause: Throwable? = null
) : NotFoundException("No entity with reference ${reference.declaration()}", cause)
