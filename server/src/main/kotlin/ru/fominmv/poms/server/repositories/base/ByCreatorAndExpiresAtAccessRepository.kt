package ru.fominmv.poms.server.repositories.base

import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.Repository

import ru.fominmv.poms.server.model.entities.User
import ru.fominmv.poms.server.model.interfaces.immutable.Expirable

import java.time.Instant
import java.util.*

@NoRepositoryBean
interface ByCreatorAndExpiresAtAccessRepository<T : Expirable, Id> : Repository<T, Id> {
    // Before

    fun findByInternalCreatorAndExpiresAtBefore(creator: User?, after: Instant): Optional<T>

    fun existsByInternalCreatorAndExpiresAtBefore(creator: User?, after: Instant): Boolean

    fun deleteByInternalCreatorAndExpiresAtBefore(creator: User?, after: Instant): Long

    // After
    
    fun findByInternalCreatorAndExpiresAtAfter(creator: User?, after: Instant): Optional<T>

    fun existsByInternalCreatorAndExpiresAtAfter(creator: User?, after: Instant): Boolean

    fun deleteByInternalCreatorAndExpiresAtAfter(creator: User?, after: Instant): Long
}
