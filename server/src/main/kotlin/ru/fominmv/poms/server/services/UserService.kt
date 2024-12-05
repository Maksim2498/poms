package ru.fominmv.poms.server.services

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
import ru.fominmv.poms.server.services.accessors.bulk.*
import ru.fominmv.poms.server.services.accessors.*

import java.time.Instant
import java.util.UUID

import kotlin.jvm.optionals.getOrNull

@Service
class UserService(
    private val userRepository: UserRepository,
    private val nicknameService: NicknameService,
    private val passwordEncoder: PasswordEncoder,
) :
    BulkAccessor<User>,
    BulkCreatorAccessor<User>,

    Accessor<User>,
    IdAccessor<User, UUID>,
    LoginAccessor<User>,
    NicknameAccessor<User>,
    SaveAccessor<User>
{
    private val logger = LoggerFactory.getLogger(javaClass)

    // Existence check

    override fun existsByCreator(creator: User?): Boolean =
        userRepository.existsByInternalCreator(creator)

    override fun exists(value: User): Boolean =
        existsById(value.id)

    override fun existsById(id: UUID): Boolean =
        userRepository.existsById(id)

    override fun existsByLogin(login: String): Boolean =
        userRepository.existsByLogin(login)

    override fun existsByNickname(nickname: String): Boolean =
        userRepository.existsByNickname(nickname)

    // Counting

    override fun count(): Long =
        userRepository.count()

    override fun countCreator(creator: User?): Long =
        userRepository.countByInternalCreator(creator)

    // Getting

    // - Many

    override fun getAll(pageable: Pageable): Page<User> =
        userRepository.findAll(pageable)

    override fun getAll(): List<User> =
        userRepository.findAll()

    override fun getAllByCreator(creator: User?, pageable: Pageable): Page<User> =
        userRepository.findAllByInternalCreator(creator, pageable)

    override fun getAllByCreator(creator: User?): List<User> =
        userRepository.findAllByInternalCreator(creator)

    // - One

    override fun getByIdOrNull(id: UUID): User? =
        userRepository.findById(id).getOrNull()

    override fun getByLoginOrNull(login: String): User? =
        userRepository.findByLogin(login).getOrNull()

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
                logger.warn("Deleted all {} user(s) with creator {}", deleted, creator)
        }

    // - One

    override fun tryDelete(value: User): Boolean =
        tryDeleteById(value.id)

    override fun tryDeleteById(id: UUID): Boolean =
        userRepository.deleteByIdAndCount(id).toBoolean()

    override fun tryDeleteByLogin(login: String): Boolean =
        userRepository.deleteByLogin(login).toBoolean()

    override fun tryDeleteByNickname(nickname: String): Boolean =
        userRepository.deleteByNickname(nickname).toBoolean()

    // Creation

    fun create(
        login: String,
        password: String,

        nicknames: Iterable<String> = emptySet(),
        maxNicknames: Int = User.DEFAULT_MAX_NICKNAMES,

        rights: UserRights = UserRights(),
        isBlocked: Boolean = false,

        creator: User? = null,
        isCreatedViaInvite: Boolean = false,

        id: UUID? = null,
        now: Instant = Instant.now(),
        createdAt: Instant = now,
        modifiedAt: Instant = now,

        encodePassword: Boolean = true,
        save: Boolean = true,
    ): User {
        checkIfLoginIsNew(login)
        nicknameService.checkIfAllNicknamesIsNew(nicknames)

        var user = User(
            login = login,
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
            createdAt = createdAt,
            modifiedAt = modifiedAt,
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
            checkIfLoginIsNew(value.login)
            nicknameService.checkIfAllNicknamesIsNew(value.nicknames.map { it.nickname })

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
