package ru.fominmv.poms.server.mc.status.io

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.deser.std.StdDeserializer

import net.kyori.adventure.text.TextComponent
import net.kyori.adventure.text.serializer.json.JSONComponentSerializer
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer

import ru.fominmv.poms.server.mc.status.Players
import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.mc.status.Version
import ru.fominmv.poms.server.util.io.DataURL

import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream

import javax.imageio.ImageIO

import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.toDuration

class ServerStatusJSONDeserializer : StdDeserializer<ServerStatus>(ServerStatus::class.java) {
    override fun deserialize(
        parser:  JsonParser,
        context: DeserializationContext,
    ): ServerStatus {
        val rootNode        = parser.readValueAsTree<JsonNode>()
        val versionNode     = rootNode.required("version")
        val version         = context.readTreeAsValue(versionNode, Version::class.java)
        val playersNode     = rootNode.required("players")
        val players         = context.readTreeAsValue(playersNode, Players::class.java)
        val faviconNode     = rootNode.path("favicon")
        val favicon         = deserializeFaviconNode(faviconNode)
        val descriptionNode = rootNode.required("description")
        val description     = deserializeDescriptionNode(descriptionNode)
        val pingNode        = rootNode.path("ping")
        val ping            = deserializePingNode(pingNode)

        return ServerStatus(
            version     = version,
            players     = players,
            description = description,
            favicon     = favicon,
            ping        = ping,
        )
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

    private fun deserializeDescriptionNode(node: JsonNode): TextComponent {
        val json       = node.toString()
        val serializer = JSONComponentSerializer.json()
        val component  = serializer.deserialize(json) as TextComponent
        val content    = component.content()
        val isLegacy   = !component.hasStyling()
                      && component.children().isEmpty()
                      && '§' in content

        if (isLegacy) {
            val legacySerializer = LegacyComponentSerializer.legacySection()
            return legacySerializer.deserialize(content)
        }

        return component
    }

    private fun deserializePingNode(node: JsonNode): Duration =
        node.asLong().toDuration(DurationUnit.MILLISECONDS)
}