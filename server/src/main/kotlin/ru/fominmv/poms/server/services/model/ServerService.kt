package ru.fominmv.poms.server.services.model

import org.slf4j.LoggerFactory

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

import ru.fominmv.poms.libs.commons.numbers.ext.toBoolean
import ru.fominmv.poms.server.model.entities.*
import ru.fominmv.poms.server.repositories.entities.ServerRepository
import ru.fominmv.poms.server.services.model.accessors.bulk.BulkValueAccessor
import ru.fominmv.poms.server.services.model.accessors.*

import java.time.Instant
import java.util.*

import kotlin.jvm.optionals.getOrNull

@Service
class ServerService(
    private val serverRepository: ServerRepository,
    private val passwordEncoder: PasswordEncoder,
) :
    BulkValueAccessor<Server>,

    ValueAccessor<Server>,
    ReferenceOrUuidAccessor<Server>,

    SaveAccessor<Server>
{
    private val logger = LoggerFactory.getLogger(javaClass)

    // Existence checking

    override fun exists(value: Server): Boolean =
        existsById(value.id)

    override fun existsById(id: UUID): Boolean =
        serverRepository.existsById(id)

    override fun existsByReference(reference: String): Boolean =
        serverRepository.existsByReferenceIgnoreCase(reference)

    // Counting

    override fun count(): Long =
        serverRepository.count()

    // Getting

    // - Many

    override fun getAll(): List<Server> =
        serverRepository.findAll()

    override fun getAll(pageable: Pageable): Page<Server> =
        serverRepository.findAll(pageable)

    // - One

    override fun getByIdOrNull(id: UUID): Server? =
        serverRepository.findById(id).getOrNull()

    override fun getByReferenceOrNull(reference: String): Server? =
        serverRepository.findByReferenceIgnoreCase(reference).getOrNull()

    // Deletion

    // - Many

    override fun deleteAll(): Long =
        serverRepository.deleteAllAndCount().toLong().also { deleted ->
            if (deleted > 0)
                logger.warn("Deleted all {} server(s)", deleted)
        }

    // - One

    override fun tryDelete(value: Server): Boolean =
        serverRepository.deleteByIdAndCount(value.id).toBoolean().also { deleted ->
            if (deleted)
                logger.debug("Deleted server {}", value)
        }

    override fun tryDeleteById(id: UUID): Boolean =
        serverRepository.deleteByIdAndCount(id).toBoolean().also { deleted ->
            if (deleted)
                logger.debug("Deleted server with ID {}", id)
        }

    override fun tryDeleteByReference(reference: String): Boolean =
        serverRepository.deleteByReferenceIgnoreCase(reference).toBoolean().also { deleted ->
            if (deleted)
                logger.debug("Deleted server with reference {}", reference)
        }

    // Creation

    fun create(
        reference: String,
        password: String,

        avatarStateGroup: AvatarStateGroup,

        publicAddress: String? = null,
        name: String? = null,
        description: String? = null,

        isBlocked: Boolean = Server.DEFAULT_IS_BLOCKED,

        id: UUID? = null,
        createdAt: Instant = Instant.now(),

        encodePassword: Boolean = true,
        save: Boolean = true,
    ): Server {
        checkIfReferenceIsNew(reference)

        var server = Server(
            reference = reference,
            password = if (encodePassword)
                passwordEncoder.encode(password)
            else
                password,

            avatarStateGroup = avatarStateGroup,

            publicAddress = publicAddress,
            name = name,
            description = description,

            isBlocked = isBlocked,

            id = getNewIdOrCheckIfNew(id),
            createdAt = createdAt,
        )

        if (save)
            server = persistToRepository(server)

        return server
    }

    // Saving

    override fun <S : Server> save(value: S): S {
        if (!exists(value))
            checkIfReferenceIsNew(value.reference)

        return persistToRepository(value)
    }

    private fun <S : Server> persistToRepository(value: S): S =
        serverRepository.persist(value).also {
            logger.debug("Saved {}", it)
        }
}
