package ru.fominmv.poms.libs.mc.status.io

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.node.ObjectNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper

import ru.fominmv.poms.libs.mc.protocol.*
import ru.fominmv.poms.libs.mc.status.*

import java.io.*
import java.net.*

import kotlin.time.*

class NewNetStatusProvider(
    val address: InetSocketAddress = DEFAULT_ADDRESS,
    val protocol: Int = DEFAULT_PROTOCOL,
) : StatusProvider {
    constructor(
        address: InetAddress,
        port: UShort = DEFAULT_PORT,
        protocol: Int = DEFAULT_PROTOCOL,
    ) : this(InetSocketAddress(address, port.toInt()), protocol)

    constructor(
        address: String,
        protocol: Int = DEFAULT_PROTOCOL,
    ) : this(resolveAddress(address), protocol)

    companion object {
        const val DEFAULT_PROTOCOL = 0

        private object PacketId {
            const val HANDSHAKE = 0
            const val STATUS = 0
            const val PING = 1
        }

        private object StateId {
            const val STATUS = 1
        }
    }

    private val objectMapper = jacksonObjectMapper()
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)

    override val status: Status
        get() = Socket(address.address, address.port).use { socket ->
            requestStatus(socket)
            receiveStatus(socket)
        }

    private fun requestStatus(socket: Socket) =
        with(McDataOutputStream(DataOutputStream(socket.outputStream))) {
            writePacket(PacketId.HANDSHAKE) {
                writeVarInt(protocol)
                writeVarString(address.hostString)
                writeShort(address.port)
                writeVarInt(StateId.STATUS)
            }

            writePacket(PacketId.STATUS)

            writePacket(PacketId.PING) {
                writeLong(System.currentTimeMillis())
            }

            flush()
        }

    private fun receiveStatus(socket: Socket): Status =
        with(McDataInputStream(DataInputStream(socket.inputStream))) {
            var json: String? = null
            var pingMillis: Long = 0

            do {
                val packet = readPacket()
                val packetDataStream = packet.toStream()

                when (packet.id) {
                    PacketId.STATUS -> json = packetDataStream.readVarString()
                    PacketId.PING -> pingMillis = (System.currentTimeMillis() - packetDataStream.readLong()) / 2

                    else -> throw PacketFormatException(
                        "Unexpected packet id (expected: ${PacketId.STATUS} or ${PacketId.PING}, got: ${packet.id})"
                    )
                }
            } while (available() > 0)

            if (json == null)
                return@with Status(ping = pingMillis.toDuration(DurationUnit.MILLISECONDS))

            try {
                val jsonTree = objectMapper.readTree(json)

                if (jsonTree is ObjectNode)
                    jsonTree.put("ping", pingMillis)

                objectMapper.treeToValue(jsonTree, Status::class.java)
            } catch (exception: Exception) {
                throw PacketFormatException("JSON is malformed")
            }
        }
}
