package ru.fominmv.poms.libs.commons.text.strings.builders.ext

fun StringBuilder.toStringAndClear(): String =
    toString().also { clear() }
