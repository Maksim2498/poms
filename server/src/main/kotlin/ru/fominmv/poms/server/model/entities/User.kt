package ru.fominmv.poms.server.model.entities

import org.hibernate.annotations.ColumnDefault
import org.hibernate.Hibernate

import ru.fominmv.poms.server.model.embedabbles.UserRights
import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.*
import ru.fominmv.poms.server.validation.constraints.*
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.collections.ext.createProxySet
import ru.fominmv.poms.libs.commons.text.strings.Secret
import ru.fominmv.poms.libs.mc.commons.enums.OpLevel

import jakarta.persistence.*
import jakarta.validation.constraints.PositiveOrZero

import java.time.Instant
import java.util.UUID

import kotlin.math.max

@Entity
class User(
    // Credentials

    @field:Login
    @Column(unique = true, nullable = false, length = Login.MAX_LENGTH)
    override var login: String = "user",

    @Secret
    @field:ShortText
    @Column(nullable = false, length = ShortText.MAX_LENGTH)
    override var password: String = "",

    // Nicknames

    nicknames: Iterable<String> = emptySet(),

    @field:PositiveOrZero
    @Column(nullable = false)
    var maxNicknames: Int = DEFAULT_MAX_NICKNAMES,

    // Rights

    @Embedded
    var rights: UserRights = UserRights(),

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    var opLevel: OpLevel = OpLevel.ALL,

    @ColumnDefault("FALSE")
    @Column(nullable = false)
    var isBlocked: Boolean = false,

    // Creator

    creator: User? = null,

    @Column(nullable = false)
    var isCreatedViaInvite: Boolean = false,

    // Model object

    id: UUID = UUID.randomUUID(),
    now: Instant = Instant.now(),
    createdAt: Instant = now,
    modifiedAt: Instant = now,
) :
    AbstractTrackableModelObject<UUID>(
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
    companion object {
        const val DEFAULT_MAX_NICKNAMES = 5
    }

    // Nicknames

    @OneToMany(
        mappedBy = "internalOwner",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
    )
    internal var internalNicknames: MutableSet<Nickname> = nicknames
        .map { Nickname(it, this) }
        .toMutableSet()

    @delegate:Transient
    var nicknames: MutableSet<Nickname> by NullablyReferencedSyncCollectionDelegate(
        getCollectionFromHolder = { it.internalNicknames },
        updateElementHolder = { nickname, owner -> nickname.internalOwner = owner },
        convertCollection = { it.createProxySet() },
        getEffectiveHolder = { it },
    )
    
    // Avatar states
    
    @OneToMany(
        mappedBy = "internalUser",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
    )
    internal var internalAvatarStates: MutableSet<AvatarState> = mutableSetOf()

    @delegate:Transient
    var avatarStates: MutableSet<AvatarState> by NullablyReferencedSyncCollectionDelegate(
        getCollectionFromHolder = { it.internalAvatarStates },
        updateElementHolder = { avatarState, user -> avatarState.internalUser = user },
        convertCollection = { it.createProxySet() },
        getEffectiveHolder = { it },
    )
    
    // Creator

    @ManyToOne(
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
    )
    internal var internalCreator: User? = creator?.apply {
        if (Hibernate.isInitialized(internalCreatedUsers))
            internalCreatedUsers.add(this@User)
    }

    @delegate:Transient
    var creator: User? by NullablyReferencedSyncCollectionDelegate.Reference(
        get = { internalCreator },
        set = { internalCreator = it },
        getCollection = { it.internalCreatedUsers },
        getEffectiveHolder = { it },
    )
    
    // Created users

    @OneToMany(
        mappedBy = "internalCreator",
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
      ],
    )
    internal var internalCreatedUsers: MutableSet<User> = mutableSetOf()

    @delegate:Transient
    var createdUsers: MutableSet<User> by NullablyReferencedSyncCollectionDelegate(
        getCollectionFromHolder = { it.internalCreatedUsers },
        updateElementHolder = { user, creator -> user.internalCreator = creator },
        convertCollection = { it.createProxySet() },
        getEffectiveHolder = { it },
    )
    
    // Created invite

    @OneToMany(
        mappedBy = "internalCreator",
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
    )
    internal var internalCreatedInvites: MutableSet<Invite> = mutableSetOf()

    @delegate:Transient
    var createdInvites: MutableSet<Invite> by NullablyReferencedSyncCollectionDelegate(
        getCollectionFromHolder = { it.internalCreatedInvites },
        updateElementHolder = { invite, creator -> invite.internalCreator = creator },
        convertCollection = { it.createProxySet() },
        getEffectiveHolder = { it },
    )

    // Events

    @PrePersist
    override fun onPrePersist() =
        normalize()

    @PreRemove
    override fun onPreRemove() {
        nicknames.clear()
        avatarStates.clear()

        creator = null

        createdUsers.clear()
        createdInvites.clear()
    }

    // Normalization

    override fun normalize() {
        super.normalize()
        normalizeNicknames()
    }

    private fun normalizeNicknames() {
        maxNicknames = max(maxNicknames, 0)

        when {
            maxNicknames == 0 -> nicknames.clear()

            nicknames.size > maxNicknames -> {
                val toRemove = nicknames.take(nicknames.size - maxNicknames).toSet()

                nicknames.removeAll(toRemove)
            }
        }
    }
}
