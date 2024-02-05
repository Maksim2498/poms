package ru.fominmv.poms.server.util.text.stringext

import java.net.Inet4Address
import java.net.InetSocketAddress

private val IP_4_ADDRESS_REGEX = Regex(
    "${List(4) { "\\s*(\\d+)\\s*" }.joinToString("\\.")}(:\\s*(\\d+)\\s*)?"
)

enum class PortMode {
    NO,
    OPTIONAL,
    REQUIRED,
}

val String.isIP4Address: Boolean
    get() = isIP4Address()

fun String.isIP4Address(portMode: PortMode = PortMode.OPTIONAL): Boolean {
    val match = IP_4_ADDRESS_REGEX.matchEntire(this) ?: return false

    for (i in 1..4) {
        val byte = match.groupValues[i].toIntOrNull() ?: return false

        if (byte !in 0..UByte.MAX_VALUE.toInt())
            return false
    }

    val portString = match.groupValues[6]

    if (portString.isEmpty())
        return portMode != PortMode.REQUIRED

    val port = portString.toIntOrNull() ?: return false

    if (port !in 0..UShort.MAX_VALUE.toInt())
        return false

    return portMode != PortMode.NO
}

fun String.toInet4Address(): Inet4Address =
    toInet4AddressOrNull() ?: throw IllegalArgumentException("Bad address")

fun String.toInet4AddressOrNull(): Inet4Address? {
    return null
}

fun String.toInetSocketAddress(defaultPort: UShort = 0u): InetSocketAddress =
    toInetSocketAddressOrNull(defaultPort) ?: throw IllegalArgumentException("Bad address")

fun String.toInetSocketAddressOrNull(defaultPort: UShort = 0u): InetSocketAddress? {
    return null
}
