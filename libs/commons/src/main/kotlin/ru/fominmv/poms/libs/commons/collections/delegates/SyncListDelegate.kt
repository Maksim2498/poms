package ru.fominmv.poms.libs.commons.collections.delegates

import ru.fominmv.poms.libs.commons.collections.classes.SyncList

import java.util.function.Supplier

import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

class SyncListDelegate<
    in HolderType,
    EffectiveHolderType,

    ElementType,
    ListType: MutableList<ElementType>,
>(
    private val initial: Supplier<ListType>,
    private val getCollectionFromElement: (element: ElementType) -> MutableCollection<EffectiveHolderType>,
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
                SyncList.doubleProxy(
                    holder = getEffectiveHolder(holder),
                    initial = initial.get(),
                    getCollectionFromElement = getCollectionFromElement,
                )
            )

        return proxy ?: throw IllegalStateException("proxy is null")
    }
}
