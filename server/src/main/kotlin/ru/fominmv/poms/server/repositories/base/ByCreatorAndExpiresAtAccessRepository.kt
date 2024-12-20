package ru.fominmv.poms.server.repositories.base

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.Repository

import ru.fominmv.poms.server.model.entities.User
import ru.fominmv.poms.server.model.interfaces.immutable.Expirable

import java.time.Instant

@NoRepositoryBean
interface ByCreatorAndExpiresAtAccessRepository<T : Expirable, Id> : Repository<T, Id> {
    // Before

    fun existsByInternalCreatorAndExpiresAtBefore(creator: User?, after: Instant): Boolean

    fun countByInternalCreatorAndExpiresAtBefore(creator: User?, after: Instant): Long

    fun findAllByInternalCreatorAndExpiresAtBefore(creator: User?, after: Instant): List<T>

    fun findAllByInternalCreatorAndExpiresAtBefore(creator: User?, after: Instant, pageable: Pageable): Page<T>

    fun deleteAllByInternalCreatorAndExpiresAtBefore(creator: User?, after: Instant): Long

    // After

    fun existsByInternalCreatorAndExpiresAtAfter(creator: User?, after: Instant): Boolean

    fun countByInternalCreatorAndExpiresAtAfter(creator: User?, after: Instant): Long

    fun findAllByInternalCreatorAndExpiresAtAfter(creator: User?, after: Instant): List<T>

    fun findAllByInternalCreatorAndExpiresAtAfter(creator: User?, after: Instant, pageable: Pageable): Page<T>

    fun deleteAllByInternalCreatorAndExpiresAtAfter(creator: User?, after: Instant): Long
}
