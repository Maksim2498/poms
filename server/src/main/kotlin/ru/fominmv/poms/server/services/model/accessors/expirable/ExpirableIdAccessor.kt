package ru.fominmv.poms.server.services.model.accessors.expirable

import ru.fominmv.poms.server.model.interfaces.immutable.Expirable
import ru.fominmv.poms.server.services.model.accessors.IdAccessor

import java.time.Instant

interface ExpirableIdAccessor<T : Expirable, Id : Any> : IdAccessor<T, Id> {
    // New-checking

    override fun checkIfIdIsNew(id: Id) =
        checkIfIdIsNew(id, ExpirableState.ANY)

    fun checkIfIdIsNew(id: Id, state: ExpirableState, now: Instant = Instant.now()) {
        if (existsById(id, state, now))
            onIdDuplicate(id)
    }

    // Existence checking

    override fun existsById(id: Id): Boolean =
        existsById(id, ExpirableState.ANY)

    fun existsById(id: Id, state: ExpirableState, now: Instant = Instant.now()): Boolean =
        getByIdOrNull(id, state, now) != null

    // Getting

    // - Forced

    override fun getById(id: Id): T =
        getById(id, ExpirableState.ANY)

    fun getById(id: Id, state: ExpirableState, now: Instant = Instant.now()): T =
        getByIdOrNull(id, state, now) ?: onNotFoundById(id)

    // - Lenient

    override fun getByIdOrNull(id: Id): T? =
        getByIdOrNull(id, ExpirableState.ANY)

    fun getByIdOrNull(id: Id, state: ExpirableState, now: Instant = Instant.now()): T?

    // Deletion

    // - Forced

    override fun deleteById(id: Id) =
        deleteById(id, ExpirableState.ANY)

    fun deleteById(id: Id, state: ExpirableState, now: Instant = Instant.now()) {
        if (!tryDeleteById(id, state, now))
            onNotFoundById(id)
    }

    // - Lenient

    override fun tryDeleteById(id: Id): Boolean =
        tryDeleteById(id, ExpirableState.ANY)

    fun tryDeleteById(id: Id, state: ExpirableState, now: Instant = Instant.now()): Boolean
}
