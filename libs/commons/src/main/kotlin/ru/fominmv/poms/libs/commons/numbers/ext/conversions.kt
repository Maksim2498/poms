package ru.fominmv.poms.libs.commons.numbers.ext

// To Boolean

fun Byte.toBoolean(): Boolean =
    this != 0.toByte()

fun Int.toBoolean(): Boolean =
    this != 0

fun Short.toBoolean(): Boolean =
    this != 0.toShort()

fun Long.toBoolean(): Boolean =
    this != 0L
