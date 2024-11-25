package ru.fominmv.poms.server.model.interfaces.immutable

import ru.fominmv.poms.libs.commons.text.strings.ext.removeWhiteSpace

interface WithCredentials {
    val login: String
    val password: String

    fun credentialsEquals(other: WithCredentials): Boolean =
        loginEquals(other.login) && password == other.password

    fun loginEquals(login: String): Boolean =
        login.removeWhiteSpace().equals(login.removeWhiteSpace(), ignoreCase = true)
}
