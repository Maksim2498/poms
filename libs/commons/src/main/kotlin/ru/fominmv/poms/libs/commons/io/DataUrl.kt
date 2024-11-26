package ru.fominmv.poms.libs.commons.io

import ru.fominmv.poms.libs.commons.text.strings.ext.removeWhiteSpace

import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.Base64
import java.util.Objects

data class DataUrl(
    val data: List<Byte> = emptyList(),
    val mimeType: MimeType = MimeType.TEXT_PLAIN,
) {
    constructor(
        data: ByteArray,
        mimeType: MimeType = MimeType.TEXT_PLAIN,
    ) : this(data.toList(), mimeType)

    companion object {
        private const val DATA_PREFIX = "data:"

        fun decode(url: String): DataUrl =
            try {
                val parts = url.split(",", limit = 2)
                val header = parts[0].removeWhiteSpace().lowercase()

                if (!header.startsWith(DATA_PREFIX))
                    throw IllegalArgumentException("Missing \"data:\" prefix")

                val mimeTypeString = header.substring(DATA_PREFIX.length)
                val mimeType = MimeType.parse(mimeTypeString, allowEmpty = true)
                val bodyString = parts.getOrNull(1)
                val body = when {
                    bodyString == null -> emptyList()

                    "base64" in mimeType.parameters -> try {
                        Base64.getDecoder().decode(bodyString).toList()
                    } catch (_: Exception) {
                        emptyList()
                    }

                    else -> try {
                        URLDecoder
                            .decode(bodyString, StandardCharsets.US_ASCII)
                            .toByteArray(StandardCharsets.US_ASCII)
                            .toList()
                    } catch (_: Exception) {
                        emptyList()
                    }
                }

                DataUrl(body, mimeType)
            } catch (exception: Exception) {
                throw IllegalArgumentException("Bad data URL", exception)
            }
    }

    fun encode(): String =
        buildString {
            append("data:")

            if (mimeType.essence != MimeType.DEFAULT_ESSENCE)
                append(mimeType.essence)

            var useBase64 = false

            for ((key, value) in mimeType.parameters) {
                when (key) {
                    MimeType.Parameter.CHARSET -> {
                        if (value.equals(MimeType.DEFAULT_CHARSET.toString(), ignoreCase = true))
                            continue
                    }

                    MimeType.Parameter.BASE64 -> { useBase64 = true }
                }

                append(';')
                append(key)

                if (value.isNotEmpty()) {
                    append('=')
                    append(value)
                }
            }

            if (data.isEmpty())
                return@buildString

            append(',')

            if (useBase64) {
                val encoder = Base64.getEncoder()
                val encodedData = encoder.encodeToString(data.toByteArray())

                append(encodedData)

                return@buildString
            }

            val dataString = String(data.toByteArray(), mimeType.charset)
            val encodedDataString = URLEncoder.encode(dataString, StandardCharsets.US_ASCII)

            append(encodedDataString)
        }

    // Equality check

    override fun equals(other: Any?): Boolean {
        if (this === other)
            return true

        if (javaClass != other?.javaClass)
            return false

        other as DataUrl

        return data == other.data &&
               mimeType.essence == other.mimeType.essence &&
               mimeType.charset == other.mimeType.charset
    }

    override fun hashCode(): Int =
        Objects.hash(data, mimeType.essence)

    // To string conversion

    override fun toString(): String =
        encode()
}
