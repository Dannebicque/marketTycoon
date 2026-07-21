/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, ref } from 'vue';
const props = defineProps();
const scope = ref('day');
const summary = computed(() => scope.value === 'day' ? props.daySummary : props.allSummary);
const visibleProducts = computed(() => scope.value === 'day' ? props.dayProducts : props.allProducts);
function diagnostic(line) {
    if (line.observations < 3)
        return { label: 'Données insuffisantes', level: 'neutral' };
    if (line.averagePriceRatio > 1.1 && line.quantityConversionRate < .65)
        return { label: 'Prix probablement trop élevé', level: 'danger' };
    if (line.averagePriceRatio < .9 && line.quantityConversionRate > .85)
        return { label: 'Marge potentiellement améliorable', level: 'warning' };
    if (line.quantityConversionRate < .5)
        return { label: 'Forte perte de demande', level: 'danger' };
    return { label: 'Tarif équilibré', level: 'success' };
}
function decisionLabel(value) { return value === 'accept' ? 'Achat accepté' : value === 'reduce' ? 'Quantité réduite' : 'Produit refusé'; }
function money(value) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0); }
function percent(value) { return new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1, signDisplay: value ? 'auto' : 'never' }).format(value || 0); }
function signed(value) { return `${value > 0 ? '+' : ''}${value.toFixed(1)} pts`; }
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['analytics-header']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-header']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-header']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-kpis']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-kpis']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-kpis']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-help']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-table']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-table']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-table']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-table']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-table']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-table']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-table']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-table']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostic']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostic']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostic']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostic']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-decisions']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-decisions']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-decisions']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-decisions']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-decisions']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-kpis']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-decisions']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "management-content customer-analytics" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "analytics-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.scope),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "day",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "all",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "analytics-kpis" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.summary.observations);
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.percent(__VLS_ctx.summary.conversionRate));
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.summary.rejectedQuantity);
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({
    ...{ class: "negative-text" },
});
(__VLS_ctx.money(__VLS_ctx.summary.estimatedLostRevenue));
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({
    ...{ class: (__VLS_ctx.summary.averageSatisfactionDelta >= 0 ? 'positive-text' : 'negative-text') },
});
(__VLS_ctx.signed(__VLS_ctx.summary.averageSatisfactionDelta));
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "analytics-help" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "analytics-table-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
    ...{ class: "analytics-table" },
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
for (const [line] of __VLS_getVForSourceType((__VLS_ctx.visibleProducts))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
        key: (line.productKey),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (line.productName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (line.observations);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (__VLS_ctx.money(line.averageSalePrice));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (__VLS_ctx.money(line.averageMarketPrice));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: (line.averagePriceRatio > 1.1 ? 'negative-text' : line.averagePriceRatio < .9 ? 'positive-text' : '') },
    });
    (__VLS_ctx.percent(line.averagePriceRatio - 1));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (line.requestedQuantity);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (line.acceptedQuantity);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (__VLS_ctx.percent(line.quantityConversionRate));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (line.rejectedDecisions);
    (line.reducedDecisions);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "negative-text" },
    });
    (__VLS_ctx.money(line.estimatedLostRevenue));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "diagnostic" },
        ...{ class: (__VLS_ctx.diagnostic(line).level) },
    });
    (__VLS_ctx.diagnostic(line).label);
}
if (!__VLS_ctx.visibleProducts.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        colspan: "10",
        ...{ class: "empty-state" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "recent-decisions" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.recent))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (item.id),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (item.productName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (item.day);
    (item.customerId);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.decisionLabel(item.decision));
    (item.acceptedQuantity);
    (item.requestedQuantity);
    (__VLS_ctx.percent(item.priceRatio - 1));
}
if (!__VLS_ctx.recent.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
}
/** @type {__VLS_StyleScopedClasses['management-content']} */ ;
/** @type {__VLS_StyleScopedClasses['customer-analytics']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-header']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-kpis']} */ ;
/** @type {__VLS_StyleScopedClasses['negative-text']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-help']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-table-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['analytics-table']} */ ;
/** @type {__VLS_StyleScopedClasses['negative-text']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostic']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['recent-decisions']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            scope: scope,
            summary: summary,
            visibleProducts: visibleProducts,
            diagnostic: diagnostic,
            decisionLabel: decisionLabel,
            money: money,
            percent: percent,
            signed: signed,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
