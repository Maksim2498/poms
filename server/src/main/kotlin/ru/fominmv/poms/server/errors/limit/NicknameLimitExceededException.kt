package ru.fominmv.poms.server.errors.limit

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

import ru.fominmv.poms.server.model.entities.User

@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY, reason = "Nickname limit exceeded")
class NicknameLimitExceededException(
    val limit: Int = User.DEFAULT_MAX_NICKNAMES,
    cause: Throwable? = null,
) : LimitExceededException("Nickname limit ($limit) exceeded", cause)
