package ru.fominmv.poms.libs.commons.collections.interfaces.immutable

typealias WithCollection<ElementType> = WithGenericCollection<ElementType, Collection<ElementType>>
typealias WithList<ElementType> = WithGenericCollection<ElementType, List<ElementType>>
typealias WithSet<ElementType> = WithGenericCollection<ElementType, Set<ElementType>>

interface WithGenericCollection<
    ElementType,
    CollectionType: Collection<ElementType>
> {
    val collection: CollectionType
}
