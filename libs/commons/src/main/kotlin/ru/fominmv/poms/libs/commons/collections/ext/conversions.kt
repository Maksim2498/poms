package ru.fominmv.poms.libs.commons.collections.ext

import ru.fominmv.poms.libs.commons.collections.interfaces.immutable.ByteArrayListView

fun List<Byte>.toByteArrayOrGetView(): ByteArray =
    if (this is ByteArrayListView)
        array
    else
        toByteArray()
