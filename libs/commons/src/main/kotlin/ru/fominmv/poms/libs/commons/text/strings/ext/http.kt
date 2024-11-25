package ru.fominmv.poms.libs.commons.text.strings.ext

import ru.fominmv.poms.libs.commons.text.chars.ext.isHttpTokenCodePoint

val String.isHttpToken: Boolean
    get() = all(Char::isHttpTokenCodePoint)
