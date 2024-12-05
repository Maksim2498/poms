group = "ru.fominmv.poms.libs.api"
version = "0.0.1-SNAPSHOT"

// Plugins

plugins {
    kotlin("jvm")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }

    jvmToolchain(21)
}

// Dependencies

repositories {
    mavenCentral()
}

dependencies {
    api(libs.jakartaValidation)
    api(project(":libs:commons"))

    implementation(kotlin("reflect"))

    testImplementation(kotlin("test"))
}

// Tasks

tasks.test {
    useJUnitPlatform()
}
