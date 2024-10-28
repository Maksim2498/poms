package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.ModelObject

import java.time.Instant

interface MutableModelObject<Id> :
    ModelObject<Id>,
    MutableIdentifiable<Id>
{
    override var createdAt: Instant
    override var modifiedAt: Instant
}
