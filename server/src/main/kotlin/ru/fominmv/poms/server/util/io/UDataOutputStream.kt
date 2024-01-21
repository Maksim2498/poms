package ru.fominmv.poms.server.util.io

import java.io.DataOutputStream
import java.io.OutputStream

class UDataOutputStream(stream: OutputStream) : DataOutputStream(stream), UDataOutput
