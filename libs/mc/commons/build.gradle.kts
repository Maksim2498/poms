group = "ru.fominmv.poms.libs.mc.commons"
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
    maven {
        name = "papermc"
        url = uri("https://repo.papermc.io/repository/maven-public/")
    }

    mavenCentral()
}

dependencies {
    api(project(":libs:commons"))
    api(libs.paper)

    implementation(kotlin("reflect"))
    implementation(libs.jackson)
}

