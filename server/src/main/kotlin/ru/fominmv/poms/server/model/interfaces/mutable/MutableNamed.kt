package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.Named

interface MutableNamed : Named {
    override var name: String
}
