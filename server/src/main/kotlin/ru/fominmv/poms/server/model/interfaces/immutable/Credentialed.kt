package ru.fominmv.poms.server.model.interfaces.immutable

interface Credentialed<T : String?> : Referenced<T> {
    val password: T

    fun credentialsEquals(other: Credentialed<T>): Boolean =
        referenceEquals(other.reference) && password == other.password
}
