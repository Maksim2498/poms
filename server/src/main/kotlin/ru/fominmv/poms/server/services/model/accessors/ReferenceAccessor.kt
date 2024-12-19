package ru.fominmv.poms.server.services.model.accessors

import ru.fominmv.poms.server.errors.duplicate.ReferenceDuplicateException
import ru.fominmv.poms.server.errors.not_found.NotFoundByReferenceException

interface ReferenceAccessor<T : Any> {
    // New-checking

    fun checkIfAllReferencesAreNew(references: Iterable<String>) =
        references.forEach(::checkIfReferenceIsNew)

    fun checkIfReferenceIsNew(reference: String) {
        if (existsByReference(reference))
            onReferenceDuplicate(reference)
    }
    
    // Existence checking

    fun allExistsByReference(references: Iterable<String>): Boolean =
        references.all(::existsByReference)

    fun existsByReference(reference: String): Boolean =
        getByReferenceOrNull(reference) != null

    // Getting

    // - Forced

    fun getAllByReference(references: Iterable<String>): List<T> =
        references.map(::getByReference)

    fun getByReference(reference: String): T =
        getByReferenceOrNull(reference) ?: onNotFoundByReference(reference)

    // - Lenient

    fun tryGetAllByReference(references: Iterable<String>): List<T> =
        references.mapNotNull(::getByReferenceOrNull)

    fun getByReferenceOrNull(reference: String): T?

    // Deletion

    // - Forced

    fun deleteAllByReference(references: Iterable<String>) =
        references.forEach(::deleteByReference)

    fun deleteByReference(reference: String) {
        if (!tryDeleteByReference(reference))
            onNotFoundByReference(reference)
    }

    // - Lenient

    fun tryDeleteAllByReference(references: Iterable<String>): Long =
        references.count(::tryDeleteByReference).toLong()

    fun tryDeleteByReference(reference: String): Boolean

    // Errors

    fun onReferenceDuplicate(reference: String): Nothing =
        throw ReferenceDuplicateException(reference)

    fun onNotFoundByReference(reference: String): Nothing =
        throw NotFoundByReferenceException(reference)
}
