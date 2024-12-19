package ru.fominmv.poms.server.services.model.accessors

import ru.fominmv.poms.libs.commons.text.strings.ext.toUuidOrNull

import java.util.UUID

interface ReferenceOrUuidAccessor<T : Any> :
    ReferenceAccessor<T>,
    IdAccessor<T, UUID>
{
    // New-checking

    fun checkIfAllReferenceOrIdsAreNew(referenceOrIds: Iterable<String>) =
        referenceOrIds.forEach(::checkIfReferenceOrIdIsNew)

    fun checkIfReferenceOrIdIsNew(referenceOrId: String) =
        referenceOrId.toUuidOrNull()?.let(::checkIfIdIsNew) ?: checkIfReferenceIsNew(referenceOrId)

    // Existence checking

    fun allExistsByReferenceOrId(referenceOrIds: Iterable<String>): Boolean =
        referenceOrIds.all(::existsByReferenceOrId)

    fun existsByReferenceOrId(referenceOrId: String): Boolean =
        referenceOrId.toUuidOrNull()?.let(::existsById) ?: existsByReference(referenceOrId)

    // Getting

    // - Forced

    fun getAllByReferenceOrId(referenceOrIds: Iterable<String>): List<T> =
        referenceOrIds.map(::getByReferenceOrId)

    fun getByReferenceOrId(referenceOrId: String): T =
        referenceOrId.toUuidOrNull()?.let(::getById) ?: getByReference(referenceOrId)

    // - Lenient

    fun tryGetAllByReferenceOrId(referenceOrIds: Iterable<String>): List<T> =
        referenceOrIds.mapNotNull(::getByReferenceOrIdOrNull)

    fun getByReferenceOrIdOrNull(referenceOrId: String): T? =
        referenceOrId.toUuidOrNull()?.let(::getByIdOrNull) ?: getByReferenceOrNull(referenceOrId)

    // Deletion

    // - Forced

    fun deleteAllByReferenceOrId(referenceOrIds: Iterable<String>) =
        referenceOrIds.forEach(::deleteByReferenceOrId)

    fun deleteByReferenceOrId(referenceOrId: String) =
        referenceOrId.toUuidOrNull()?.let(::deleteById) ?: deleteByReference(referenceOrId)

    // - Lenient

    fun tryDeleteAllByReferenceOrId(referenceOrIds: Iterable<String>): Long =
        referenceOrIds.count(::tryDeleteByReferenceOrId).toLong()

    fun tryDeleteByReferenceOrId(referenceOrId: String): Boolean =
        referenceOrId.toUuidOrNull()?.let(::tryDeleteById) ?: tryDeleteByReference(referenceOrId)
}
