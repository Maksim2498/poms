package ru.fominmv.poms.libs.commons.text.strings.ext

fun String.capitalizedText(): String {
    var lastSpace = true

    return buildString {
        this@capitalizedText.forEach { char ->
            val currentSpace = char.isWhitespace()

            val newChar = when {
                currentSpace -> char
                lastSpace -> char.uppercaseChar()
                else -> char.lowercaseChar()
            }

            append(newChar)

            lastSpace = currentSpace
        }
    }
}

fun String.capitalized(): String =
    lowercase().withFirstUppercase()

fun String.withFirstUppercase(): String =
    replaceFirstChar(Char::uppercase)

fun String.withFirstLowercase(): String =
    replaceFirstChar(Char::lowercase)
