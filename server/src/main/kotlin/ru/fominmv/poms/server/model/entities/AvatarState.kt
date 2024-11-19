package ru.fominmv.poms.server.model.entities

import org.hibernate.Hibernate

import ru.fominmv.poms.server.model.embedabbles.Vector3
import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.Normalizable
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.collections.ext.createProxySet
import ru.fominmv.poms.libs.mc.commons.enums.GameMode
import ru.fominmv.poms.libs.mc.commons.duration.ext.toTicks
import ru.fominmv.poms.libs.mc.commons.duration.durationFromTicks

import jakarta.persistence.*
import jakarta.validation.constraints.PositiveOrZero
import ru.fominmv.poms.libs.commons.delegates.NullableSyncFieldDelegate

import java.time.Duration
import java.util.*

import kotlin.math.max

@Entity
class AvatarState(
    user: User? = null,
    group: AvatarStateGroup? = null,

    // State

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    var gameMode: GameMode = GameMode.SURVIVAL,

    @field:PositiveOrZero
    @Column(nullable = false)
    var health: Double = 20.0,

    @field:PositiveOrZero
    @Column(nullable = false)
    var foodLevel: Int = 20,

    @field:PositiveOrZero
    @Column(nullable = false)
    var airLevel: Int = 0,

    @field:PositiveOrZero
    @Column(nullable = false)
    var level: Int = 0,

    @field:PositiveOrZero
    @Column(nullable = false)
    var exp: Float = 0f,

    @field:PositiveOrZero
    @Column(nullable = false)
    var fireDurationInTicks: Int = 0,

    @Embedded
    var position: Vector3 = Vector3(),

    @Embedded
    var velocity: Vector3 = Vector3(),

    inventory: Inventory? = null,
    enderChestInventory: Inventory? = null,

    // Model object

    id: UUID = UUID.randomUUID(),
) :
    AbstractModelObject<UUID>(id),

    PrePersistEventListener,
    PreRemoveEventListener,
    Normalizable
{
    // Fire duration

    var fireDuration: Duration
        get() = durationFromTicks(fireDurationInTicks)

        set(value) {
            fireDurationInTicks = value.toTicks().toInt()
        }
    
    // User
    
    @ManyToOne(
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
    )
    internal var internalUser: User? = user?.apply {
        if (Hibernate.isInitialized(internalAvatarStates))
            internalAvatarStates.add(this@AvatarState)
    }

    @delegate:Transient
    var user: User? by NullablyReferencedSyncCollectionDelegate.Reference(
        get = { internalUser },
        set = { internalUser = it },
        getCollection = { it.internalAvatarStates },
        getEffectiveHolder = { it },
    )

    // Group

    @ManyToOne(
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
    )
    internal var internalGroup: AvatarStateGroup? = group?.apply {
        if (Hibernate.isInitialized(internalAvatarStates))
            internalAvatarStates.add(this@AvatarState)
    }

    @delegate:Transient
    var group: AvatarStateGroup? by NullablyReferencedSyncCollectionDelegate.Reference(
        get = { internalGroup },
        set = { internalGroup = it },
        getCollection = { it.internalAvatarStates },
        getEffectiveHolder = { it },
    )

    // Inventory

    @OneToOne(
        fetch = FetchType.LAZY,
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
    )
    internal var internalInventory: Inventory? = inventory?.apply {
        if (Hibernate.isInitialized(internalInventoryAvatarState))
            internalInventoryAvatarState = this@AvatarState
    }

    @delegate:Transient
    var inventory: Inventory? by NullableSyncFieldDelegate(
        get = { internalInventory },
        set = { internalInventory = it },
        update = { inventory, avatarState -> inventory.internalInventoryAvatarState = avatarState },
    )

    // Ender check inventory

    @OneToOne(
        fetch = FetchType.LAZY,
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
    )
    internal var internalEnderChestInventory: Inventory? = enderChestInventory?.apply {
        if (Hibernate.isInitialized(internalEnderChestInventoryAvatarState))
            internalEnderChestInventoryAvatarState = this@AvatarState
    }

    @delegate:Transient
    var enderChestInventory: Inventory? by NullableSyncFieldDelegate(
        get = { internalEnderChestInventory },
        set = { internalEnderChestInventory = it },
        update = { inventory, avatarState -> inventory.internalEnderChestInventoryAvatarState = avatarState },
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
        user = null
        group = null

        inventory = null
        enderChestInventory = null

        potionEffects.clear()
    }

    // Normalization

    override fun normalize() {
        health = max(health, 0.0)
        foodLevel = max(foodLevel, 0)
        airLevel = max(airLevel, 0)
        level = max(level, 0)
        exp = max(exp, 0f)
        fireDurationInTicks = max(fireDurationInTicks, 0)
    }
}
