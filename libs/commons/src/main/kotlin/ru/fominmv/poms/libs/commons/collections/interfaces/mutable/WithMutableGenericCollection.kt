package ru.fominmv.poms.libs.commons.collections.interfaces.mutable

import ru.fominmv.poms.libs.commons.collections.interfaces.immutable.WithGenericCollection

typealias WithMutableCollection<ElementType> = WithMutableGenericCollection<
    ElementType,
    MutableCollection<ElementType>
>

typealias WithMutableList<ElementType> = WithMutableGenericCollection<
    ElementType,
    MutableList<ElementType>
>

typealias WithMutableSet<ElementType> = WithMutableGenericCollection<
    ElementType,
    MutableSet<ElementType>
>

interface WithMutableGenericCollection<
    ElementType,
    CollectionType: MutableCollection<ElementType>
> : WithGenericCollection<ElementType, CollectionType>
