package ru.fominmv.poms.server.repositories.entities

import org.springframework.stereotype.Repository

import ru.fominmv.poms.server.model.entities.*
import ru.fominmv.poms.server.repositories.base.*

import java.util.*

@Repository
interface NicknameRepository :
    EntityManagementRepository<Nickname>,
    EntityRepository<Nickname, UUID>,
    ByOwnerAccessRepository<Nickname, UUID>
{
    // Nickname

    fun findByNickname(nickname: String): Optional<Nickname>

    fun existsByNickname(nickname: String): Boolean

    fun deleteByNickname(nickname: String): Long
}
