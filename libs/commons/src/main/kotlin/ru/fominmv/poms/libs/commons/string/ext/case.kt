package ru.fominmv.poms.libs.commons.string.ext

fun String.capitalize(): String =
    lowercase().firstUpper()

fun String.firstUpper(): String =
    replaceFirstChar(Char::uppercase)

fun String.firstLower(): String =
    replaceFirstChar(Char::lowercase)