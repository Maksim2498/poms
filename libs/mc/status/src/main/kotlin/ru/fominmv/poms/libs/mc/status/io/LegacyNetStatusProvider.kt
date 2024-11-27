package ru.fominmv.poms.libs.mc.status.io

import net.kyori.adventure.text.Component
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer

import ru.fominmv.poms.libs.commons.text.strings.ext.declaration
import ru.fominmv.poms.libs.mc.protocol.PacketFormatException
import ru.fominmv.poms.libs.mc.status.*

import java.io.*
import java.net.*
import java.nio.charset.StandardCharsets

import kotlin.time.DurationUnit
import kotlin.time.toDuration

class LegacyNetStatusProvider(
    val address: InetSocketAddress = DEFAULT_ADDRESS,
    val protocol: Int = DEFAULT_PROTOCOL,
    val compatibilityMode: Boolean = true,
) : StatusProvider {
    constructor(
        address: InetAddress,
        port: UShort = DEFAULT_PORT,
        protocol: Int = DEFAULT_PROTOCOL,
    ) : this(InetSocketAddress(address, port.toInt()), protocol)

    constructor(
        address: String,
        protocol: Int = DEFAULT_PROTOCOL,
        compatibilityMode: Boolean = false,
    ) : this(resolveAddress(address), protocol, compatibilityMode)

    companion object {
        const val DEFAULT_PROTOCOL = 0x2F

        private object Packet {
            object Id {
                const val PING = 0xFE.toByte()
                const val MOTD = 0xFA.toByte()
                const val KICK = 0xFF.toByte()
            }

            object Request {
                const val PING_PAYLOAD = 0x01.toByte()
                const val MOTD_MESSAGE = "MC|PingHost"

                val START_BYTES = byteArrayOf(
                    Id.PING,
                    PING_PAYLOAD,

                    Id.MOTD,
                    (MOTD_MESSAGE.length ushr 8).toByte(),
                    MOTD_MESSAGE.length.toByte(),
                    *MOTD_MESSAGE.toByteArray(StandardCharsets.UTF_16BE),
                )
            }

            object Response {
                const val PREFIX = "§1"

                object Entry {
                    const val COUNT = 6

                    object Id {
                        const val PREFIX = 0
                        const val PROTOCOL = 1
                        const val VERSION = 2
                        const val MOTD = 3
                        const val ONLINE_PLAYER_COUNT = 4
                        const val MAX_PLAYER_COUNT = 5
                    }
                }
            }
        }
    }

    override val status: Status
        get() = Socket(address.address, address.port).use { socket ->
            requestStatus(socket)
            receiveStatus(socket)
        }

    private fun requestStatus(socket: Socket) =
        with(DataOutputStream(socket.outputStream)) {
            if (compatibilityMode) {
                Packet.Request.START_BYTES.slice(0..3).forEach { writeByte(it.toInt()) }
                return
            }

            val hostname = address.hostString
            val hostnameBytes = hostname.toByteArray(StandardCharsets.UTF_16BE)
            val restSize = 7 + hostnameBytes.size

            write(Packet.Request.START_BYTES)
            writeShort(restSize)
            writeByte(protocol)
            writeShort(hostname.length)
            write(hostnameBytes)
            writeInt(address.port)
            flush()
        }

    private fun receiveStatus(socket: Socket): Status =
        with(DataInputStream(socket.inputStream)) {
            val startMillis = System.currentTimeMillis()
            val packetId = readByte()

            if (packetId != Packet.Id.KICK)
                throw PacketFormatException("Unexpected packet id (expected: ${Packet.Id.KICK}, got: $packetId)")

            val packetLength = readShort().toInt()
            val packetSize = 2 * packetLength
            val packetBytes = readNBytes(packetSize)
            val endMillis = System.currentTimeMillis()
            val pingMillis = endMillis - startMillis
            val ping = pingMillis.toDuration(DurationUnit.MILLISECONDS)
            val packet = String(packetBytes, StandardCharsets.UTF_16BE)
            val entries = packet.split("\u0000")

            if (entries.size < Packet.Response.Entry.COUNT)
                throw PacketFormatException("Not enough entries in the packet (expected: ${Packet.Response.Entry.COUNT}, got: ${entries.size})")

            val prefix = entries[Packet.Response.Entry.Id.PREFIX]

            if (prefix != Packet.Response.PREFIX)
                throw PacketFormatException("Bad packet prefix (expected: ${Packet.Response.PREFIX.declaration()}, got: ${prefix.declaration()})")

            val protocolString = entries[Packet.Response.Entry.Id.PROTOCOL]
            val protocol = protocolString.toIntOrNull()
                ?: throw PacketFormatException("Bad protocol (${protocolString.declaration()})")

            val version = entries[Packet.Response.Entry.Id.VERSION]

            val motdSerializer = LegacyComponentSerializer.legacySection()
            val motdString = entries[Packet.Response.Entry.Id.MOTD]
            val motd = motdSerializer.deserializeOr(motdString, Component.text(motdString))!!

            val onlinePlayerCountString = entries[Packet.Response.Entry.Id.ONLINE_PLAYER_COUNT]
            val onlinePlayerCount = onlinePlayerCountString.toIntOrNull()
                ?: throw PacketFormatException("Bad online player count (${onlinePlayerCountString.declaration()})")

            val maxPlayerCountString = entries[Packet.Response.Entry.Id.MAX_PLAYER_COUNT]
            val maxPlayerCount = maxPlayerCountString.toIntOrNull()
                ?: throw PacketFormatException("Max online player count (${onlinePlayerCountString.declaration()})")

            try {
                Status(
                    version = Version(version, protocol),
                    players = PlayerList(onlinePlayerCount, maxPlayerCount),
                    description = motd,
                    ping = ping,
                )
            } catch (exception: Exception) {
                throw PacketFormatException(cause = exception)
            }
        }
}
