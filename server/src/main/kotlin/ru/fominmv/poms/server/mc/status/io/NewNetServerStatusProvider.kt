package ru.fominmv.poms.server.mc.status.io

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.node.ObjectNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper

import ru.fominmv.poms.server.mc.io.McDataInputStream
import ru.fominmv.poms.server.mc.io.McDataOutputStream
import ru.fominmv.poms.server.mc.io.PacketFormatException
import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.mc.status.ServerStatusProvider
import ru.fominmv.poms.server.mc.status.Version

import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Socket

import kotlin.time.DurationUnit
import kotlin.time.toDuration

class NewNetServerStatusProvider(
    val address:  InetSocketAddress = DEFAULT_SERVER_SOCKET_ADDRESS,
    val protocol: Int               = Version.DEFAULT_PROTOCOL,
) : ServerStatusProvider {
    constructor(
        address:  InetAddress,
        port:     UShort = DEFAULT_SERVER_PORT,
        protocol: Int    = Version.DEFAULT_PROTOCOL,
    ): this(InetSocketAddress(address, port.toInt()), protocol)

    constructor(address: String, protocol: Int = Version.DEFAULT_PROTOCOL):
        this(resolveServerAddress(address), protocol)

    companion object {
        private const val HANDSHAKE_PACKET_ID = 0
        private const val STATUS_PACKET_ID    = 0
        private const val PING_PACKET_ID      = 1
        private const val STATUS_STATE_ID     = 1
    }

    private val objectMapper = jacksonObjectMapper()
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)

    override val serverStatus: ServerStatus
        get() = Socket(address.address, address.port).use { socket ->
            requestStatus(socket)
            receiveStatus(socket)
        }

    private fun requestStatus(socket: Socket) =
        with (McDataOutputStream(socket.outputStream)) {
            writePacket(HANDSHAKE_PACKET_ID) {
                writeVarInt(protocol)
                writeVarString(address.hostString)
                writeUShort(address.port.toUInt())
                writeVarInt(STATUS_STATE_ID)
            }

            writePacket(STATUS_PACKET_ID)

            writePacket(PING_PACKET_ID) {
                writeLong(System.currentTimeMillis())
            }

            flush()
        }

    private fun receiveStatus(socket: Socket): ServerStatus =
        with (McDataInputStream(socket.inputStream)) {
            var json:       String? = null
            var pingMillis: Long    = 0

            do {
                val packet           = readPacket()
                val packetDataStream = packet.toDataStream()

                when (packet.id) {
                    STATUS_PACKET_ID -> json       = packetDataStream.readVarString()
                    PING_PACKET_ID   -> pingMillis = System.currentTimeMillis() - packetDataStream.readLong()
                    else             -> throw PacketFormatException("Unexpected packet id (expected: $STATUS_PACKET_ID or $PING_PACKET_ID, got: ${packet.id})")
                }
            } while (available() > 0)

            if (json == null)
                return@with ServerStatus(ping = pingMillis.toDuration(DurationUnit.MILLISECONDS))

            try {
                val jsonTree = objectMapper.readTree(json)

                if (jsonTree is ObjectNode)
                    jsonTree.put("ping", pingMillis)

                objectMapper.treeToValue(jsonTree, ServerStatus::class.java)
            } catch (exception: Exception) {
                throw PacketFormatException("JSON is malformed")
            }
        }
}