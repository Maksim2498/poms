package ru.fominmv.poms.server.repositories.base

interface EntityManagementRepository<T> {
    fun <S : T> refresh(entity: S): S

    fun <S : T> persist(entity: S): S

    fun <S : T> merge(entity: S): S

    fun detach(entity: T)
}
