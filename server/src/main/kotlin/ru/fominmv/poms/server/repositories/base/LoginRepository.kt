package ru.fominmv.poms.server.repositories.base

import org.springframework.data.repository.NoRepositoryBean

import ru.fominmv.poms.server.model.interfaces.immutable.WithLogin

import java.util.*

@NoRepositoryBean
interface LoginRepository<T : WithLogin> {
    fun findByLogin(login: String): Optional<T>

    fun existsByLogin(login: String): Boolean

    fun deleteByLogin(login: String): Long
}
