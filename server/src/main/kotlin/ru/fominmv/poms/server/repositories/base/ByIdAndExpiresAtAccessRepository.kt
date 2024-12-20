package ru.fominmv.poms.server.repositories.base

import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.Repository

import ru.fominmv.poms.server.model.interfaces.immutable.Expirable

import java.time.Instant
import java.util.*

@NoRepositoryBean
interface ByIdAndExpiresAtAccessRepository<T : Expirable, Id> : Repository<T, Id> {
    // Before

    fun existsByIdAndExpiresAtBefore(id: Id, after: Instant): Boolean

    fun findByIdAndExpiresAtBefore(id: Id, after: Instant): Optional<T>

    fun deleteByIdAndExpiresAtBefore(id: Id, after: Instant): Long

    // After

    fun existsByIdAndExpiresAtAfter(id: Id, after: Instant): Boolean

    fun findByIdAndExpiresAtAfter(id: Id, after: Instant): Optional<T>

    fun deleteByIdAndExpiresAtAfter(id: Id, after: Instant): Long
}
