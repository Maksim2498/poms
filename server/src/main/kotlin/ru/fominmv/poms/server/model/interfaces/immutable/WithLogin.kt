package ru.fominmv.poms.server.model.interfaces.immutable

import ru.fominmv.poms.libs.commons.text.strings.ext.removeWhiteSpace

interface WithLogin {
    val login: String

    fun loginEquals(login: String): Boolean =
        login.removeWhiteSpace().equals(login.removeWhiteSpace(), ignoreCase = true)
}
