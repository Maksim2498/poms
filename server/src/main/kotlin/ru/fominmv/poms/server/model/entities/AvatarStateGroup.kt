package ru.fominmv.poms.server.model.entities

import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.*
import ru.fominmv.poms.libs.api.validation.constraints.*
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.collections.ext.createProxySet
import ru.fominmv.poms.libs.commons.text.strings.ext.*
import ru.fominmv.poms.libs.commons.text.strings.objs.Hidden

import jakarta.persistence.*

import java.time.Instant
import java.util.*

@Entity
class AvatarStateGroup(
    // Login

    @field:Reference
    @Column(unique = true, nullable = false, length = Reference.MAX_LENGTH)
    override var reference: String = DEFAULT_REFERENCE,

    // About

    @field:ShortText
    @Column(length = ShortText.MAX_LENGTH)
    override var name: String? = null,

    @field:MediumText
    @Column(length = MediumText.MAX_LENGTH)
    override var description: String? = null,

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
    MutableDescribed<String?>,
    MutableReferenced<String>,
    Normalizable
{
    companion object {
        // Constants

        const val DEFAULT_REFERENCE = "group"
    }

    // Servers

    @Hidden
    @OneToMany(
        mappedBy = "internalAvatarStateGroup",
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
    )
    internal var internalServers: MutableSet<Server> = mutableSetOf()

    @delegate:Transient
    var servers: MutableSet<Server> by NullablyReferencedSyncCollectionDelegate(
        getCollectionFromHolder = { it.internalServers },
        updateElementHolder = { server, group -> server.internalAvatarStateGroup = group },
        convertCollection = { it.createProxySet() },
        getEffectiveHolder = { it },
    )
    
    // Avatar states

    @Hidden
    @OneToMany(
        mappedBy = "internalGroup",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
    )
    internal var internalAvatarStates: MutableSet<AvatarState> = mutableSetOf()

    @delegate:Transient
    var avatarStates: MutableSet<AvatarState> by NullablyReferencedSyncCollectionDelegate(
        getCollectionFromHolder = { it.internalAvatarStates },
        updateElementHolder = { avatarState, group -> avatarState.internalGroup = group },
        convertCollection = { it.createProxySet() },
        getEffectiveHolder = { it },
    )

    // Events

    @PrePersist
    override fun onPrePersist() =
        normalize()

    @PreRemove
    override fun onPreRemove() {
        servers.clear()
        avatarStates.clear()
    }

    // Normalization

    override fun normalize() {
        reference = reference.removeWhiteSpace()
        name = name.collapseWhiteSpaceToNull()
        description = description.collapseSpacesToNull()
    }
}

