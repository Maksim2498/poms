package ru.fominmv.poms.server.mc.status.io

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.node.ObjectNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper

import ru.fominmv.poms.server.mc.io.McDataInputStream
import ru.fominmv.poms.server.mc.io.McDataOutputStream
import ru.fominmv.poms.server.mc.io.PacketFormatException
import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.mc.status.ServerStatusProvider

import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Socket

import kotlin.time.DurationUnit
import kotlin.time.toDuration

class NewNetServerStatusProvider(
    val address:  InetSocketAddress = InetSocketAddress(InetAddress.getLocalHost(), 25565),
    val hostname: String            = address.hostString,
    val protocol: Int               = -1,
) : ServerStatusProvider {
    companion object {
        private const val HANDSHAKE_PACKET_ID = 0
        private const val STATUS_PACKET_ID    = 0
        private const val PING_PACKET_ID      = 1
        private const val STATUS_STATE_ID     = 1
    }

    constructor(
        address:  InetAddress = InetAddress.getLocalHost(),
        port:     UShort      = 25565u,
        hostname: String      = address.hostAddress,
        protocol: Int         = 0,
    ): this(
        InetSocketAddress(address, port.toInt()),
        hostname,
        protocol
    )

    private val objectMapper = jacksonObjectMapper()
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)

    override val serverStatus: ServerStatus
        get() = Socket(address.address, address.port).use {
            requestStatus(it)
            receiveStatus(it)
        }

    private fun requestStatus(socket: Socket) =
        with (McDataOutputStream(socket.getOutputStream())) {
            writePacket(HANDSHAKE_PACKET_ID) {
                writeVarInt(protocol)
                writeVarString(hostname)
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
        with (McDataInputStream(socket.getInputStream())) {
            var json:       String? = null
            var pingMillis: Long    = 0

            do {
                val packet           = readPacket()
                val packetDataStream = packet.toDataStream()

                when (packet.id) {
                    STATUS_PACKET_ID -> json       = packetDataStream.readVarString()
                    PING_PACKET_ID   -> pingMillis = System.currentTimeMillis() - packetDataStream.readLong()
                    else             -> throw PacketFormatException("Unexpected packet id: ${packet.id}")
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