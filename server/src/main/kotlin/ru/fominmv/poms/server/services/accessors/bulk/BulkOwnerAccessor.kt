package ru.fominmv.poms.server.services.accessors.bulk

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

import ru.fominmv.poms.server.model.entities.User

interface BulkOwnerAccessor<T> {
    fun existsByOwner(owner: User?): Boolean =
        countOwner(owner) > 0

    fun countOwner(owner: User?): Long =
        getAllByOwner(owner).size.toLong()

    fun getAllByOwner(owner: User?, pageable: Pageable): Page<T>

    fun getAllByOwner(owner: User?): List<T>

    fun deleteAllByOwner(owner: User?): Long
}
