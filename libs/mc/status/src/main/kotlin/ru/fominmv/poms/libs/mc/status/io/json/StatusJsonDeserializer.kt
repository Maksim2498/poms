package ru.fominmv.poms.libs.mc.status.io.json

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.deser.std.StdDeserializer
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonNode

import net.kyori.adventure.text.serializer.json.JSONComponentSerializer
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer
import net.kyori.adventure.text.TextComponent

import ru.fominmv.poms.libs.commons.io.DataUrl
import ru.fominmv.poms.libs.mc.status.*

import java.awt.image.BufferedImage

import javax.imageio.ImageIO

import kotlin.time.*

class StatusJsonDeserializer : StdDeserializer<Status>(Status::class.java) {
    override fun deserialize(
        parser: JsonParser,
        context: DeserializationContext,
    ): Status {
        val rootNode = parser.readValueAsTree<JsonNode>()

        val versionNode = rootNode.required("version")
        val version = context.readTreeAsValue(versionNode, Version::class.java)

        val playersNode = rootNode.required("players")
        val players = context.readTreeAsValue(playersNode, PlayerList::class.java)

        val faviconNode = rootNode.path("favicon")
        val favicon = deserializeFaviconNode(faviconNode)

        val descriptionNode = rootNode.required("description")
        val description = deserializeDescriptionNode(descriptionNode)

        val pingNode = rootNode.path("ping")
        val ping = deserializePingNode(pingNode)

        return Status(
            version = version,
            players = players,
            description = description,
            favicon = favicon,
            ping = ping,
        )
    }

    private fun deserializeFaviconNode(node: JsonNode): BufferedImage? {
        try {
            val encodedUrl = node.asText()
            val url = DataUrl.decode(encodedUrl)
            // url.data.stream() won't work for the imageStream creation
            val byteStream = url.data.toByteArray().inputStream()
            val imageStream = ImageIO.createImageInputStream(byteStream) ?: return null
            val readers = ImageIO.getImageReadersByMIMEType(url.mimeType.essence)

            for (reader in readers)
                try {
                    reader.input = imageStream
                    return reader.read(0)
                } catch (_: Exception) {}

            return null
        } catch (_: Exception) {
            return null
        }
    }

    private fun deserializeDescriptionNode(node: JsonNode): TextComponent {
        val json = node.toString()
        val serializer = JSONComponentSerializer.json()
        val component = serializer.deserialize(json) as TextComponent
        val content = component.content()
        val isLegacy =
            !component.hasStyling() &&
            component.children().isEmpty() &&
            '§' in content

        if (isLegacy) {
            val legacySerializer = LegacyComponentSerializer.legacySection()
            return legacySerializer.deserialize(content)
        }

        return component
    }

    private fun deserializePingNode(node: JsonNode): Duration =
        node.asLong().toDuration(DurationUnit.MILLISECONDS)
}
