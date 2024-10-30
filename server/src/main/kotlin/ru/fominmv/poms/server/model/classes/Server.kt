package ru.fominmv.poms.server.model.classes

import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.*
import ru.fominmv.poms.server.validation.constraints.*
import ru.fominmv.poms.libs.commons.string.ext.*
import ru.fominmv.poms.libs.commons.string.Secret

import jakarta.persistence.*

import java.time.Instant
import java.util.*

@Entity
class Server(
    // Credentials

    @field:Login
    @Column(unique = true, nullable = false, length = Login.MAX_LENGTH)
    override var login: String,

    @Secret
    @field:ShortText
    @Column(nullable = false, length = ShortText.MAX_LENGTH)
    override var password: String = "",

    // Description

    @field:ShortText
    @Column(length = ShortText.MAX_LENGTH)
    var name: String? = null,

    @field:MediumText
    @Column(length = MediumText.MAX_LENGTH)
    var description: String? = null,

    // Model object

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
    MutableWithCredentials,
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
        super.normalize()

        name = name.collapseWhiteSpaceToNull()
        description = description.collapseSpacesToNull()
    }
}
