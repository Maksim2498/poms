package ru.fominmv.poms.server.util.io

import java.io.DataInputStream
import java.io.InputStream
import java.nio.charset.CharacterCodingException

class UTF8InputStream(stream: InputStream)
    : InputStreamWrapper<DataInputStream>(DataInputStream(stream)), UTF8Input {
    private var bufferedChar: Char? = null

    override val hasBufferedUTF8CharPart: Boolean
        get() = bufferedChar != null

    override fun readFullUTF8Char(): String =
        buildString {
            bufferedChar = null

            append(readUTF8Char())

            if (hasBufferedUTF8CharPart)
                append(bufferedChar.also { bufferedChar = null })
        }

    override fun readUTF8Char(): Char {
        if (hasBufferedUTF8CharPart)
            return bufferedChar.also { bufferedChar = null }!!

        val utf32Char = readUTF32Char()
        val chars     = Character.toChars(utf32Char)

        if (chars.size > 1)
            bufferedChar = chars[1]

        return chars[0]
    }

    // Didn't find a standard way of doing this
    // without reading too many bytes at once
    // just like java.io.InputStreamReader does
    private fun readUTF32Char(): Int {
        val readByte  = { stream.readByte().toInt() }
        val firstByte = readByte()

        // Ony byte

        if ((firstByte and 0x80) == 0)
            return firstByte and 0x7F

        // Two bytes

        if ((firstByte and 0xE0) == 0xC0) {
            val secondByte = readByte()

            return (firstByte  and 0x1F shl 6) or
                   (secondByte and 0x3F      )
        }

        // Three bytes

        if ((firstByte and 0xF0) == 0xE0) {
            val secondByte = readByte()
            val thirdByte  = readByte()

            return (firstByte  and 0x0F shl 12) or
                   (secondByte and 0x3F shl 6 ) or
                   (thirdByte  and 0x3F       )
        }

        // Four bytes

        if ((firstByte and 0xF7) == 0xF0) {
            val secondByte = readByte()
            val thirdByte  = readByte()
            val fourthByte = readByte()

            return (firstByte  and 0x07 shl 18) or
                   (secondByte and 0x3F shl 12) or
                   (thirdByte  and 0x3F shl 6 ) or
                   (fourthByte and 0x3F       )
        }

        // Error

        throw CharacterCodingException()
    }
}