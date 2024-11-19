package ru.fominmv.poms.server.model.entities

import org.hibernate.Hibernate

import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.*
import ru.fominmv.poms.server.validation.constraints.*
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.strings.ext.*
import ru.fominmv.poms.libs.commons.strings.Secret

import jakarta.persistence.*

import java.time.Instant
import java.util.*

@Entity
class Server(
    // Credentials

    @field:Login
    @Column(unique = true, nullable = false, length = Login.MAX_LENGTH)
    override var login: String = "server",

    @Secret
    @field:ShortText
    @Column(nullable = false, length = ShortText.MAX_LENGTH)
    override var password: String = "",

    // About

    @field:ShortText
    @Column(length = ShortText.MAX_LENGTH)
    var publicAddress: String? = null,

    @field:ShortText
    @Column(length = ShortText.MAX_LENGTH)
    var name: String? = null,

    @field:MediumText
    @Column(length = MediumText.MAX_LENGTH)
    var description: String? = null,

    // Avatar state group

    avatarStateGroup: AvatarStateGroup? = null,

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
    // Avatar state group

    @ManyToOne(
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
    )
    internal var internalAvatarStateGroup: AvatarStateGroup? = avatarStateGroup?.apply {
        if (Hibernate.isInitialized(internalServers))
            internalServers.add(this@Server)
    }

    @delegate:Transient
    var avatarStateGroup: AvatarStateGroup? by NullablyReferencedSyncCollectionDelegate.Reference(
        get = { internalAvatarStateGroup },
        set = { internalAvatarStateGroup = it },
        getCollection = { it.internalServers },
        getEffectiveHolder = { it },
    )
    
    // Events

    @PrePersist
    override fun onPrePersist() =
        normalize()

    @PreRemove
    override fun onPreRemove() {
        avatarStateGroup = null
    }

    // Normalization

    override fun normalize() {
        super.normalize()

        publicAddress = publicAddress.collapseWhiteSpaceToNull()
        name = name.collapseWhiteSpaceToNull()
        description = description.collapseSpacesToNull()
    }
}
