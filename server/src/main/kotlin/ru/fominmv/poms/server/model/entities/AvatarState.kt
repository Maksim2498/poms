package ru.fominmv.poms.server.model.entities

import org.hibernate.annotations.*
import org.hibernate.Hibernate

import ru.fominmv.poms.server.model.embedabbles.Vector3
import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.Normalizable
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.delegates.NullableSyncFieldDelegate
import ru.fominmv.poms.libs.commons.collections.ext.createProxySet
import ru.fominmv.poms.libs.commons.text.strings.Hidden
import ru.fominmv.poms.libs.mc.commons.enums.GameMode
import ru.fominmv.poms.libs.mc.commons.duration.ext.toTicks
import ru.fominmv.poms.libs.mc.commons.duration.durationFromTicks

import jakarta.persistence.CascadeType
import jakarta.persistence.*
import jakarta.validation.constraints.*

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
    @ColumnDefault("'SURVIVAL'")
    var gameMode: GameMode = GameMode.SURVIVAL,

    @field:PositiveOrZero
    @Column(nullable = false)
    @ColumnDefault(DEFAULT_HEALTH.toString())
    var health: Double = DEFAULT_HEALTH,

    @field:PositiveOrZero
    @Column(nullable = false)
    @ColumnDefault(DEFAULT_FOOD_LEVEL.toString())
    var foodLevel: Int = DEFAULT_FOOD_LEVEL,

    @field:PositiveOrZero
    @Column(nullable = false)
    @ColumnDefault(DEFAULT_REMAINING_AIR_IN_TICKS.toString())
    var remainingAirInTicks: Int = DEFAULT_REMAINING_AIR_IN_TICKS,

    @field:PositiveOrZero
    @Column(nullable = false)
    @ColumnDefault(DEFAULT_LEVEL.toString())
    var level: Int = DEFAULT_LEVEL,

    @field:PositiveOrZero
    @Column(nullable = false)
    @ColumnDefault(DEFAULT_EXP.toString())
    var exp: Float = DEFAULT_EXP,

    @field:PositiveOrZero
    @Column(nullable = false)
    @ColumnDefault(DEFAULT_FIRE_DURATION_IN_TICKS.toString())
    var fireDurationInTicks: Int = DEFAULT_FIRE_DURATION_IN_TICKS,

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
    companion object {
        const val DEFAULT_HEALTH = 20.0
        const val DEFAULT_FOOD_LEVEL = 20
        const val DEFAULT_REMAINING_AIR_IN_TICKS = 300
        const val DEFAULT_LEVEL = 0
        const val DEFAULT_EXP = 0f
        const val DEFAULT_FIRE_DURATION_IN_TICKS = 0
    }

    // Remaining air

    var remainingAir: Duration
        get() = durationFromTicks(remainingAirInTicks)

        set(value) {
            remainingAirInTicks = value.toTicks().toInt()
        }

    // Fire duration

    var fireDuration: Duration
        get() = durationFromTicks(fireDurationInTicks)

        set(value) {
            fireDurationInTicks = value.toTicks().toInt()
        }

    // User

    @Hidden
    @NotNull
    @ManyToOne(
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
        optional = false,
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
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

    @Hidden
    @NotNull
    @ManyToOne(
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
        optional = false,
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
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

    @Hidden
    @NotNull
    @OneToOne(
        fetch = FetchType.LAZY,
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
        optional = false,
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
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

    @Hidden
    @NotNull
    @OneToOne(
        fetch = FetchType.LAZY,
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
        optional = false,
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
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

    @Hidden
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
        remainingAirInTicks = max(remainingAirInTicks, 0)
        level = max(level, 0)
        exp = max(exp, 0f)
        fireDurationInTicks = max(fireDurationInTicks, 0)
    }
}
