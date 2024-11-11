package ru.fominmv.poms.libs.commons.collections.delegates

import ru.fominmv.poms.libs.commons.collections.classes.SyncCollection

import java.util.function.Supplier

import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

class SyncCollectionDelegate<
    in HolderType,
    EffectiveHolderType,

    ElementType,
    CollectionType: MutableCollection<ElementType>,
>(
    private val initial: Supplier<CollectionType>,
    private val getCollectionFromElement: (element: ElementType) -> MutableCollection<EffectiveHolderType>,
    private val convertCollection: (collection: MutableCollection<ElementType>) -> CollectionType,
    private val getEffectiveHolder: (holder: HolderType) -> EffectiveHolderType,
) : ReadWriteProperty<HolderType, CollectionType> {
    private var proxy: CollectionType? = null

    override fun getValue(thisRef: HolderType, property: KProperty<*>): CollectionType =
        getInitializedProxy(thisRef)

    override fun setValue(thisRef: HolderType, property: KProperty<*>, value: CollectionType) {
        if (value === proxy)
            return

        val initializedProxy = getInitializedProxy(thisRef)

        initializedProxy.clear()
        initializedProxy.addAll(value)
    }

    private fun getInitializedProxy(holder: HolderType): CollectionType {
        if (proxy == null)
            proxy = convertCollection(
                SyncCollection.doubleProxy(
                    holder = getEffectiveHolder(holder),
                    initial = initial.get(),
                    getCollectionFromElement = getCollectionFromElement,
                )
            )

        return proxy ?: throw IllegalStateException("proxy is null")
    }
}
