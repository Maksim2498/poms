package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.libs.commons.text.strings.ext.removeWhiteSpace
import ru.fominmv.poms.server.model.interfaces.immutable.WithCredentials

interface MutableWithCredentials :
    WithCredentials,
    Normalizable
{
    override var login: String
    override var password: String

    override fun normalize() {
        login = login.removeWhiteSpace()
    }
}
