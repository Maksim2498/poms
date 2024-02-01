package ru.fominmv.poms.server.util.text.stringext

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
