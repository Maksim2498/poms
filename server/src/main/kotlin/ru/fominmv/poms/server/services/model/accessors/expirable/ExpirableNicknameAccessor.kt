package ru.fominmv.poms.server.services.model.accessors.expirable

import ru.fominmv.poms.server.model.interfaces.immutable.Expirable
import ru.fominmv.poms.server.services.model.accessors.NicknameAccessor

import java.time.Instant

interface ExpirableNicknameAccessor<T : Expirable> : NicknameAccessor<T> {
    // New-checking

    override fun checkIfNicknameIsNew(nickname: String) =
        checkIfNicknameIsNew(nickname, ExpirableState.ANY)

    fun checkIfNicknameIsNew(nickname: String, state: ExpirableState, now: Instant = Instant.now()) {
        if (existsByNickname(nickname, state, now))
            onNicknameDuplicate(nickname)
    }

    // Existence checking

    override fun existsByNickname(nickname: String): Boolean =
        existsByNickname(nickname, ExpirableState.ANY)

    fun existsByNickname(nickname: String, state: ExpirableState, now: Instant = Instant.now()): Boolean =
        getByNicknameOrNull(nickname, state, now) != null

    // Getting

    // - Forced

    override fun getByNickname(nickname: String): T =
        getByNickname(nickname, ExpirableState.ANY)

    fun getByNickname(nickname: String, state: ExpirableState, now: Instant = Instant.now()): T =
        getByNicknameOrNull(nickname, state, now) ?: onNotFoundByNickname(nickname)

    // - Lenient

    override fun getByNicknameOrNull(nickname: String): T? =
        getByNicknameOrNull(nickname, ExpirableState.ANY)

    fun getByNicknameOrNull(nickname: String, state: ExpirableState, now: Instant = Instant.now()): T?

    // Deletion

    // - Forced

    override fun deleteByNickname(nickname: String) =
        deleteByNickname(nickname, ExpirableState.ANY)

    fun deleteByNickname(nickname: String, state: ExpirableState, now: Instant = Instant.now()) {
        if (!tryDeleteByNickname(nickname, state, now))
            onNotFoundByNickname(nickname)
    }

    // - Lenient

    override fun tryDeleteByNickname(nickname: String): Boolean =
        tryDeleteByNickname(nickname, ExpirableState.ANY)

    fun tryDeleteByNickname(nickname: String, state: ExpirableState, now: Instant = Instant.now()): Boolean
}
