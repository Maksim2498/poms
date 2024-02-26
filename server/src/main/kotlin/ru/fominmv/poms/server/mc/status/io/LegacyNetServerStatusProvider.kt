package ru.fominmv.poms.server.mc.status.io

import net.kyori.adventure.text.Component
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer

import ru.fominmv.poms.server.mc.io.PacketFormatException
import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.mc.status.ServerStatusProvider
import ru.fominmv.poms.server.mc.status.Version
import ru.fominmv.poms.server.mc.status.Players
import ru.fominmv.poms.server.util.text.stringext.declaration

import java.io.DataInputStream
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Socket
import java.nio.charset.StandardCharsets

import kotlin.time.DurationUnit
import kotlin.time.toDuration

class LegacyNetServerStatusProvider(
    val address:  InetSocketAddress = DEFAULT_SERVER_SOCKET_ADDRESS,
    val protocol: Int               = Version.DEFAULT_PROTOCOL,
) : ServerStatusProvider {
    companion object {
        private const val PING_PACKET_ID      = 0xFE.toByte()
        private const val PING_PACKET_PAYLOAD = 0x01.toByte()
        private const val MOTD_PACKET_ID      = 0xFA.toByte()
        private const val KICK_PACKET_ID      = 0xFF.toByte()

        private val REQUEST_BYTES = byteArrayOf(
            PING_PACKET_ID,
            PING_PACKET_PAYLOAD,
            MOTD_PACKET_ID,
        )

        private const val RESPONSE_PACKET_PREFIX                       = "§1"
        private const val RESPONSE_PACKET_ENTRY_COUNT                  = 6
        private const val RESPONSE_PACKET_PREFIX_ENTRY_ID              = 0
        private const val RESPONSE_PACKET_PROTOCOL_ENTRY_ID            = 1
        private const val RESPONSE_PACKET_VERSION_ENTRY_ID             = 2
        private const val RESPONSE_PACKET_MOTD_ENTRY_ID                = 3
        private const val RESPONSE_PACKET_ONLINE_PLAYER_COUNT_ENTRY_ID = 4
        private const val RESPONSE_PACKET_MAX_PLAYER_COUNT_ENTRY_ID    = 5
    }

    constructor(
        address:  InetAddress = DEFAULT_SERVER_ADDRESS,
        port:     UShort      = DEFAULT_SERVER_PORT,
        protocol: Int         = Version.DEFAULT_PROTOCOL,
    ): this(InetSocketAddress(address, port.toInt()), protocol)

    constructor(
        address:  String = DEFAULT_SERVER_HOST_NAME,
        protocol: Int    = Version.DEFAULT_PROTOCOL,
    ): this(resolveServerAddress(address), protocol)

    override val serverStatus: ServerStatus
        get() = Socket(address.address, address.port).use { socket ->
            requestStatus(socket)
            receiveStatus(socket)
        }

    private fun requestStatus(socket: Socket) =
        socket.outputStream.write(REQUEST_BYTES)

    private fun receiveStatus(socket: Socket): ServerStatus =
        with (DataInputStream(socket.inputStream)) {
            val startMillis = System.currentTimeMillis()
            val packetId    = readByte()

            if (packetId != KICK_PACKET_ID)
                throw PacketFormatException("Unexpected packet id (expected: $KICK_PACKET_ID, got: $packetId)")

            val packetLength = readShort().toInt()
            val packetSize   = 2 * packetLength
            val packetBytes  = readNBytes(packetSize)
            val endMillis    = System.currentTimeMillis()
            val pingMillis   = endMillis - startMillis
            val ping         = pingMillis.toDuration(DurationUnit.MILLISECONDS)
            val packet       = String(packetBytes, StandardCharsets.UTF_16BE)
            val entries      = packet.split("\u0000")

            if (entries.size < RESPONSE_PACKET_ENTRY_COUNT)
                throw PacketFormatException("Not enough entries in the packet (expected: $RESPONSE_PACKET_ENTRY_COUNT, got: ${entries.size})")

            val prefix = entries[RESPONSE_PACKET_PREFIX_ENTRY_ID]

            if (prefix != RESPONSE_PACKET_PREFIX)
                throw PacketFormatException("Bad packet prefix (expected: ${RESPONSE_PACKET_PREFIX.declaration()}, got: ${prefix.declaration()})")

            val protocolString          = entries[RESPONSE_PACKET_PROTOCOL_ENTRY_ID]
            val protocol                = protocolString.toIntOrNull() ?: throw PacketFormatException("Bad protocol (${protocolString.declaration()})")
            val version                 = entries[RESPONSE_PACKET_VERSION_ENTRY_ID]
            val motdSerializer          = LegacyComponentSerializer.legacySection()
            val motdString              = entries[RESPONSE_PACKET_MOTD_ENTRY_ID]
            val motd                    = motdSerializer.deserializeOr(motdString, Component.text(motdString))!!
            val onlinePlayerCountString = entries[RESPONSE_PACKET_ONLINE_PLAYER_COUNT_ENTRY_ID]
            val onlinePlayerCount       = onlinePlayerCountString.toIntOrNull() ?: throw PacketFormatException("Bad online player count (${onlinePlayerCountString.declaration()})")
            val maxPlayerCountString    = entries[RESPONSE_PACKET_MAX_PLAYER_COUNT_ENTRY_ID]
            val maxPlayerCount          = maxPlayerCountString.toIntOrNull() ?: throw PacketFormatException("Max online player count (${onlinePlayerCountString.declaration()})")

            try {
                ServerStatus(
                    version     = Version(version, protocol),
                    players     = Players(onlinePlayerCount, maxPlayerCount),
                    description = motd,
                    ping        = ping,
                )
            } catch (_: Exception) {
                throw PacketFormatException()
            }
        }
}