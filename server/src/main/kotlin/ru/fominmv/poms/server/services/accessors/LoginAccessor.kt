package ru.fominmv.poms.server.services.accessors

import ru.fominmv.poms.server.errors.not_found.NotFoundByLoginException

interface LoginAccessor<T> {
    // Exists

    fun allExistsByLogin(logins: Iterable<String>): Boolean =
        logins.all(::existsByLogin)

    fun existsByLogin(login: String): Boolean =
        getByLoginOrNull(login) != null

    // Get

    fun getAllByLogin(logins: Iterable<String>): List<T> =
        logins.map(::getByLogin)

    fun getByLogin(login: String): T =
        getByLoginOrNull(login) ?: onNotFoundByLogin(login)

    // Get or null

    fun tryGetAllByLogin(logins: Iterable<String>): List<T> =
        logins.mapNotNull(::getByLoginOrNull)

    fun getByLoginOrNull(login: String): T?

    // Delete

    fun deleteAllByLogin(logins: Iterable<String>) =
        logins.forEach(::deleteByLogin)

    fun deleteByLogin(login: String) {
        if (!tryDeleteByLogin(login))
            onNotFoundByLogin(login)
    }

    // Try delete

    fun tryDeleteAllByLogin(logins: Iterable<String>): Long =
        logins.count(::tryDeleteByLogin).toLong()

    fun tryDeleteByLogin(login: String): Boolean

    // Errors

    fun onNotFoundByLogin(login: String): Nothing =
        throw NotFoundByLoginException(login)
}
