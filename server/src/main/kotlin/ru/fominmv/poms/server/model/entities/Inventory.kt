package ru.fominmv.poms.server.model.entities

import ru.fominmv.poms.libs.commons.collections.delegates.NullablyReferencedSyncCollectionDelegate
import ru.fominmv.poms.libs.commons.collections.ext.createProxySet
import ru.fominmv.poms.libs.commons.delegates.NullableSyncFieldDelegate
import ru.fominmv.poms.libs.commons.text.strings.Hidden
import ru.fominmv.poms.server.model.interfaces.events.PreRemoveEventListener

import jakarta.persistence.*
import jakarta.validation.constraints.NotNull

import java.util.UUID

@Entity
class Inventory(id: UUID = UUID.randomUUID()) :
    AbstractModelObject<UUID>(id),

    PreRemoveEventListener
{
    // Avatar state

    @Hidden
    @NotNull
    @OneToOne(
        mappedBy = "internalInventory",
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
        optional = false,
    )
    internal var internalInventoryAvatarState: AvatarState? = null

    @delegate:Transient
    var inventoryAvatarState: AvatarState? by NullableSyncFieldDelegate(
        get = { internalInventoryAvatarState },
        set = { internalInventoryAvatarState = it },
        update = { avatarState, inventory -> avatarState.internalInventory = inventory },
    )

    @Hidden
    @NotNull
    @OneToOne(
        mappedBy = "internalEnderChestInventory",
        fetch = FetchType.LAZY,
        cascade = [
            CascadeType.PERSIST,
            CascadeType.MERGE,
            CascadeType.REFRESH,
        ],
        optional = false,
    )
    internal var internalEnderChestInventoryAvatarState: AvatarState? = null

    @delegate:Transient
    var enderChestInventoryAvatarState: AvatarState? by NullableSyncFieldDelegate(
        get = { internalEnderChestInventoryAvatarState },
        set = { internalEnderChestInventoryAvatarState = it },
        update = { avatarState, inventory -> avatarState.internalEnderChestInventory = inventory },
    )

    // Item stacks

    @Hidden
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

        inventoryAvatarState = null
        enderChestInventoryAvatarState = null
    }
}
