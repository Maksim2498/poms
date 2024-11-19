rootProject.name = "poms"

plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.8.0"
}

include(
    ":libs:mc:commands",
    ":libs:mc:commons",
    ":libs:mc:nbt",
    ":libs:mc:protocol",
    ":libs:mc:status",

    ":libs:commons",

    ":plugin",
    ":server",
)
