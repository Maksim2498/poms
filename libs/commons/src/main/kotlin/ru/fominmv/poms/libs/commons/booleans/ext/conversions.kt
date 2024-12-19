package ru.fominmv.poms.libs.commons.booleans.ext

// To String

fun Boolean.toYes(): String =
    if (this) "yes" else "no"

fun Boolean.toEnabled(): String =
    if (this) "enabled" else "disabled"

fun Boolean.toRequired(): String =
    if (this) "required" else "not required"

fun Boolean.toIs(short: Boolean = true): String =
    when {
        this -> "is"
        short -> "isn't"
        else -> "is not"
    }

fun Boolean.toAre(short: Boolean = true): String =
    when {
        this -> "are"
        short -> "aren't"
        else -> "are not"
    }

fun Boolean.toWill(short: Boolean = true): String =
    when {
        this -> "will"
        short -> "wont"
        else -> "will not"
    }

fun Boolean.toMust(short: Boolean = true): String =
    when {
        this -> "must"
        short -> "mustn't"
        else -> "must not"
    }

// To Number

fun Boolean.toByte(): Byte =
    if (this) 1 else 0

fun Boolean.toShort(): Short =
    if (this) 1 else 0

fun Boolean.toInt(): Int =
    if (this) 1 else 0

fun Boolean.toLong(): Long =
    if (this) 1 else 0
