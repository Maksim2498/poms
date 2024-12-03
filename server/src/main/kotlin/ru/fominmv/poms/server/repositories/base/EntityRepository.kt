package ru.fominmv.poms.server.repositories.base

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.PagingAndSortingRepository
import org.springframework.data.repository.NoRepositoryBean

@NoRepositoryBean
interface EntityRepository<T, Id> :
    ResultDeleteRepository<T, Id>,
    JpaRepository<T, Id>,
    PagingAndSortingRepository<T, Id>
