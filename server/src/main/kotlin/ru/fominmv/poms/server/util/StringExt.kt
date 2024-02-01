package ru.fominmv.poms.server.util

fun String.declaration(): String =
    "\"${escapeSpecial()}\""

fun String.escapeSpecial(): String =
    map {
        when (it) {
            '\t' -> "\\t"
            '\b' -> "\\b"
            '\n' -> "\\n"
            '\r' -> "\\r"
            '\'' -> "\\'"
            '\"' -> "\\\""
            '\\' -> "\\\\"
            '\$' -> "\\$"
            else -> it.toString()
        }
    }.joinToString(separator = "")

val String.utf8Length: Int
    get() {
        var i      = 0
        var length = 0

        while (i < this.length) {
            val char = this[i++]

            if (char.code <= 0x7F) {
                ++length
                continue
            }

            if (char.code <= 0x07FF) {
                length += 2
                continue
            }

            if (char.isHighSurrogate()) {
                length += 4
                ++i
                continue
            }

            length += 3
        }

        return length
    }

private val INET_4_ADDRESS_REGEX = Regex(
    List(4) { "\\s*(\\d+)\\s*" }.joinToString("\\.")
)

val String.isInet4Address: Boolean
    get() {
        val match = INET_4_ADDRESS_REGEX.matchEntire(this) ?: return false

        for (i in 1..4) {
            val byte = match.groupValues[i].toIntOrNull() ?: return false

            if (byte !in 0..UByte.MAX_VALUE.toInt())
                return false
        }

        return true
    }

private val INET_4_SOCKET_ADDRESS_REGEX = Regex(
    "${INET_4_ADDRESS_REGEX.pattern}(:\\s*(\\d+)\\s*)?"
)

val String.isInet4SocketAddress: Boolean
    get() {
        val match = INET_4_SOCKET_ADDRESS_REGEX.matchEntire(this) ?: return false

        for (i in 1..4) {
            val byte = match.groupValues[i].toIntOrNull() ?: return false

            if (byte !in 0..UByte.MAX_VALUE.toInt())
                return false
        }

        val portString = match.groupValues[6]

        if (portString.isEmpty())
            return true

        val port = portString.toIntOrNull() ?: return false

        return port in 0..UShort.MAX_VALUE.toInt()
    }
