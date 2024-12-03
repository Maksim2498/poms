package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.Named

interface MutableNamed<T : String?> : Named<T> {
    override var name: T
}
