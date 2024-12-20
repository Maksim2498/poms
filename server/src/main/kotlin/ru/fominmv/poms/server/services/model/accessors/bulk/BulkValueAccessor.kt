package ru.fominmv.poms.server.services.model.accessors.bulk

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface BulkValueAccessor<T : Any> {
    // Existence checking

    fun exists(): Boolean =
        count() > 0

    // Counting

    fun count(): Long =
        getAll().size.toLong()

    // Getting

    fun getAll(): List<T> =
        getAll(Pageable.unpaged()).content

    fun getAll(pageable: Pageable): Page<T>

    // Deletion

    fun deleteAll(): Long
}
