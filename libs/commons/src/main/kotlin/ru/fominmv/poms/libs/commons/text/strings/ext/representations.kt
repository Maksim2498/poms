package ru.fominmv.poms.libs.commons.text.strings.ext

fun String.declaration(): String =
    "\"${escapeSpecial()}\""
