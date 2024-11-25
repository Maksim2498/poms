package ru.fominmv.poms.libs.mc.nbt.tags

/**
 * A class representing NBT tag holding a set of other NBT tags
 *
 * The main difference between [ListNbt] and [CompoundNbt] is that [CompoundNbt]
 * holds an unordered collection of the [Nbt]s and during the serialization and
 * deserialization process [name]s of the [Nbt]s stored in the [ListNbt] will be
 * ignored, whereas [name]s of the [Nbt]s stored in the [CompoundNbt] wouldn't.
 *
 * In contrast to the [ByteArrayNbt], [IntArrayNbt], and [LongArrayNbt] it holds
 * a copy of the [values] provided in the constructors, not an initial value.
 * It's done this way to guarantee the compliance with the precondition that
 * [values] must not contain an [EndNbt]
 *
 * @param name the name of this NBT tag
 * @param values the values of this NBT tag (all must be of the same type)
 *
 * @constructor Creates NBT tag with [name] and [values] specified
 *
 * @throws IllegalArgumentException if [values] contains [EndNbt]
 */
class CompoundNbt(
    override val name: String,
    values: Iterable<Nbt>,
) : CollectionNbt<Set<Nbt>>() {
    /**
     * Creates NBT tag with empty [name] and [values] specified
     */
    constructor(values: Iterable<Nbt>) : this("", values)

    // Properties

    override val values: Set<Nbt> = values.toSet()

    // Validation

    init {
        check(this.values.none { it === EndNbt }) {
            "${EndNbt.javaClass.simpleName} is not allowed"
        }
    }

    // Destructuring

    operator fun component1(): String =
        name

    operator fun component2(): Set<Nbt> =
        values
}
