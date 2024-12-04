package ru.fominmv.poms.server.model.entities

import org.hibernate.Hibernate

import ru.fominmv.poms.server.model.embedabbles.UserRights
import ru.fominmv.poms.server.model.interfaces.events.PreRemoveEventListener
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.delegates.NullableSyncFieldDelegate
import ru.fominmv.poms.libs.commons.text.strings.Hidden

import jakarta.persistence.*
import jakarta.validation.constraints.NotNull
import jakarta.validation.Valid

import java.time.Instant
import java.util.*

@Entity
class Invite(
    nickname: Nickname? = null,
    creator: User? = null,

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

    PreRemoveEventListener
{
    // Nickname

    @Valid
    @Hidden
    @NotNull
    @OneToOne(
        fetch = FetchType.LAZY,
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
        optional = false,
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

    // Creator

    @Hidden
    @ManyToOne(
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
    )
    internal var internalCreator: User? = creator?.apply {
        if (Hibernate.isInitialized(internalCreatedInvites))
            internalCreatedInvites.add(this@Invite)
    }

    @delegate:Transient
    var creator: User? by NullablyReferencedSyncCollectionDelegate.Reference(
        get = { internalCreator },
        set = { internalCreator = it },
        getCollection = { it.internalCreatedInvites },
        getEffectiveHolder = { it },
    )

    // Events

    @PreRemove
    override fun onPreRemove() {
        nickname = null
        creator = null
    }
}
