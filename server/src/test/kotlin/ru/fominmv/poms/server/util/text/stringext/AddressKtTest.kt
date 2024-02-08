package ru.fominmv.poms.server.util.text.stringext

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import ru.fominmv.poms.server.util.printSep

import java.net.InetAddress

class AddressKtTest {
    @Test
    fun isIP4Address() {
        val tests = listOf(
            Triple("0.0.0.0",                   PortMode.OPTIONAL, true ),
            Triple("0.0.0.0:",                  PortMode.OPTIONAL, false),
            Triple("0.0.0.0",                   PortMode.REQUIRED, false),
            Triple("  0.  0. 0  .0  ",          PortMode.OPTIONAL, true ),
            Triple("  10.  0. 255  .8  : 655 ", PortMode.OPTIONAL, true ),
            Triple("0.0.0.0:",                  PortMode.OPTIONAL, false),
            Triple("0.0.0.0:abcdef",            PortMode.OPTIONAL, false),
            Triple("255.255.255.255:65535",     PortMode.OPTIONAL, true ),
            Triple("255.255.255.255:65535",     PortMode.NO,       false),
            Triple("255.255.255.255:65536",     PortMode.OPTIONAL, false),
            Triple("256.255.255.255:65535",     PortMode.OPTIONAL, false),
            Triple("-1.255.255.255",            PortMode.OPTIONAL, false),
            Triple("0.0.0",                     PortMode.OPTIONAL, false),
            Triple("0.0.0:255",                 PortMode.OPTIONAL, false),
            Triple("1.2.5.10:255",              PortMode.OPTIONAL, true ),
            Triple("a.b.c.10:255",              PortMode.OPTIONAL, false),
            Triple("not and address",           PortMode.OPTIONAL, false),
            Triple("hey 10.20.30.40 bye",       PortMode.OPTIONAL, false),
            Triple("",                          PortMode.OPTIONAL, false),
        )

        printSep()

        for ((string, portMode, isAddress) in tests) {
            println("Testing ${string.declaration()}.isInet4SocketAddress(${portMode}) == $isAddress")
            assertEquals(isAddress, string.isIP4Address(portMode))
        }

        printSep()
    }

    @Test
    fun isDomainName() {
        val tests = listOf(
            Pair("",                                                                    false),
            Pair("example.org",                                                         true ),
            Pair(" example.org",                                                        true ),
            Pair("example.org ",                                                        true ),
            Pair("example .org",                                                        false),
            Pair("a.b",                                                                 true ),
            Pair("a-.b",                                                                false),
            Pair("a-b.c",                                                               true ),
            Pair("a-b.c-",                                                              false),
            Pair("a-b.c-d",                                                             true ),
            Pair("a-b.c-d:",                                                            false),
            Pair(" a-b.c-d : 24980",                                                    true ),
            Pair(" a-b.c-d : 249800",                                                   false),
            Pair("a-b.c-d.0-1-2-3-4-5-6-7-8-9",                                         false),
            Pair("a-b.c-d.e-0-1-2-3-4-5-6-7-8-9:2498",                                  true ),
            Pair("${"a".repeat(63)}.com",                                            true ),
            Pair("${"a".repeat(64)}.com",                                            false),
            Pair(List(4) { "a".repeat(62) }.joinToString("."),         true ),
            Pair(List(4) { "a".repeat(62) }.joinToString(".") + ".a",  true ),
            Pair(List(4) { "a".repeat(62) }.joinToString(".") + ".ab", false),
        )

        printSep()

        for ((string, isDomainName) in tests) {
            println("Testing ${string.declaration()}.isDomainName == $isDomainName")
            assertEquals(isDomainName, string.isDomainName)
        }

        printSep()
    }

    @Test
    fun toInet4Address() {
        val tests = listOf(
            Pair("127.0.0.1",             InetAddress.getByName("127.0.0.1")      ),
            Pair("  127.0.0.1",           InetAddress.getByName("127.0.0.1")      ),
            Pair("127.0.0.1  ",           InetAddress.getByName("127.0.0.1")      ),
            Pair("  127  .  0 .  0.  1 ", InetAddress.getByName("127.0.0.1")      ),
            Pair("255.255.255.255",       InetAddress.getByName("255.255.255.255")),
            Pair("256.255.255.255",       null                                         ),
            Pair("255.256.255.255",       null                                         ),
            Pair("255.255.256.255",       null                                         ),
            Pair("255.255.255.256",       null                                         ),
            Pair("",                      null                                         ),
        )

        printSep()

        for ((string, address) in tests) {
            println("Testing ${string.declaration()}.toInet4AddressOrNull() == $address")
            assertEquals(address, string.toInet4AddressOrNull())
        }

        printSep()
    }
}