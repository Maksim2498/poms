package ru.fominmv.poms.server.model.entities

import org.hibernate.annotations.ColumnDefault
import org.hibernate.annotations.UpdateTimestamp

import ru.fominmv.poms.server.model.interfaces.immutable.Trackable

import jakarta.persistence.Column
import jakarta.persistence.MappedSuperclass
import jakarta.validation.constraints.PastOrPresent

import java.time.Instant

@MappedSuperclass
abstract class AbstractTrackableModelObject<Id>(
    id: Id,

    now: Instant = Instant.now(),

    @field:PastOrPresent
    @Column(nullable = false)
    @ColumnDefault("(CURRENT_TIMESTAMP)")
    override var createdAt: Instant = now,

    @UpdateTimestamp
    @field:PastOrPresent
    @Column(nullable = false)
    @ColumnDefault("(CURRENT_TIMESTAMP)")
    override var modifiedAt: Instant = now,
) :
    AbstractModelObject<Id>(id),

    Trackable
