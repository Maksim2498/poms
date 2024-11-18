package ru.fominmv.poms.libs.mc.commons.enums

import org.bukkit.potion.PotionEffectType as BukkitPotionEffectType

enum class PotionEffectType(
    val id: Int,

    private val bukkitPotionEffectType: BukkitPotionEffectType,
) {
    SPEED(1, BukkitPotionEffectType.SPEED),
    SLOWNESS(2, BukkitPotionEffectType.SLOWNESS),
    HASTE(3, BukkitPotionEffectType.HASTE),
    MINING_FATIGUE(4, BukkitPotionEffectType.MINING_FATIGUE),
    STRENGTH(5, BukkitPotionEffectType.STRENGTH),
    INSTANT_HEALTH(6, BukkitPotionEffectType.INSTANT_HEALTH),
    INSTANT_DAMAGE(7, BukkitPotionEffectType.INSTANT_DAMAGE),
    JUMP_BOOST(8, BukkitPotionEffectType.JUMP_BOOST),
    NAUSEA(9, BukkitPotionEffectType.NAUSEA),
    REGENERATION(10, BukkitPotionEffectType.REGENERATION),
    RESISTANCE(11, BukkitPotionEffectType.RESISTANCE),
    FIRE_RESISTANCE(12, BukkitPotionEffectType.FIRE_RESISTANCE),
    WATER_BREATHING(13, BukkitPotionEffectType.WATER_BREATHING),
    INVISIBILITY(14, BukkitPotionEffectType.INVISIBILITY),
    BLINDNESS(15, BukkitPotionEffectType.BLINDNESS),
    NIGHT_VISION(16, BukkitPotionEffectType.NIGHT_VISION),
    HUNGER(17, BukkitPotionEffectType.HUNGER),
    WEAKNESS(18, BukkitPotionEffectType.WEAKNESS),
    POISON(19, BukkitPotionEffectType.POISON),
    WITHER(20, BukkitPotionEffectType.WITHER),
    HEALTH_BOOST(21, BukkitPotionEffectType.HEALTH_BOOST),
    ABSORPTION(22, BukkitPotionEffectType.ABSORPTION),
    SATURATION(23, BukkitPotionEffectType.SATURATION),
    GLOWING(24, BukkitPotionEffectType.GLOWING),
    LEVITATION(25, BukkitPotionEffectType.LEVITATION),
    LUCK(26, BukkitPotionEffectType.LUCK),
    UNLUCK(27, BukkitPotionEffectType.UNLUCK),
    SLOW_FALLING(28, BukkitPotionEffectType.SLOW_FALLING),
    CONDUIT_POWER(29, BukkitPotionEffectType.CONDUIT_POWER),
    DOLPHINS_GRACE(30, BukkitPotionEffectType.DOLPHINS_GRACE),
    BAD_OMEN(31, BukkitPotionEffectType.BAD_OMEN),
    HERO_OF_THE_VILLAGE(32, BukkitPotionEffectType.HERO_OF_THE_VILLAGE),
    DARKNESS(33, BukkitPotionEffectType.DARKNESS),
    TRIAL_OMEN(34, BukkitPotionEffectType.TRIAL_OMEN),
    RAID_OMEN(35, BukkitPotionEffectType.RAID_OMEN),
    WIND_CHARGED(36, BukkitPotionEffectType.WIND_CHARGED),
    WEAVING(37, BukkitPotionEffectType.WEAVING),
    OOZING(38, BukkitPotionEffectType.OOZING),
    INFESTED(39, BukkitPotionEffectType.INFESTED);

    fun toBukkit(): BukkitPotionEffectType =
        bukkitPotionEffectType

    companion object {
        fun fromBukkit(type: BukkitPotionEffectType): PotionEffectType =
            entries.firstOrNull { it.bukkitPotionEffectType == type } ?:
            throw IllegalArgumentException(
                "No potion effect type corresponding to the bukkit potion effect type $type"
            )

        fun valueOfId(id: Int): PotionEffectType =
            entries.firstOrNull { it.id == id } ?:
                throw IllegalArgumentException("No potion effect type with id $id")
    }
}
