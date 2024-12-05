package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.WithReference

interface MutableWithReference : WithReference {
    override var reference: String
}
