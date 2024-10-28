group = "ru.fominmv.poms.plugin"
version = "0.0.1-SNAPSHOT"

// Plugins

plugins {
    kotlin("jvm")
}

// Dependencies

repositories {
    maven {
        name = "papermc"
        url = uri("https://repo.papermc.io/repository/maven-public/")
    }
}

dependencies {
    compileOnly("io.papermc.paper:paper-api:1.21.1-R0.1-SNAPSHOT")
}

// Tasks

tasks.processResources {
    filesMatching("**/plugin.yml") {
        expand(
            "version" to project.version,
        )
    }
}
