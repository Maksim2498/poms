package ru.fominmv.poms.server.model.entities

import org.hibernate.annotations.ColumnDefault
import org.hibernate.engine.jdbc.BlobProxy
import org.hibernate.Hibernate

import ru.fominmv.poms.server.model.interfaces.events.PreRemoveEventListener
import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate

import jakarta.persistence.*

import java.sql.Blob
import java.util.UUID

@Entity
class ItemStack(
    inventory: Inventory? = null,

    @Column(nullable = false)
    var slotIndex: Int = 0,

    @Lob
    @Column(nullable = false, length = 16_777_215) // 16MB
    var nbtBytes: Blob = BlobProxy.generateProxy(byteArrayOf()),

    @ColumnDefault("TRUE")
    @Column(nullable = false)
    var isCompressed: Boolean = true,

    id: UUID = UUID.randomUUID(),
) :
    AbstractModelObject<UUID>(id),

    PreRemoveEventListener
{
    // Avatar state

    @ManyToOne(
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
    )
    internal var internalInventory: Inventory? = inventory?.apply {
        if (Hibernate.isInitialized(internalItemStacks))
            internalItemStacks.add(this@ItemStack)
    }

    @delegate:Transient
    var inventory: Inventory? by NullablyReferencedSyncCollectionDelegate.Reference(
        get = { internalInventory },
        set = { internalInventory = it },
        getCollection = { it.internalItemStacks },
        getEffectiveHolder = { it },
    )

    // Events

    @PreRemove
    override fun onPreRemove() {
        inventory = null
    }
}
