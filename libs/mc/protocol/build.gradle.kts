group = "ru.fominmv.poms.libs.mc.protocol"
version = "0.0.1"

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
    api(project(":libs:commons"))
    api(project(":libs:mc:nbt"))

    implementation(kotlin("reflect"))

    testImplementation(kotlin("test"))
}

// Tasks

tasks.test {
    useJUnitPlatform()
}
