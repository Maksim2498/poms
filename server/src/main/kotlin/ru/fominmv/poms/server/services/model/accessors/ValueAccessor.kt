package ru.fominmv.poms.server.services.model.accessors

import ru.fominmv.poms.server.errors.duplicate.ValueDuplicateException
import ru.fominmv.poms.server.errors.not_found.NotFoundException

interface ValueAccessor<T : Any> {
    // New-checking

    fun checkIfAllValuesAreNew(values: Iterable<T>) =
        values.forEach(::checkIfValueIsNew)

    fun checkIfValueIsNew(value: T) {
        if (exists(value))
            onValueDuplicate(value)
    }

    // Existence checking

    fun allExists(values: Iterable<T>): Boolean =
        values.all(::exists)

    fun exists(value: T): Boolean

    // Deletion

    // - Forced

    fun deleteAll(values: Iterable<T>) =
        values.forEach(::delete)

    fun delete(value: T) {
        if (!tryDelete(value))
            onNotFoundByValue(value)
    }

    // - Lenient

    fun tryDeleteAll(values: Iterable<T>): Long =
        values.count(::tryDelete).toLong()

    fun tryDelete(value: T): Boolean

    // Errors

    fun onValueDuplicate(value: T): Nothing =
        throw ValueDuplicateException(value)

    fun onNotFoundByValue(value: T): Nothing =
        throw NotFoundException("Not found $value")
}
