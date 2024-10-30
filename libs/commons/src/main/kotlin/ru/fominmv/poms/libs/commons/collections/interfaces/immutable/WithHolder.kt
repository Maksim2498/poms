package ru.fominmv.poms.libs.commons.collections.interfaces.immutable

interface WithHolder<HolderType> : WithNullableHolder<HolderType> {
    override val holder: HolderType
}
