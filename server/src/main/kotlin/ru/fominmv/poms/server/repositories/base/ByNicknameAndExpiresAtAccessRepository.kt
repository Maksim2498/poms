package ru.fominmv.poms.server.repositories.base

import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.Repository

import ru.fominmv.poms.server.model.interfaces.immutable.Expirable

import java.time.Instant
import java.util.*

@NoRepositoryBean
interface ByNicknameAndExpiresAtAccessRepository<T : Expirable, Id> : Repository<T, Id> {
    // Before

    fun existsByNicknameAndExpiresAtBefore(nickname: String, after: Instant): Boolean

    fun findByNicknameAndExpiresAtBefore(nickname: String, after: Instant): Optional<T>

    fun deleteByNicknameAndExpiresAtBefore(nickname: String, after: Instant): Int

    // After

    fun existsByNicknameAndExpiresAtAfter(nickname: String, after: Instant): Boolean

    fun findByNicknameAndExpiresAtAfter(nickname: String, after: Instant): Optional<T>

    fun deleteByNicknameAndExpiresAtAfter(nickname: String, after: Instant): Int
}
