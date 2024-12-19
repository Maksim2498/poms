package ru.fominmv.poms.server.model.interfaces.immutable

import ru.fominmv.poms.libs.commons.text.strings.ext.removeWhiteSpaceToNull

interface Referenced<T : String?> {
    companion object {
        fun referencesEquals(lhs: String?, rhs: String?): Boolean =
            lhs.removeWhiteSpaceToNull() == rhs.removeWhiteSpaceToNull()
    }

    val reference: T

    fun referenceEquals(reference: T): Boolean =
        referencesEquals(this.reference, reference)
}
