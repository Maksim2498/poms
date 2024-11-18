group = "ru.fominmv.poms.libs.mc.commons"
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
    maven {
        name = "papermc"
        url = uri("https://repo.papermc.io/repository/maven-public/")
    }

    mavenCentral()
}

dependencies {
    api(project(":libs:commons"))
    api(libs.paper)

    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation(libs.jackson)
}

