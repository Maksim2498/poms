package ru.fominmv.poms.server.model.entities

import org.hibernate.annotations.*
import org.hibernate.Hibernate

import ru.fominmv.poms.server.model.interfaces.events.*
import ru.fominmv.poms.server.model.interfaces.mutable.Normalizable
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.text.strings.objs.Hidden
import ru.fominmv.poms.libs.mc.commons.duration.ext.toTicks
import ru.fominmv.poms.libs.mc.commons.duration.durationFromTicks
import ru.fominmv.poms.libs.mc.commons.enums.PotionEffectType

import jakarta.persistence.CascadeType
import jakarta.persistence.*
import jakarta.validation.constraints.NotNull

import java.time.Duration
import java.util.*

@Entity
class PotionEffect(
    target: AvatarState? = null,

    @Column(nullable = false)
    var typeId: Int = PotionEffectType.SPEED.id,

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
    }

    // Duration

    var duration: Duration
        get() = durationFromTicks(durationInTicks)
        set(value) { durationInTicks = value.toTicks().toInt() }

    // Target

    @Hidden
    @NotNull
    @ManyToOne(
        optional = false,
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
    internal var internalTarget: AvatarState? = target?.also {
        if (Hibernate.isInitialized(it.internalPotionEffects))
            it.internalPotionEffects.add(this)
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
