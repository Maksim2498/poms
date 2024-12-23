package ru.fominmv.poms.server.services.model

import org.slf4j.LoggerFactory

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

import ru.fominmv.poms.libs.commons.numbers.ext.toBoolean
import ru.fominmv.poms.server.errors.limit.NicknameLimitExceededException
import ru.fominmv.poms.server.model.embedabbles.*
import ru.fominmv.poms.server.model.entities.User
import ru.fominmv.poms.server.repositories.entities.UserRepository
import ru.fominmv.poms.server.services.model.accessors.bulk.*
import ru.fominmv.poms.server.services.model.accessors.*

import java.time.Instant
import java.util.UUID

import kotlin.jvm.optionals.getOrNull

@Service
class UserService(
    private val userRepository: UserRepository,
    private val nicknameService: NicknameService,
    private val passwordEncoder: PasswordEncoder,
) :
    BulkValueAccessor<User>,
    BulkCreatorAccessor<User>,

    ValueAccessor<User>,
    ReferenceOrUuidAccessor<User>,
    NicknameAccessor<User>,

    SaveAccessor<User>
{
    private val logger = LoggerFactory.getLogger(javaClass)

    // Existence checking

    override fun existsByCreator(creator: User?): Boolean =
        userRepository.existsByInternalCreator(creator)

    override fun exists(value: User): Boolean =
        existsById(value.id)

    override fun existsById(id: UUID): Boolean =
        userRepository.existsById(id)

    override fun existsByReference(reference: String): Boolean =
        userRepository.existsByReferenceIgnoreCase(reference)

    override fun existsByNickname(nickname: String): Boolean =
        userRepository.existsByNickname(nickname)

    // Counting

    override fun count(): Long =
        userRepository.count()

    override fun countByCreator(creator: User?): Long =
        userRepository.countByInternalCreator(creator)

    // Getting

    // - Many

    override fun getAll(): List<User> =
        userRepository.findAll()

    override fun getAll(pageable: Pageable): Page<User> =
        userRepository.findAll(pageable)

    override fun getAllByCreator(creator: User?): List<User> =
        userRepository.findAllByInternalCreator(creator)

    override fun getAllByCreator(creator: User?, pageable: Pageable): Page<User> =
        userRepository.findAllByInternalCreator(creator, pageable)

    // - One

    override fun getByIdOrNull(id: UUID): User? =
        userRepository.findById(id).getOrNull()

    override fun getByReferenceOrNull(reference: String): User? =
        userRepository.findByReferenceIgnoreCase(reference).getOrNull()

    override fun getByNicknameOrNull(nickname: String): User? =
        userRepository.findByNickname(nickname).getOrNull()

    // Deletion

    // - Many

    override fun deleteAll(): Long =
        userRepository.deleteAllAndCount().toLong().also { deleted ->
            if (deleted > 0)
                logger.warn("Deleted all {} user(s)", deleted)
        }

    override fun deleteAllByCreator(creator: User?): Long =
        userRepository.deleteAllByInternalCreator(creator).also { deleted ->
            if (deleted > 0)
                logger.warn("Deleted all {} user(s) created by {}", deleted, creator)
        }

    // - One

    override fun tryDelete(value: User): Boolean =
        userRepository.deleteByIdAndCount(value.id).toBoolean().also { deleted ->
            if (deleted)
                logger.debug("Deleted user {}", value)
        }

    override fun tryDeleteById(id: UUID): Boolean =
        userRepository.deleteByIdAndCount(id).toBoolean().also { deleted ->
            if (deleted)
                logger.debug("Deleted user with ID {}", id)
        }

    override fun tryDeleteByReference(reference: String): Boolean =
        userRepository.deleteByReferenceIgnoreCase(reference).toBoolean().also { deleted ->
            if (deleted)
                logger.debug("Deleted user with reference {}", reference)
        }

    override fun tryDeleteByNickname(nickname: String): Boolean =
        userRepository.deleteByNickname(nickname).toBoolean().also { deleted ->
            if (deleted)
                logger.debug("Deleted user with nickname {}", nickname)
        }

    // Creation

    fun create(
        reference: String,
        password: String,

        nicknames: Iterable<String> = emptySet(),
        maxNicknames: Int = User.DEFAULT_MAX_NICKNAMES,

        rights: UserRights = UserRights(),
        isBlocked: Boolean = User.DEFAULT_IS_BLOCKED,

        creator: User? = null,
        isCreatedViaInvite: Boolean = User.DEFAULT_IS_CREATED_VIA_INVITE,

        id: UUID? = null,
        now: Instant = Instant.now(),

        encodePassword: Boolean = true,
        save: Boolean = true,
    ): User {
        checkIfReferenceIsNew(reference)
        nicknameService.checkIfAllNicknamesAreNew(nicknames)

        var user = User(
            reference = reference,
            password = if (encodePassword)
                passwordEncoder.encode(password)
            else
                password,

            nicknames = nicknames,
            maxNicknames = maxNicknames,

            rights = rights,
            isBlocked = isBlocked,

            creator = creator,
            isCreatedViaInvite = isCreatedViaInvite,

            id = getNewIdOrCheckIfNew(id),
            now = now,
        )

        if (user.nicknames.size > user.maxNicknames)
            throw NicknameLimitExceededException(user.maxNicknames)

        if (save)
            user = persistToRepository(user)

        return user
    }

    // Saving

    override fun <S : User> save(value: S): S {
        if (!exists(value)) {
            checkIfReferenceIsNew(value.reference)
            nicknameService.checkIfAllNicknamesAreNew(value.nicknames.map { it.nickname })

            if (value.nicknames.size > value.maxNicknames)
                throw NicknameLimitExceededException(value.maxNicknames)
        }

        return persistToRepository(value)
    }

    private fun <S : User> persistToRepository(value: S): S =
        userRepository.persist(value).also {
            logger.debug("Saved {}", it)
        }
}
