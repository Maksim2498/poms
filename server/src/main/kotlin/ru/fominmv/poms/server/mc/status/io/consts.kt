package ru.fominmv.poms.server.mc.status.io

import java.net.InetAddress
import java.net.InetSocketAddress

const val DEFAULT_SERVER_PORT: UShort = 25565u

val DEFAULT_SERVER_SOCKET_ADDRESS: InetSocketAddress = InetSocketAddress(
    InetAddress.getLocalHost(),
    DEFAULT_SERVER_PORT.toInt(),
)