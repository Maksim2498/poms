package ru.fominmv.poms.libs.commons.collections.delegates

import ru.fominmv.poms.libs.commons.collections.classes.NullablyReferencedSyncList
import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

class NullablyReferencedSyncListDelegate<
    in HolderType,
    EffectiveHolderType,

    ElementType,
    ListType: MutableList<ElementType>,
>(
    private val getListFromHolder: (holder: EffectiveHolderType) -> MutableList<ElementType>,
    private val updateElementHolder: (element: ElementType, newHolder: EffectiveHolderType?) -> Unit,
    private val convertList: (collection: MutableList<ElementType>) -> ListType,
    private val getEffectiveHolder: (holder: HolderType) -> EffectiveHolderType,
) : ReadWriteProperty<HolderType, ListType> {
    private var proxy: ListType? = null

    override fun getValue(thisRef: HolderType, property: KProperty<*>): ListType =
        getInitializedProxy(thisRef)

    override fun setValue(thisRef: HolderType, property: KProperty<*>, value: ListType) {
        if (value === proxy)
            return

        val initializedProxy = getInitializedProxy(thisRef)

        initializedProxy.clear()
        initializedProxy.addAll(value)
    }

    private fun getInitializedProxy(holder: HolderType): ListType {
        if (proxy == null)
            proxy = convertList(
                NullablyReferencedSyncList.doubleProxy(
                    holder = getEffectiveHolder(holder),
                    getListFromHolder = getListFromHolder,
                    updateElementHolder = updateElementHolder,
                )
            )

        return proxy ?: throw IllegalStateException("proxy is null")
    }

    class Reference<
        in HolderType,
        EffectiveHolderType,

        ReferenceType,
    >(
        private val get: () -> ReferenceType?,
        private val set: (value: ReferenceType?) -> Unit,
        private val getList: (reference: ReferenceType) -> MutableList<EffectiveHolderType>,
        private val getEffectiveHolder: (holder: HolderType) -> EffectiveHolderType,
    ) : ReadWriteProperty<HolderType, ReferenceType?>
        by NullablyReferencedSyncCollectionDelegate.Reference(
            get = get,
            set = set,
            getCollection = getList,
            getEffectiveHolder = getEffectiveHolder,
        )
}
