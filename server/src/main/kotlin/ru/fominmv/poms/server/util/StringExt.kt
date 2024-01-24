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
            '\\' -> "\\\\"
            '\$' -> "\\$"
            else -> it.toString()
        }
    }.joinToString(separator = "")

val String.utf8Length: Int
    get() {
        var i      = 0
        var length = 0

        while (i < this.length) {
            val char = this[i++]

            if (char.code <= 0x7F) {
                ++length
                continue
            }

            if (char.code <= 0x07FF) {
                length += 2
                continue
            }

            if (char.isHighSurrogate()) {
                length += 4
                ++i
                continue
            }

            length += 3
        }

        return length
    }
