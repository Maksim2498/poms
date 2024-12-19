package ru.fominmv.poms.libs.commons.log.slf4.ext

import org.slf4j.event.Level
import org.slf4j.Logger

fun <T> Logger.tryOrWarn(action: () -> T): T? =
    tryOrLog(action, Level.WARN)

fun <T> Logger.tryOrError(action: () -> T): T? =
    tryOrLog(action, Level.ERROR)

fun <T> Logger.tryOrLog(action: () -> T, level: Level): T? =
    try {
        action()
    } catch (exception: Exception) {
        atLevel(level).log(exception.message)
        null
    }
