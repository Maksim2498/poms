package ru.fominmv.poms.libs.commons.collections.delegates

import ru.fominmv.poms.libs.commons.collections.classes.ReferencedSyncCollection

import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

class ReferencedSyncCollectionDelegate<
    in HolderType,
    EffectiveHolderType,

    ElementType,
    CollectionType: MutableCollection<ElementType>,
>(
    private val getCollectionFromHolder: (holder: EffectiveHolderType) -> MutableCollection<ElementType>,
    private val updateElementHolder: (element: ElementType, newHolder: EffectiveHolderType) -> Unit,
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
                ReferencedSyncCollection.doubleProxy(
                    holder = getEffectiveHolder(holder),
                    getCollectionFromHolder = getCollectionFromHolder,
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
        private val get: () -> ReferenceType,
        private val set: (value: ReferenceType) -> Unit,
        private val getCollection: (reference: ReferenceType) -> MutableCollection<EffectiveHolderType>,
        private val getEffectiveHolder: (holder: HolderType) -> EffectiveHolderType,
    ) : ReadWriteProperty<HolderType, ReferenceType> {
        override fun getValue(thisRef: HolderType, property: KProperty<*>): ReferenceType =
            get()

        override fun setValue(thisRef: HolderType, property: KProperty<*>, value: ReferenceType) {
            val oldValue = get()

            if (value == oldValue)
                return

            val effectiveHolder = getEffectiveHolder(thisRef)

            getCollection(oldValue).remove(effectiveHolder)
            getCollection(value).add(effectiveHolder)

            set(value)
        }
    }
}
