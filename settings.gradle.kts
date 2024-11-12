rootProject.name = "poms"

plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.8.0"
}

include(
    ":libs:mc:commands",
    ":libs:mc:commons",
    ":libs:commons",
    ":plugin",
    ":server",
)
