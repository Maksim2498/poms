package ru.fominmv.poms.server.repositories.base

import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.Repository

import ru.fominmv.poms.server.model.interfaces.immutable.Expirable

import java.time.Instant
import java.util.*

@NoRepositoryBean
interface ByIdAndExpiresAtAccessRepository<T : Expirable, Id> : Repository<T, Id> {
    // Before

    fun findByIdAndExpiresAtBefore(id: Id, after: Instant): Optional<T>

    fun existsByIdAndExpiresAtBefore(id: Id, after: Instant): Boolean

    fun deleteByIdAndExpiresAtBefore(id: Id, after: Instant): Long

    // After
    
    fun findByIdAndExpiresAtAfter(id: Id, after: Instant): Optional<T>

    fun existsByIdAndExpiresAtAfter(id: Id, after: Instant): Boolean

    fun deleteByIdAndExpiresAtAfter(id: Id, after: Instant): Long
}
