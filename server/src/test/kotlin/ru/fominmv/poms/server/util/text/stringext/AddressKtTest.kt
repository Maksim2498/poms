package ru.fominmv.poms.server.util.text.stringext

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import ru.fominmv.poms.server.util.printSep

import java.net.Inet4Address
import java.net.InetAddress
import java.net.InetSocketAddress

class AddressKtTest {
    companion object {
        private const val DEFAULT_PORT: UShort = 2498u

        private val IP_4_TESTS: List<Triple<String, PortMode, InetSocketAddress?>> = listOf(
            Triple(
                "0.0.0.0",
                PortMode.OPTIONAL,
                createIP4InetSocketAddress("0.0.0.0"),
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
                createIP4InetSocketAddress("0.0.0.0"),
            ),
            Triple(
                "  10.  0. 255  .8  : 655 ",
                PortMode.OPTIONAL,
                createIP4InetSocketAddress("10.0.255.8", 655u),
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
                createIP4InetSocketAddress("255.255.255.255", 65535u),
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
                createIP4InetSocketAddress("1.2.5.10", 255u),
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
            Pair("127.0.0.1",             createInet4Address("127.0.0.1")      ),
            Pair("  127.0.0.1",           createInet4Address("127.0.0.1")      ),
            Pair("127.0.0.1  ",           createInet4Address("127.0.0.1")      ),
            Pair("  127  .  0 .  0.  1 ", createInet4Address("127.0.0.1")      ),
            Pair("255.255.255.255",       createInet4Address("255.255.255.255")),
            Pair("256.255.255.255",       null                                 ),
            Pair("255.256.255.255",       null                                 ),
            Pair("255.255.256.255",       null                                 ),
            Pair("255.255.255.256",       null                                 ),
            Pair("",                      null                                 ),
        )

        private val DOMAIN_NAME_WITH_LONGEST_VALID_LABEL = "${"a".repeat(63)}.com"
        private val DOMAIN_NAME_WITH_TOO_LONG_LABEL      = "${"a".repeat(64)}.com"
        private val LONG_VALID_DOMAIN_NAME               = List(4) { "a".repeat(62) }.joinToString(".")
        private val LONGEST_VALID_DOMAIN_NAME            = "$LONG_VALID_DOMAIN_NAME.a"
        private val TOO_LONG_DOMAIN_NAME                 = LONGEST_VALID_DOMAIN_NAME + "b"

        private val DOMAIN_NAME_TESTS: List<Pair<String, InetSocketAddress?>> = listOf(
            Pair(
                "",
                null,
            ),
            Pair(
                "x0123456789abcdef.hex",
                createDomainNameInetSocketAddress("x0123456789abcdef.hex"),
            ),
            Pair(
                "  x0123456789abcdef.hex : 4090  ",
                createDomainNameInetSocketAddress("x0123456789abcdef.hex", 4090u),
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
                createDomainNameInetSocketAddress("a-valid-domain-name.dns", 4040u),
            ),
            Pair(
                "example.org",
                createDomainNameInetSocketAddress("example.org"),
            ),
            Pair(
                " example.org",
                createDomainNameInetSocketAddress("example.org"),
            ),
            Pair(
                "example.org ",
                createDomainNameInetSocketAddress("example.org"),
            ),
            Pair(
                "example .org",
                null,
            ),
            Pair(
                "a.b",
                createDomainNameInetSocketAddress("a.b"),
            ),
            Pair(
                "a-.b",
                null,
            ),
            Pair(
                "a-b.c",
                createDomainNameInetSocketAddress("a-b.c"),
            ),
            Pair(
                "a-b.c-",
                null,
            ),
            Pair(
                "a-b.c-d",
                createDomainNameInetSocketAddress("a-b.c-d"),
            ),
            Pair(
                "a-b.c-d:",
                null,
            ),
            Pair(
                " a-b.c-d : 24981",
                createDomainNameInetSocketAddress("a-b.c-d", 24981u),
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
                createDomainNameInetSocketAddress("a-b.c-d.e-0-1-2-3-4-5-6-7-8-9", 2498u),
            ),
            Pair(
                DOMAIN_NAME_WITH_LONGEST_VALID_LABEL,
                createDomainNameInetSocketAddress(DOMAIN_NAME_WITH_LONGEST_VALID_LABEL),
            ),
            Pair(
                DOMAIN_NAME_WITH_TOO_LONG_LABEL,
                null,
            ),
            Pair(
                LONG_VALID_DOMAIN_NAME,
                createDomainNameInetSocketAddress(LONG_VALID_DOMAIN_NAME),
            ),
            Pair(
                LONGEST_VALID_DOMAIN_NAME,
                createDomainNameInetSocketAddress(LONGEST_VALID_DOMAIN_NAME),
            ),
            Pair(
                TOO_LONG_DOMAIN_NAME,
                null,
            ),
        )

        private fun createIP4InetSocketAddress(
            address: String,
            port:    UShort = DEFAULT_PORT,
        ): InetSocketAddress =
            InetSocketAddress(Inet4Address.getByName(address), port.toInt())

        private fun createDomainNameInetSocketAddress(
            address: String,
            port:    UShort = DEFAULT_PORT,
        ): InetSocketAddress =
            InetSocketAddress.createUnresolved(address, port.toInt())

        private fun createInet4Address(address: String): Inet4Address =
            InetAddress.getByName(address) as Inet4Address
    }

    @Test
    fun toIP4InetSocketAddressOrNull() {
        printSep()

        for ((string, portMode, expectedAddress) in IP_4_TESTS) {
            println("Testing ${string.declaration()}.toIP4InetSocketAddressOrNull(portMode = $portMode, defaultPort = $DEFAULT_PORT) == $expectedAddress")

            assertEquals(
                expectedAddress,
                string.toIP4InetSocketAddressOrNull(
                    portMode    = portMode,
                    defaultPort = DEFAULT_PORT,
                ),
            )
        }

        printSep()
    }

    @Test
    fun toDomainNameInetSocketAddressOrNull() {
        printSep()

        for ((string, expectedAddress) in DOMAIN_NAME_TESTS) {
            println("Testing ${string.declaration()}.toDomainNameInetSocketAddressOrNull(defaultPort = $DEFAULT_PORT, resolve = false) == $expectedAddress")

            assertEquals(
                expectedAddress,
                string.toDomainNameInetSocketAddressOrNull(
                    defaultPort = DEFAULT_PORT,
                    resolve     = false,
                ),
            )
        }

        printSep()
    }

    @Test
    fun isIP4Address() {
        printSep()

        for ((string, portMode, expectedAddress) in IP_4_TESTS) {
            val isAddress = expectedAddress != null

            println("Testing ${string.declaration()}.isIP4Address(${portMode}) == $isAddress")

            assertEquals(isAddress, string.isIP4Address(portMode))
        }

        printSep()
    }

    @Test
    fun isDomainName() {
        printSep()

        for ((string, expectedAddress) in DOMAIN_NAME_TESTS) {
            val isDomainName = expectedAddress != null

            println("Testing ${string.declaration()}.isDomainName == $isDomainName")

            assertEquals(isDomainName, string.isDomainName)
        }

        printSep()
    }

    @Test
    fun toInet4Address() {
        printSep()

        for ((string, address) in IP_4_WITHOUT_PORT_TESTS) {
            println("Testing ${string.declaration()}.toInet4AddressOrNull() == $address")
            assertEquals(address, string.toInet4AddressOrNull())
        }

        printSep()
    }
}