package ru.fominmv.poms.libs.commons.io

const val DEFAULT_SEP_SIZE = 64

fun printSep(size: Int = DEFAULT_SEP_SIZE) =
    print("-".repeat(size))

fun printlnSep(size: Int = DEFAULT_SEP_SIZE) =
    println("-".repeat(size))
