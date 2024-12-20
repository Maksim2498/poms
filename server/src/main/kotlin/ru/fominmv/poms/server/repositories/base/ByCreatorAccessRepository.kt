package ru.fominmv.poms.server.repositories.base

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.Repository

import ru.fominmv.poms.server.model.entities.User

@NoRepositoryBean
interface ByCreatorAccessRepository<T, Id> : Repository<T, Id> {
    fun existsByInternalCreator(creator: User?): Boolean

    fun countByInternalCreator(creator: User?): Long

    fun findAllByInternalCreator(creator: User?): List<T>

    fun findAllByInternalCreator(creator: User?, pageable: Pageable): Page<T>

    fun deleteAllByInternalCreator(creator: User?): Long
}
