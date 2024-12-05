package ru.fominmv.poms.server.services

import org.slf4j.LoggerFactory

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

import ru.fominmv.poms.libs.commons.numbers.ext.toBoolean
import ru.fominmv.poms.server.model.entities.AvatarStateGroup
import ru.fominmv.poms.server.model.entities.Server
import ru.fominmv.poms.server.repositories.entities.ServerRepository
import ru.fominmv.poms.server.services.accessors.bulk.BulkAccessor
import ru.fominmv.poms.server.services.accessors.*

import java.time.Instant
import java.util.*

import kotlin.jvm.optionals.getOrNull

@Service
class ServerService(
    private val serverRepository: ServerRepository,
    private val passwordEncoder: PasswordEncoder,
) :
    BulkAccessor<Server>,

    Accessor<Server>,
    IdAccessor<Server, UUID>,
    LoginAccessor<Server>,
    SaveAccessor<Server>
{
    private val logger = LoggerFactory.getLogger(javaClass)

    // Existence check

    override fun exists(value: Server): Boolean =
        existsById(value.id)

    override fun existsById(id: UUID): Boolean =
        serverRepository.existsById(id)

    override fun existsByLogin(login: String): Boolean =
        serverRepository.existsByLogin(login)

    // Counting

    override fun count(): Long =
        serverRepository.count()

    // Getting

    // - Many

    override fun getAll(pageable: Pageable): Page<Server> =
        serverRepository.findAll(pageable)

    override fun getAll(): List<Server> =
        serverRepository.findAll()

    // - One

    override fun getByIdOrNull(id: UUID): Server? =
        serverRepository.findById(id).getOrNull()

    override fun getByLoginOrNull(login: String): Server? =
        serverRepository.findByLogin(login).getOrNull()

    // Deletion

    // - Many

    override fun deleteAll(): Long =
        serverRepository.deleteAllAndCount().toLong().also { deleted ->
            if (deleted > 0)
                logger.warn("Deleted all {} servers", deleted)
        }

    // - One

    override fun tryDelete(value: Server): Boolean =
        tryDeleteById(value.id)

    override fun tryDeleteById(id: UUID): Boolean =
        serverRepository.deleteByIdAndCount(id).toBoolean()

    override fun tryDeleteByLogin(login: String): Boolean =
        serverRepository.deleteByLogin(login).toBoolean()

    // Creation

    fun create(
        login: String,
        password: String,

        avatarStateGroup: AvatarStateGroup,

        publicAddress: String? = null,
        name: String? = null,
        description: String? = null,

        id: UUID = UUID.randomUUID(),
        now: Instant = Instant.now(),
        createdAt: Instant = now,
        modifiedAt: Instant = now,

        save: Boolean = true,
        encodePassword: Boolean = true,
    ): Server {
        checkIfLoginIsNew(login)

        var server = Server(
            login = login,
            password = if (encodePassword)
                passwordEncoder.encode(password)
            else
                password,

            avatarStateGroup = avatarStateGroup,

            publicAddress = publicAddress,
            name = name,
            description = description,

            id = getNewIdOrCheckIfNew(id),
            now = now,
            createdAt = createdAt,
            modifiedAt = modifiedAt,
        )

        if (save)
            server = persistToRepository(server)

        return server
    }

    // Saving

    override fun <S : Server> save(value: S): S {
        if (!exists(value))
            checkIfLoginIsNew(value.login)

        return persistToRepository(value)
    }

    private fun <S : Server> persistToRepository(value: S): S =
        serverRepository.persist(value).also {
            logger.debug("Saved {}", it)
        }
}
