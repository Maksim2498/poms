package ru.fominmv.poms.server.validation.constraints

import jakarta.validation.constraints.Size
import jakarta.validation.Constraint

import kotlin.annotation.AnnotationTarget.*
import kotlin.reflect.KClass

@MustBeDocumented
@Constraint(validatedBy = [])
@Size(max = MediumText.MAX_LENGTH)
@Target(ANNOTATION_CLASS, CONSTRUCTOR, FIELD, FUNCTION, TYPE_PARAMETER, TYPE, VALUE_PARAMETER)
annotation class MediumText(
    val message: String = "Too long for medium text (max length is $MAX_LENGTH)",
    val groups: Array<KClass<out Any>> = [],
    val payload: Array<KClass<out Any>> = [],
) {
    companion object {
        const val MAX_LENGTH = 65_535
    }
}
