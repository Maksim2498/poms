package ru.fominmv.poms.libs.commons.collections.classes

import ru.fominmv.poms.libs.commons.collections.ext.createMappingProxy
import ru.fominmv.poms.libs.commons.collections.interfaces.mutable.WithMutableCollection
import ru.fominmv.poms.libs.commons.iterable.ext.anyForEach

class SyncList<
    HolderType,
    InitialElementType: WithMutableCollection<HolderType>,
    InitialType: MutableList<InitialElementType>
>(
    val holder: HolderType,
    val initial: InitialType,
) : MutableList<InitialElementType> by initial {
    companion object {
        fun <HolderType, ElementType> doubleProxy(
            holder: HolderType,
            initial: MutableList<ElementType>,
            getCollectionFromElement: (element: ElementType) -> MutableCollection<HolderType>,
        ): MutableList<ElementType> {
            val firstProxy = proxy(holder, initial, getCollectionFromElement)

            val secondProxy = firstProxy.createMappingProxy(
                from = { ProxyList.Element(it, getCollectionFromElement) },
                to = { it.initial },
            )

            return secondProxy
        }

        fun <HolderType, ElementType> proxy(
            holder: HolderType,
            initial: MutableList<ElementType>,
            getCollectionFromElement: (element: ElementType) -> MutableCollection<HolderType>,
        ): SyncList<
            HolderType,
            ProxyList.Element<HolderType, ElementType>,
            ProxyList<HolderType, ElementType>
        > =
            SyncList(
                holder,
                ProxyList(initial, getCollectionFromElement),
            )

        class ProxyList<HolderType, ElementType>(
            initial: MutableList<ElementType>,
            getCollectionFromElement: (element: ElementType) -> MutableCollection<HolderType>,
        ) : MutableList<ProxyList.Element<HolderType, ElementType>>
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

    override fun addAll(index: Int, elements: Collection<InitialElementType>): Boolean =
        initial.addAll(index, elements).also {
            elements.forEach(::updateAdded)
        }

    override fun add(index: Int, element: InitialElementType) =
        initial.add(index, element).also {
            updateAdded(element)
        }

    override fun addAll(elements: Collection<InitialElementType>): Boolean =
        elements.anyForEach(::add)

    override fun add(element: InitialElementType): Boolean =
        initial.add(element).also { added ->
            if (added)
                updateAdded(element)
        }

    override fun set(index: Int, element: InitialElementType): InitialElementType =
        initial.set(index, element).also { oldElement ->
            updateRemoved(oldElement)
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
        anyForEach(::remove)

    override fun remove(element: InitialElementType): Boolean =
        initial.remove(element).also { removed ->
            if (removed)
                updateRemoved(element)
        }

    override fun removeAt(index: Int): InitialElementType =
        initial.removeAt(index).also(::updateRemoved)

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

    override fun listIterator(): MutableListIterator<InitialElementType> =
        proxy(initial.listIterator())

    override fun listIterator(index: Int): MutableListIterator<InitialElementType> =
        proxy(initial.listIterator(index))

    // Equality check

    override fun equals(other: Any?): Boolean =
        initial == other

    override fun hashCode(): Int =
        initial.hashCode()

    // To string conversion

    override fun toString(): String =
        initial.toString()

    // Util

    private fun proxy(initial: MutableListIterator<InitialElementType>): MutableListIterator<InitialElementType> =
        object : MutableListIterator<InitialElementType> by initial {
            override fun add(element: InitialElementType) =
                initial.add(element).also {
                    updateAdded(element)
                }

            override fun remove() {
                val old = currentOrNull()

                initial.remove()

                old?.let(::updateRemoved)
            }

            override fun set(element: InitialElementType) {
                val old = currentOrNull()

                initial.set(element)

                old?.let(::updateRemoved)
                updateAdded(element)
            }

            private fun currentOrNull(): InitialElementType? =
                this@SyncList.getOrNull(this.nextIndex() - 1)
        }

    private fun updateAdded(element: InitialElementType) {
        element.collection.add(holder)
    }

    private fun updateRemoved(element: InitialElementType) {
        element.collection.remove(holder)
    }
}
