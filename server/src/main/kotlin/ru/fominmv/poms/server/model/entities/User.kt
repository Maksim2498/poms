package ru.fominmv.poms.server.model.entities

import org.hibernate.annotations.*
import org.hibernate.Hibernate

import ru.fominmv.poms.server.model.embedabbles.UserRights
import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.immutable.Validatable
import ru.fominmv.poms.server.model.interfaces.mutable.*
import ru.fominmv.poms.libs.api.validation.constraints.*
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.collections.ext.createProxySet
import ru.fominmv.poms.libs.commons.text.strings.objs.*
import ru.fominmv.poms.libs.commons.text.strings.ext.removeWhiteSpace

import jakarta.persistence.CascadeType
import jakarta.persistence.*
import jakarta.validation.constraints.*

import java.time.Instant
import java.util.UUID

import kotlin.math.max

@Entity
@Suppress("LeakingThis")
class User(
    // Credentials

    @field:Reference
    @Column(unique = true, nullable = false, length = Reference.MAX_LENGTH)
    override var reference: String = DEFAULT_REFERENCE,

    @Secret
    @field:ShortText
    @Column(nullable = false, length = ShortText.MAX_LENGTH)
    override var password: String = DEFAULT_PASSWORD,

    // Nicknames

    nicknames: Iterable<String> = emptySet(),

    @field:PositiveOrZero
    @Column(nullable = false)
    var maxNicknames: Int = DEFAULT_MAX_NICKNAMES,

    // Rights

    @Embedded
    var rights: UserRights = UserRights(),

    @Column(nullable = false)
    @ColumnDefault(DEFAULT_IS_BLOCKED.toString())
    override var isBlocked: Boolean = DEFAULT_IS_BLOCKED,

    // Creator

    creator: User? = null,

    @Column(nullable = false)
    @ColumnDefault(DEFAULT_IS_CREATED_VIA_INVITE.toString())
    var isCreatedViaInvite: Boolean = DEFAULT_IS_CREATED_VIA_INVITE,

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
    MutableCredentialed<String>,
    MutableBlockable,
    Normalizable,
    Validatable
{
    companion object {
        // Constants

        const val DEFAULT_REFERENCE = "user"
        const val DEFAULT_PASSWORD = ""
        const val DEFAULT_MAX_NICKNAMES = 5
        const val DEFAULT_IS_BLOCKED = false
        const val DEFAULT_IS_CREATED_VIA_INVITE = false
    }

    // Nicknames

    @Hidden
    @OneToMany(
        mappedBy = "internalOwner",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
    )
    internal var internalNicknames: MutableSet<Nickname> = mutableSetOf()

    @delegate:Transient
    var nicknames: MutableSet<Nickname> by NullablyReferencedSyncCollectionDelegate(
        getCollectionFromHolder = { it.internalNicknames },
        updateElementHolder = { nickname, owner -> nickname.internalOwner = owner },
        convertCollection = { it.createProxySet() },
        getEffectiveHolder = { it },
    )

    init {
        for (nickname in nicknames)
            internalNicknames.add(Nickname(nickname, this))
    }
    
    // Avatar states

    @Hidden
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

    @Hidden
    @ManyToOne(
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
    )
    @OnDelete(action = OnDeleteAction.SET_NULL)
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

    @Hidden
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
    
    // Created invites

    @Hidden
    @OneToMany(
        mappedBy = "internalCreator",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
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
        reference = reference.removeWhiteSpace()
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

    // Validation

    @get:AssertTrue(message = "Nickname limit exceeded")
    override val isValid: Boolean
        get() = nicknames.size <= maxNicknames
}
