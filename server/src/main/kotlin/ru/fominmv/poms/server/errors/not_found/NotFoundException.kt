package ru.fominmv.poms.server.errors.not_found

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.NOT_FOUND, reason = NotFoundException.DEFAULT_MESSAGE)
open class NotFoundException(
    message: String = DEFAULT_MESSAGE,
    cause: Throwable? = null,
) : NoSuchElementException(message, cause) {
    companion object {
        const val DEFAULT_MESSAGE = "No such entity"
    }
}
