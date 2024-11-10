package ru.fominmv.poms.libs.commons.strings.builders.ext

fun StringBuilder.toStringAndClear(): String =
    toString().also { clear() }
