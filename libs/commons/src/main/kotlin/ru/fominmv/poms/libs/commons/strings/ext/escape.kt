package ru.fominmv.poms.libs.commons.strings.ext

fun String.escapeSpecial(): String =
    map {
        when (it) {
            '\t' -> "\\t"
            '\b' -> "\\b"
            '\n' -> "\\n"
            '\r' -> "\\r"
            '\'' -> "\\'"
            '\"' -> "\\\""
            '\\' -> "\\\\"
            '\$' -> "\\$"
            else -> it.toString()
        }
    }.joinToString("")
