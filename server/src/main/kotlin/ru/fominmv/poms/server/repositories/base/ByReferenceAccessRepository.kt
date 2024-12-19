package ru.fominmv.poms.server.repositories.base

import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.Repository

import ru.fominmv.poms.server.model.interfaces.immutable.Referenced

import java.util.*

@NoRepositoryBean
interface ByReferenceAccessRepository<T : Referenced<*>, Id> : Repository<T, Id> {
    fun findByReferenceIgnoreCase(reference: String): Optional<T>

    fun existsByReferenceIgnoreCase(reference: String): Boolean

    fun deleteByReferenceIgnoreCase(reference: String): Long
}
