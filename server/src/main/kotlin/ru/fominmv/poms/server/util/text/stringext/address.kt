package ru.fominmv.poms.server.util.text.stringext

import java.net.Inet4Address
import java.net.InetAddress
import java.net.InetSocketAddress

fun String.toInetSocketAddress(
    portMode:    PortMode = PortMode.OPTIONAL,
    defaultPort: UShort   = 0u,
    resolve:     Boolean  = true,
): InetSocketAddress =
    toInetSocketAddressOrNull(portMode, defaultPort, resolve)
        ?: throw IllegalArgumentException("Bad socket address")

fun String.toInetSocketAddressOrNull(
    portMode:    PortMode = PortMode.OPTIONAL,
    defaultPort: UShort   = 0u,
    resolve:     Boolean  = true,
): InetSocketAddress? {
    TODO()
}

fun String.toIP4AddressInetSocketAddress(
    portMode:    PortMode = PortMode.OPTIONAL,
    defaultPort: UShort   = 0u,
): InetSocketAddress =
    toInet4AddressInetSocketAddressOrNull(portMode, defaultPort)
        ?: throw IllegalArgumentException("Bad IPv4 socket address")

fun String.toInet4AddressInetSocketAddressOrNull(
    portMode:    PortMode = PortMode.OPTIONAL,
    defaultPort: UShort   = 0u,
): InetSocketAddress? {
    TODO()
}

fun String.toDomainNameInetSocketAddress(
    portMode:    PortMode = PortMode.OPTIONAL,
    defaultPort: UShort   = 0u,
    resolve:     Boolean  = true,
): InetSocketAddress =
    toDomainNameInetSocketAddressOrNull(portMode, defaultPort, resolve)
        ?: throw IllegalArgumentException("Bad domain name socket address")

fun String.toDomainNameInetSocketAddressOrNull(
    portMode:    PortMode = PortMode.OPTIONAL,
    defaultPort: UShort   = 0u,
    resolve:     Boolean  = true,
): InetSocketAddress? {
    TODO()
}

fun String.toInet4Address(): Inet4Address =
    toInet4AddressOrNull() ?: throw IllegalArgumentException("Bad IPv4 address")

fun String.toInet4AddressOrNull(): Inet4Address? {
    val match = INET_4_ADDRESS_REGEX.matchEntire(this) ?: return null
    val bytes = ByteArray(4)

    for (i in 1..4) {
        val byte = match.groupValues[i].toIntOrNull() ?: return null

        if (byte > UByte.MAX_VALUE.toInt())
            return null

        bytes[i - 1] = byte.toByte()
    }

    return InetAddress.getByAddress(bytes) as? Inet4Address
}

val String.isIP4Address: Boolean
    get() = isIP4Address()

fun String.isIP4Address(portMode: PortMode = PortMode.OPTIONAL): Boolean {
    val match = IP_4_ADDRESS_REGEX.matchEntire(this) ?: return false

    for (i in 1..4) {
        val byte = match.groupValues[i].toIntOrNull() ?: return false

        if (byte > UByte.MAX_VALUE.toInt())
            return false
    }

    val portString = match.groupValues[5]

    if (portString.isEmpty())
        return portMode != PortMode.REQUIRED

    val port = portString.toIntOrNull() ?: return false

    if (port !in 0..UShort.MAX_VALUE.toInt())
        return false

    return portMode != PortMode.NO
}

val String.isDomainName: Boolean
    get() = isDomainName()

fun String.isDomainName(portMode: PortMode = PortMode.OPTIONAL): Boolean {
    val match = DOMAIN_NAME_REGEX.matchEntire(this) ?: return false

    print(match.groupValues.map(String::declaration))

    if (match.groupValues[1].length > MAX_DOMAIN_NAME_LENGTH)
        return false

    for (i in 2..<match.groupValues.size - 1)
        if (match.groupValues[i].length > MAX_DOMAIN_NAME_LABEL_LENGTH)
            return false

    val portString = match.groupValues[match.groupValues.size - 1]

    if (portString.isEmpty())
        return portMode != PortMode.REQUIRED

    val port = portString.toIntOrNull() ?: return false

    if (port !in 0..UShort.MAX_VALUE.toInt())
        return false

    return portMode != PortMode.NO
}

private val IP_4_ADDRESS_REGEX = Regex(
    "${List(4) { "\\s*(\\d+)\\s*" }.joinToString("\\.")}(?::\\s*(\\d+)\\s*)?"
)

private val INET_4_ADDRESS_REGEX = Regex(
    List(4) { "\\s*(\\d+)\\s*" }.joinToString("\\.")
)

private const val MAX_DOMAIN_NAME_LENGTH       = 253
private const val MAX_DOMAIN_NAME_LABEL_LENGTH = 63
private const val DOMAIN_NAME_LABEL_PATTERN    = "([a-zA-Z](?:[-a-zA-Z0-9]*[a-zA-Z0-9])?)"

private val DOMAIN_NAME_REGEX = Regex(
    "\\s*($DOMAIN_NAME_LABEL_PATTERN(?:\\.$DOMAIN_NAME_LABEL_PATTERN)*)\\s*(?::\\s*(\\d+)\\s*)?"
)

enum class PortMode {
    NO,
    OPTIONAL,
    REQUIRED,
}
