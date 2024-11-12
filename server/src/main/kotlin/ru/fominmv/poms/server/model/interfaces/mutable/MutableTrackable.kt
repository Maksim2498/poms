package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.Trackable

import java.time.Instant

interface MutableTrackable : Trackable {
    override var createdAt: Instant
    override var modifiedAt: Instant
}
