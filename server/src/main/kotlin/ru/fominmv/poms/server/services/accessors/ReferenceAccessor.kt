package ru.fominmv.poms.server.services.accessors

import ru.fominmv.poms.server.errors.duplicate.ReferenceDuplicateException
import ru.fominmv.poms.server.errors.not_found.NotFoundByReferenceException

interface ReferenceAccessor<T> {
    // Check

    fun checkIfAllReferencesIsNew(references: Iterable<String>) =
        references.forEach(::checkIfReferenceIsNew)

    fun checkIfReferenceIsNew(reference: String) {
        if (existsByReference(reference))
            onReferenceDuplicate(reference)
    }
    
    // Exists

    fun allExistsByReference(references: Iterable<String>): Boolean =
        references.all(::existsByReference)

    fun existsByReference(reference: String): Boolean =
        getByReferenceOrNull(reference) != null

    // Get

    fun getAllByReference(references: Iterable<String>): List<T> =
        references.map(::getByReference)

    fun getByReference(reference: String): T =
        getByReferenceOrNull(reference) ?: onNotFoundByReference(reference)

    // Get or null

    fun tryGetAllByReference(references: Iterable<String>): List<T> =
        references.mapNotNull(::getByReferenceOrNull)

    fun getByReferenceOrNull(reference: String): T?

    // Delete

    fun deleteAllByReference(references: Iterable<String>) =
        references.forEach(::deleteByReference)

    fun deleteByReference(reference: String) {
        if (!tryDeleteByReference(reference))
            onNotFoundByReference(reference)
    }

    // Try delete

    fun tryDeleteAllByReference(references: Iterable<String>): Long =
        references.count(::tryDeleteByReference).toLong()

    fun tryDeleteByReference(reference: String): Boolean

    // Errors

    fun onReferenceDuplicate(reference: String): Nothing =
        throw ReferenceDuplicateException(reference)

    fun onNotFoundByReference(reference: String): Nothing =
        throw NotFoundByReferenceException(reference)
}
