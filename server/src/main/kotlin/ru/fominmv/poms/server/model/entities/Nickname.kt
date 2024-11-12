package ru.fominmv.poms.server.model.entities

import org.hibernate.Hibernate

import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.Normalizable
import ru.fominmv.poms.server.validation.constraints.Nickname as NicknameConstraint
import ru.fominmv.poms.libs.commons.strings.ext.removeWhiteSpace
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate

import jakarta.persistence.*

import java.time.Instant
import java.util.*

@Entity
class Nickname(
    @field:NicknameConstraint
    @Column(unique = true, nullable = false, length = NicknameConstraint.MAX_LENGTH)
    var nickname: String,

    owner: User? = null,

    id: UUID = UUID.randomUUID(),
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

    // Events

    @PrePersist
    override fun onPrePersist() =
        normalize()

    @PreRemove
    override fun onPreRemove() {
        owner = null
    }

    // Normalization

    override fun normalize() {
        nickname = nickname.removeWhiteSpace()
    }
}
