package ru.fominmv.poms.libs.mc.commons.duration

import java.time.Duration

fun durationFromTicks(ticks: Byte): Duration =
    durationFromTicks(ticks.toLong())

fun durationFromTicks(ticks: Short): Duration =
    durationFromTicks(ticks.toLong())

fun durationFromTicks(ticks: Int): Duration =
    durationFromTicks(ticks.toLong())

fun durationFromTicks(ticks: Long): Duration =
    Duration.ofMillis(1000 * ticks / TICKS_IN_SECOND)
