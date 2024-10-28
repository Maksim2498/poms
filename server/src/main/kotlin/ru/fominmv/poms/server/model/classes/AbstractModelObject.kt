package ru.fominmv.poms.server.model.classes

import org.hibernate.annotations.ColumnDefault
import org.hibernate.annotations.UpdateTimestamp

import ru.fominmv.poms.server.model.interfaces.mutable.MutableModelObject
import ru.fominmv.poms.libs.commons.string.toObjectString

import jakarta.persistence.Column
import jakarta.persistence.MappedSuperclass
import jakarta.persistence.Id as JpaId
import jakarta.validation.constraints.PastOrPresent

import java.time.Instant

@MappedSuperclass
abstract class AbstractModelObject<Id>(
    @JpaId
    override var id: Id,

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
) : MutableModelObject<Id> {
    override fun equals(other: Any?): Boolean {
        if (this === other)
            return true

        if (javaClass != other?.javaClass)
            return false

        other as AbstractModelObject<*>

        return id == other.id
    }

    override fun hashCode(): Int =
        id.hashCode()

    override fun toString(): String =
        toObjectString()
}
