package ru.fominmv.poms.server.repositories.entities

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

import ru.fominmv.poms.server.model.entities.User
import ru.fominmv.poms.server.repositories.base.*

import java.util.*

@Repository
interface UserRepository:
    EntityManagementRepository<User>,
    EntityRepository<User, UUID>,
    LoginRepository<User>
{
    companion object {
        private const val NICKNAME_QUERY_BODY = "FROM User u INNER JOIN u.internalNicknames n WHERE n.nickname = ?1"
    }

    // Creator

    fun findAllByInternalCreator(creator: User?, pageable: Pageable): Page<User>

    fun findAllByInternalCreator(creator: User?): List<User>

    fun countByInternalCreator(creator: User?): Long

    fun existsByInternalCreator(creator: User?): Boolean

    fun deleteAllByInternalCreator(creator: User?): Long

    // Nicknames

    @Query("SELECT u $NICKNAME_QUERY_BODY")
    fun findByNickname(login: String): Optional<User>

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN TRUE ELSE FALSE END $NICKNAME_QUERY_BODY")
    fun existsByNickname(login: String): Boolean

    @Modifying
    @Query("DELETE $NICKNAME_QUERY_BODY")
    fun deleteByNickname(login: String): Int
}
