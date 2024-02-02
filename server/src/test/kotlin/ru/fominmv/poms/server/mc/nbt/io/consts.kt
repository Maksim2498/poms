package ru.fominmv.poms.server.mc.nbt.io

import ru.fominmv.poms.server.mc.nbt.tag.*

val HELLO_WORLD_NBT = CompoundNBT(
    "hello world",
    listOf(
        StringNBT("name", "Bananrama"),
    ),
)

val BIG_TEST_NBT = CompoundNBT("Level", listOf(
    CompoundNBT("nested compound test", listOf(
        CompoundNBT("egg", listOf(
            StringNBT("name", "Eggbert"),
            FloatNBT("value", .5f),
        )),
        CompoundNBT("ham", listOf(
            StringNBT("name", "Hampus"),
            FloatNBT("value", .75f),
        )),
    )),
    IntNBT("intTest", 2147483647),
    ByteNBT("byteTest", 127),
    StringNBT("stringTest", "HELLO WORLD THIS IS A TEST STRING \u00C5\u00C4\u00D6!"),
    ListNBT("listTest (long)", listOf(
        LongNBT("", 11),
        LongNBT("", 12),
        LongNBT("", 13),
        LongNBT("", 14),
        LongNBT("", 15),
    )),
    DoubleNBT("doubleTest", .49312871321823148),
    FloatNBT("floatTest", .49823147058486938f),
    LongNBT("longTest", 9223372036854775807L),
    ListNBT("listTest (compound)", listOf(
        CompoundNBT("", listOf(
            LongNBT("created-on", 1264099775885L),
            StringNBT("name", "Compound tag #0"),
        )),
        CompoundNBT("", listOf(
            LongNBT("created-on", 1264099775885L),
            StringNBT("name", "Compound tag #1"),
        )),
    )),
    ByteArrayNBT(
        "byteArrayTest (the first 1000 values of (n*n*255+n*7)%100, starting with n=0 (0, 62, 34, 16, 8, ...))",
        List(1000) { n -> ((n * n * 255 + n * 7) % 100).toByte() },
    ),
    ShortNBT("shortTest", 32767),
))