group = "ru.fominmv.poms.server"
version = "0.0.1-SNAPSHOT"

// Plugins

plugins {
	kotlin("jvm")
	kotlin("plugin.spring") version libs.versions.kotlin
	kotlin("plugin.jpa") version libs.versions.kotlin

	id("org.springframework.boot") version libs.versions.springBoot
	id("io.spring.dependency-management") version libs.versions.springDependencyManagement
}

allOpen {
	annotation("jakarta.persistence.Entity")
	annotation("jakarta.persistence.MappedSuperclass")
	annotation("jakarta.persistence.Embeddable")
}

springBoot {
	mainClass = "ru.fominmv.poms.server.ApplicationKt"
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
	// Libs

	implementation(project(":libs:mc:commons"))
	implementation(project(":libs:mc:nbt"))
	implementation(project(":libs:api"))
	implementation(project(":libs:commons"))

	// Kotlin

	implementation(kotlin("reflect"))

	// Spring

	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-validation")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-websocket")

	// Validation

	implementation(libs.jakartaValidation)

	// JSON

	implementation(libs.jsonPatch)
	implementation(libs.jackson)

	// SQL

	runtimeOnly("com.h2database:h2")
	runtimeOnly("com.mysql:mysql-connector-j")

	// Test

	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.springframework.security:spring-security-test")

	testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")

	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

// Tasks

tasks.withType<Test> {
	useJUnitPlatform()
}
