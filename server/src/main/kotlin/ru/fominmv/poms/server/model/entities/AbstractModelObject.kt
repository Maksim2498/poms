package ru.fominmv.poms.server.model.entities

import ru.fominmv.poms.server.model.interfaces.mutable.MutableIdentifiable
import ru.fominmv.poms.libs.commons.strings.toObjectString

import jakarta.persistence.MappedSuperclass
import jakarta.persistence.Id as JpaId

@MappedSuperclass
abstract class AbstractModelObject<Id>(
    @JpaId
    override var id: Id,
) : MutableIdentifiable<Id> {
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
