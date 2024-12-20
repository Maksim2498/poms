package ru.fominmv.poms.server.repositories.base

import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.Repository

import ru.fominmv.poms.server.model.interfaces.immutable.Expirable

import java.time.Instant
import java.util.*

@NoRepositoryBean
interface ByExpiresAtAccessRepository<T : Expirable, Id> : Repository<T, Id> {
    // Before

    fun findByExpiresAtBefore(after: Instant): Optional<T>

    fun existsByExpiresAtBefore(after: Instant): Boolean

    fun deleteByExpiresAtBefore(after: Instant): Long

    // After
    
    fun findByExpiresAtAfter(after: Instant): Optional<T>

    fun existsByExpiresAtAfter(after: Instant): Boolean

    fun deleteByExpiresAtAfter(after: Instant): Long
}
