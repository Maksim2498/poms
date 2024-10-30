package ru.fominmv.poms.libs.commons.collections.classes

import ru.fominmv.poms.libs.commons.collections.ext.createMappingProxy
import ru.fominmv.poms.libs.commons.collections.interfaces.mutable.WithMutableCollection
import ru.fominmv.poms.libs.commons.iterable.ext.anyForEach

class SyncCollection<
    HolderType,
    InitialElementType: WithMutableCollection<HolderType>,
    InitialType: MutableCollection<InitialElementType>
>(
    val holder: HolderType,
    val initial: InitialType,
) : MutableCollection<InitialElementType> by initial {
    companion object {
        fun <HolderType, ElementType> doubleProxy(
            holder: HolderType,
            initial: MutableCollection<ElementType>,
            getCollectionFromElement: (element: ElementType) -> MutableCollection<HolderType>,
        ): MutableCollection<ElementType> {
            val firstProxy = proxy(holder, initial, getCollectionFromElement)

            val secondProxy = firstProxy.createMappingProxy(
                from = { ProxyCollection.Element(it, getCollectionFromElement) },
                to = { it.initial },
            )

            return secondProxy
        }

        fun <HolderType, ElementType> proxy(
            holder: HolderType,
            initial: MutableCollection<ElementType>,
            getCollectionFromElement: (element: ElementType) -> MutableCollection<HolderType>,
        ): SyncCollection<
            HolderType,
            ProxyCollection.Element<HolderType, ElementType>,
            ProxyCollection<HolderType, ElementType>
        > =
            SyncCollection(
                holder,
                ProxyCollection(initial, getCollectionFromElement),
            )

        class ProxyCollection<HolderType, ElementType>(
            initial: MutableCollection<ElementType>,
            getCollectionFromElement: (element: ElementType) -> MutableCollection<HolderType>,
        ) : MutableCollection<ProxyCollection.Element<HolderType, ElementType>>
            by initial.createMappingProxy(
                from = { it.initial },
                to = { Element(it, getCollectionFromElement) }
            )
        {
            class Element<HolderType, ElementType>(
                val initial: ElementType,
                val getCollectionFromElement: (element: ElementType) -> MutableCollection<HolderType>,
            ) : WithMutableCollection<HolderType> {
                override val collection: MutableCollection<HolderType>
                    get() = getCollectionFromElement(initial)

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

    override fun addAll(elements: Collection<InitialElementType>): Boolean =
        elements.anyForEach(::add)

    override fun add(element: InitialElementType): Boolean =
        initial.add(element).also { added ->
            if (added)
                updateAdded(element)
        }

    // Remove

    override fun retainAll(elements: Collection<InitialElementType>): Boolean {
        val toRemove = mutableSetOf<InitialElementType>()

        initial.forEach {
            if (!elements.contains(it))
                toRemove.add(it)
        }

        return removeAll(toRemove)
    }

    override fun removeAll(elements: Collection<InitialElementType>): Boolean =
        elements.anyForEach(::remove)

    override fun remove(element: InitialElementType): Boolean =
        initial.remove(element).also { removed ->
            if (removed)
                updateRemoved(element)
        }

    override fun clear() {
        initial.forEach(::updateRemoved)
        initial.clear()
    }

    // Iterator

    override fun iterator(): MutableIterator<InitialElementType> =
        object : MutableIterator<InitialElementType> by initial.iterator(){
            override fun remove() =
                throw UnsupportedOperationException("remove() is not supported")
        }

    // Equality check

    override fun equals(other: Any?): Boolean =
        initial == other

    override fun hashCode(): Int =
        initial.hashCode()

    // To string conversion

    override fun toString(): String =
        initial.toString()

    // Util

    private fun updateAdded(element: InitialElementType) {
        element.collection.add(holder)
    }

    private fun updateRemoved(element: InitialElementType) {
        element.collection.remove(holder)
    }
}
