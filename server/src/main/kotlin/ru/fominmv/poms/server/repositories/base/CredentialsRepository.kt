package ru.fominmv.poms.server.repositories.base

import org.springframework.data.repository.NoRepositoryBean

import ru.fominmv.poms.server.model.interfaces.immutable.WithCredentials

import java.util.*

@NoRepositoryBean
interface CredentialsRepository<T : WithCredentials> {
    fun findByLogin(login: String): Optional<T>

    fun existsByLogin(login: String): Boolean

    fun deleteByLogin(login: String): Long
}
