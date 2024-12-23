package ru.fominmv.poms.libs.commons.text.strings.ext

fun String.plural(): String =
    if (endsWith("s"))
        this + "es"
    else
        this + 's'
