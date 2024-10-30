package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.WithCredentials

interface MutableWithCredentials : WithCredentials {
    override var login: String
    override var password: String
}
