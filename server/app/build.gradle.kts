plugins {
    alias(libs.plugins.jvm)

    application
}

repositories {
    mavenCentral()
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

application {
    mainClass.set("ru.fominmv.poms.server.AppKt")
}
