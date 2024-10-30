package ru.fominmv.poms.libs.commons.collections.ext

fun <T> MutableCollection<T>.createProxySet(): MutableSet<T> =
    object : MutableSet<T> {
        // Size

        override val size: Int
            get() = this@createProxySet.size

        override fun isEmpty(): Boolean =
            this@createProxySet.isEmpty()

        // Add

        override fun addAll(elements: Collection<T>): Boolean =
            this@createProxySet.addAll(elements)

        override fun add(element: T): Boolean =
            this@createProxySet.add(element)

        // Remove

        override fun retainAll(elements: Collection<T>): Boolean =
            this@createProxySet.retainAll(elements)

        override fun removeAll(elements: Collection<T>): Boolean =
            this@createProxySet.removeAll(elements)

        override fun remove(element: T): Boolean =
            this@createProxySet.remove(element)

        override fun clear() =
            this@createProxySet.clear()

        // Contains

        override fun containsAll(elements: Collection<T>): Boolean =
            this@createProxySet.containsAll(elements)

        override fun contains(element: T): Boolean =
            this@createProxySet.contains(element)

        // Iterator

        override fun iterator(): MutableIterator<T> =
            this@createProxySet.iterator()

        // Equality check

        override fun equals(other: Any?): Boolean =
            this@createProxySet == other

        override fun hashCode(): Int =
            this@createProxySet.hashCode()

        // To string conversion

        override fun toString(): String =
            this@createProxySet.toString()
    }

fun <S, D> MutableCollection<S>.createMappingProxy(
    to: (element: S) -> D,
    from: (element: D) -> S,
): MutableCollection<D> =
    object : MutableCollection<D> {
        // Size

        override val size: Int
            get() = this@createMappingProxy.size

        override fun isEmpty(): Boolean =
            this@createMappingProxy.isEmpty()

        // Add

        override fun addAll(elements: Collection<D>): Boolean =
            this@createMappingProxy.addAll(elements.map(from))

        override fun add(element: D): Boolean =
            this@createMappingProxy.add(from(element))

        // Remove

        override fun retainAll(elements: Collection<D>): Boolean =
            this@createMappingProxy.retainAll(elements.map(from))

        override fun removeAll(elements: Collection<D>): Boolean =
            this@createMappingProxy.removeAll(elements.map(from))

        override fun remove(element: D): Boolean =
            this@createMappingProxy.remove(from(element))

        override fun clear() =
            this@createMappingProxy.clear()

        // Contains

        override fun containsAll(elements: Collection<D>): Boolean =
            this@createMappingProxy.containsAll(elements.map(from))

        override fun contains(element: D): Boolean =
            this@createMappingProxy.contains(from(element))

        // Iterator

        override fun iterator(): MutableIterator<D> {
            val initial = this@createMappingProxy.iterator()

            return object : MutableIterator<D> {
                override fun hasNext(): Boolean =
                    initial.hasNext()

                override fun next(): D =
                    to(initial.next())

                override fun remove() =
                    initial.remove()
            }
        }

        // Equality check

        override fun equals(other: Any?): Boolean =
            this@createMappingProxy == other

        override fun hashCode(): Int =
            this@createMappingProxy.hashCode()

        // To string conversion

        override fun toString(): String =
            this@createMappingProxy.toString()
    }

fun <S, D> MutableList<S>.createMappingProxy(
    to: (element: S) -> D,
    from: (element: D) -> S,
): MutableList<D> =
    object : MutableList<D> {
        // Size

        override val size: Int
            get() = this@createMappingProxy.size

        override fun isEmpty(): Boolean =
            this@createMappingProxy.isEmpty()

        // Add

        override fun addAll(index: Int, elements: Collection<D>): Boolean =
            this@createMappingProxy.addAll(index, elements.map(from))

        override fun add(index: Int, element: D) =
            this@createMappingProxy.add(index, from(element))

        override fun addAll(elements: Collection<D>): Boolean =
            this@createMappingProxy.addAll(elements.map(from))

        override fun add(element: D): Boolean =
            this@createMappingProxy.add(from(element))

        // Remove

        override fun retainAll(elements: Collection<D>): Boolean =
            this@createMappingProxy.retainAll(elements.map(from))

        override fun removeAll(elements: Collection<D>): Boolean =
            this@createMappingProxy.removeAll(elements.map(from))

        override fun remove(element: D): Boolean =
            this@createMappingProxy.remove(from(element))

        override fun removeAt(index: Int): D =
            to(this@createMappingProxy.removeAt(index))

        override fun clear() =
            this@createMappingProxy.clear()

        // Contains

        override fun containsAll(elements: Collection<D>): Boolean =
            this@createMappingProxy.containsAll(elements.map(from))

        override fun contains(element: D): Boolean =
            this@createMappingProxy.contains(from(element))

        // Iterators

        override fun iterator(): MutableIterator<D> {
            val initial = this@createMappingProxy.iterator()

            return object : MutableIterator<D> {
                override fun hasNext(): Boolean =
                    initial.hasNext()

                override fun next(): D =
                    to(initial.next())

                override fun remove() =
                    initial.remove()
            }
        }

        override fun listIterator(): MutableListIterator<D> =
            proxyListIterator(this@createMappingProxy.listIterator())

        override fun listIterator(index: Int): MutableListIterator<D> =
            proxyListIterator(this@createMappingProxy.listIterator(index))

        private fun proxyListIterator(initial: MutableListIterator<S>): MutableListIterator<D> =
            object : MutableListIterator<D> {
                // Next

                override fun hasNext(): Boolean =
                    initial.hasNext()

                override fun next(): D =
                    to(initial.next())

                override fun nextIndex(): Int =
                    initial.nextIndex()

                // Previous

                override fun hasPrevious(): Boolean =
                    initial.hasPrevious()

                override fun previous(): D =
                    to(initial.previous())

                override fun previousIndex(): Int =
                    initial.previousIndex()

                // Current

                override fun add(element: D) =
                    initial.add(from(element))

                override fun remove() =
                    initial.remove()

                override fun set(element: D) =
                    initial.set(from(element))
            }

        // Element access

        override fun get(index: Int): D =
            to(this@createMappingProxy[index])

        override fun set(index: Int, element: D): D =
            to(this@createMappingProxy.set(index, from(element)))

        override fun indexOf(element: D): Int =
            this@createMappingProxy.indexOf(from(element))

        override fun lastIndexOf(element: D): Int =
            this@createMappingProxy.lastIndexOf(from(element))

        // Sublist

        override fun subList(fromIndex: Int, toIndex: Int): MutableList<D> =
            this@createMappingProxy.subList(fromIndex, toIndex).createMappingProxy(to, from)

        // Equality check

        override fun equals(other: Any?): Boolean =
            this@createMappingProxy == other

        override fun hashCode(): Int =
            this@createMappingProxy.hashCode()

        // To string conversion

        override fun toString(): String =
            this@createMappingProxy.toString()
    }
