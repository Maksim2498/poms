package ru.fominmv.poms.libs.commons.arrays.ext

import ru.fominmv.poms.libs.commons.collections.interfaces.immutable.ByteArrayListView

fun ByteArray.toListView(): ByteArrayListView =
    object : ByteArrayListView {
        override val array: ByteArray
            get() = this@toListView

        override val size: Int
            get() = array.size

        override fun get(index: Int): Byte =
            array[index]

        override fun isEmpty(): Boolean =
            array.isEmpty()

        override fun iterator(): Iterator<Byte> =
            array.iterator()

        override fun listIterator(): ListIterator<Byte> =
            listIterator(0)

        override fun listIterator(index: Int): ListIterator<Byte> =
            object : ListIterator<Byte> {
                private var index = index

                override fun hasNext(): Boolean =
                    this.index < array.size

                override fun hasPrevious(): Boolean =
                    this.index > 0

                override fun next(): Byte =
                    if (hasNext())
                        array[++this.index]
                    else
                        throw NoSuchElementException()

                override fun nextIndex(): Int =
                    this.index + 1

                override fun previous(): Byte =
                    if (hasPrevious())
                        array[--this.index]
                    else
                        throw NoSuchElementException()

                override fun previousIndex(): Int =
                    this.index - 1
            }

        override fun subList(fromIndex: Int, toIndex: Int): List<Byte> =
            array.slice(fromIndex..<toIndex)

        override fun lastIndexOf(element: Byte): Int =
            array.lastIndexOf(element)

        override fun indexOf(element: Byte): Int =
            array.indexOf(element)

        override fun containsAll(elements: Collection<Byte>): Boolean =
            elements.all(::contains)

        override fun contains(element: Byte): Boolean =
            element in array
    }

