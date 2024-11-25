package ru.fominmv.poms.libs.commons.text.strings.ext

fun String.startsWithAndNotEquals(other: String): Boolean =
    other.length < length && startsWith(other)
