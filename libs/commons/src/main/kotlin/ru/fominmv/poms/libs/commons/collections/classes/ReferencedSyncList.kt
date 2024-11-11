package ru.fominmv.poms.libs.commons.collections.classes

import ru.fominmv.poms.libs.commons.collections.ext.createMappingProxy
import ru.fominmv.poms.libs.commons.collections.interfaces.mutable.MutableWithHolder
import ru.fominmv.poms.libs.commons.collections.interfaces.mutable.WithMutableList
import ru.fominmv.poms.libs.commons.iterable.ext.anyForEach

class ReferencedSyncList<
    HolderType: WithMutableList<ElementType>,
    ElementType: MutableWithHolder<HolderType>
>(
    val holder: HolderType,
) : MutableList<ElementType> by holder.collection {
    companion object {
        fun <HolderType, ElementType> doubleProxy(
            holder: HolderType,
            getListFromHolder: (holder: HolderType) -> MutableList<ElementType>,
            updateElementHolder: (element: ElementType, newHolder: HolderType) -> Unit
        ): MutableList<ElementType> {
            val firstProxy = proxy(holder, getListFromHolder, updateElementHolder)

            val secondProxy = firstProxy.createMappingProxy(
                from = firstProxy.holder::ListElement,
                to = { it.initial },
            )

            return secondProxy
        }

        fun <HolderType, ElementType> proxy(
            holder: HolderType,
            getListFromHolder: (holder: HolderType) -> MutableList<ElementType>,
            updateElementHolder: (element: ElementType, newHolder: HolderType) -> Unit
        ): ReferencedSyncList<
            ProxyHolder<HolderType, ElementType>,
            ProxyHolder<HolderType, ElementType>.ListElement
        > =
            ReferencedSyncList(
                ProxyHolder(
                    holder,
                    getListFromHolder,
                    updateElementHolder,
                )
            )

        @Suppress("CanBeParameter")
        class ProxyHolder<HolderType, ElementType>(
            val holder: HolderType,
            val getListFromHolder: (holder: HolderType) -> MutableList<ElementType>,
            val updateElementHolder: (element: ElementType, newHolder: HolderType) -> Unit
        ) : WithMutableList<ProxyHolder<HolderType, ElementType>.ListElement> {
            override val collection: MutableList<ListElement> =
                getListFromHolder(holder).createMappingProxy(
                    from = { it.initial },
                    to = ::ListElement,
                )

            // Equality check

            override fun equals(other: Any?): Boolean =
                holder == other

            override fun hashCode(): Int =
                holder.hashCode()

            // To string conversion

            override fun toString(): String =
                holder.toString()

            // List element

            inner class ListElement(
                val initial: ElementType,
                holder: ProxyHolder<HolderType, ElementType> = this,
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

    override fun addAll(index: Int, elements: Collection<ElementType>): Boolean =
        holder.collection.addAll(index, elements).also {
            elements.forEach(::updateAdded)
        }

    override fun add(index: Int, element: ElementType) =
        holder.collection.add(index, element).also {
            updateAdded(element)
        }

    override fun addAll(elements: Collection<ElementType>): Boolean =
        elements.anyForEach(::add)

    override fun add(element: ElementType): Boolean =
        holder.collection.add(element).also { added ->
            if (added)
                updateAdded(element)
        }

    override fun set(index: Int, element: ElementType): ElementType =
        holder.collection.set(index, element).also {
            updateAdded(element)
        }

    // Iterators

    override fun iterator(): MutableIterator<ElementType> =
        object : MutableIterator<ElementType> by holder.collection.iterator() {
            override fun remove() =
                throw UnsupportedOperationException("remove() isn't supported")
        }

    override fun listIterator(): MutableListIterator<ElementType> =
        proxy(holder.collection.listIterator())

    override fun listIterator(index: Int): MutableListIterator<ElementType> =
        proxy(holder.collection.listIterator(index))


    // Equality check

    override fun equals(other: Any?): Boolean =
        holder.collection == other

    override fun hashCode(): Int =
        holder.collection.hashCode()

    // To string conversion

    override fun toString(): String =
        holder.collection.toString()

    // Util

    private fun proxy(initial: MutableListIterator<ElementType>): MutableListIterator<ElementType> =
        object : MutableListIterator<ElementType> by initial {
            override fun add(element: ElementType) {
                initial.add(element)
                updateAdded(element)
            }

            override fun set(element: ElementType) {
                initial.set(element)
                updateAdded(element)
            }
        }

    private fun updateAdded(element: ElementType) {
        element.holder.collection.remove(element)
        element.holder = holder
    }
}
