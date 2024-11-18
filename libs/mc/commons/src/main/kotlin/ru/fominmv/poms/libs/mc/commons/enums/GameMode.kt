package ru.fominmv.poms.libs.mc.commons.enums

import org.bukkit.GameMode as BukkitGameMode

import com.fasterxml.jackson.annotation.JsonProperty

private object GameModeDisplayName {
    const val SURVIVAL = "survival"
    const val CREATIVE = "creative"
    const val ADVENTURE = "adventure"
    const val SPECTATOR = "spectator"
}

private object GameModeId {
    const val SURVIVAL = 0
    const val CREATIVE = 1
    const val ADVENTURE = 2
    const val SPECTATOR = 3
}

enum class GameMode(
    val id: Int,
    val displayName: String,
    val isInvulnerable: Boolean,

    private val bukkitGameMode: BukkitGameMode,
) {
    @JsonProperty(GameModeDisplayName.SURVIVAL)
    SURVIVAL(
        id = GameModeId.SURVIVAL,
        displayName = GameModeDisplayName.SURVIVAL,
        isInvulnerable = false,
        bukkitGameMode = BukkitGameMode.SURVIVAL,
    ),

    @JsonProperty(GameModeDisplayName.CREATIVE)
    CREATIVE(
        id = GameModeId.CREATIVE,
        displayName = GameModeDisplayName.CREATIVE,
        isInvulnerable = true,
        bukkitGameMode = BukkitGameMode.CREATIVE,
    ),

    @JsonProperty(GameModeDisplayName.ADVENTURE)
    ADVENTURE(
        id = GameModeId.ADVENTURE,
        displayName = GameModeDisplayName.ADVENTURE,
        isInvulnerable = false,
        bukkitGameMode = BukkitGameMode.ADVENTURE,
    ),

    @JsonProperty(GameModeDisplayName.SPECTATOR)
    SPECTATOR(
        id = GameModeId.SPECTATOR,
        displayName = GameModeDisplayName.SPECTATOR,
        isInvulnerable = true,
        bukkitGameMode = BukkitGameMode.SPECTATOR,
    );

    fun toBukkit(): BukkitGameMode =
        bukkitGameMode

    companion object {
        const val CREATIVE_ID = GameModeId.CREATIVE
        const val SURVIVAL_ID = GameModeId.SURVIVAL
        const val ADVENTURE_ID = GameModeId.ADVENTURE
        const val SPECTATOR_ID = GameModeId.SPECTATOR

        const val CREATIVE_DISPLAY_NAME = GameModeDisplayName.CREATIVE
        const val SURVIVAL_DISPLAY_NAME = GameModeDisplayName.SURVIVAL
        const val ADVENTURE_DISPLAY_NAME = GameModeDisplayName.ADVENTURE
        const val SPECTATOR_DISPLAY_NAME = GameModeDisplayName.SPECTATOR

        fun fromBukkit(gameMode: BukkitGameMode): GameMode =
            when (gameMode) {
                BukkitGameMode.CREATIVE -> CREATIVE
                BukkitGameMode.SURVIVAL -> SURVIVAL
                BukkitGameMode.ADVENTURE -> ADVENTURE
                BukkitGameMode.SPECTATOR -> SPECTATOR
            }

        fun valueOfId(id: Int): GameMode =
            when (id) {
                CREATIVE_ID -> CREATIVE
                SURVIVAL_ID -> SURVIVAL
                ADVENTURE_ID -> ADVENTURE
                SPECTATOR_ID -> SPECTATOR

                else -> throw IllegalArgumentException("No game mode with id $id")
            }

        fun valueOfDisplayName(displayName: String): GameMode =
            when (displayName) {
                CREATIVE_DISPLAY_NAME -> CREATIVE
                SURVIVAL_DISPLAY_NAME -> SURVIVAL
                ADVENTURE_DISPLAY_NAME -> ADVENTURE
                SPECTATOR_DISPLAY_NAME -> SPECTATOR

                else -> throw IllegalArgumentException("No game mode with display name $displayName")
            }
    }
}
