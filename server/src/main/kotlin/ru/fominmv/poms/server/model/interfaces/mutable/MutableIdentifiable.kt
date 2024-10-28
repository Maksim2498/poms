package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.Identifiable

interface MutableIdentifiable<Id> : Identifiable<Id> {
    override var id: Id
}
