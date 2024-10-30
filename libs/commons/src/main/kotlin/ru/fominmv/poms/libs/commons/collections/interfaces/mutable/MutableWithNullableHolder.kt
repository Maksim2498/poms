package ru.fominmv.poms.libs.commons.collections.interfaces.mutable

import ru.fominmv.poms.libs.commons.collections.interfaces.immutable.WithNullableHolder

interface MutableWithNullableHolder<HolderType> : WithNullableHolder<HolderType> {
    override var holder: HolderType?
}
