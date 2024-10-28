package ru.fominmv.poms.server.validation.constraints

import jakarta.validation.constraints.Size
import jakarta.validation.Constraint

import kotlin.annotation.AnnotationTarget.*
import kotlin.reflect.KClass

@MustBeDocumented
@Constraint(validatedBy = [])
@Size(max = ShortText.MAX_LENGTH)
@Target(ANNOTATION_CLASS, CONSTRUCTOR, FIELD, FUNCTION, TYPE_PARAMETER, TYPE, VALUE_PARAMETER)
annotation class ShortText(
    val message: String = "Too long for short text (max length is ${MAX_LENGTH})",
    val groups: Array<KClass<out Any>> = [],
    val payload: Array<KClass<out Any>> = [],
) {
    companion object {
        const val MAX_LENGTH = 255
    }
}
