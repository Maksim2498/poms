package ru.fominmv.poms.libs.commons.collections.interfaces.mutable

import ru.fominmv.poms.libs.commons.collections.interfaces.immutable.WithHolder

interface MutableWithHolder<HolderType> : WithHolder<HolderType> {
    override var holder: HolderType
}
