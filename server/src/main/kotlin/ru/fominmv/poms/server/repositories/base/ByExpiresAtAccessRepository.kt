package ru.fominmv.poms.server.repositories.base

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.Repository

import ru.fominmv.poms.server.model.interfaces.immutable.Expirable

import java.time.Instant

@NoRepositoryBean
interface ByExpiresAtAccessRepository<T : Expirable, Id> : Repository<T, Id> {
    // Before

    fun existsByExpiresAtBefore(after: Instant): Boolean

    fun countByExpiresAtBefore(after: Instant): Long

    fun findAllByExpiresAtBefore(after: Instant): List<T>

    fun findAllByExpiresAtBefore(after: Instant, pageable: Pageable): Page<T>

    fun deleteAllByExpiresAtBefore(after: Instant): Long

    // After

    fun existsByExpiresAtAfter(after: Instant): Boolean

    fun countByExpiresAtAfter(after: Instant): Long

    fun findAllByExpiresAtAfter(after: Instant): List<T>

    fun findAllByExpiresAtAfter(after: Instant, pageable: Pageable): Page<T>

    fun deleteAllByExpiresAtAfter(after: Instant): Long
}
