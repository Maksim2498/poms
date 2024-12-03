package ru.fominmv.poms.server.model.interfaces.immutable

interface WithCredentials : WithLogin {
    val password: String

    fun credentialsEquals(other: WithCredentials): Boolean =
        loginEquals(other.login) && password == other.password
}
