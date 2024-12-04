package ru.fominmv.poms.server.repositories.entities

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Repository

import ru.fominmv.poms.server.model.entities.*
import ru.fominmv.poms.server.repositories.base.*

import java.util.*

@Repository
interface NicknameRepository :
    EntityManagementRepository<Nickname>,
    EntityRepository<Nickname, UUID>
{
    // Nickname

    fun findByNickname(nickname: String): Optional<Nickname>

    fun existsByNickname(nickname: String): Boolean

    fun deleteByNickname(nickname: String): Long

    // Owner

    fun findAllByInternalOwner(owner: User?, pageable: Pageable): Page<Nickname>

    fun findAllByInternalOwner(owner: User?): List<Nickname>

    fun countByInternalOwner(owner: User?): Long

    fun existsByInternalOwner(owner: User?): Boolean

    fun deleteAllByInternalOwner(owner: User?): Long
}
