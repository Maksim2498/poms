package ru.fominmv.poms.libs.mc.status.io.json

import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.databind.SerializerProvider
import com.fasterxml.jackson.databind.ser.std.StdSerializer

import net.kyori.adventure.text.TextComponent
import net.kyori.adventure.text.serializer.json.JSONComponentSerializer

import ru.fominmv.poms.libs.commons.io.*
import ru.fominmv.poms.libs.mc.status.*

import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream

import javax.imageio.ImageIO

import kotlin.time.Duration
import kotlin.time.DurationUnit

class StatusJsonSerializer : StdSerializer<Status>(Status::class.java) {
    override fun serialize(value: Status, generator: JsonGenerator, provider: SerializerProvider) =
        with (generator) {
            writeStartObject()
            writeObjectField("version", value.version)
            writeObjectField("players", value.players)
            writeFavicon(value.favicon, generator)
            writeDescription(value.description, generator)
            writePing(value.ping, generator)
            writeEndObject()
        }

    private fun writeFavicon(favicon: BufferedImage?, generator: JsonGenerator) {
        if (favicon == null)
            return

        val stream = ByteArrayOutputStream()

        ImageIO.write(favicon, "png", stream)

        val data = stream.toByteArray()
        val url = DataUrl(data, faviconMimeType)

        generator.writeStringField("favicon", url.encode())
    }

    private val faviconMimeType by lazy {
        MimeType("image", "png", base64 = true)
    }

    private fun writeDescription(description: TextComponent, generator: JsonGenerator) =
        with (generator) {
            writeFieldName("description")
            writeRawValue(JSONComponentSerializer.json().serialize(description))
        }

    private fun writePing(ping: Duration, generator: JsonGenerator) =
        generator.writeNumberField("ping", ping.toLong(DurationUnit.MILLISECONDS))
}
