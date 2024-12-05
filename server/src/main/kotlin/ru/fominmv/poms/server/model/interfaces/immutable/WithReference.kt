package ru.fominmv.poms.server.model.interfaces.immutable

import ru.fominmv.poms.libs.commons.text.strings.ext.removeWhiteSpace

interface WithReference {
    val reference: String

    fun referenceEquals(reference: String): Boolean =
        reference.removeWhiteSpace().equals(reference.removeWhiteSpace(), ignoreCase = true)
}
