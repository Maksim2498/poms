package ru.fominmv.poms.server.converter

import org.springframework.core.convert.converter.Converter

import kotlin.time.Duration

class StringToDurationConverter : Converter<String, Duration> {
    override fun convert(source: String): Duration =
        Duration.parse(source)
}