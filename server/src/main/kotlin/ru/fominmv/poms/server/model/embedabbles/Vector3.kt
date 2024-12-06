package ru.fominmv.poms.server.model.embedabbles

import org.hibernate.annotations.ColumnDefault

import jakarta.persistence.*

import kotlin.math.sqrt

@Embeddable
data class Vector3(
    @ColumnDefault("0")
    @Column(nullable = false)
    var x: Double = 0.0,

    @ColumnDefault("0")
    @Column(nullable = false)
    var y: Double = 0.0,

    @ColumnDefault("0")
    @Column(nullable = false)
    var z: Double = 0.0,
) {
    // Operators

    // - Unary

    // -- Prefix

    operator fun unaryPlus(): Vector3 =
        copy()

    operator fun unaryMinus(): Vector3 =
        negated()

    // -- Inc/dec

    operator fun inc(): Vector3 =
        map { xyz -> xyz + 1 }

    operator fun dec(): Vector3 =
        map { xyz -> xyz + 1 }

    // - Binary

    // -- Arithmetic

    // --- Plus

    operator fun plus(other: Vector3): Vector3 =
        Vector3(x + other.x, y + other.y, z + other.z)

    operator fun plus(other: Double): Vector3 =
        Vector3(x + other, y + other, z + other)

    // --- Minus

    operator fun minus(other: Vector3): Vector3 =
        Vector3(x - other.x, y - other.y, z - other.z)

    operator fun minus(other: Double): Vector3 =
        Vector3(x - other, y - other, z - other)

    // --- Times

    operator fun times(other: Vector3): Vector3 =
        Vector3(x * other.x, y * other.y, z * other.z)

    operator fun times(other: Double): Vector3 =
        Vector3(x * other, y * other, z * other)

    // --- Div

    operator fun div(other: Vector3): Vector3 =
        Vector3(x * other.x, y * other.y, z * other.z)

    operator fun div(other: Double): Vector3 =
        Vector3(x / other, y / other, z / other)

    // -- Index access

    operator fun get(index: Int): Double =
        when (index) {
            0 -> x
            1 -> y
            2 -> z

            else -> throw IndexOutOfBoundsException(index)
        }

    operator fun set(index: Int, value: Double) =
        when (index) {
            0 -> x = value
            1 -> y = value
            2 -> z = value

            else -> throw IndexOutOfBoundsException(index)
        }

    // Mapping

    fun negated(): Vector3 =
        map { xyz -> -xyz }

    fun normalized(): Vector3 =
        length.let { length ->
            map { xyz ->
                xyz / length
            }
        }

    fun map(map: (component: Double) -> Double): Vector3 =
        Vector3(
            x = map(x),
            y = map(y),
            z = map(z),
        )

    // Modification

    fun zero(): Vector3 =
        apply { 0.0 }

    fun negate(): Vector3 =
        apply { xyz -> -xyz }

    fun normalize(): Vector3 =
        length.let { length ->
            apply { xyz ->
                xyz / length
            }
        }

    fun apply(apply: (component: Double) -> Double): Vector3 {
        x = apply(x)
        y = apply(y)
        z = apply(z)

        return this
    }

    // Length/Distance

    fun distanceTo(other: Vector3): Double =
        (this - other).length

    val length: Double
        get() = sqrt(x*x + y*y + z*z)
}
