package ru.fominmv.poms.server.repositories.entities

import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

import ru.fominmv.poms.server.model.entities.*
import ru.fominmv.poms.server.repositories.base.*

import java.time.Instant
import java.util.*

@Repository
interface InviteRepository :
    EntityManagementRepository<Invite>,
    EntityRepository<Invite, UUID>,
    ByCreatorAccessRepository<Invite, UUID>,
    ByCreatorAndExpiresAtAccessRepository<Invite, UUID>,
    ByExpiresAtAccessRepository<Invite, UUID>,
    ByIdAndExpiresAtAccessRepository<Invite, UUID>,
    ByNicknameAccessRepository<Invite, UUID>,
    ByNicknameAndExpiresAtAccessRepository<Invite, UUID>
{
    companion object {
        private const val INVITE_ENTITY_ALIAS = "i"
        private const val NICKNAME_ENTITY_ALIAS = "n"

        private const val NICKNAME_QUERY_BODY = "FROM #{#entityName} $INVITE_ENTITY_ALIAS INNER JOIN i.internalNickname $NICKNAME_ENTITY_ALIAS WHERE n.nickname = ?1"
        private const val NICKNAME_AND_EXPIRES_AT_BEFORE_QUERY_BODY = "$NICKNAME_QUERY_BODY AND $INVITE_ENTITY_ALIAS.expiresAt < ?2"
        private const val NICKNAME_AND_EXPIRES_AT_AFTER_QUERY_BODY = "$NICKNAME_QUERY_BODY AND $INVITE_ENTITY_ALIAS.expiresAt > ?2"

        private const val FIND_SELECT_STATEMENT = "SELECT $INVITE_ENTITY_ALIAS"
        private const val EXISTS_SELECT_STATEMENT = "SELECT CASE WHEN COUNT($INVITE_ENTITY_ALIAS) > 0 THEN TRUE ELSE FALSE END"
    }

    // Nickname

    @Query("$EXISTS_SELECT_STATEMENT $NICKNAME_QUERY_BODY")
    override fun existsByNickname(nickname: String): Boolean

    @Query("$FIND_SELECT_STATEMENT $NICKNAME_QUERY_BODY")
    override fun findByNickname(nickname: String): Optional<Invite>

    @Modifying
    @Query("DELETE $NICKNAME_QUERY_BODY")
    override fun deleteByNickname(nickname: String): Int

    // Nickname and expires before

    @Query("$EXISTS_SELECT_STATEMENT $NICKNAME_AND_EXPIRES_AT_BEFORE_QUERY_BODY")
    override fun existsByNicknameAndExpiresAtBefore(nickname: String, after: Instant): Boolean

    @Query("$FIND_SELECT_STATEMENT $NICKNAME_AND_EXPIRES_AT_BEFORE_QUERY_BODY")
    override fun findByNicknameAndExpiresAtBefore(nickname: String, after: Instant): Optional<Invite>

    @Modifying
    @Query("DELETE $NICKNAME_AND_EXPIRES_AT_BEFORE_QUERY_BODY")
    override fun deleteByNicknameAndExpiresAtBefore(nickname: String, after: Instant): Int

    // Nickname and expires after

    @Query("$EXISTS_SELECT_STATEMENT $NICKNAME_AND_EXPIRES_AT_AFTER_QUERY_BODY")
    override fun existsByNicknameAndExpiresAtAfter(nickname: String, after: Instant): Boolean

    @Query("$FIND_SELECT_STATEMENT $NICKNAME_AND_EXPIRES_AT_AFTER_QUERY_BODY")
    override fun findByNicknameAndExpiresAtAfter(nickname: String, after: Instant): Optional<Invite>

    @Modifying
    @Query("DELETE $NICKNAME_AND_EXPIRES_AT_AFTER_QUERY_BODY")
    override fun deleteByNicknameAndExpiresAtAfter(nickname: String, after: Instant): Int
}
