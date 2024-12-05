package ru.fominmv.poms.libs.commons.text.strings.ext

import ru.fominmv.poms.libs.commons.uuids.UUID_REGEX

import java.util.UUID

val String.isUuid: Boolean
    get() = matches(UUID_REGEX)

fun String.toUuid(): UUID =
    UUID.fromString(this)

fun String.toUuidOrNull(): UUID? =
    try {
        UUID.fromString(this)
    } catch (_: Exception) {
        null
    }
