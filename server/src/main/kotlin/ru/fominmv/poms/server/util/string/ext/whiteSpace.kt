package ru.fominmv.poms.server.util.string.ext

// Regex

private val SPACES_REGEX = Regex("[^\\S\\n]+")
private val WHITE_SPACE_REGEX = Regex("\\s+")

// Remove white space

fun String?.removeWhiteSpaceToNull(): String? =
    this?.removeWhiteSpace()?.ifEmpty { null }

fun String.removeWhiteSpace(): String =
    replace(WHITE_SPACE_REGEX, "")

// Collapse spaces

fun String?.collapseSpacesToNull(): String? =
    trimToNull()?.replace(SPACES_REGEX, " ")

fun String.collapseSpaces(): String =
    trim().replace(SPACES_REGEX, " ")

// Collapse white space

fun String?.collapseWhiteSpaceToNull(): String? =
    trimToNull()?.replace(WHITE_SPACE_REGEX, " ")

fun String.collapseWhiteSpace(): String =
    trim().replace(WHITE_SPACE_REGEX, " ")

// Trim to null

fun String?.trimToNull(): String? =
    this?.trim()?.ifEmpty { null }
