package ru.fominmv.poms.server.mc.status.io

import java.net.InetAddress
import java.net.InetSocketAddress

const val DEFAULT_SERVER_PORT:      UShort = 25565u
const val DEFAULT_SERVER_HOST_NAME: String = "localhost"

val DEFAULT_SERVER_ADDRESS:        InetAddress       = InetAddress.getLocalHost()
val DEFAULT_SERVER_SOCKET_ADDRESS: InetSocketAddress = InetSocketAddress(
    InetAddress.getLocalHost(),
    DEFAULT_SERVER_PORT.toInt(),
)