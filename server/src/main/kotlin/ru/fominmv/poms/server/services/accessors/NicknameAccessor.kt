package ru.fominmv.poms.server.services.accessors

import ru.fominmv.poms.server.errors.duplicate.NicknameDuplicateException
import ru.fominmv.poms.server.errors.not_found.NotFoundByNicknameException

interface NicknameAccessor<T> {
    // Check

    fun checkIfAllNicknamesIsNew(nicknames: Iterable<String>) =
        nicknames.forEach(::checkIfNicknameIsNew)

    fun checkIfNicknameIsNew(nickname: String) {
        if (existsByNickname(nickname))
            onNicknameDuplicate(nickname)
    }
    
    // Exists

    fun allExistsByNickname(nicknames: Iterable<String>): Boolean =
        nicknames.all(::existsByNickname)

    fun existsByNickname(nickname: String): Boolean =
        getByNicknameOrNull(nickname) != null

    // Get

    fun getAllByNickname(nicknames: Iterable<String>): List<T> =
        nicknames.map(::getByNickname)

    fun getByNickname(nickname: String): T =
        getByNicknameOrNull(nickname) ?: onNotFoundByNickname(nickname)

    // Get or null

    fun tryGetAllByNickname(nicknames: Iterable<String>): List<T> =
        nicknames.mapNotNull(::getByNicknameOrNull)

    fun getByNicknameOrNull(nickname: String): T?

    // Delete

    fun deleteAllByNickname(nicknames: Iterable<String>) =
        nicknames.forEach(::deleteByNickname)

    fun deleteByNickname(nickname: String) {
        if (!tryDeleteByNickname(nickname))
            onNotFoundByNickname(nickname)
    }

    // Try delete

    fun tryDeleteAllByNickname(nicknames: Iterable<String>): Long =
        nicknames.count(::tryDeleteByNickname).toLong()

    fun tryDeleteByNickname(nickname: String): Boolean

    // Errors

    fun onNicknameDuplicate(nickname: String): Nothing =
        throw NicknameDuplicateException(nickname)

    fun onNotFoundByNickname(nickname: String): Nothing =
        throw NotFoundByNicknameException(nickname)
}
