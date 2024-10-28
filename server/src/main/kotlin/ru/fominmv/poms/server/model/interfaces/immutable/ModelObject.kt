package ru.fominmv.poms.server.model.interfaces.immutable

import java.time.Instant

interface ModelObject<Id> : Identifiable<Id> {
    val createdAt: Instant
    val modifiedAt: Instant
}
