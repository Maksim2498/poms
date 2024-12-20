package ru.fominmv.poms.server.repositories.base

import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.Repository

import java.util.*

@NoRepositoryBean
interface ByNicknameAccessRepository<T, Id> : Repository<T, Id> {
    fun findByNickname(nickname: String): Optional<T>

    fun existsByNickname(nickname: String): Boolean

    fun deleteByNickname(nickname: String): Int
}
