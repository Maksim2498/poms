package ru.fominmv.poms.server.repositories.entities

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
    ByReferenceAccessRepository<User, UUID>,
    ByCreatorAccessRepository<User, UUID>,
    ByNicknameAccessRepository<User, UUID>
{
    companion object {
        private const val NICKNAME_QUERY_BODY = "FROM #{#entityName} u INNER JOIN u.internalNicknames n WHERE n.nickname = ?1"
    }

    // Nicknames

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN TRUE ELSE FALSE END $NICKNAME_QUERY_BODY")
    override fun existsByNickname(nickname: String): Boolean

    @Query("SELECT u $NICKNAME_QUERY_BODY")
    override fun findByNickname(nickname: String): Optional<User>

    @Modifying
    @Query("DELETE $NICKNAME_QUERY_BODY")
    override fun deleteByNickname(nickname: String): Int
}
