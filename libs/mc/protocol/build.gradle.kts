group = "ru.fominmv.poms.libs.mc.protocol"
version = "0.0.1"

// Plugins

plugins {
    kotlin("jvm")
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

// Dependencies

repositories {
    mavenCentral()
}

dependencies {
    api(project(":libs:commons"))
    api(project(":libs:mc:nbt"))

    implementation("org.jetbrains.kotlin:kotlin-reflect")

    testImplementation(kotlin("test"))
}

// Tasks

tasks.test {
    useJUnitPlatform()
}