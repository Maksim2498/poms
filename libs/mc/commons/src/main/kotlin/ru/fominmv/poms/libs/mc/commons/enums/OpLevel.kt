package ru.fominmv.poms.libs.mc.commons.enums

import com.fasterxml.jackson.annotation.JsonProperty

private object OpLevelLevel {
    const val ALL = 0
    const val MODERATOR = 1
    const val GAME_MASTER = 2
    const val ADMIN = 3
    const val OWNER = 4
}

private object OpLevelDisplayName {
    const val ALL = "all"
    const val MODERATOR = "moderator"
    const val GAME_MASTER = "game-master"
    const val ADMIN = "admin"
    const val OWNER = "owner"
}

enum class OpLevel(val level: Int, val displayName: String) {
    @JsonProperty(OpLevelDisplayName.ALL)
    ALL(OpLevelLevel.ALL, OpLevelDisplayName.ALL),

    @JsonProperty(OpLevelDisplayName.MODERATOR)
    MODERATOR(OpLevelLevel.MODERATOR, OpLevelDisplayName.MODERATOR),

    @JsonProperty(OpLevelDisplayName.GAME_MASTER)
    GAME_MASTER(OpLevelLevel.GAME_MASTER, OpLevelDisplayName.GAME_MASTER),

    @JsonProperty(OpLevelDisplayName.ADMIN)
    ADMIN(OpLevelLevel.ADMIN, OpLevelDisplayName.ADMIN),

    @JsonProperty(OpLevelDisplayName.OWNER)
    OWNER(OpLevelLevel.OWNER, OpLevelDisplayName.OWNER);
    
    companion object {
        const val ALL_LEVEL = OpLevelLevel.ALL
        const val MODERATOR_LEVEL = OpLevelLevel.MODERATOR
        const val GAME_MASTER_LEVEL = OpLevelLevel.GAME_MASTER
        const val ADMIN_LEVEL = OpLevelLevel.ADMIN
        const val OWNER_LEVEL = OpLevelLevel.OWNER

        const val ALL_DISPLAY_NAME = OpLevelDisplayName.ALL
        const val MODERATOR_DISPLAY_NAME = OpLevelDisplayName.MODERATOR
        const val GAME_MASTER_DISPLAY_NAME = OpLevelDisplayName.GAME_MASTER
        const val ADMIN_DISPLAY_NAME = OpLevelDisplayName.ADMIN
        const val OWNER_DISPLAY_NAME = OpLevelDisplayName.OWNER
        
        fun valueOfLevel(level: Int): OpLevel =
            when (level) {
                ALL_LEVEL -> ALL
                MODERATOR_LEVEL -> MODERATOR
                GAME_MASTER_LEVEL -> GAME_MASTER
                ADMIN_LEVEL -> ADMIN
                OWNER_LEVEL -> OWNER
                
                else -> throw IllegalArgumentException("No op level $level")
            }
        
        fun valueOfDisplayName(displayName: String): OpLevel =
            when (displayName) {
                ALL_DISPLAY_NAME -> ALL
                MODERATOR_DISPLAY_NAME -> MODERATOR
                GAME_MASTER_DISPLAY_NAME -> GAME_MASTER
                ADMIN_DISPLAY_NAME -> ADMIN
                OWNER_DISPLAY_NAME -> OWNER

                else -> throw IllegalArgumentException("No op level with displayName $displayName")
            }
    }
}
