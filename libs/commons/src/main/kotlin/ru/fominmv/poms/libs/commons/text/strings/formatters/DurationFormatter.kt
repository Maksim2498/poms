package ru.fominmv.poms.libs.commons.text.strings.formatters

import java.time.Duration

import kotlin.time.toKotlinDuration

class DurationFormatter(val duration: Duration) {
    override fun toString(): String =
        duration.toKotlinDuration().toString()
}
