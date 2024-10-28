package ru.fominmv.poms.server.model.classes

import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.Normalizable
import ru.fominmv.poms.server.validation.constraints.*
import ru.fominmv.poms.libs.commons.string.ext.removeWhiteSpace
import ru.fominmv.poms.libs.commons.string.Secret

import jakarta.persistence.*

import java.time.Instant
import java.util.UUID

@Entity
class User(
    // Credentials

    @field:Login
    @Column(unique = true, nullable = false, length = Login.MAX_LENGTH)
    var login: String,

    @Secret
    @field:ShortText
    @Column(nullable = false, length = ShortText.MAX_LENGTH)
    var password: String = "",

    // Model object

    id: UUID ,
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
        login = login.removeWhiteSpace().lowercase()
    }
}
