package ru.fominmv.poms.libs.commons.arrays.ext

fun ByteArray.toListView(): List<Byte> =
    object : List<Byte> {
        override val size: Int
            get() = this@toListView.size

        override fun get(index: Int): Byte =
            this@toListView[index]

        override fun isEmpty(): Boolean =
            this@toListView.isEmpty()

        override fun iterator(): Iterator<Byte> =
            this@toListView.iterator()

        override fun listIterator(): ListIterator<Byte> =
            listIterator(0)

        override fun listIterator(index: Int): ListIterator<Byte> =
            object : ListIterator<Byte> {
                private var index = index

                override fun hasNext(): Boolean =
                    this.index < this@toListView.size

                override fun hasPrevious(): Boolean =
                    this.index > 0

                override fun next(): Byte =
                    if (hasNext())
                        this@toListView[++this.index]
                    else
                        throw NoSuchElementException()

                override fun nextIndex(): Int =
                    this.index + 1

                override fun previous(): Byte =
                    if (hasPrevious())
                        this@toListView[--this.index]
                    else
                        throw NoSuchElementException()

                override fun previousIndex(): Int =
                    this.index - 1
            }

        override fun subList(fromIndex: Int, toIndex: Int): List<Byte> =
            this@toListView.slice(fromIndex..<toIndex)

        override fun lastIndexOf(element: Byte): Int =
            this@toListView.lastIndexOf(element)

        override fun indexOf(element: Byte): Int =
            this@toListView.indexOf(element)

        override fun containsAll(elements: Collection<Byte>): Boolean =
            elements.all(::contains)

        override fun contains(element: Byte): Boolean =
            element in this@toListView
    }
