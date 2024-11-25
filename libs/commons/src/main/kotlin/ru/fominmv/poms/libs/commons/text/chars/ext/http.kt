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
