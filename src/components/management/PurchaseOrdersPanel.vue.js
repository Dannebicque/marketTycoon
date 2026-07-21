/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { toRef } from 'vue';
import { usePurchaseOrderCart } from '../../composables/usePurchaseOrderCart';
const props = defineProps();
const emit = defineEmits();
const storageTypes = ['ambient', 'cold', 'frozen'];
const cart = usePurchaseOrderCart({ suppliers: toRef(props, 'suppliers'), products: toRef(props, 'products'), storageCapacities: toRef(props, 'storageCapacities'), cash: toRef(props, 'cash') });
function onQuantityChange(productKey, event) {
    cart.updateQuantity(productKey, Number(event.target.value));
}
function submitOrder() {
    if (cart.validationErrors.value.length || !cart.supplier.value)
        return;
    emit('submit', cart.supplier.value.key, cart.lines.value.map(line => ({ ...line })));
    cart.clear();
}
function supplierName(key) { return props.suppliers.find(item => item.key === key)?.name ?? key; }
function productName(key) { return props.products.find(item => item.key === key)?.name ?? key; }
function orderStatusLabel(status) { return status === 'ordered' ? 'En attente' : status === 'delivered' ? 'Livrée' : status === 'partially-delivered' ? 'Partielle' : 'Annulée'; }
function storageLabel(type) { return type === 'ambient' ? 'Ambiante' : type === 'cold' ? 'Froide' : 'Surgelée'; }
function money(value) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0); }
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "management-content orders-layout" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "order-form-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "field-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.cart.supplierKey.value),
});
for (const [supplier] of __VLS_getVForSourceType((__VLS_ctx.suppliers))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (supplier.key),
        value: (supplier.key),
    });
    (supplier.name);
}
if (__VLS_ctx.cart.supplier.value) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "supplier-info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.cart.supplier.value.leadTimeDays);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.money(__VLS_ctx.cart.supplier.value.minimumOrderAmount));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.money(__VLS_ctx.cart.supplier.value.deliveryFee));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "order-add-line" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "field-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.cart.selectedProductKey.value),
});
for (const [product] of __VLS_getVForSourceType((__VLS_ctx.cart.availableProducts.value))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (product.key),
        value: (product.key),
    });
    (product.name);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "field-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "number",
    min: "1",
    step: "1",
});
(__VLS_ctx.cart.selectedQuantity.value);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.cart.addLine) },
    ...{ class: "panel-action" },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
if (!__VLS_ctx.cart.detailedLines.value.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
}
for (const [line] of __VLS_getVForSourceType((__VLS_ctx.cart.detailedLines.value))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (line.productKey),
        ...{ class: "cart-line" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "cart-product" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (line.product.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (__VLS_ctx.money(line.unitPrice));
    (__VLS_ctx.storageLabel(line.storageType));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.onQuantityChange(line.productKey, $event);
            } },
        value: (line.quantity),
        type: "number",
        min: "1",
        step: "1",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.money(line.lineTotal));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.cart.removeLine(line.productKey);
            } },
        ...{ class: "cart-remove" },
        type: "button",
        title: "Supprimer",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "order-preview" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.money(__VLS_ctx.cart.merchandiseTotal.value));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.money(__VLS_ctx.cart.lines.value.length ? __VLS_ctx.cart.supplier.value?.deliveryFee ?? 0 : 0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "total" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.money(__VLS_ctx.cart.orderTotal.value));
for (const [type] of __VLS_getVForSourceType((__VLS_ctx.storageTypes))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (type),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.storageLabel(type));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.cart.requiredByStorage.value[type]);
}
for (const [error] of __VLS_getVForSourceType((__VLS_ctx.cart.validationErrors.value))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (error),
        ...{ class: "form-error" },
    });
    (error);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "cart-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.cart.clear) },
    type: "button",
    ...{ class: "secondary-action" },
    disabled: (!__VLS_ctx.cart.lines.value.length),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.submitOrder) },
    type: "button",
    ...{ class: "panel-action" },
    disabled: (__VLS_ctx.cart.validationErrors.value.length > 0),
});
if (__VLS_ctx.message) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: (__VLS_ctx.messageType === 'success' ? 'form-success' : 'form-error') },
    });
    (__VLS_ctx.message);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
if (!__VLS_ctx.orders.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
}
for (const [order] of __VLS_getVForSourceType((__VLS_ctx.orders))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (order.id),
        ...{ class: "order-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (order.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.orderStatusLabel(order.status));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (__VLS_ctx.supplierName(order.supplierKey));
    (order.expectedDay);
    (__VLS_ctx.money(order.orderedTotal));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
        ...{ class: "order-lines" },
    });
    for (const [line] of __VLS_getVForSourceType((order.lines))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (line.productKey),
        });
        (__VLS_ctx.productName(line.productKey));
        (line.quantity);
    }
    if (order.rejectedLines.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        (order.rejectedLines.reduce((sum, line) => sum + line.quantity, 0));
    }
}
/** @type {__VLS_StyleScopedClasses['management-content']} */ ;
/** @type {__VLS_StyleScopedClasses['orders-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['order-form-card']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['supplier-info']} */ ;
/** @type {__VLS_StyleScopedClasses['order-add-line']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-action']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-line']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-product']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-remove']} */ ;
/** @type {__VLS_StyleScopedClasses['order-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['total']} */ ;
/** @type {__VLS_StyleScopedClasses['form-error']} */ ;
/** @type {__VLS_StyleScopedClasses['cart-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-action']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-action']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['order-card']} */ ;
/** @type {__VLS_StyleScopedClasses['order-lines']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            storageTypes: storageTypes,
            cart: cart,
            onQuantityChange: onQuantityChange,
            submitOrder: submitOrder,
            supplierName: supplierName,
            productName: productName,
            orderStatusLabel: orderStatusLabel,
            storageLabel: storageLabel,
            money: money,
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
