/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
const __VLS_props = defineProps();
const __VLS_emit = defineEmits();
function storageLabel(type) { return type === 'ambient' ? 'ambiante' : type === 'cold' ? 'froide' : 'surgelée'; }
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "selection-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-heading" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
(__VLS_ctx.selectedItem ? __VLS_ctx.selectedItem.buildingName : 'Sélection');
if (__VLS_ctx.selectedItem) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedItem))
                    return;
                __VLS_ctx.$emit('select', null);
            } },
        ...{ class: "close-button" },
    });
}
if (__VLS_ctx.selectedItem?.type === 'shelf') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "selection-type" },
    });
    (__VLS_ctx.selectedItem.columns);
    (__VLS_ctx.selectedItem.levels);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "panel-help" },
    });
    (__VLS_ctx.selectedItem.description);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "equipment-summary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.selectedItem.configuredSlots);
    (__VLS_ctx.selectedItem.slots.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.selectedItem.stock);
    (__VLS_ctx.selectedItem.capacity);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedItem?.type === 'shelf'))
                    return;
                __VLS_ctx.$emit('restock-equipment', __VLS_ctx.selectedItem.id);
            } },
        ...{ class: "panel-action" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "equipment-grid" },
        ...{ style: ({ gridTemplateColumns: `repeat(${__VLS_ctx.selectedItem.columns}, minmax(0, 1fr))` }) },
    });
    for (const [column] of __VLS_getVForSourceType((__VLS_ctx.selectedItem.columnGroups))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            key: (column.index),
            ...{ class: "equipment-column" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        (column.index + 1);
        for (const [slot] of __VLS_getVForSourceType((column.slots))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                key: (slot.id),
                ...{ class: "equipment-slot" },
                ...{ class: ({ empty: !slot.productKey }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "slot-heading" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (slot.level + 1);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (slot.quantity);
            (slot.capacity);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                ...{ onChange: (...[$event]) => {
                        if (!(__VLS_ctx.selectedItem?.type === 'shelf'))
                            return;
                        __VLS_ctx.$emit('assign-product', __VLS_ctx.selectedItem.id, slot.id, $event);
                    } },
                value: (slot.productKey ?? ''),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "",
            });
            for (const [product] of __VLS_getVForSourceType((__VLS_ctx.selectedItem.compatibleProducts))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (product.key),
                    value: (product.key),
                });
                (product.name);
                (product.capacity);
            }
            if (slot.productKey) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "slot-product" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.i)({
                    ...{ style: ({ background: slot.color }) },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (slot.productName);
            }
            if (slot.productKey) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                (slot.reserveQuantity);
            }
            if (slot.productKey && slot.quantity < slot.capacity) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.selectedItem?.type === 'shelf'))
                                return;
                            if (!(slot.productKey && slot.quantity < slot.capacity))
                                return;
                            __VLS_ctx.$emit('restock-slot', __VLS_ctx.selectedItem.id, slot.id);
                        } },
                    ...{ class: "slot-action" },
                });
            }
        }
    }
}
else if (__VLS_ctx.selectedItem?.type === 'storage') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "selection-type" },
    });
    (__VLS_ctx.storageLabel(__VLS_ctx.selectedItem.storageType));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "panel-help" },
    });
    (__VLS_ctx.selectedItem.description);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stock-meter" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
        ...{ style: ({ width: `${__VLS_ctx.selectedItem.ratio * 100}%` }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dl, __VLS_intrinsicElements.dl)({
        ...{ class: "detail-list" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
    (__VLS_ctx.selectedItem.used);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
    (__VLS_ctx.selectedItem.capacity);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
    (__VLS_ctx.selectedItem.free);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.selectedItem?.type === 'shelf'))
                    return;
                if (!(__VLS_ctx.selectedItem?.type === 'storage'))
                    return;
                __VLS_ctx.$emit('open-management', 'reserve');
            } },
        ...{ class: "panel-action" },
    });
}
else if (__VLS_ctx.selectedItem?.type === 'checkout') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "selection-type" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "panel-help" },
    });
    (__VLS_ctx.selectedItem.description);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dl, __VLS_intrinsicElements.dl)({
        ...{ class: "detail-list" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({
        ...{ class: (__VLS_ctx.selectedItem.open ? 'positive-text' : 'negative-text') },
    });
    (__VLS_ctx.selectedItem.open ? 'Ouverte' : 'Fermée');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
    (__VLS_ctx.selectedItem.employeeName ?? 'Aucun');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
    (__VLS_ctx.selectedItem.queueLength);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
    (__VLS_ctx.selectedItem.busy ? 'Encaissement' : __VLS_ctx.selectedItem.open ? 'Disponible' : 'Hors service');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
    (__VLS_ctx.selectedItem.payments.join(', '));
    if (!__VLS_ctx.selectedItem.open) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.selectedItem?.type === 'shelf'))
                        return;
                    if (!!(__VLS_ctx.selectedItem?.type === 'storage'))
                        return;
                    if (!(__VLS_ctx.selectedItem?.type === 'checkout'))
                        return;
                    if (!(!__VLS_ctx.selectedItem.open))
                        return;
                    __VLS_ctx.$emit('open-management', 'employees');
                } },
            ...{ class: "panel-action" },
        });
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "panel-help" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.shelves))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.selectedItem?.type === 'shelf'))
                        return;
                    if (!!(__VLS_ctx.selectedItem?.type === 'storage'))
                        return;
                    if (!!(__VLS_ctx.selectedItem?.type === 'checkout'))
                        return;
                    __VLS_ctx.$emit('select', item.id);
                } },
            key: (item.id),
            ...{ class: "selection-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.buildingName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.stock);
        (item.capacity);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.storages))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.selectedItem?.type === 'shelf'))
                        return;
                    if (!!(__VLS_ctx.selectedItem?.type === 'storage'))
                        return;
                    if (!!(__VLS_ctx.selectedItem?.type === 'checkout'))
                        return;
                    __VLS_ctx.$emit('select', item.id);
                } },
            key: (item.id),
            ...{ class: "selection-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.buildingName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.used);
        (item.capacity);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.checkouts))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.selectedItem?.type === 'shelf'))
                        return;
                    if (!!(__VLS_ctx.selectedItem?.type === 'storage'))
                        return;
                    if (!!(__VLS_ctx.selectedItem?.type === 'checkout'))
                        return;
                    __VLS_ctx.$emit('select', item.id);
                } },
            key: (item.id),
            ...{ class: "selection-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.buildingName);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.open ? item.queueLength : 'Fermée');
    }
}
/** @type {__VLS_StyleScopedClasses['selection-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['close-button']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-type']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-help']} */ ;
/** @type {__VLS_StyleScopedClasses['equipment-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-action']} */ ;
/** @type {__VLS_StyleScopedClasses['equipment-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['equipment-column']} */ ;
/** @type {__VLS_StyleScopedClasses['equipment-slot']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['slot-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['slot-product']} */ ;
/** @type {__VLS_StyleScopedClasses['slot-action']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-type']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-help']} */ ;
/** @type {__VLS_StyleScopedClasses['stock-meter']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-list']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-action']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-type']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-help']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-list']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-action']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-help']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-row']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-row']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-row']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            storageLabel: storageLabel,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
