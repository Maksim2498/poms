package ru.fominmv.poms.libs.commons.text.strings.ext

import ru.fominmv.poms.libs.commons.text.chars.ext.*

val String.isHttpToken: Boolean
    get() = all(Char::isHttpTokenCodePoint)

val String.isHttpQuotedStringToken: Boolean
    get() = all(Char::isHttpQuotedStringTokenCodePoint)
