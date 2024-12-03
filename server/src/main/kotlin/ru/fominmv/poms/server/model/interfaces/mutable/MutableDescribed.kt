package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.Described

interface MutableDescribed<T : String?> :
    MutableNamed<T>,
    Described<T>
{
    override var description: T
}
