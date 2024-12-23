package ru.fominmv.poms.server.services.model

import org.slf4j.LoggerFactory

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

import ru.fominmv.poms.libs.commons.numbers.ext.toBoolean
import ru.fominmv.poms.server.model.embedabbles.UserRights
import ru.fominmv.poms.server.model.entities.*
import ru.fominmv.poms.server.repositories.entities.InviteRepository
import ru.fominmv.poms.server.services.model.accessors.expirable.bulk.*
import ru.fominmv.poms.server.services.model.accessors.expirable.*
import ru.fominmv.poms.server.services.model.accessors.*

import java.time.Instant
import java.util.UUID

import kotlin.jvm.optionals.getOrNull

@Service
class InviteService(
    private val inviteRepository: InviteRepository,
    private val nicknameService: NicknameService,
) :
    BulkExpirableValueAccessor<Invite>,
    BulkExpirableCreatorAccessor<Invite>,

    ValueAccessor<Invite>,
    ExpirableIdAccessor<Invite, UUID>,
    ExpirableNicknameAccessor<Invite>,

    SaveAccessor<Invite>
{
    private val logger = LoggerFactory.getLogger(javaClass)

    // Existence checking

    override fun existsByCreator(creator: User?, state: ExpirableState, now: Instant): Boolean =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.existsByInternalCreatorAndExpiresAtAfter(creator, now)
            ExpirableState.EXPIRED -> inviteRepository.existsByInternalCreatorAndExpiresAtBefore(creator, now)
            ExpirableState.ANY -> inviteRepository.existsByInternalCreator(creator)
        }

    override fun exists(value: Invite): Boolean =
        existsById(value.id)

    override fun existsById(id: UUID, state: ExpirableState, now: Instant): Boolean =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.existsByIdAndExpiresAtAfter(id, now)
            ExpirableState.EXPIRED -> inviteRepository.existsByIdAndExpiresAtBefore(id, now)
            ExpirableState.ANY -> inviteRepository.existsById(id)
        }

    override fun existsByNickname(nickname: String, state: ExpirableState, now: Instant): Boolean =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.existsByNicknameAndExpiresAtAfter(nickname, now)
            ExpirableState.EXPIRED -> inviteRepository.existsByNicknameAndExpiresAtBefore(nickname, now)
            ExpirableState.ANY -> inviteRepository.existsByNickname(nickname)
        }

    // Counting

    override fun count(state: ExpirableState, now: Instant): Long =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.countByExpiresAtAfter(now)
            ExpirableState.EXPIRED -> inviteRepository.countByExpiresAtBefore(now)
            ExpirableState.ANY -> inviteRepository.count()
        }

    override fun countByCreator(creator: User?, state: ExpirableState, now: Instant): Long =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.countByInternalCreatorAndExpiresAtAfter(creator, now)
            ExpirableState.EXPIRED -> inviteRepository.countByInternalCreatorAndExpiresAtBefore(creator, now)
            ExpirableState.ANY -> inviteRepository.countByInternalCreator(creator)
        }

    // Getting

    // - Many

    override fun getAll(state: ExpirableState, now: Instant): List<Invite> =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.findAllByExpiresAtAfter(now)
            ExpirableState.EXPIRED -> inviteRepository.findAllByExpiresAtBefore(now)
            ExpirableState.ANY -> inviteRepository.findAll()
        }

    override fun getAll(pageable: Pageable, state: ExpirableState, now: Instant): Page<Invite> =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.findAllByExpiresAtAfter(now, pageable)
            ExpirableState.EXPIRED -> inviteRepository.findAllByExpiresAtBefore(now, pageable)
            ExpirableState.ANY -> inviteRepository.findAll(pageable)
        }

    override fun getAllByCreator(creator: User?, state: ExpirableState, now: Instant): List<Invite> =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.findAllByInternalCreatorAndExpiresAtAfter(creator, now)
            ExpirableState.EXPIRED -> inviteRepository.findAllByInternalCreatorAndExpiresAtBefore(creator, now)
            ExpirableState.ANY -> inviteRepository.findAllByInternalCreator(creator)
        }

    override fun getAllByCreator(creator: User?, pageable: Pageable, state: ExpirableState, now: Instant): Page<Invite> =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.findAllByInternalCreatorAndExpiresAtAfter(creator, now, pageable)
            ExpirableState.EXPIRED -> inviteRepository.findAllByInternalCreatorAndExpiresAtBefore(creator , now, pageable)
            ExpirableState.ANY -> inviteRepository.findAllByInternalCreator(creator, pageable)
        }

    // - One

    override fun getByIdOrNull(id: UUID, state: ExpirableState, now: Instant): Invite? =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.findByIdAndExpiresAtAfter(id, now)
            ExpirableState.EXPIRED -> inviteRepository.findByIdAndExpiresAtBefore(id, now)
            ExpirableState.ANY -> inviteRepository.findById(id)
        }.getOrNull()

    override fun getByNicknameOrNull(nickname: String, state: ExpirableState, now: Instant): Invite? =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.findByNicknameAndExpiresAtAfter(nickname, now)
            ExpirableState.EXPIRED -> inviteRepository.findByNicknameAndExpiresAtBefore(nickname, now)
            ExpirableState.ANY -> inviteRepository.findByNickname(nickname)
        }.getOrNull()

    // Deletion

    // - Many

    override fun deleteAll(state: ExpirableState, now: Instant): Long =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.deleteAllByExpiresAtAfter(now)
            ExpirableState.EXPIRED -> inviteRepository.deleteAllByExpiresAtBefore(now)
            ExpirableState.ANY -> inviteRepository.deleteAllAndCount().toLong()
        }.also { deleted ->
            if (deleted > 0)
                logger.warn("Deleted all {} invites", deleted)
        }

    override fun deleteAllByCreator(creator: User?, state: ExpirableState, now: Instant): Long =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.deleteAllByInternalCreatorAndExpiresAtAfter(creator, now)
            ExpirableState.EXPIRED -> inviteRepository.deleteAllByInternalCreatorAndExpiresAtBefore(creator, now)
            ExpirableState.ANY -> inviteRepository.deleteAllByInternalCreator(creator)
        }.also { deleted ->
            if (deleted > 0)
                logger.warn("Deleted all {} invites created by {}", deleted, creator)
        }

    // - One

    override fun tryDelete(value: Invite): Boolean =
        inviteRepository.deleteByIdAndCount(value.id).toBoolean().also { deleted ->
            if (deleted)
                logger.debug("Deleted invite {}", value)
        }

    override fun tryDeleteById(id: UUID, state: ExpirableState, now: Instant): Boolean =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.deleteByIdAndExpiresAtAfter(id, now)
            ExpirableState.EXPIRED -> inviteRepository.deleteByIdAndExpiresAtBefore(id, now)
            ExpirableState.ANY -> inviteRepository.deleteByIdAndCount(id).toLong()
        }.toBoolean().also { deleted ->
            if (deleted)
                logger.debug("Deleted invite with ID {}", id)
        }

    override fun tryDeleteByNickname(nickname: String, state: ExpirableState, now: Instant): Boolean =
        when (state) {
            ExpirableState.NON_EXPIRED -> inviteRepository.deleteByNicknameAndExpiresAtAfter(nickname, now)
            ExpirableState.EXPIRED -> inviteRepository.deleteByNicknameAndExpiresAtBefore(nickname, now)
            ExpirableState.ANY -> inviteRepository.deleteByNickname(nickname)
        }.toBoolean()

    // Creation

    fun create(
        nickname: String,
        rights: UserRights = UserRights(),

        creator: User? = null,

        id: UUID? = null,
        now: Instant = Instant.now(),
        expiresAt: Instant = now.plus(Invite.DEFAULT_DURATION),

        save: Boolean = true,
    ): Invite {
        nicknameService.checkIfNicknameIsNew(nickname)

        var invite = Invite(
            nickname = Nickname(nickname),
            creator = creator,

            rights = rights,

            id = getNewIdOrCheckIfNew(id),
            now = now,
            expiresAt = expiresAt,
        )

        if (save)
            invite = persistToRepository(invite)

        return invite
    }

    // Saving

    override fun <S : Invite> save(value: S): S {
        if (!exists(value))
            value.nickname?.nickname?.let(nicknameService::checkIfNicknameIsNew)

        return persistToRepository(value)
    }

    private fun <S : Invite> persistToRepository(value: S): S =
        inviteRepository.persist(value).also {
            logger.debug("Saved {}", value)
        }
}
