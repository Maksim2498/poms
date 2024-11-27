package ru.fominmv.poms.libs.mc.status.io

import java.net.InetAddress
import java.net.InetSocketAddress

const val DEFAULT_PORT: UShort = 25565u

val DEFAULT_ADDRESS = InetSocketAddress(
    InetAddress.getLocalHost(),
    DEFAULT_PORT.toInt(),
)
