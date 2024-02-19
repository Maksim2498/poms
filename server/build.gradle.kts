import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
	id("org.springframework.boot"		) version "3.2.1"
	id("io.spring.dependency-management") version "1.1.4"

	kotlin("jvm"		  ) version "1.9.21"
	kotlin("plugin.spring") version "1.9.21"
	kotlin("plugin.jpa"	  ) version "1.9.21"
}

group 	= "ru.fominmv.poms"
version = "0.0.1-SNAPSHOT"

java {
	sourceCompatibility = JavaVersion.VERSION_21
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-data-jpa"	)
//	implementation("org.springframework.boot:spring-boot-starter-security"	)
//	implementation("org.springframework.boot:spring-boot-starter-validation")
	implementation("org.springframework.boot:spring-boot-starter-web"		)
	implementation("com.fasterxml.jackson.module:jackson-module-kotlin"		)
	implementation("org.jetbrains.kotlin:kotlin-reflect"					)
//	implementation("org.springframework.session:spring-session-core"		)
	implementation("net.kyori:adventure-api:4.15.0"							)
	implementation("net.kyori:adventure-text-serializer-gson:4.15.0"		)
	implementation("dnsjava:dnsjava:3.5.3"									)

	runtimeOnly("com.mysql:mysql-connector-j")
	runtimeOnly("com.h2database:h2")

	testImplementation("org.springframework.boot:spring-boot-starter-test")
//	testImplementation("org.springframework.security:spring-security-test")
}

tasks.withType<KotlinCompile> {
	kotlinOptions {
		freeCompilerArgs += "-Xjsr305=strict"
		jvmTarget 		  = "21"
	}
}

tasks.withType<Test> {
	useJUnitPlatform()
}
