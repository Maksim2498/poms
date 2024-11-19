package ru.fominmv.poms.server.model.entities

import org.hibernate.annotations.ColumnDefault

import ru.fominmv.poms.server.model.interfaces.mutable.MutableExpirable

import jakarta.persistence.Column
import jakarta.persistence.MappedSuperclass

import java.time.Duration
import java.time.Instant

@MappedSuperclass
abstract class AbstractExpirableModelObject<Id>(
    id: Id,
    now: Instant = Instant.now(),
    createdAt: Instant = now,
    modifiedAt: Instant = now,

    @Column(nullable = false)
    @ColumnDefault("(CURRENT_TIMESTAMP)")
    override var expiresAt: Instant = now.plus(DEFAULT_DURATION),
) :
    AbstractTrackableModelObject<Id>(
        id = id,
        now = now,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    ),

    MutableExpirable
{
    companion object {
        val DEFAULT_DURATION = Duration.ofDays(1)!!
    }
}
