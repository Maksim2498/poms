package ru.fominmv.poms.server

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class PomsServerApplication

fun main(args: Array<String>) {
	runApplication<PomsServerApplication>(*args)
}
