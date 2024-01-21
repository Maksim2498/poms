package ru.fominmv.poms.server.util.io

import java.io.DataInputStream
import java.io.InputStream

class UDataInputStream(stream: InputStream) : DataInputStream(stream), UDataInput
