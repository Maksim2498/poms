package ru.fominmv.poms.server.services.accessors.bulk

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

import ru.fominmv.poms.server.model.entities.User

interface BulkCreatorAccessor<T> {
    fun existsByCreator(creator: User?): Boolean =
        countCreator(creator) > 0

    fun countCreator(creator: User?): Long =
        getAllByCreator(creator).size.toLong()

    fun getAllByCreator(creator: User?, pageable: Pageable): Page<T>

    fun getAllByCreator(creator: User?): List<T>

    fun deleteAllByCreator(creator: User?): Long
}
