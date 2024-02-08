package ru.fominmv.poms.server.util.text.stringext

val String.isIP4Address: Boolean
    get() = isIP4Address()

private val IP_4_ADDRESS_REGEX = Regex(
    "${List(4) { "\\s*(\\d+)\\s*" }.joinToString("\\.")}(?::\\s*(\\d+)\\s*)?"
)

fun String.isIP4Address(portMode: PortMode = PortMode.OPTIONAL): Boolean {
    val match = IP_4_ADDRESS_REGEX.matchEntire(this) ?: return false

    for (i in 1..4) {
        val byte = match.groupValues[i].toIntOrNull() ?: return false

        if (byte !in 0..UByte.MAX_VALUE.toInt())
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

private const val MAX_DOMAIN_NAME_LENGTH       = 253
private const val MAX_DOMAIN_NAME_LABEL_LENGTH = 63
private const val DOMAIN_NAME_LABEL_PATTERN    = "([a-zA-Z](?:[-a-zA-Z0-9]*[a-zA-Z0-9])?)"

private val DOMAIN_NAME_REGEX = Regex(
    "\\s*($DOMAIN_NAME_LABEL_PATTERN(?:\\.$DOMAIN_NAME_LABEL_PATTERN)*)\\s*(?::\\s*(\\d+)\\s*)?"
)

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

enum class PortMode {
    NO,
    OPTIONAL,
    REQUIRED,
}
