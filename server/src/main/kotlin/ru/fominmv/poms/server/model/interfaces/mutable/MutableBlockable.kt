package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.Blockable

interface MutableBlockable : Blockable {
    override var isBlocked: Boolean
}
