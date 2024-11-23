package ru.fominmv.poms.libs.commons.strings.ext

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import ru.fominmv.poms.libs.commons.io.printlnSep

import java.net.Inet4Address
import java.net.InetAddress
import java.net.InetSocketAddress

class AddressTest {
    companion object {
        private const val DEFAULT_PORT: UShort = 2498u

        private val IP_4_TESTS: List<Triple<String, PortMode, InetSocketAddress?>> = listOf(
            Triple(
                "0.0.0.0",
                PortMode.OPTIONAL,
                createIp4SocketAddress("0.0.0.0"),
            ),

            Triple(
                "0.0.0.0:",
                PortMode.OPTIONAL,
                null,
            ),

            Triple(
                "0.0.0.0",
                PortMode.REQUIRED,
                null,
            ),

            Triple(
                "  0.  0. 0  .0  ",
                PortMode.OPTIONAL,
                createIp4SocketAddress("0.0.0.0"),
            ),

            Triple(
                "  10.  0. 255  .8  : 655 ",
                PortMode.OPTIONAL,
                createIp4SocketAddress("10.0.255.8", 655u),
            ),

            Triple(
                "0.0.0.0:",
                PortMode.OPTIONAL,
                null,
            ),

            Triple(
                "0.0.0.0:abcdef",
                PortMode.OPTIONAL,
                null,
            ),

            Triple(
                "255.255.255.255:65535",
                PortMode.OPTIONAL,
                createIp4SocketAddress("255.255.255.255", 65535u),
            ),

            Triple(
                "255.255.255.255:65535",
                PortMode.NO,
                null,
            ),

            Triple(
                "255.255.255.255:65536",
                PortMode.OPTIONAL,
                null,
            ),

            Triple(
                "256.255.255.255:65535",
                PortMode.OPTIONAL,
                null,
            ),

            Triple(
                "-1.255.255.255",
                PortMode.OPTIONAL,
                null,
            ),

            Triple(
                "0.0.0",
                PortMode.OPTIONAL,
                null,
            ),

            Triple(
                "0.0.0:255",
                PortMode.OPTIONAL,
                null,
            ),

            Triple(
                "1.2.5.10:255",
                PortMode.OPTIONAL,
                createIp4SocketAddress("1.2.5.10", 255u),
            ),

            Triple(
                "a.b.c.10:255",
                PortMode.OPTIONAL,
                null,
            ),

            Triple(
                "not and address",
                PortMode.OPTIONAL,
                null,
            ),

            Triple(
                "hey 10.20.30.40 bye",
                PortMode.OPTIONAL,
                null,
            ),

            Triple(
                "",
                PortMode.OPTIONAL,
                null,
            ),
        )

        private val IP_4_WITHOUT_PORT_TESTS: List<Pair<String, Inet4Address?>> = listOf(
            Pair("127.0.0.1", createIp4Address("127.0.0.1")),
            Pair("  127.0.0.1", createIp4Address("127.0.0.1")),
            Pair("127.0.0.1  ", createIp4Address("127.0.0.1")),
            Pair("  127  .  0 .  0.  1 ", createIp4Address("127.0.0.1")),
            Pair("255.255.255.255", createIp4Address("255.255.255.255")),
            Pair("256.255.255.255", null),
            Pair("255.256.255.255", null),
            Pair("255.255.256.255", null),
            Pair("255.255.255.256", null),
            Pair("", null),
        )

        private val DOMAIN_NAME_WITH_LONGEST_VALID_LABEL = "${"a".repeat(63)}.com"
        private val DOMAIN_NAME_WITH_TOO_LONG_LABEL = "${"a".repeat(64)}.com"
        private val LONG_VALID_DOMAIN_NAME = List(4) { "a".repeat(62) }.joinToString(".")
        private val LONGEST_VALID_DOMAIN_NAME = "$LONG_VALID_DOMAIN_NAME.a"
        private val TOO_LONG_DOMAIN_NAME = LONGEST_VALID_DOMAIN_NAME + "b"

        private val DOMAIN_NAME_TESTS: List<Pair<String, InetSocketAddress?>> = listOf(
            Pair(
                "",
                null,
            ),

            Pair(
                "x0123456789abcdef.hex",
                createDomainNameSocketAddress("x0123456789abcdef.hex"),
            ),

            Pair(
                "  x0123456789abcdef.hex : 4090  ",
                createDomainNameSocketAddress("x0123456789abcdef.hex", 4090u),
            ),

            Pair(
                "abc:24982498",
                null,
            ),

            Pair(
                "definitely not a domain name",
                null,
            ),

            Pair(
                "a-valid-domain-name.dns:4040",
                createDomainNameSocketAddress("a-valid-domain-name.dns", 4040u),
            ),

            Pair(
                "example.org",
                createDomainNameSocketAddress("example.org"),
            ),

            Pair(
                " example.org",
                createDomainNameSocketAddress("example.org"),
            ),

            Pair(
                "example.org ",
                createDomainNameSocketAddress("example.org"),
            ),

            Pair(
                "example .org",
                null,
            ),

            Pair(
                "a.b",
                createDomainNameSocketAddress("a.b"),
            ),

            Pair(
                "a-.b",
                null,
            ),

            Pair(
                "a-b.c",
                createDomainNameSocketAddress("a-b.c"),
            ),

            Pair(
                "a-b.c-",
                null,
            ),

            Pair(
                "a-b.c-d",
                createDomainNameSocketAddress("a-b.c-d"),
            ),

            Pair(
                "a-b.c-d:",
                null,
            ),

            Pair(
                " a-b.c-d : 24981",
                createDomainNameSocketAddress("a-b.c-d", 24981u),
            ),

            Pair(
                " a-b.c-d : 249800",
                null,
            ),

            Pair(
                "a-b.c-d.0-1-2-3-4-5-6-7-8-9",
                null,
            ),

            Pair(
                "a-b.c-d.e-0-1-2-3-4-5-6-7-8-9:2498",
                createDomainNameSocketAddress("a-b.c-d.e-0-1-2-3-4-5-6-7-8-9", 2498u),
            ),

            Pair(
                DOMAIN_NAME_WITH_LONGEST_VALID_LABEL,
                createDomainNameSocketAddress(DOMAIN_NAME_WITH_LONGEST_VALID_LABEL),
            ),

            Pair(
                DOMAIN_NAME_WITH_TOO_LONG_LABEL,
                null,
            ),

            Pair(
                LONG_VALID_DOMAIN_NAME,
                createDomainNameSocketAddress(LONG_VALID_DOMAIN_NAME),
            ),

            Pair(
                LONGEST_VALID_DOMAIN_NAME,
                createDomainNameSocketAddress(LONGEST_VALID_DOMAIN_NAME),
            ),

            Pair(
                TOO_LONG_DOMAIN_NAME,
                null,
            ),
        )

        private fun createIp4SocketAddress(
            address: String,
            port: UShort = DEFAULT_PORT,
        ): InetSocketAddress =
            InetSocketAddress(Inet4Address.getByName(address), port.toInt())

        private fun createDomainNameSocketAddress(
            address: String,
            port: UShort = DEFAULT_PORT,
        ): InetSocketAddress =
            InetSocketAddress.createUnresolved(address, port.toInt())

        private fun createIp4Address(address: String): Inet4Address =
            InetAddress.getByName(address) as Inet4Address
    }

    @Test
    fun toIp4SocketAddressOrNull() {
        printlnSep()

        for ((string, portMode, expectedAddress) in IP_4_TESTS) {
            print("Testing ${string.declaration()}.toIp4SocketAddressOrNull(portMode = $portMode, defaultPort = $DEFAULT_PORT) == $expectedAddress")

            assertEquals(
                expectedAddress,
                string.toIp4SocketAddressOrNull(
                    portMode = portMode,
                    defaultPort = DEFAULT_PORT,
                ),
            )

            println(" ✅")
        }

        printlnSep()
    }

    @Test
    fun toDomainNameSocketAddressOrNull() {
        printlnSep()

        for ((string, expectedAddress) in DOMAIN_NAME_TESTS) {
            print("Testing ${string.declaration()}.toDomainNameSocketAddressOrNull(defaultPort = $DEFAULT_PORT, resolve = false) == $expectedAddress")

            assertEquals(
                expectedAddress,

                string.toDomainNameSocketAddressOrNull(
                    defaultPort = DEFAULT_PORT,
                    resolve = false,
                ),
            )

            println(" ✅")
        }

        printlnSep()
    }

    @Test
    fun isIp4SocketAddress() {
        printlnSep()

        for ((string, portMode, expectedAddress) in IP_4_TESTS) {
            val mustBeValid = expectedAddress != null

            print("Testing ${string.declaration()}.isIp4SocketAddress(${portMode}) == $mustBeValid")
            assertEquals(mustBeValid, string.isIp4SocketAddress(portMode))
            println(" ✅")
        }

        printlnSep()
    }

    @Test
    fun isDomainNameSocketAddress() {
        printlnSep()

        for ((string, expectedAddress) in DOMAIN_NAME_TESTS) {
            val isDomainName = expectedAddress != null

            print("Testing ${string.declaration()}.isDomainNameSocketAddress == $isDomainName")
            assertEquals(isDomainName, string.isDomainNameSocketAddress)
            println(" ✅")
        }

        printlnSep()
    }

    @Test
    fun toIp4AddressOrNull() {
        printlnSep()

        for ((string, address) in IP_4_WITHOUT_PORT_TESTS) {
            print("Testing ${string.declaration()}.toIp4AddressOrNull() == $address")
            assertEquals(address, string.toIp4AddressOrNull())
            println(" ✅")
        }

        printlnSep()
    }
}
