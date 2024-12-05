package ru.fominmv.poms.server.repositories.base

import org.springframework.data.repository.NoRepositoryBean

import ru.fominmv.poms.server.model.interfaces.immutable.WithReference

import java.util.*

@NoRepositoryBean
interface ReferenceRepository<T : WithReference> {
    fun findByReferenceIgnoreCase(reference: String): Optional<T>

    fun existsByReferenceIgnoreCase(reference: String): Boolean

    fun deleteByReferenceIgnoreCase(reference: String): Long
}
