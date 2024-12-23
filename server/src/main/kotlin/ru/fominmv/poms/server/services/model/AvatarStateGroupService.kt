package ru.fominmv.poms.server.services.model

import org.slf4j.LoggerFactory

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

import ru.fominmv.poms.libs.commons.numbers.ext.toBoolean
import ru.fominmv.poms.server.model.entities.AvatarStateGroup
import ru.fominmv.poms.server.repositories.entities.AvatarStateGroupRepository
import ru.fominmv.poms.server.services.model.accessors.bulk.BulkValueAccessor
import ru.fominmv.poms.server.services.model.accessors.*

import java.time.Instant
import java.util.*

import kotlin.jvm.optionals.getOrNull

@Service
class AvatarStateGroupService(private val avatarStateGroupRepository: AvatarStateGroupRepository) :
    BulkValueAccessor<AvatarStateGroup>,

    ValueAccessor<AvatarStateGroup>,
    ReferenceOrUuidAccessor<AvatarStateGroup>,

    SaveAccessor<AvatarStateGroup>
{
    private val logger = LoggerFactory.getLogger(javaClass)

    // Existence checking

    override fun exists(value: AvatarStateGroup): Boolean =
        existsById(value.id)

    override fun existsById(id: UUID): Boolean =
        avatarStateGroupRepository.existsById(id)

    override fun existsByReference(reference: String): Boolean =
        avatarStateGroupRepository.existsByReferenceIgnoreCase(reference)

    // Counting

    override fun count(): Long =
        avatarStateGroupRepository.count()

    // Getting

    // - Many

    override fun getAll(): List<AvatarStateGroup> =
        avatarStateGroupRepository.findAll()

    override fun getAll(pageable: Pageable): Page<AvatarStateGroup> =
        avatarStateGroupRepository.findAll(pageable)

    // - One

    override fun getByIdOrNull(id: UUID): AvatarStateGroup? =
        avatarStateGroupRepository.findById(id).getOrNull()

    override fun getByReferenceOrNull(reference: String): AvatarStateGroup? =
        avatarStateGroupRepository.findByReferenceIgnoreCase(reference).getOrNull()

    // Deletion

    // - Many

    override fun deleteAll(): Long =
        avatarStateGroupRepository.deleteAllAndCount().toLong().also { deleted ->
            if (deleted > 0)
                logger.warn("Delete all {} avatar state group(s)", deleted)
        }

    // - One

    override fun tryDelete(value: AvatarStateGroup): Boolean =
        avatarStateGroupRepository.deleteByIdAndCount(value.id).toBoolean().also { deleted ->
            if (deleted)
                logger.debug("Deleted avatar state group {}", value)
        }

    override fun tryDeleteById(id: UUID): Boolean =
        avatarStateGroupRepository.deleteByIdAndCount(id).toBoolean().also { deleted ->
            if (deleted)
                logger.debug("Deleted avatar state group with id {}", id)
        }

    override fun tryDeleteByReference(reference: String): Boolean =
        avatarStateGroupRepository.deleteByReferenceIgnoreCase(reference).toBoolean().also { deleted ->
            if (deleted)
                logger.debug("Deleted avatar state group with reference {}", reference)
        }

    // Creation

    fun create(
        reference: String,

        name: String? = null,
        description: String? = null,

        id: UUID? = null,
        now: Instant = Instant.now(),

        save: Boolean = true,
    ): AvatarStateGroup {
        checkIfReferenceIsNew(reference)

        var group = AvatarStateGroup(
            reference = reference,

            name = name,
            description =description,

            id = getNewIdOrCheckIfNew(id),
            now = now,
        )

        if (save)
            group = persistToRepository(group)

        return group
    }

    // Saving

    override fun <S : AvatarStateGroup> save(value: S): S {
        if (!exists(value))
            checkIfReferenceIsNew(value.reference)

        return persistToRepository(value)
    }

    private fun <S : AvatarStateGroup> persistToRepository(value: S): S =
        avatarStateGroupRepository.persist(value).also {
            logger.debug("Saved {}", it)
        }
}
