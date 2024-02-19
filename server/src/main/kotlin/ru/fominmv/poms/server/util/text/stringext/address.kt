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
): InetSocketAddress? =
    toIP4InetSocketAddressOrNull(portMode, defaultPort)
        ?: toDomainNameInetSocketAddressOrNull(portMode, defaultPort, resolve)

fun String.toIP4InetSocketAddress(
    portMode:    PortMode = PortMode.OPTIONAL,
    defaultPort: UShort   = 0u,
): InetSocketAddress =
    toIP4InetSocketAddressOrNull(portMode, defaultPort)
        ?: throw IllegalArgumentException("Bad IPv4 socket address")

fun String.toIP4InetSocketAddressOrNull(
    portMode:    PortMode = PortMode.OPTIONAL,
    defaultPort: UShort   = 0u,
): InetSocketAddress? {
    val match = IP_4_SOCKET_ADDRESS_REGEX.matchEntire(this) ?: return null
    val bytes = ByteArray(4)

    for (i in 1..4) {
        val byte = match.groupValues[i].toIntOrNull() ?: return null

        if (byte > UByte.MAX_VALUE.toInt())
            return null

        bytes[i - 1] = byte.toByte()
    }

    fun create(port: Int = defaultPort.toInt()): InetSocketAddress =
        InetSocketAddress(InetAddress.getByAddress(bytes), port)

    val portString = match.groupValues[5]

    if (portString.isEmpty())
        return if (portMode != PortMode.REQUIRED) create() else null

    if (portMode == PortMode.NO)
        return null

    val port = portString.toIntOrNull() ?: return null

    return if (port <= UShort.MAX_VALUE.toInt()) create(port) else null
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
    val match      = DOMAIN_NAME_SOCKET_ADDRESS_REGEX.matchEntire(this) ?: return null
    val domainName = match.groupValues[1]

    if (domainName.length > MAX_DOMAIN_NAME_LENGTH)
        return null

    for (i in 2..<match.groupValues.size - 1)
        if (match.groupValues[i].length > MAX_DOMAIN_NAME_LABEL_LENGTH)
            return null

    fun create(port: Int = defaultPort.toInt()): InetSocketAddress =
        if (resolve)
            InetSocketAddress(domainName, port)
        else
            InetSocketAddress.createUnresolved(domainName, port)

    val portString = match.groupValues[match.groupValues.size - 1]

    if (portString.isEmpty())
        return if (portMode != PortMode.REQUIRED) create() else null

    if (portMode == PortMode.NO)
        return null

    val port = portString.toIntOrNull() ?: return null

    return if (port <= UShort.MAX_VALUE.toInt()) create(port) else null
}

fun String.toInet4Address(): Inet4Address =
    toInet4AddressOrNull() ?: throw IllegalArgumentException("Bad IPv4 address")

fun String.toInet4AddressOrNull(): Inet4Address? {
    val match = IP_4_ADDRESS_REGEX.matchEntire(this) ?: return null
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

fun String.isIP4Address(portMode: PortMode = PortMode.OPTIONAL): Boolean =
    toIP4InetSocketAddressOrNull(portMode) != null

val String.isDomainName: Boolean
    get() = isDomainName()

fun String.isDomainName(portMode: PortMode = PortMode.OPTIONAL): Boolean =
    toDomainNameInetSocketAddressOrNull(portMode = portMode, resolve = false) != null


private const val PORT_PATTERN = "(?::\\s*(\\d+)\\s*)"

private val IP_4_ADDRESS_REGEX = Regex(
    List(4) { "\\s*(\\d+)\\s*" }.joinToString("\\.")
)

private val IP_4_SOCKET_ADDRESS_REGEX = Regex(
    "${IP_4_ADDRESS_REGEX.pattern}$PORT_PATTERN?"
)

private const val MAX_DOMAIN_NAME_LENGTH       = 253
private const val MAX_DOMAIN_NAME_LABEL_LENGTH = 63
private const val DOMAIN_NAME_LABEL_PATTERN    = "([a-zA-Z](?:[-a-zA-Z0-9]*[a-zA-Z0-9])?)"
private const val DOMAIN_NAME_PATTERN          = "\\s*($DOMAIN_NAME_LABEL_PATTERN(?:\\.$DOMAIN_NAME_LABEL_PATTERN)*)\\s*"

private val DOMAIN_NAME_SOCKET_ADDRESS_REGEX = Regex(
    "$DOMAIN_NAME_PATTERN$PORT_PATTERN?"
)


enum class PortMode {
    NO,
    OPTIONAL,
    REQUIRED,
}
