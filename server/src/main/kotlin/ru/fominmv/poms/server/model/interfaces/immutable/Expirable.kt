package ru.fominmv.poms.server.model.interfaces.immutable

import com.fasterxml.jackson.annotation.JsonIgnore

import java.time.Instant

interface Expirable : Trackable {
    var expiresAt: Instant

    @get:JsonIgnore
    val isExpired: Boolean
        get() = isExpired()

    fun isExpired(now: Instant = Instant.now()): Boolean =
        now.isAfter(expiresAt)
}
