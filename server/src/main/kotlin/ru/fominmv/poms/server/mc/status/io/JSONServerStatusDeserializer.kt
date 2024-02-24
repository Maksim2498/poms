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

import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream

import javax.imageio.ImageIO

import kotlin.time.Duration
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

        val rootNode              = parser.readValueAsTree<JsonNode>()
        val versionNode           = rootNode.required("version")
        val version               = deserializeVersionNode(versionNode)
        val playersNode           = rootNode.required("players")
        val (players, maxPlayers) = deserializePlayersNode(playersNode, context)
        val faviconNode           = rootNode.path("favicon")
        val favicon               = deserializeFaviconNode(faviconNode)
        val descriptionNode       = rootNode.required("description")
        val description           = deserializeDescriptionNode(descriptionNode)
        val pingNode              = rootNode.path("ping")
        val ping                  = deserializePingNode(pingNode)

        return ServerStatus(
            version     = version,
            maxPlayers  = maxPlayers,
            players     = players,
            description = description,
            favicon     = favicon,
            ping        = ping,
        )
    }

    private fun deserializeVersionNode(node: JsonNode): Version =
        with (node) {
            Version(
                required("name").asText(),
                required("protocol").asInt(),
            )
        }

    private fun deserializePlayersNode(
        node:    JsonNode,
        context: DeserializationContext,
    ): Pair<List<Player>, UInt> =
        with (node) {
            val max        = required("max").asInt().toUInt()
            val sampleNode = path("sample")
            val sample     = if (sampleNode.isMissingNode)
                emptyList()
            else
                context.readTreeAsValue(sampleNode, Array<Player>::class.java).toList()

            return Pair(sample, max)
        }

    private fun deserializeFaviconNode(node: JsonNode): BufferedImage? {
        try {
            val encodedURL      = node.asText()
            val url             = DataURL.decode(encodedURL)
            val byteArrayStream = ByteArrayInputStream(url.data)
            val imageStream     = ImageIO.createImageInputStream(byteArrayStream)
            val mimeType        = "${url.mimeType.type}/${url.mimeType.subtype}"
            val readers         = ImageIO.getImageReadersByMIMEType(mimeType)

            for (reader in readers)
                try {
                    reader.input = imageStream
                    return reader.read(0)
                } catch (_: Exception) { }

            return null
        } catch (_: Exception) {
            return null
        }
    }

    private fun deserializeDescriptionNode(node: JsonNode): TextComponent =
        JSONComponentSerializer.json().deserialize(node.toString()) as TextComponent

    private fun deserializePingNode(node: JsonNode): Duration =
        node.asLong().toDuration(DurationUnit.MILLISECONDS)
}