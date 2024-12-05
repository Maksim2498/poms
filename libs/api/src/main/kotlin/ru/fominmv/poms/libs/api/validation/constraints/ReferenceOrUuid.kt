package ru.fominmv.poms.libs.api.validation.constraints

import jakarta.validation.Constraint
import jakarta.validation.constraints.Pattern

import ru.fominmv.poms.libs.commons.uuids.UUID_PATTERN

import kotlin.annotation.AnnotationTarget.*
import kotlin.reflect.KClass

@ShortText
@MustBeDocumented
@Constraint(validatedBy = [])
@Pattern(regexp = ReferenceOrUuid.PATTERN)
@Target(ANNOTATION_CLASS, CONSTRUCTOR, FIELD, FUNCTION, TYPE_PARAMETER, TYPE, VALUE_PARAMETER)
annotation class ReferenceOrUuid(
    val message: String = "Not a valid reference or UUID",
    val groups: Array<KClass<out Any>> = [],
    val payload: Array<KClass<out Any>> = [],
) {
    companion object {
        const val MAX_LENGTH = ShortText.MAX_LENGTH
        const val PATTERN = "${Reference.PATTERN}|$UUID_PATTERN"
    }
}
