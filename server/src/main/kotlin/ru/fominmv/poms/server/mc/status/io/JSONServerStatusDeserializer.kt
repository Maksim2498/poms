package ru.fominmv.poms.server.mc.status.io

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.deser.std.StdDeserializer

import net.kyori.adventure.text.TextComponent
import net.kyori.adventure.text.serializer.json.JSONComponentSerializer

import ru.fominmv.poms.server.mc.status.Player
import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.mc.status.Version
import ru.fominmv.poms.server.util.io.DataURL

import java.io.ByteArrayInputStream

import javax.imageio.ImageIO

import kotlin.time.DurationUnit
import kotlin.time.toDuration

class JSONServerStatusDeserializer(
    clazz: Class<*>? = null,
) : StdDeserializer<ServerStatus>(clazz) {
    override fun deserialize(
        parser:  JsonParser?,
        context: DeserializationContext?,
    ): ServerStatus {
        if (parser == null)
            throw NullPointerException("<parser> is null")

        if (context == null)
            throw NullPointerException("<context> is null")

        val rootNode = parser.readValueAsTree<JsonNode>()

        val version = with (rootNode.required("version")) {
            Version(
                required("name"    ).asText(),
                required("protocol").asInt(),
            )
        }

        val (players, maxPlayers) = with (rootNode.required("players")) {
            val max        = required("max").asInt().toUInt()
            val sampleNode = path("sample")
            val sample     = if (sampleNode.isMissingNode)
                emptyList()
            else
                context.readTreeAsValue(sampleNode, Array<Player>::class.java).toList()

            Pair(sample, max)
        }

        val favicon = with (rootNode.path("favicon")) {
            try {
                val encodedURL      = asText()
                val url             = DataURL.decode(encodedURL)
                val byteArrayStream = ByteArrayInputStream(url.data)
                val imageStream     = ImageIO.createImageInputStream(byteArrayStream)
                val mimeType        = "${url.mimeType.type}/${url.mimeType.subtype}"
                val readers         = ImageIO.getImageReadersByMIMEType(mimeType)

                for (reader in readers)
                    try {
                        reader.input = imageStream

                        return@with reader.read(0)
                    } catch (_: Exception) { }

                    null
            } catch (_: Exception) {
                null
            }
        }

        val description = with (rootNode.required("description")) {
            val json = toString()

            JSONComponentSerializer.json().deserialize(json) as TextComponent
        }

        val ping = rootNode.path("ping")
                           .asLong()
                           .toDuration(DurationUnit.MILLISECONDS)

        return ServerStatus(
            version     = version,
            maxPlayers  = maxPlayers,
            players     = players,
            description = description,
            favicon     = favicon,
            ping        = ping,
        )
    }
}