package ru.fominmv.poms.libs.mc.nbt.io

import ru.fominmv.poms.libs.mc.nbt.tags.*

val HELLO_WORLD_NBT = CompoundNbt(
    "hello world",
    listOf(StringNbt("name", "Bananrama")),
)

val BIG_TEST_NBT = CompoundNbt("Level", listOf(
    CompoundNbt("nested compound test", listOf(
        CompoundNbt("egg", listOf(
            StringNbt("name", "Eggbert"),
            FloatNbt("value", .5f),
        )),

        CompoundNbt("ham", listOf(
            StringNbt("name", "Hampus"),
            FloatNbt("value", .75f),
        )),
    )),

    IntNbt("intTest", 2147483647),
    ByteNbt("byteTest", 127),
    StringNbt("stringTest", "HELLO WORLD THIS IS A TEST STRING \u00C5\u00C4\u00D6!"),

    ListNbt("listTest (long)", listOf(
        LongNbt(11),
        LongNbt(12),
        LongNbt(13),
        LongNbt(14),
        LongNbt(15),
    )),

    DoubleNbt("doubleTest", .49312871321823148),
    FloatNbt("floatTest", .49823147058486938f),
    LongNbt("longTest", 9223372036854775807L),

    ListNbt("listTest (compound)", listOf(
        CompoundNbt(listOf(
            LongNbt("created-on", 1264099775885L),
            StringNbt("name", "Compound tag #0"),
        )),

        CompoundNbt(listOf(
            LongNbt("created-on", 1264099775885L),
            StringNbt("name", "Compound tag #1"),
        )),
    )),

    ByteArrayNbt(
        "byteArrayTest (the first 1000 values of (n*n*255+n*7)%100, starting with n=0 (0, 62, 34, 16, 8, ...))",
        List(1000) { n -> ((n * n * 255 + n * 7) % 100).toByte() },
    ),

    ShortNbt("shortTest", 32767),
))
