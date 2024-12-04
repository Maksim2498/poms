package ru.fominmv.poms.server.errors.limit

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY, reason = LimitException.DEFAULT_MESSAGE)
open class LimitException(
    message: String = DEFAULT_MESSAGE,
    cause: Throwable? = null,
) : RuntimeException(message, cause) {
    companion object {
        const val DEFAULT_MESSAGE = "Limit reached"
    }
}
