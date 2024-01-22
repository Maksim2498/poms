package ru.fominmv.poms.server.mc.protocol.nbt.io

import ru.fominmv.poms.server.mc.protocol.nbt.tag.*

val HELLO_WORLD_TAG = CompoundTag(
    "hello world",
    listOf(
        StringTag("name", "Bananrama"),
    ),
)

val BIG_TEST_TAG = CompoundTag("Level", listOf(
    CompoundTag("nested compound test", listOf(
        CompoundTag("egg", listOf(
            StringTag("name", "Eggbert"),
            FloatTag("value", .5f),
        )),
        CompoundTag("ham", listOf(
            StringTag("name", "Hampus"),
            FloatTag("value", .75f),
        )),
    )),
    IntTag("intTest", 2147483647),
    ByteTag("byteTest", 127),
    StringTag("stringTest", "HELLO WORLD THIS IS A TEST STRING \u00C5\u00C4\u00D6!"),
    ListTag("listTest (long)", listOf(
        LongTag("", 11),
        LongTag("", 12),
        LongTag("", 13),
        LongTag("", 14),
        LongTag("", 15),
    )),
    DoubleTag("doubleTest", .49312871321823148),
    FloatTag("floatTest", .49823147058486938f),
    LongTag("longTest", 9223372036854775807L),
    ListTag("listTest (compound)", listOf(
        CompoundTag("", listOf(
            LongTag("created-on", 1264099775885L),
            StringTag("name", "Compound tag #0"),
        )),
        CompoundTag("", listOf(
            LongTag("created-on", 1264099775885L),
            StringTag("name", "Compound tag #1"),
        )),
    )),
    ByteArrayTag(
        "byteArrayTest (the first 1000 values of (n*n*255+n*7)%100, starting with n=0 (0, 62, 34, 16, 8, ...))",
        List(1000) { n -> ((n * n * 255 + n * 7) % 100).toByte() },
    ),
    ShortTag("shortTest", 32767),
))