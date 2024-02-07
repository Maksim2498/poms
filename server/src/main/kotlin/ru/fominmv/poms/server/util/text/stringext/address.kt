package ru.fominmv.poms.server.util.text.stringext

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

private val IP_4_ADDRESS_REGEX = Regex(
    "${List(4) { "\\s*(\\d+)\\s*" }.joinToString("\\.")}(:\\s*(\\d+)\\s*)?"
)

val String.isDomainName: Boolean
    get() {
        if (length > MAX_DOMAIN_NAME_LENGTH)
            return false

        val match = DOMAIN_NAME_REGEX.matchEntire(this) ?: return false

        for (i in 1..<match.groupValues.size)
            if (match.groupValues[i].length > MAX_DOMAIN_NAME_LABEL_LENGTH)
                return false

        return true
    }

private const val MAX_DOMAIN_NAME_LENGTH       = 253
private const val MAX_DOMAIN_NAME_LABEL_LENGTH = 63
private const val DOMAIN_NAME_LABEL_PATTERN    = "([a-zA-Z]([-a-zA-Z0-9]*[a-zA-Z0-9])?)"

private val DOMAIN_NAME_REGEX = Regex(
    "$DOMAIN_NAME_LABEL_PATTERN(\\.$DOMAIN_NAME_LABEL_PATTERN)*"
)