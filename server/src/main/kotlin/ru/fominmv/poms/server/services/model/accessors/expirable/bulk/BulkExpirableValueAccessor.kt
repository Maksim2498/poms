package ru.fominmv.poms.server.services.model.accessors.expirable.bulk

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

import ru.fominmv.poms.server.model.interfaces.immutable.Expirable
import ru.fominmv.poms.server.services.model.accessors.bulk.BulkValueAccessor
import ru.fominmv.poms.server.services.model.accessors.expirable.ExpirableState

import java.time.Instant

interface BulkExpirableValueAccessor<T : Expirable> : BulkValueAccessor<T> {
    // Existence checking

    override fun exists(): Boolean =
        exists(ExpirableState.ANY)

    fun exists(state: ExpirableState, now: Instant = Instant.now()): Boolean =
        count(state, now) > 0

    // Counting

    override fun count(): Long =
        count(ExpirableState.ANY)

    fun count(state: ExpirableState, now: Instant = Instant.now()): Long =
        getAll(state, now).size.toLong()

    // Getting

    // - All

    override fun getAll(): List<T> =
        getAll(ExpirableState.ANY)

    fun getAll(state: ExpirableState, now: Instant = Instant.now()): List<T> =
        getAll(Pageable.unpaged(), state, now).content

    // - Paged

    override fun getAll(pageable: Pageable): Page<T> =
        getAll(pageable, ExpirableState.ANY)

    fun getAll(pageable: Pageable, state: ExpirableState, now: Instant = Instant.now()): Page<T>

    // Deletion

    override fun deleteAll(): Long =
        deleteAll(ExpirableState.ANY)

    fun deleteAll(state: ExpirableState, now: Instant = Instant.now()): Long
}
