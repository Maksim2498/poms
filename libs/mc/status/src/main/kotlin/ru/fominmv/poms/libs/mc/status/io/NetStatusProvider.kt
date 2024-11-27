package ru.fominmv.poms.libs.mc.status.io

import ru.fominmv.poms.libs.mc.status.*

import java.net.*

class NetStatusProvider(address: InetSocketAddress = DEFAULT_ADDRESS) : StatusProvider {
    constructor(address: InetAddress, port: UShort = DEFAULT_PORT) :
        this(InetSocketAddress(address, port.toInt()))

    constructor(address: String) : this(resolveAddress(address))

    private val new = NewNetStatusProvider(address)
    private val legacy = LegacyNetStatusProvider(address)

    val address: InetSocketAddress
        get() = new.address

    override val status: Status
        get() = try {
            new.status
        } catch (exception: ConnectException) {
            throw exception
        } catch (_: Exception) {
            legacy.status
        }
}

fun main() {
    println(NewNetStatusProvider("node-01.lan").status)
//    println(NewNetStatusProvider("mc.hypixel.net").status)
}
