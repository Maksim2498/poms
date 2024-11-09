package ru.fominmv.poms.libs.commons.strings.ext

fun String.startsWithAndNotEquals(other: String): Boolean =
    other.length < length && startsWith(other)
