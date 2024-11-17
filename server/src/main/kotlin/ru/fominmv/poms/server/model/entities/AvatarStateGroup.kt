package ru.fominmv.poms.server.model.entities

import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.Normalizable
import ru.fominmv.poms.server.validation.constraints.*
import ru.fominmv.poms.libs.commons.strings.ext.*

import jakarta.persistence.*
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.collections.ext.createProxySet

import java.time.Instant
import java.util.*

@Entity
class AvatarStateGroup(
    // About

    @field:ShortText
    @Column(length = ShortText.MAX_LENGTH)
    var name: String? = null,

    @field:MediumText
    @Column(length = MediumText.MAX_LENGTH)
    var description: String? = null,

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
    Normalizable
{
    // Avatar states

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
        avatarStates.clear()
    }

    // Normalization

    override fun normalize() {
        name = name.collapseWhiteSpaceToNull()
        description = description.collapseSpacesToNull()
    }
}

