package ru.fominmv.poms.server.mc.status.io

import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.databind.SerializerProvider
import com.fasterxml.jackson.databind.ser.std.StdSerializer

import net.kyori.adventure.text.serializer.json.JSONComponentSerializer

import org.springframework.util.MimeType

import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.util.io.DataURL

import java.io.ByteArrayOutputStream

import javax.imageio.ImageIO

import kotlin.time.DurationUnit

class JSONServerStatusSerializer(
    clazz: Class<ServerStatus>? = null,
) : StdSerializer<ServerStatus>(clazz) {
    override fun serialize(
        value:     ServerStatus?,
        generator: JsonGenerator?,
        provider:  SerializerProvider?,
    ) {
        if (value == null)
            throw NullPointerException("<value> is null")

        if (generator == null)
            throw NullPointerException("<generator> is null")

        if (provider == null)
            throw NullPointerException("<provider> is null")

        with (generator) {
            writeStartObject()

            writeObjectField("version", value.version)

            writeObjectFieldStart("players")
            writeNumberField("max",    value.maxPlayers.toInt())
            writeNumberField("online", value.players.size      )
            writeArrayFieldStart("sample")
            value.players.forEach(this::writeObject)
            writeEndArray()
            writeEndObject()

            if (value.favicon != null) {
                val stream = ByteArrayOutputStream()

                ImageIO.write(value.favicon, "png", stream)

                val url = DataURL(stream.toByteArray(), MimeType("image", "png"))

                writeStringField("favicon", url.encode())
            }

            writeFieldName("description")
            writeRawValue(JSONComponentSerializer.json().serialize(value.description))

            writeNumberField("ping", value.ping.toLong(DurationUnit.MILLISECONDS))

            writeEndObject()
        }
    }
}