package ru.fominmv.poms.server.model.entities

import ru.fominmv.poms.server.model.interfaces.mutable.MutableIdentified
import ru.fominmv.poms.libs.commons.text.strings.objs.toObjString

import jakarta.persistence.MappedSuperclass
import jakarta.persistence.Id as JpaId

@MappedSuperclass
abstract class AbstractModelObject<Id : Any>(
    @JpaId
    override var id: Id,
) : MutableIdentified<Id> {
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
        toObjString()
}
