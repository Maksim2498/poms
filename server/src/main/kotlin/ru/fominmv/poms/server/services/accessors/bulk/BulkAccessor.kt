package ru.fominmv.poms.server.services.accessors.bulk

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface BulkAccessor<T> {
    fun exists(): Boolean =
        count() > 0

    fun count(): Long =
        getAll().size.toLong()

    fun getAll(pageable: Pageable): Page<T>

    fun getAll(): List<T>

    fun deleteAll(): Long
}
