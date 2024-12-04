package ru.fominmv.poms.server.services.accessors

interface NicknameAccessor<T, Nickname> {
    // Check

    fun checkIfAllNicknamesIsNew(nicknames: Iterable<Nickname>) =
        nicknames.forEach(::checkIfNicknameIsNew)

    fun checkIfNicknameIsNew(nickname: Nickname) {
        if (existsByNickname(nickname))
            onNicknameDuplicate(nickname)
    }
    
    // Exists

    fun allExistsByNickname(nicknames: Iterable<Nickname>): Boolean =
        nicknames.all(::existsByNickname)

    fun existsByNickname(nickname: Nickname): Boolean =
        getByNicknameOrNull(nickname) != null

    // Get

    fun getAllByNickname(nicknames: Iterable<Nickname>): List<T> =
        nicknames.map(::getByNickname)

    fun getByNickname(nickname: Nickname): T =
        getByNicknameOrNull(nickname) ?: onNotFoundByNickname(nickname)

    // Get or null

    fun tryGetAllByNickname(nicknames: Iterable<Nickname>): List<T> =
        nicknames.mapNotNull(::getByNicknameOrNull)

    fun getByNicknameOrNull(nickname: Nickname): T?

    // Delete

    fun deleteAllByNickname(nicknames: Iterable<Nickname>) =
        nicknames.forEach(::deleteByNickname)

    fun deleteByNickname(nickname: Nickname) {
        if (!tryDeleteByNickname(nickname))
            onNotFoundByNickname(nickname)
    }

    // Try delete

    fun tryDeleteAllByNickname(nicknames: Iterable<Nickname>): Long =
        nicknames.count(::tryDeleteByNickname).toLong()

    fun tryDeleteByNickname(nickname: Nickname): Boolean

    // Errors

    fun onNicknameDuplicate(nickname: Nickname): Nothing

    fun onNotFoundByNickname(nickname: Nickname): Nothing
}
