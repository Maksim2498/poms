package ru.fominmv.poms.server.services.accessors

import ru.fominmv.poms.server.errors.not_found.NotFoundException

interface ValueAccessor<T> {
    // Exists

    fun allExists(values: Iterable<T>): Boolean =
        values.all(::exists)

    fun exists(value: T): Boolean

    // Delete

    fun deleteAll(values: Iterable<T>) =
        values.forEach(::delete)

    fun delete(value: T) {
        if (!tryDelete(value))
            onNotFoundByValue(value)
    }

    // Try delete

    fun tryDeleteAll(values: Iterable<T>): Long =
        values.count(::tryDelete).toLong()

    fun tryDelete(value: T): Boolean

    // Errors

    fun onNotFoundByValue(value: T): Nothing =
        throw NotFoundException("Not found $value")
}
