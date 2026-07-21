export function createEquipmentInventory(buildingId, definition) {
    const compartments = [];
    for (let column = 0; column < definition.layout.columns; column++) {
        for (let level = 0; level < definition.layout.levels; level++) {
            compartments.push({
                id: `column-${column + 1}-level-${level + 1}`,
                column,
                level,
                productKey: null,
                quantity: 0,
                capacity: 0,
            });
        }
    }
    return { buildingId, definitionKey: definition.key, compartments };
}
export function getProductCapacity(definition, product) {
    return product.capacities[definition.layout.compartmentType] ?? 0;
}
export function isProductCompatible(definition, product) {
    if (!definition.allowedProductCategories.includes(product.category))
        return false;
    if (product.requiresFreezing && !definition.frozen)
        return false;
    if (product.requiresRefrigeration && !definition.refrigerated && !definition.frozen)
        return false;
    return getProductCapacity(definition, product) > 0;
}
