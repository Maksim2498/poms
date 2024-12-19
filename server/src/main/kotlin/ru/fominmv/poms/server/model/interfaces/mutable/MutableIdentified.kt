package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.Identified

interface MutableIdentified<Id> : Identified<Id> {
    override var id: Id
}
