package ru.fominmv.poms.server.model.entities

import ru.fominmv.poms.server.model.embedabbles.Vector3
import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.Normalizable
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.collections.ext.createProxySet
import ru.fominmv.poms.libs.mc.commons.duration.ext.toTicks
import ru.fominmv.poms.libs.mc.commons.duration.durationFromTicks

import jakarta.persistence.*
import jakarta.validation.constraints.PositiveOrZero

import java.time.Duration
import java.util.*

import kotlin.math.max

@Entity
class AvatarState(
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