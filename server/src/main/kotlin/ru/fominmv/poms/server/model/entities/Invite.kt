package ru.fominmv.poms.server.model.entities

import org.hibernate.Hibernate

import ru.fominmv.poms.server.model.embedabbles.UserRights
import ru.fominmv.poms.server.model.interfaces.events.PreRemoveEventListener
import ru.fominmv.poms.server.model.interfaces.immutable.Validatable
import ru.fominmv.poms.libs.commons.delegates.NullableSyncFieldDelegate

import jakarta.persistence.*
import jakarta.validation.constraints.AssertTrue
import jakarta.validation.Valid

import java.time.Instant
import java.util.*

@Entity
class Invite(
    nickname: Nickname? = null,

    @Embedded
    var rights: UserRights = UserRights(),

    // Model object

    id: UUID = UUID.randomUUID(),
    now: Instant = Instant.now(),
    createdAt: Instant = now,
    modifiedAt: Instant = now,
    expiresAt: Instant = now.plus(DEFAULT_DURATION),
) :
    AbstractExpirableModelObject<UUID>(
        id = id,
        now = now,
        createdAt = createdAt,
        modifiedAt = modifiedAt,
        expiresAt = expiresAt,
    ),

    PreRemoveEventListener,
    Validatable
{
    // Nickname

    @Valid
    @OneToOne(
        fetch = FetchType.LAZY,
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
    )
    internal var internalNickname: Nickname? = nickname?.apply {
        if (Hibernate.isInitialized(internalInvite))
            internalInvite = this@Invite
    }

    @delegate:Transient
    var nickname: Nickname? by NullableSyncFieldDelegate(
        get = { internalNickname },
        set = { internalNickname = it },
        update = { nickname, invite -> nickname.internalInvite = invite }
    )

    // Events

    @PreRemove
    override fun onPreRemove() {
        nickname = null
    }

    // Validation

    @get:AssertTrue
    override val isValid: Boolean
        get() = nickname != null
}
