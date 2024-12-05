package ru.fominmv.poms.server.repositories.base

import org.springframework.data.repository.NoRepositoryBean

import ru.fominmv.poms.server.model.interfaces.immutable.WithReference

import java.util.*

@NoRepositoryBean
interface ReferenceRepository<T : WithReference> {
    fun findByReference(reference: String): Optional<T>

    fun existsByReference(reference: String): Boolean

    fun deleteByReference(reference: String): Long
}
