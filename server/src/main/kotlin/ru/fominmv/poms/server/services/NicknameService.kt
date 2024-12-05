package ru.fominmv.poms.server.services

import org.slf4j.LoggerFactory

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

import ru.fominmv.poms.libs.commons.numbers.ext.toBoolean
import ru.fominmv.poms.server.errors.limit.NicknameLimitExceededException
import ru.fominmv.poms.server.model.entities.*
import ru.fominmv.poms.server.repositories.entities.NicknameRepository
import ru.fominmv.poms.server.services.accessors.bulk.*
import ru.fominmv.poms.server.services.accessors.*

import java.util.UUID

import kotlin.jvm.optionals.getOrNull

@Service
class NicknameService(private val nicknameRepository: NicknameRepository) :
    BulkAccessor<Nickname>,
    BulkOwnerAccessor<Nickname>,

    Accessor<Nickname>,
    IdAccessor<Nickname, UUID>,
    NicknameAccessor<Nickname>,
    SaveAccessor<Nickname>
{
    private val logger = LoggerFactory.getLogger(javaClass)

    // Existence check

    override fun existsByOwner(owner: User?): Boolean =
        nicknameRepository.existsByInternalOwner(owner)

    override fun exists(value: Nickname): Boolean =
        existsById(value.id)

    override fun existsById(id: UUID): Boolean =
        nicknameRepository.existsById(id)

    override fun existsByNickname(nickname: String): Boolean =
        nicknameRepository.existsByNickname(nickname)

    // Counting

    override fun count(): Long =
        nicknameRepository.count()

    override fun countOwner(owner: User?): Long =
        nicknameRepository.countByInternalOwner(owner)

    // Getting

    // - Many

    override fun getAll(pageable: Pageable): Page<Nickname> =
        nicknameRepository.findAll(pageable)

    override fun getAll(): List<Nickname> =
        nicknameRepository.findAll()

    override fun getAllByOwner(owner: User?, pageable: Pageable): Page<Nickname> =
        nicknameRepository.findAllByInternalOwner(owner, pageable)

    override fun getAllByOwner(owner: User?): List<Nickname> =
        nicknameRepository.findAllByInternalOwner(owner)

    // - One

    override fun getByIdOrNull(id: UUID): Nickname? =
        nicknameRepository.findById(id).getOrNull()

    override fun getByNicknameOrNull(nickname: String): Nickname? =
        nicknameRepository.findByNickname(nickname).getOrNull()

    // Deletion

    // - Many

    override fun deleteAll(): Long =
        nicknameRepository.deleteAllAndCount().toLong().also { deleted ->
            if (deleted > 0)
                logger.warn("Deleted all {} nicknames", deleted)
        }

    override fun deleteAllByOwner(owner: User?): Long =
        nicknameRepository.deleteAllByInternalOwner(owner)

    // - One

    override fun tryDelete(value: Nickname): Boolean =
        tryDeleteById(value.id)

    override fun tryDeleteById(id: UUID): Boolean =
        nicknameRepository.deleteByIdAndCount(id).toBoolean()

    override fun tryDeleteByNickname(nickname: String): Boolean =
        nicknameRepository.deleteByNickname(nickname).toBoolean()

    // Creation

    fun create(
        nickname: String,
        owner: User,
        id: UUID? = null,
        save: Boolean = false,
    ): Nickname {
        if (owner.maxNicknames >= owner.nicknames.size)
            throw NicknameLimitExceededException()

        return create(
            nickname = nickname,
            owner = owner,
            id = id,
            save = save,
        )
    }

    fun create(
        nickname: String,
        invite: Invite,
        id: UUID? = null,
        save: Boolean = false,
    ): Nickname =
        create(
            nickname = nickname,
            invite = invite,
            id = id,
            save = save,
        )

    private fun create(
        nickname: String,

        owner: User? = null,
        invite: Invite? = null,

        id: UUID? = null,

        save: Boolean = true,
    ): Nickname {
        checkIfNicknameIsNew(nickname)

        var nicknameEntity = Nickname(
            nickname = nickname,

            owner = owner,
            invite = invite,

            id = getNewIdOrCheckIfNew(id),
        )

        if (save)
            nicknameEntity = persistToRepository(nicknameEntity)

        return nicknameEntity
    }

    // Saving

    override fun <S : Nickname> save(value: S): S {
        if (!exists(value))
            checkIfNicknameIsNew(value.nickname)

        return persistToRepository(value)
    }

    private fun <S : Nickname> persistToRepository(value: S): S =
        nicknameRepository.persist(value).apply {
            logger.debug("Saved {}", this)
        }
}
