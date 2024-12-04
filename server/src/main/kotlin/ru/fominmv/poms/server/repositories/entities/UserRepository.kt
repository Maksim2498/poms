package ru.fominmv.poms.server.repositories.entities

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Repository
import ru.fominmv.poms.server.model.entities.Nickname

import ru.fominmv.poms.server.model.entities.User
import ru.fominmv.poms.server.repositories.base.*

import java.util.*

@Repository
interface UserRepository:
    EntityManagementRepository<User>,
    EntityRepository<User, UUID>,
    LoginRepository<User>
{
    // Creator

    fun findAllByInternalCreator(creator: User?, pageable: Pageable): Page<Nickname>

    fun findAllByInternalCreator(creator: User?): List<Nickname>

    fun countByInternalCreator(creator: User?): Long

    fun existsByInternalCreator(creator: User?): Boolean

    fun deleteAllByInternalCreator(creator: User?): Long
}
