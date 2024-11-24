package ru.fominmv.poms.libs.commons.strings.ext

import java.net.*

// United

// - Socket address

val String.isSocketAddress: Boolean
    get() = isSocketAddress()

fun String.isSocketAddress(portMode: PortMode = PortMode.OPTIONAL): Boolean =
    isIp4SocketAddress(portMode) || isDomainNameSocketAddress(portMode)

fun String.toSocketAddress(
    portMode: PortMode = PortMode.OPTIONAL,
    defaultPort: UShort = 0u,
    resolve: Boolean = true,
): InetSocketAddress =
    toSocketAddressOrNull(portMode, defaultPort, resolve)
        ?: throw IllegalArgumentException("Bad socket address")

fun String.toSocketAddressOrNull(
    portMode: PortMode = PortMode.OPTIONAL,
    defaultPort: UShort = 0u,
    resolve: Boolean = true,
): InetSocketAddress? =
    toIp4SocketAddressOrNull(portMode, defaultPort)
        ?: toDomainNameSocketAddressOrNull(portMode, defaultPort, resolve)

// - Address

val String.isAddress: Boolean
    get() = isIp4Address || isDomainName

fun String.toAddress(): InetAddress =
    toAddressOrNull() ?: throw IllegalArgumentException("Bad address")

fun String.toAddressOrNull(): InetAddress? =
    toIp4AddressOrNull() ?: toDomainNameAddressOrNull()

// IPv6

// - Socket address

// TODO

// - Address

// TODO

// IPv4

// - Socket address

val String.isIp4SocketAddress: Boolean
    get() =  isIp4SocketAddress()

fun String.isIp4SocketAddress(portMode: PortMode = PortMode.OPTIONAL): Boolean =
    toIp4SocketAddressOrNull(portMode) != null

fun String.toIp4SocketAddress(
    portMode: PortMode = PortMode.OPTIONAL,
    defaultPort: UShort = 0u,
): InetSocketAddress =
    toIp4SocketAddressOrNull(portMode, defaultPort)
        ?: throw IllegalArgumentException("Bad IPv4 socket address")

fun String.toIp4SocketAddressOrNull(
    portMode: PortMode = PortMode.OPTIONAL,
    defaultPort: UShort = 0u,
): InetSocketAddress? {
    val (match, bytes) = tryMatchIp4Address(true) ?: return null
    val portString = match.groupValues.last()

    return tryParsePort(portString, portMode, defaultPort) { port ->
        InetSocketAddress(InetAddress.getByAddress(bytes), port.toInt())
    }
}

// - Address

val String.isIp4Address: Boolean
    get() = toIp4AddressOrNull() != null

fun String.toIp4Address(): Inet4Address =
    toIp4AddressOrNull() ?: throw IllegalArgumentException("Bad IPv4 address")

fun String.toIp4AddressOrNull(): Inet4Address? =
    tryMatchIp4Address(false)
        ?.second
        ?.let(InetAddress::getByAddress) as? Inet4Address

// - Util

private fun String.tryMatchIp4Address(withPort: Boolean): Pair<MatchResult, ByteArray>? {
    val regex = if (withPort)
        IP_4_SOCKET_ADDRESS_REGEX
    else
        IP_4_ADDRESS_REGEX

    val match = regex.matchEntire(this) ?: return null
    val bytes = ByteArray(4)

    for (i in 1..4)
        bytes[i - 1] = match.groupValues[i].toUByteOrNull()?.toByte() ?: return null

    return match to bytes
}

// Domain name

// - Socket address

val String.isDomainNameSocketAddress: Boolean
    get() = isDomainNameSocketAddress()

fun String.isDomainNameSocketAddress(portMode: PortMode = PortMode.OPTIONAL): Boolean =
    toDomainNameSocketAddressOrNull(portMode, resolve = false) != null

fun String.toDomainNameSocketAddress(
    portMode: PortMode = PortMode.OPTIONAL,
    defaultPort: UShort = 0u,
    resolve: Boolean = true,
): InetSocketAddress =
    toDomainNameSocketAddressOrNull(portMode, defaultPort, resolve)
        ?: throw IllegalArgumentException("Bad domain name socket address")

fun String.toDomainNameSocketAddressOrNull(
    portMode: PortMode = PortMode.OPTIONAL,
    defaultPort: UShort = 0u,
    resolve: Boolean = true,
): InetSocketAddress? {
    val match = tryMatchDomainName(true) ?: return null
    val portString = match.groupValues.last()

    return tryParsePort(portString, portMode, defaultPort) { port ->
        val domainName = match.groupValues[1]
        val intPort = port.toInt()

        if (resolve)
            InetSocketAddress(domainName, intPort)
        else
            InetSocketAddress.createUnresolved(domainName, intPort)
    }
}

// - Address

val String.isDomainName: Boolean
    get() = isDomainNameAddress

// Added symmetry sake (the above one is preferred)
val String.isDomainNameAddress: Boolean
    get() = tryMatchDomainName(false) != null

fun String.toDomainNameAddress(): InetAddress =
    toDomainNameAddressOrNull() ?: throw IllegalArgumentException("Bad domain name address")

fun String.toDomainNameAddressOrNull(): InetAddress? =
    tryMatchDomainName(false)
        ?.groupValues
        ?.get(1)
        ?.let(InetAddress::getByName)

// - Util

private fun String.tryMatchDomainName(withPort: Boolean): MatchResult? {
    val regex = if (withPort)
        DOMAIN_NAME_SOCKET_ADDRESS_REGEX
    else
        DOMAIN_NAME_ADDRESS_REGEX

    val match = regex.matchEntire(this) ?: return null
    val domainName = match.groupValues[1]

    if (domainName.length > MAX_DOMAIN_NAME_LENGTH)
        return null

    val labelsEnd = if (withPort)
        match.groupValues.size
    else
        match.groupValues.size - 1

    for (i in 2..<labelsEnd)
        if (match.groupValues[i].length > MAX_DOMAIN_NAME_LABEL_LENGTH)
            return null

    return match
}

// PortMode

enum class PortMode {
    NO,
    OPTIONAL,
    REQUIRED,
}

private fun <T> tryParsePort(
    portString: String,
    portMode: PortMode,
    defaultPort: UShort,
    create: (port: UShort) -> T,
): T? {
    if (portString.isEmpty())
        return if (portMode != PortMode.REQUIRED)
            create(defaultPort)
        else
            null

    if (portMode == PortMode.NO)
        return null

    val port = portString.toUShortOrNull() ?: return null

    return create(port)
}

// Constants

// - Ports

private const val PORT_PATTERN = "(?::\\s*(\\d+)\\s*)"

// - IPv4

private val IP_4_ADDRESS_REGEX = Regex(List(4) { "\\s*(\\d+)\\s*" }.joinToString("\\."))
private val IP_4_SOCKET_ADDRESS_REGEX = Regex("${IP_4_ADDRESS_REGEX.pattern}$PORT_PATTERN?")

// - Domain names

private const val MAX_DOMAIN_NAME_LENGTH = 253
private const val MAX_DOMAIN_NAME_LABEL_LENGTH = 63

private const val DOMAIN_NAME_LABEL_PATTERN = "([a-zA-Z](?:[-a-zA-Z0-9]*[a-zA-Z0-9])?)"

private val DOMAIN_NAME_ADDRESS_REGEX = Regex("\\s*($DOMAIN_NAME_LABEL_PATTERN(?:\\.$DOMAIN_NAME_LABEL_PATTERN)*)\\s*")
private val DOMAIN_NAME_SOCKET_ADDRESS_REGEX = Regex("${DOMAIN_NAME_ADDRESS_REGEX.pattern}$PORT_PATTERN?")
