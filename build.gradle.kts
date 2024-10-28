plugins {
    kotlin("jvm") version "2.0.21"
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

allprojects {
    repositories {
        mavenCentral()
    }
}
