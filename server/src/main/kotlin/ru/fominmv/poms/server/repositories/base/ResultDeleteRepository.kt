package ru.fominmv.poms.server.repositories.base

import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.Repository

@NoRepositoryBean
interface ResultDeleteRepository<T, Id> : Repository<T, Id> {
    @Modifying
    @Query("DELETE FROM #{#entityName}")
    fun deleteAllAndCount(): Int

    @Modifying
    @Query("DELETE FROM #{#entityName} WHERE id = ?1")
    fun deleteByIdAndCount(id: Id): Int
}
