package ru.fominmv.poms.server.util

fun String.declaration(): String =
    "\"${escapeSpecial()}\""

fun String.escapeSpecial(): String =
    map {
        when (it) {
            '\t' -> "\\t"
            '\b' -> "\\b"
            '\n' -> "\\n"
            '\r' -> "\\r"
            '\'' -> "\\'"
            '\"' -> "\\\""
            '\\' -> "\\"
            '\$' -> "\\$"
            else -> it.toString()
        }
    }.joinToString(separator = "")
