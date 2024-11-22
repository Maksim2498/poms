package ru.fominmv.poms.libs.mc.protocol

import ru.fominmv.poms.libs.mc.nbt.io.NbtInputStream

import java.io.DataInput
import java.io.DataInputStream

open class McDataInputStream<T : DataInputStream>(stream: T) :
    NbtInputStream<T>(stream),

    DataInput by stream,
    McDataInput
