package ru.fominmv.poms.server.services.model.accessors

import ru.fominmv.poms.server.errors.duplicate.NicknameDuplicateException
import ru.fominmv.poms.server.errors.not_found.NotFoundByNicknameException

interface NicknameAccessor<T : Any> {
    // New-checking

    fun checkIfAllNicknamesAreNew(nicknames: Iterable<String>) =
        nicknames.forEach(::checkIfNicknameIsNew)

    fun checkIfNicknameIsNew(nickname: String) {
        if (existsByNickname(nickname))
            onNicknameDuplicate(nickname)
    }
    
    // Existence checking

    fun allExistsByNickname(nicknames: Iterable<String>): Boolean =
        nicknames.all(::existsByNickname)

    fun existsByNickname(nickname: String): Boolean =
        getByNicknameOrNull(nickname) != null

    // Getting

    // - Forced

    fun getAllByNickname(nicknames: Iterable<String>): List<T> =
        nicknames.map(::getByNickname)

    fun getByNickname(nickname: String): T =
        getByNicknameOrNull(nickname) ?: onNotFoundByNickname(nickname)

    // - Lenient

    fun tryGetAllByNickname(nicknames: Iterable<String>): List<T> =
        nicknames.mapNotNull(::getByNicknameOrNull)

    fun getByNicknameOrNull(nickname: String): T?

    // Deletion

    // - Forced

    fun deleteAllByNickname(nicknames: Iterable<String>) =
        nicknames.forEach(::deleteByNickname)

    fun deleteByNickname(nickname: String) {
        if (!tryDeleteByNickname(nickname))
            onNotFoundByNickname(nickname)
    }

    // - Lenient

    fun tryDeleteAllByNickname(nicknames: Iterable<String>): Long =
        nicknames.count(::tryDeleteByNickname).toLong()

    fun tryDeleteByNickname(nickname: String): Boolean

    // Errors

    fun onNicknameDuplicate(nickname: String): Nothing =
        throw NicknameDuplicateException(nickname)

    fun onNotFoundByNickname(nickname: String): Nothing =
        throw NotFoundByNicknameException(nickname)
}
