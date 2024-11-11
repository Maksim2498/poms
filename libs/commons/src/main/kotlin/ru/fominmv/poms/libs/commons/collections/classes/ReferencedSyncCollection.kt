package ru.fominmv.poms.libs.commons.collections.classes

import ru.fominmv.poms.libs.commons.collections.ext.createMappingProxy
import ru.fominmv.poms.libs.commons.collections.interfaces.mutable.MutableWithHolder
import ru.fominmv.poms.libs.commons.collections.interfaces.mutable.WithMutableCollection
import ru.fominmv.poms.libs.commons.iterable.ext.anyForEach

class ReferencedSyncCollection<
    HolderType: WithMutableCollection<ElementType>,
    ElementType: MutableWithHolder<HolderType>
>(
    val holder: HolderType,
) : MutableCollection<ElementType> by holder.collection {
    companion object {
        fun <HolderType, ElementType> doubleProxy(
            holder: HolderType,
            getCollectionFromHolder: (holder: HolderType) -> MutableCollection<ElementType>,
            updateElementHolder: (element: ElementType, newHolder: HolderType) -> Unit
        ): MutableCollection<ElementType> {
            val firstProxy = proxy(holder, getCollectionFromHolder, updateElementHolder)

            val secondProxy = firstProxy.createMappingProxy(
                from = firstProxy.holder::CollectionElement,
                to = { it.initial },
            )

            return secondProxy
        }

        fun <HolderType, ElementType> proxy(
            holder: HolderType,
            getCollectionFromHolder: (holder: HolderType) -> MutableCollection<ElementType>,
            updateElementHolder: (element: ElementType, newHolder: HolderType) -> Unit,
        ): ReferencedSyncCollection<
            ProxyHolder<HolderType, ElementType>,
            ProxyHolder<HolderType, ElementType>.CollectionElement
        > =
            ReferencedSyncCollection(
                ProxyHolder(
                    holder,
                    getCollectionFromHolder,
                    updateElementHolder,
                )
            )

        @Suppress("CanBeParameter")
        class ProxyHolder<HolderType, ElementType>(
            val holder: HolderType,
            val getCollectionFromHolder: (holder: HolderType) -> MutableCollection<ElementType>,
            val updateElementHolder: (element: ElementType, newHolder: HolderType) -> Unit
        ) : WithMutableCollection<ProxyHolder<HolderType, ElementType>.CollectionElement> {
            override val collection: MutableCollection<CollectionElement> =
                getCollectionFromHolder(holder).createMappingProxy(
                    from = { it.initial },
                    to = ::CollectionElement,
                )

            // Equality check

            override fun equals(other: Any?): Boolean =
                holder == other

            override fun hashCode(): Int =
                holder.hashCode()

            // To string conversion

            override fun toString(): String =
                holder.toString()

            // Collection element

            inner class CollectionElement(
                val initial: ElementType,
                holder: ProxyHolder<HolderType, ElementType> = this@ProxyHolder,
            ) : MutableWithHolder<ProxyHolder<HolderType, ElementType>> {
                override var holder: ProxyHolder<HolderType, ElementType> = holder
                    set(value) {
                        updateElementHolder(initial, value.holder)
                        field = value
                    }

                override fun equals(other: Any?): Boolean =
                    initial == other

                override fun hashCode(): Int =
                    initial.hashCode()

                override fun toString(): String =
                    initial.toString()
            }
        }
    }

    // Add

    override fun addAll(elements: Collection<ElementType>): Boolean =
        elements.anyForEach(::add)

    override fun add(element: ElementType): Boolean =
        holder.collection.add(element).also { added ->
            if (added)
                updateAdded(element)
        }

    private fun updateAdded(element: ElementType) {
        element.holder.collection.remove(element)
        element.holder = holder
    }

    // Equality check

    override fun equals(other: Any?): Boolean =
        holder.collection == other

    override fun hashCode(): Int =
        holder.collection.hashCode()

    // To string conversion

    override fun toString(): String =
        holder.collection.toString()
}
