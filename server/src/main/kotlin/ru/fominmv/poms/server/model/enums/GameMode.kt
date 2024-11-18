package ru.fominmv.poms.server.model.enums

import com.fasterxml.jackson.annotation.JsonProperty

private object GameModeDisplayName {
    const val CREATIVE = "creative"
    const val SURVIVAL = "survival"
    const val ADVENTURE = "adventure"
    const val SPECTATOR = "spectator"
}

private object GameModeId {
    const val CREATIVE = 0
    const val SURVIVAL = 1
    const val ADVENTURE = 2
    const val SPECTATOR = 3
}

enum class GameMode(val id: Int, val displayName: String) {
    @JsonProperty(GameModeDisplayName.CREATIVE)
    CREATIVE(GameModeId.CREATIVE, GameModeDisplayName.CREATIVE),

    @JsonProperty(GameModeDisplayName.SURVIVAL)
    SURVIVAL(GameModeId.SURVIVAL, GameModeDisplayName.SURVIVAL),

    @JsonProperty(GameModeDisplayName.ADVENTURE)
    ADVENTURE(GameModeId.ADVENTURE, GameModeDisplayName.ADVENTURE),

    @JsonProperty(GameModeDisplayName.SPECTATOR)
    SPECTATOR(GameModeId.SPECTATOR, GameModeDisplayName.SPECTATOR);
    
    companion object {
        const val CREATIVE_ID = GameModeId.CREATIVE
        const val SURVIVAL_ID = GameModeId.SURVIVAL
        const val ADVENTURE_ID = GameModeId.ADVENTURE
        const val SPECTATOR_ID = GameModeId.SPECTATOR
        
        const val CREATIVE_DISPLAY_NAME = GameModeDisplayName.CREATIVE
        const val SURVIVAL_DISPLAY_NAME = GameModeDisplayName.SURVIVAL
        const val ADVENTURE_DISPLAY_NAME = GameModeDisplayName.ADVENTURE
        const val SPECTATOR_DISPLAY_NAME = GameModeDisplayName.SPECTATOR

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
