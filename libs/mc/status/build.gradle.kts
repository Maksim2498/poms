group = "ru.fominmv.poms.libs.mc.status"
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
    api(project(":libs:mc:protocol"))

    implementation(kotlin("reflect"))
    implementation(libs.jackson)
    implementation(libs.kyoriAdventureApi)
    implementation(libs.kyoriAdventureTextSerializerGson)
    implementation(libs.kyoriAdventureTextSerializerLegacy)
    implementation(libs.dnsJava)
    implementation(libs.slf4jApi)
    implementation(libs.slf4jSimple)

    testImplementation(kotlin("test"))
    testImplementation(libs.kyoriAdventureTextSerializerPlain)
}

// Tasks

tasks.test {
    useJUnitPlatform()
}
