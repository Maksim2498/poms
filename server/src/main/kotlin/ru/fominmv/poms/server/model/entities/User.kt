package ru.fominmv.poms.server.model.entities

import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.*
import ru.fominmv.poms.server.validation.constraints.*
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.collections.ext.createProxySet
import ru.fominmv.poms.libs.commons.strings.Secret

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
    override var login: String,

    @Secret
    @field:ShortText
    @Column(nullable = false, length = ShortText.MAX_LENGTH)
    override var password: String = "",

    // Nicknames

    nicknames: Iterable<String> = emptySet(),

    @field:PositiveOrZero
    @Column(nullable = false)
    var maxNicknames: Int = DEFAULT_MAX_NICKNAMES,

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

    // Events

    @PrePersist
    override fun onPrePersist() =
        normalize()

    @PreRemove
    override fun onPreRemove() {
        nicknames.clear()
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
