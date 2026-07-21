/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, ref } from 'vue';
const props = defineProps();
const emit = defineEmits();
const bulkMarkup = ref(35);
const averageMargin = computed(() => props.lines.length ? props.lines.reduce((sum, line) => sum + line.markupRate, 0) / props.lines.length : 0);
function changePrice(productKey, event) {
    emit('update-price', productKey, Number(event.target.value));
}
function applyBulk() { emit('apply-markup', Number(bulkMarkup.value) / 100); }
function money(value) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0); }
function percent(value) { return new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 }).format(value || 0); }
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['pricing-header']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['bulk-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['bulk-pricing']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-table']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-table']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-table']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-table']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-table']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-table']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-table']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-table']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-table']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-table']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-status']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-status']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-status']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "management-content pricing-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "pricing-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pricing-summary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({
    ...{ class: (__VLS_ctx.averageMargin >= 0 ? 'positive-text' : 'negative-text') },
});
(__VLS_ctx.percent(__VLS_ctx.averageMargin));
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "bulk-pricing" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "field-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bulk-controls" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "number",
    min: "-99",
    step: "1",
});
(__VLS_ctx.bulkMarkup);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.applyBulk) },
    ...{ class: "secondary-action" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pricing-table-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
    ...{ class: "pricing-table" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
for (const [line] of __VLS_getVForSourceType((__VLS_ctx.lines))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
        key: (line.productKey),
        ...{ class: ({ loss: line.isLossLeader }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (line.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (line.category);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (__VLS_ctx.money(line.purchasePrice));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (__VLS_ctx.money(line.recommendedPrice));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.changePrice(line.productKey, $event);
            } },
        value: (line.salePrice),
        type: "number",
        min: "0.01",
        step: "0.01",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: (line.unitMargin >= 0 ? 'positive-text' : 'negative-text') },
    });
    (__VLS_ctx.money(line.unitMargin));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (__VLS_ctx.percent(line.markupRate));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (__VLS_ctx.percent(line.marginRate));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "pricing-status" },
        ...{ class: (line.isLossLeader ? 'danger' : line.markupRate < .1 ? 'warning' : 'success') },
    });
    (line.isLossLeader ? 'Vente à perte' : line.markupRate < .1 ? 'Marge faible' : 'Rentable');
}
/** @type {__VLS_StyleScopedClasses['management-content']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-header']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['bulk-pricing']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['bulk-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-action']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-table-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-table']} */ ;
/** @type {__VLS_StyleScopedClasses['loss']} */ ;
/** @type {__VLS_StyleScopedClasses['pricing-status']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            bulkMarkup: bulkMarkup,
            averageMargin: averageMargin,
            changePrice: changePrice,
            applyBulk: applyBulk,
            money: money,
            percent: percent,
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
