package ru.fominmv.poms.libs.commons.delegates

import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

class NullableSyncFieldDelegate<in T, V>(
    private val get: () -> V?,
    private val set: (value: V?) -> Unit,
    private val update: (value: V, thisRef: T?) -> Unit,
) : ReadWriteProperty<T, V?> {
    override fun getValue(thisRef: T, property: KProperty<*>): V? =
        get()

    override fun setValue(thisRef: T, property: KProperty<*>, value: V?) {
        val oldValue = get()

        if (value === oldValue)
            return

        oldValue?.let { update(it, null) }
        value?.let { update(it, thisRef) }

        set(value)
    }
}
