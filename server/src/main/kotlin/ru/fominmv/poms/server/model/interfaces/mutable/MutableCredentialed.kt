package ru.fominmv.poms.server.model.interfaces.mutable

import ru.fominmv.poms.server.model.interfaces.immutable.Credentialed

interface MutableCredentialed<T : String?> :
    MutableReferenced<T>,
    Credentialed<T>
{
    override var password: T
}
