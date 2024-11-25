package ru.fominmv.poms.libs.mc.nbt.tags

/**
 * A class representing NBT tag holding a list of other NBT tags
 *
 * The main difference between [ListNbt] and [CompoundNbt] is that [CompoundNbt]
 * holds an unordered collection of the [Nbt]s and during the serialization and
 * deserialization process [name]s of the [Nbt]s stored in the [ListNbt] will be
 * ignored, whereas [name]s of the [Nbt]s stored in the [CompoundNbt] wouldn't.
 *
 * In contrast to the [ByteArrayNbt], [IntArrayNbt], and [LongArrayNbt] it holds
 * a copy of the [values] provided in the constructors, not an initial value.
 * It's done this way to guarantee the compliance with the precondition that
 * [values] must not contain an [EndNbt] and must all be of the same type
 *
 * @param name the name of this NBT tag
 * @param values the values of this NBT tag (all must be of the same type)
 *
 * @constructor Creates NBT tag with [name] and [values] specified
 *
 * @throws IllegalArgumentException if [values] contains [EndNbt] or are not of the same type
 */
class ListNbt<out T : Nbt>(
    override val name: String,
    values: Iterable<T>,
) : CollectionNbt<List<T>>() {
    /**
     * Creates NBT tag with empty [name] and [values] specified
     */
    constructor(values: Iterable<T>) : this("", values)

    // Properties

    override val values = values.toList()

    /**
     * A class of the [values] element
     */
    val valuesClass: Class<out Nbt> = this.values.firstOrNull()?.javaClass ?: EndNbt::class.java

    // Validation

    init {
        check(this.values.none { it === EndNbt }) {
            "${EndNbt.javaClass.simpleName} is not allowed"
        }

        check(this.values.all { it.javaClass == valuesClass }) {
            "All values must be of the same class"
        }
    }

    // Destructuring

    operator fun component1(): String =
        name

    operator fun component2(): List<T> =
        values

    // Copying

    fun copy(
        name: String = this.name,
        values: List<@UnsafeVariance T> = this.values,
    ): ListNbt<T> =
        ListNbt(name, values)
}
