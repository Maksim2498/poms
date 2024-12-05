package ru.fominmv.poms.server.repositories.base

import org.springframework.data.repository.NoRepositoryBean

import ru.fominmv.poms.server.model.interfaces.immutable.WithLogin

import java.util.*

@NoRepositoryBean
interface LoginRepository<T : WithLogin> {
    fun findByLoginIgnoreCase(login: String): Optional<T>

    fun existsByLoginIgnoreCase(login: String): Boolean

    fun deleteByLoginIgnoreCase(login: String): Long
}
