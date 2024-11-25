package ru.fominmv.poms.server.model.entities

import org.hibernate.Hibernate

import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.immutable.Validatable
import ru.fominmv.poms.server.model.interfaces.mutable.Normalizable
import ru.fominmv.poms.server.validation.constraints.Nickname as NicknameConstraint
import ru.fominmv.poms.libs.commons.text.strings.ext.removeWhiteSpace
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.delegates.NullableSyncFieldDelegate

import jakarta.persistence.*
import jakarta.validation.constraints.AssertTrue

import java.util.*

@Entity
class Nickname(
    @field:NicknameConstraint
    @Column(unique = true, nullable = false, length = NicknameConstraint.MAX_LENGTH)
    var nickname: String = "player",

    owner: User? = null,
    invite: Invite? = null,

    id: UUID = UUID.randomUUID(),
) :
    AbstractModelObject<UUID>(id),

    PrePersistEventListener,
    PreRemoveEventListener,
    Validatable,
    Normalizable
{
    // Owner

    @ManyToOne(
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
    )
    internal var internalOwner: User? = owner?.apply {
        if (Hibernate.isInitialized(internalNicknames))
            internalNicknames.add(this@Nickname)
    }

    @delegate:Transient
    var owner: User? by NullablyReferencedSyncCollectionDelegate.Reference(
        get = { internalOwner },
        set = { internalOwner = it },
        getCollection = { it.internalNicknames },
        getEffectiveHolder = { it },
    )
    
    // Invite
    
    @OneToOne(
        mappedBy = "internalNickname",
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
    )
    internal var internalInvite: Invite? = invite?.apply {
        if (Hibernate.isInitialized(internalNickname))
            internalNickname = this@Nickname
    }

    @delegate:Transient
    var invite: Invite? by NullableSyncFieldDelegate(
        get = { internalInvite },
        set = { internalInvite = it },
        update = { invite, nickname -> invite.internalNickname = nickname }
    )

    // Events

    @PrePersist
    override fun onPrePersist() =
        normalize()

    @PreRemove
    override fun onPreRemove() {
        owner = null
        invite = null
    }

    // Normalization

    override fun normalize() {
        nickname = nickname.removeWhiteSpace()
    }

    // Validation

    @get:AssertTrue
    override val isValid: Boolean
        get() = (owner == null) != (invite == null)
}
