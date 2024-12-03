package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.WithLogin

interface MutableWithLogin : WithLogin {
    override var login: String
}
