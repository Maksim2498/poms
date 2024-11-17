package ru.fominmv.poms.server.model.entities

import org.hibernate.Hibernate

import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.Normalizable
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.mc.commons.duration.ext.toTicks
import ru.fominmv.poms.libs.mc.commons.duration.durationFromTicks

import jakarta.persistence.*

import java.time.Duration
import java.util.*

@Entity
class PotionEffect(
    target: AvatarState? = null,

    @Column(nullable = false)
    var typeId: Int = TypeId.SPEED,

    @Column(nullable = false)
    var durationInTicks: Int = Duration.ofMinutes(1).toTicks().toInt(),

    @Column(nullable = false)
    var amplifier: Int = 1,

    id: UUID = UUID.randomUUID(),
) :
    AbstractModelObject<UUID>(id),

    PrePersistEventListener,
    PreRemoveEventListener,
    Normalizable
{
    companion object {
        const val INFINITE_DURATION_IN_TICKS = -1

        object TypeId {
            const val SPEED = 1
            const val SLOWNESS = 2
            const val HASTE = 3
            const val MINING_FATIGUE = 4
            const val STRENGTH = 5
            const val INSTANT_HEALTH = 6
            const val INSTANT_DAMAGE = 7
            const val JUMP_BOOST = 8
            const val NAUSEA = 9
            const val REGENERATION = 10
            const val RESISTANCE = 11
            const val FIRE_RESISTANCE = 12
            const val WATER_BREATHING = 13
            const val INVISIBILITY = 14
            const val BLINDNESS = 15
            const val NIGHT_VISION = 16
            const val HUNGER = 17
            const val WEAKNESS = 18
            const val POISON = 19
            const val WITHER = 20
            const val HEALTH_BOOST = 21
            const val ABSORPTION = 22
            const val SATURATION = 23
            const val GLOWING = 24
            const val LEVITATION = 25
            const val LUCK = 26
            const val UNLUCK = 27
            const val SLOW_FALLING = 28
            const val CONDUIT_POWER = 29
            const val DOLPHINS_GRACE = 30
            const val BAD_OMEN = 31
            const val HERO_OF_THE_VILLAGE = 32
            const val DARKNESS = 33
            const val TRIAL_OMEN = 34
            const val RAID_OMEN = 35
            const val WIND_CHARGED = 36
            const val WEAVING = 37
            const val OOZING = 38
            const val INFESTED = 39
        }
    }

    // Duration

    var duration: Duration
        get() = durationFromTicks(durationInTicks)

        set(value) {
            durationInTicks = value.toTicks().toInt()
        }

    // Target

    @ManyToOne(
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
    )
    internal var internalTarget: AvatarState? = target?.apply {
        if (Hibernate.isInitialized(internalPotionEffects))
            internalPotionEffects.add(this@PotionEffect)
    }

    @delegate:Transient
    var target: AvatarState? by NullablyReferencedSyncCollectionDelegate.Reference(
        get = { internalTarget },
        set = { internalTarget = it },
        getCollection = { it.internalPotionEffects },
        getEffectiveHolder = { it },
    )

    // Events

    @PrePersist
    override fun onPrePersist() =
        normalize()

    @PreRemove
    override fun onPreRemove() {
        target = null
    }

    // Normalization

    override fun normalize() {
        if (durationInTicks < 0)
            durationInTicks = INFINITE_DURATION_IN_TICKS
    }
}
