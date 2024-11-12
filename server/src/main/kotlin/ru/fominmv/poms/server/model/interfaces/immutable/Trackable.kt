package ru.fominmv.poms.server.model.interfaces.immutable

import java.time.Instant

interface Trackable {
    val createdAt: Instant
    val modifiedAt: Instant
}
