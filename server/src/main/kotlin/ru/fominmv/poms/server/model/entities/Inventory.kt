package ru.fominmv.poms.server.model.entities

import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.collections.ext.createProxySet
import ru.fominmv.poms.server.model.interfaces.events.PreRemoveEventListener

import jakarta.persistence.*

import java.util.UUID

@Entity
class Inventory(
    id: UUID = UUID.randomUUID(),
) :
    AbstractModelObject<UUID>(id),

    PreRemoveEventListener
{
    // Item stacks

    @OneToMany(
        mappedBy = "internalInventory",
        cascade = [CascadeType.ALL],
        orphanRemoval = true,
    )
    internal var internalItemStacks: MutableSet<ItemStack> = mutableSetOf()

    @delegate:Transient
    var itemStacks: MutableSet<ItemStack> by NullablyReferencedSyncCollectionDelegate(
        getCollectionFromHolder = { it.internalItemStacks },
        updateElementHolder = { itemStack, inventory -> itemStack.internalInventory = inventory },
        convertCollection = { it.createProxySet() },
        getEffectiveHolder = { it },
    )

    // Events

    @PreRemove
    override fun onPreRemove() {
        itemStacks.clear()
    }
}
