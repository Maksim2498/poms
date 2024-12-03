package ru.fominmv.poms.server.repositories.base

import org.springframework.stereotype.Repository

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext

@Repository
class EntityManagementRepositoryImpl<T> : EntityManagementRepository<T> {
    @PersistenceContext
    private lateinit var entityManager: EntityManager

    override fun <S : T> refresh(entity: S): S {
        entityManager.refresh(entity)
        return entity
    }

    override fun <S : T> persist(entity: S): S {
        entityManager.persist(entity)
        return entity
    }

    override fun <S : T > merge(entity: S): S =
        entityManager.merge(entity)

    override fun detach(entity: T) =
        entityManager.detach(entity)
}
