package ru.fominmv.poms.server.validation.constraints

import jakarta.validation.Constraint
import jakarta.validation.constraints.Pattern

import kotlin.annotation.AnnotationTarget.*
import kotlin.reflect.KClass

@ShortText
@MustBeDocumented
@Constraint(validatedBy = [])
@Pattern(regexp = "[a-z_][a-z0-9_]*", flags = [Pattern.Flag.CASE_INSENSITIVE])
@Target(ANNOTATION_CLASS, CONSTRUCTOR, FIELD, FUNCTION, TYPE_PARAMETER, TYPE, VALUE_PARAMETER)
annotation class Reference(
    val message: String = "Not a valid login",
    val groups: Array<KClass<out Any>> = [],
    val payload: Array<KClass<out Any>> = [],
) {
    companion object {
        const val MAX_LENGTH = ShortText.MAX_LENGTH
    }
}
