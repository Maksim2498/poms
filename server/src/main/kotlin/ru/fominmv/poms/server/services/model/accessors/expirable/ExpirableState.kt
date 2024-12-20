package ru.fominmv.poms.server.services.model.accessors.expirable

import com.fasterxml.jackson.annotation.JsonProperty

private object ExpirableStateDisplayName {
    const val NON_EXPIRED = "non-expired"
    const val EXPIRED = "expired"
    const val ANY = "any"
}

enum class ExpirableState(val displayName: String) {
    @JsonProperty(ExpirableStateDisplayName.NON_EXPIRED)
    NON_EXPIRED(ExpirableStateDisplayName.NON_EXPIRED),

    @JsonProperty(ExpirableStateDisplayName.EXPIRED)
    EXPIRED(ExpirableStateDisplayName.EXPIRED),

    @JsonProperty(ExpirableStateDisplayName.ANY)
    ANY(ExpirableStateDisplayName.ANY);
    
    companion object {
        const val NON_EXPIRED_DISPLAY_NAME = ExpirableStateDisplayName.NON_EXPIRED
        const val EXPIRED_DISPLAY_NAME = ExpirableStateDisplayName.EXPIRED
        const val ANY_DISPLAY_NAME = ExpirableStateDisplayName.ANY

        fun valueOfDisplayName(displayName: String): ExpirableState =
            when (displayName) {
                NON_EXPIRED_DISPLAY_NAME -> NON_EXPIRED
                EXPIRED_DISPLAY_NAME -> EXPIRED
                ANY_DISPLAY_NAME -> ANY

                else -> throw IllegalArgumentException(
                    "No expirable state with display name $displayName"
                )
            }
    }
}
