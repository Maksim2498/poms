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

    fun exists(state: ExpirableState, now: Instant = Instant.now()): Boolean

    // Counting

    override fun count(): Long =
        count(ExpirableState.ANY)

    fun count(state: ExpirableState, now: Instant = Instant.now()): Long

    // Getting

    override fun getAll(): List<T> =
        getAll(ExpirableState.ANY)

    fun getAll(state: ExpirableState, now: Instant = Instant.now()): List<T>


    override fun getAll(pageable: Pageable): Page<T> =
        getAll(pageable, ExpirableState.ANY)

    fun getAll(pageable: Pageable, state: ExpirableState, now: Instant = Instant.now()): Page<T>

    // Deletion

    override fun deleteAll(): Long =
        deleteAll(ExpirableState.ANY)

    fun deleteAll(state: ExpirableState, now: Instant = Instant.now()): Long
}
