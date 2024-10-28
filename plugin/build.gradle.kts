plugins {
    kotlin("jvm") version "2.0.21"
}

group = "ru.fominmv.poms.plugin"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    maven {
        name = "papermc"
        url = uri("https://repo.papermc.io/repository/maven-public/")
    }

    mavenCentral()
}

dependencies {
    compileOnly("io.papermc.paper:paper-api:1.21.1-R0.1-SNAPSHOT")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

tasks.processResources {
    filesMatching("**/plugin.yml") {
        expand(
            "version" to project.version,
        )
    }
}
