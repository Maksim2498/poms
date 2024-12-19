package ru.fominmv.poms.server.services.model.accessors.bulk

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

import ru.fominmv.poms.server.model.entities.User

interface BulkCreatorAccessor<T : Any> {
    // Existence checking

    fun existsByCreator(creator: User?): Boolean =
        countByCreator(creator) > 0

    // Counting

    fun countByCreator(creator: User?): Long =
        getAllByCreator(creator).size.toLong()

    // Getting

    fun getAllByCreator(creator: User?): List<T>

    fun getAllByCreator(creator: User?, pageable: Pageable): Page<T>

    // Deletion

    fun deleteAllByCreator(creator: User?): Long
}
