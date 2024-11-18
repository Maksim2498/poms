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

    implementation("org.jetbrains.kotlin:kotlin-reflect")

    compileOnly("io.papermc.paper:paper-api:1.21.1-R0.1-SNAPSHOT")
}

