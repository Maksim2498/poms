package ru.fominmv.poms.libs.commons.text.chars.ext

val Char.isHttpTokenCodePoint: Boolean
    get() = when (this) {
        in 'a'..'z',
        in 'A'..'Z',
        in '0'..'9',

        '!', '#', '$',
        '%', '&', '\'',
        '*', '+', '-',
        '.', '^', '_',
        '`', '|', '~' -> true

        else -> false
    }

val Char.isHttpQuotedStringTokenCodePoint: Boolean
    get() = when (this) {
        '\u0009',
        in '\u0020'..'\u007E',
        in '\u0080'..'\u00FF' -> true

        else -> false
    }
