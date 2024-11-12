package ru.fominmv.poms.server.model.entities

import ru.fominmv.poms.server.model.embedabbles.Vector3
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

import kotlin.math.min

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

    // Avatar state

    @field:PositiveOrZero
    @Column(nullable = false)
    var health: Double = 20.0,

    @field:PositiveOrZero
    @Column(nullable = false)
    var foodLevel: Int = 20,

    @field:PositiveOrZero
    @Column(nullable = false)
    var remainingAir: Int = 0,

    @field:PositiveOrZero
    @Column(nullable = false)
    var level: Int = 0,

    @field:PositiveOrZero
    @Column(nullable = false)
    var exp: Float = 0f,

    @Embedded
    var position: Vector3 = Vector3(),

    @Embedded
    var velocity: Vector3 = Vector3(),

    // Model object

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
    MutableWithCredentials,
    Normalizable
{
    // Nicknames

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

    // Effects

    @OneToMany(
        mappedBy = "internalTarget",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
    )
    internal var internalPotionEffects: MutableSet<PotionEffect> = mutableSetOf()

    @delegate:Transient
    var potionEffects: MutableSet<PotionEffect> by NullablyReferencedSyncCollectionDelegate(
        getCollectionFromHolder = { it.internalPotionEffects },
        updateElementHolder = { potionEffect, target -> potionEffect.internalTarget = target },
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
        potionEffects.clear()
    }

    // Normalization

    override fun normalize() {
        super.normalize()

        health = min(health, 0.0)
        foodLevel = min(foodLevel, 0)
        remainingAir = min(remainingAir, 0)
        level = min(level, 0)
        exp = min(exp, 0f)
    }
}
