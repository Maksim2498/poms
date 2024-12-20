package ru.fominmv.poms.server.services.model.accessors.expirable.bulk

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

import ru.fominmv.poms.server.model.entities.User
import ru.fominmv.poms.server.model.interfaces.immutable.Expirable
import ru.fominmv.poms.server.services.model.accessors.bulk.BulkCreatorAccessor
import ru.fominmv.poms.server.services.model.accessors.expirable.ExpirableState

import java.time.Instant

interface BulkExpirableCreatorAccessor<T : Expirable> : BulkCreatorAccessor<T> {
    // Existence checking

    override fun existsByCreator(creator: User?): Boolean =
        existsByCreator(creator, ExpirableState.ANY)

    fun existsByCreator(creator: User?, state: ExpirableState, now: Instant = Instant.now()): Boolean =
        countByCreator(creator, state, now) > 0

    // Counting

    override fun countByCreator(creator: User?): Long =
        countByCreator(creator, ExpirableState.ANY)

    fun countByCreator(creator: User?, state: ExpirableState, now: Instant = Instant.now()): Long =
        getAllByCreator(creator, state, now).size.toLong()

    // Getting

    // - All

    override fun getAllByCreator(creator: User?): List<T> =
        getAllByCreator(creator, ExpirableState.ANY)

    fun getAllByCreator(creator: User?, state: ExpirableState, now: Instant = Instant.now()): List<T> =
        getAllByCreator(creator, Pageable.unpaged(), state, now).content

    // - Paged

    override fun getAllByCreator(creator: User?, pageable: Pageable): Page<T> =
        getAllByCreator(creator, pageable, ExpirableState.ANY)

    fun getAllByCreator(creator: User?, pageable: Pageable, state: ExpirableState, now: Instant = Instant.now()): Page<T>

    // Deletion

    override fun deleteAllByCreator(creator: User?): Long =
        deleteAllByCreator(creator, ExpirableState.ANY)

    fun deleteAllByCreator(creator: User?, state: ExpirableState, now: Instant = Instant.now()): Long
}
