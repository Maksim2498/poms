package ru.fominmv.poms.server.mc.status.io

import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.mc.status.ServerStatusProvider

import java.net.ConnectException
import java.net.InetAddress
import java.net.InetSocketAddress

class NetServerStatusProvider(address: InetSocketAddress = DEFAULT_SERVER_SOCKET_ADDRESS)
    : ServerStatusProvider {
    constructor(address: InetAddress, port: UShort = DEFAULT_SERVER_PORT):
        this(InetSocketAddress(address, port.toInt()))

    constructor(address: String): this(resolveServerAddress(address))

    private val new    = NewNetServerStatusProvider(address)
    private val legacy = LegacyNetServerStatusProvider(address)

    val address: InetSocketAddress
        get() = new.address

    override val serverStatus: ServerStatus
        get() = try {
            new.serverStatus
        } catch (exception: ConnectException) {
            throw exception
        } catch (_: Exception) {
            legacy.serverStatus
        }
}