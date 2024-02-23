package ru.fominmv.poms.server

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.core.convert.ConversionService
import org.springframework.core.convert.support.DefaultConversionService

import ru.fominmv.poms.server.converter.StringToDurationConverter

@SpringBootApplication
class PomsServerApplication {
    @Bean
    fun conversionService(): ConversionService =
        DefaultConversionService().apply {
            addConverter(StringToDurationConverter())
        }
}

fun main(args: Array<String>) {
    runApplication<PomsServerApplication>(*args)
}
