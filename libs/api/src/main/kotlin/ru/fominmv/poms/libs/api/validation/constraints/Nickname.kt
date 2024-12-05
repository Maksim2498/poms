package ru.fominmv.poms.libs.api.validation.constraints

import jakarta.validation.Constraint
import jakarta.validation.constraints.Pattern

import kotlin.annotation.AnnotationTarget.*
import kotlin.reflect.KClass

@MustBeDocumented
@Constraint(validatedBy = [])
@Pattern(regexp = "[\\w_]{${Nickname.MIN_LENGTH},${Nickname.MAX_LENGTH}}")
@Target(ANNOTATION_CLASS, CONSTRUCTOR, FIELD, FUNCTION, TYPE_PARAMETER, TYPE, VALUE_PARAMETER)
annotation class Nickname(
    val message: String = "Not a valid nickname",
    val groups: Array<KClass<out Any>> = [],
    val payload: Array<KClass<out Any>> = [],
) {
    companion object {
        const val MIN_LENGTH = 3
        const val MAX_LENGTH = 16
    }
}
