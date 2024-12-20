package ru.fominmv.poms.server.repositories.base

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.Repository

import ru.fominmv.poms.server.model.entities.User

@NoRepositoryBean
interface ByOwnerAccessRepository<T, Id> : Repository<T, Id> {
    fun existsByInternalOwner(owner: User?): Boolean

    fun countByInternalOwner(owner: User?): Long

    fun findAllByInternalOwner(owner: User?): List<T>

    fun findAllByInternalOwner(owner: User?, pageable: Pageable): Page<T>

    fun deleteAllByInternalOwner(owner: User?): Long
}
