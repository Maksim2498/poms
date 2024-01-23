package ru.fominmv.poms.server.util.io

interface UTF8Input {
    val hasBufferedUTF8CharPart: Boolean

    fun readFullUTF8Char(): String

    fun readUTF8Char(): Char
}