package ru.fominmv.poms.libs.commons.strings.ext

fun String.declaration(): String =
    "\"${escapeSpecial()}\""
