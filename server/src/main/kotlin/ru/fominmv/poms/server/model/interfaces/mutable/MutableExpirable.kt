package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.Expirable

import java.time.Instant

interface MutableExpirable :
    MutableTrackable,
    Expirable
{
    override var expiresAt: Instant
}
