package ru.fominmv.poms.libs.mc.protocol

val Long.size: Int
    get() {
        // Number of bytes required to encode a long
        // increases by one for every 7 used bits

        if (this < 0) // MSB will be 1
            return 10

        if (this < 0b1__000_0000)
            return 1

        if (this < 0b1__000_0000__000_0000)
            return 2

        if (this < 0b1__000_0000__000_0000__000_0000)
            return 3

        if (this < 0b1__000_0000__000_0000__000_0000__000_0000)
            return 4

        if (this < 0b1__000_0000__000_0000__000_0000__000_0000__000_0000)
            return 5

        if (this < 0b1__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000)
            return 6

        if (this < 0b1__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000)
            return 7

        if (this < 0b1__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000)
            return 8

        if (this.toULong() < 0b1__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000u)
            return 9

        return 10
    }
