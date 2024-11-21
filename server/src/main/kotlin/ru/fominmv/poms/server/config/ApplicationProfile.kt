package ru.fominmv.poms.server.config

import com.fasterxml.jackson.annotation.JsonProperty

private object ApplicationProfileDisplayName {
    const val DEVELOPMENT = "development"
    const val PRODUCTION = "production"
}

enum class ApplicationProfile(val displayName: String) {
    @JsonProperty(ApplicationProfileDisplayName.DEVELOPMENT)
    DEVELOPMENT(ApplicationProfileDisplayName.DEVELOPMENT),

    @JsonProperty(ApplicationProfileDisplayName.PRODUCTION)
    PRODUCTION(ApplicationProfileDisplayName.PRODUCTION);

    companion object {
        const val PRODUCTION_DISPLAY_NAME = ApplicationProfileDisplayName.PRODUCTION
        const val DEVELOPMENT_DISPLAY_NAME = ApplicationProfileDisplayName.DEVELOPMENT
    }

    fun valueOfDisplayName(displayName: String): ApplicationProfile =
        when (displayName) {
            PRODUCTION_DISPLAY_NAME -> PRODUCTION
            DEVELOPMENT_DISPLAY_NAME -> DEVELOPMENT

            else -> throw IllegalArgumentException("No profile with display name $displayName")
        }
}
