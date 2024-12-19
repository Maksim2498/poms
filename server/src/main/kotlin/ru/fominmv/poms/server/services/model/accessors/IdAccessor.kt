package ru.fominmv.poms.server.services.model.accessors

import ru.fominmv.poms.server.errors.duplicate.IdDuplicateException
import ru.fominmv.poms.server.errors.not_found.NotFoundByIdException

import java.util.*

interface IdAccessor<T : Any, Id : Any> {
    // New-checking

    fun checkIfAllIdsAreNew(ids: Iterable<Id>) =
        ids.forEach(::checkIfIdIsNew)

    fun checkIfIdIsNew(id: Id) {
        if (existsById(id))
            onIdDuplicate(id)
    }

    // Existence checking

    fun allExistsById(ids: Iterable<Id>): Boolean =
        ids.all(::existsById)

    fun existsById(id: Id): Boolean =
        getByIdOrNull(id) != null

    // Getting

    // - Forced

    fun getAllById(ids: Iterable<Id>): List<T> =
        ids.map(::getById)

    fun getById(id: Id): T =
        getByIdOrNull(id) ?: onNotFoundById(id)

    // - Lenient

    fun tryGetAllById(ids: Iterable<Id>): List<T> =
        ids.mapNotNull(::getByIdOrNull)

    fun getByIdOrNull(id: Id): T?

    // Deletion

    // - Forced

    fun deleteAllById(ids: Iterable<Id>) =
        ids.forEach(::deleteById)

    fun deleteById(id: Id) {
        if (!tryDeleteById(id))
            onNotFoundById(id)
    }

    // - Lenient

    fun tryDeleteAllById(ids: Iterable<Id>): Long =
        ids.count(::tryDeleteById).toLong()

    fun tryDeleteById(id: Id): Boolean

    // Errors

    fun onIdDuplicate(id: Id): Nothing =
        throw IdDuplicateException(id)

    fun onNotFoundById(id: Id): Nothing =
        throw NotFoundByIdException(id)
}

// New ID

fun <T : Any> IdAccessor<T, UUID>.getNewIdOrCheckIfNew(id: UUID? = null): UUID =
    if (id != null) {
        checkIfIdIsNew(id)
        id
    } else
        getNewId()

fun <T : Any> IdAccessor<T, UUID>.getNewId(): UUID {
    var newId: UUID

    do
        newId = UUID.randomUUID()
    while (existsById(newId))

    return newId
}
