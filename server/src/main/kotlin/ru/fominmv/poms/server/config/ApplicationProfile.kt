package ru.fominmv.poms.server.config

private object ApplicationProfileDisplayName {
    const val DEVELOPMENT = "development"
    const val PRODUCTION = "production"
}

enum class ApplicationProfile(val displayName: String) {
    DEVELOPMENT(ApplicationProfileDisplayName.DEVELOPMENT),
    PRODUCTION(ApplicationProfileDisplayName.PRODUCTION);

    companion object {
        const val PRODUCTION_DISPLAY_NAME = ApplicationProfileDisplayName.PRODUCTION
        const val DEVELOPMENT_DISPLAY_NAME = ApplicationProfileDisplayName.DEVELOPMENT
    }

    fun valueOfDisplayName(displayName: String): ApplicationProfile =
        when (displayName) {
            PRODUCTION_DISPLAY_NAME -> PRODUCTION
            DEVELOPMENT_DISPLAY_NAME -> DEVELOPMENT

            else -> throw IllegalArgumentException("There is no profile with display name $displayName")
        }
}
