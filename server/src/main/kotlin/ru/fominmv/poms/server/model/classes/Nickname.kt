package ru.fominmv.poms.server.model.classes

import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.Normalizable
import ru.fominmv.poms.server.validation.constraints.Nickname as NicknameConstraint
import ru.fominmv.poms.libs.commons.strings.ext.removeWhiteSpace

import jakarta.persistence.*

import java.time.Instant
import java.util.*

@Entity
class Nickname(
    @field:NicknameConstraint
    @Column(unique = true, nullable = false, length = NicknameConstraint.MAX_LENGTH)
    var nickname: String,

    id: UUID,
    now: Instant = Instant.now(),
    createdAt: Instant = now,
    modifiedAt: Instant = now,
) :
    AbstractModelObject<UUID>(
        id = id,
        now = now,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
    ),

    PrePersistEventListener,
    PreRemoveEventListener,
    Normalizable
{
    // Events

    @PrePersist
    override fun onPrePersist() =
        normalize()

    @PreRemove
    override fun onPreRemove() {

    }

    // Normalization

    override fun normalize() {
        nickname = nickname.removeWhiteSpace()
    }
}
