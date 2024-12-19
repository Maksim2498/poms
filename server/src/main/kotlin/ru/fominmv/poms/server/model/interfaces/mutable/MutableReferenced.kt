package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.Referenced

interface MutableReferenced<T : String?> : Referenced<T> {
    override var reference: T
}
