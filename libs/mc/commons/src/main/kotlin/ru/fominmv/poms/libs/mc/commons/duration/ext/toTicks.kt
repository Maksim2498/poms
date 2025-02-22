package ru.fominmv.poms.libs.mc.commons.duration.ext

import ru.fominmv.poms.libs.mc.commons.duration.TICKS_IN_SECOND

import java.time.Duration

fun Duration.toTicks(): Long =
    toMillis() / (1_000 / TICKS_IN_SECOND)
