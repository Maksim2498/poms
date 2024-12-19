package ru.fominmv.poms.server.services.model.accessors.bulk

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

import ru.fominmv.poms.server.model.entities.User

interface BulkOwnerAccessor<T : Any> {
    // Existence checking

    fun existsByOwner(owner: User?): Boolean =
        countByOwner(owner) > 0

    // Counting

    fun countByOwner(owner: User?): Long =
        getAllByOwner(owner).size.toLong()

    // Getting

    fun getAllByOwner(owner: User?): List<T>

    fun getAllByOwner(owner: User?, pageable: Pageable): Page<T>

    // Deletion

    fun deleteAllByOwner(owner: User?): Long
}
