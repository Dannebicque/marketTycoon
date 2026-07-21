import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CustomerAnalyticsPanel from './CustomerAnalyticsPanel.vue';
import EmployeesPanel from './EmployeesPanel.vue';
import PricingPanel from './PricingPanel.vue';
import PurchaseOrdersPanel from './PurchaseOrdersPanel.vue';
import SettingsPanel from './SettingsPanel.vue';
debugger; /* PartiallyEnd: #3632/both.vue */
export default await (async () => {
    const props = defineProps();
    const __VLS_emit = defineEmits();
    const { t, locale } = useI18n({ useScope: 'global' });
    const tabs = computed(() => {
        void locale.value;
        return [
            { key: 'dashboard', label: t('management.tabs.dashboard') },
            { key: 'finances', label: t('management.tabs.finances') },
            { key: 'reserve', label: t('management.tabs.reserve') },
            { key: 'customers', label: t('management.tabs.customers') },
            { key: 'pricing', label: t('management.tabs.pricing') },
            { key: 'employees', label: t('management.tabs.employees') },
            { key: 'orders', label: t('management.tabs.orders') },
            { key: 'settings', label: t('management.tabs.settings') },
        ];
    });
    function supplierName(key) { return props.suppliers.find(item => item.key === key)?.name ?? key; }
    function storageLabel(type) { return type === 'ambient' ? 'Ambiante' : type === 'cold' ? 'Froide' : 'Surgelée'; }
    function money(value) { return new Intl.NumberFormat(locale.value === 'en' ? 'en-US' : 'fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value || 0); }
    debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    /** @type {__VLS_StyleScopedClasses['save-actions']} */ ;
    /** @type {__VLS_StyleScopedClasses['save-actions']} */ ;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.$emit('close');
            } },
        ...{ class: "management-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "management-window" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
        ...{ class: "management-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "eyebrow" },
    });
    (__VLS_ctx.t('management.eyebrow'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    (__VLS_ctx.t('management.title'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.$emit('close');
            } },
        ...{ class: "close-button" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
        ...{ class: "management-nav" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.tabs))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.$emit('update:tab', item.key);
                } },
            key: (item.key),
            ...{ class: ({ active: __VLS_ctx.tab === item.key }) },
        });
        (item.label);
    }
    if (__VLS_ctx.tab === 'dashboard') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "management-content" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "kpi-grid" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.money(__VLS_ctx.ui.cash));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.money(__VLS_ctx.ui.dayRevenue));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({
            ...{ class: (__VLS_ctx.ui.dayProfit >= 0 ? 'positive-text' : 'negative-text') },
        });
        (__VLS_ctx.money(__VLS_ctx.ui.dayProfit));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.ui.customers);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.ui.shelfStock);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.money(__VLS_ctx.payroll));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "save-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.tab === 'dashboard'))
                        return;
                    __VLS_ctx.$emit('save-game');
                } },
            ...{ class: "panel-action" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.tab === 'dashboard'))
                        return;
                    __VLS_ctx.$emit('load-game');
                } },
            ...{ class: "secondary-action" },
            disabled: (!__VLS_ctx.hasSave),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.tab === 'dashboard'))
                        return;
                    __VLS_ctx.$emit('delete-save');
                } },
            ...{ class: "danger-action" },
            disabled: (!__VLS_ctx.hasSave),
        });
        if (__VLS_ctx.saveMessage) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "form-success" },
            });
            (__VLS_ctx.saveMessage);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        if (!__VLS_ctx.alerts.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "success-state" },
            });
        }
        for (const [alert] of __VLS_getVForSourceType((__VLS_ctx.alerts))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (alert),
                ...{ class: "alert-card" },
            });
            (alert);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        if (!__VLS_ctx.pendingOrders.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "empty-state" },
            });
        }
        for (const [order] of __VLS_getVForSourceType((__VLS_ctx.pendingOrders))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                key: (order.id),
                ...{ class: "order-card" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (order.id);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (order.expectedDay);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.supplierName(order.supplierKey));
            (__VLS_ctx.money(order.orderedTotal));
        }
    }
    else if (__VLS_ctx.tab === 'finances') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "management-content" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "finance-summary" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.money(__VLS_ctx.ui.dayRevenue));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.money(__VLS_ctx.ui.dayExpenses));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.money(__VLS_ctx.ui.dayProfit));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dl, __VLS_intrinsicElements.dl)({
            ...{ class: "finance-list" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
        (__VLS_ctx.money(__VLS_ctx.ui.dayConstructionCost));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
        (__VLS_ctx.money(__VLS_ctx.ui.dayMerchandiseCost));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
        (__VLS_ctx.money(__VLS_ctx.ui.dayOperatingCost));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
        (__VLS_ctx.money(__VLS_ctx.payroll));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "total" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dt, __VLS_intrinsicElements.dt)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.dd, __VLS_intrinsicElements.dd)({});
        (__VLS_ctx.money(__VLS_ctx.ui.dayExpenses));
    }
    else if (__VLS_ctx.tab === 'reserve') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "management-content" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "capacity-grid" },
        });
        for (const [capacity] of __VLS_getVForSourceType((__VLS_ctx.storageCapacities))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                key: (capacity.type),
                ...{ class: "capacity-card" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.storageLabel(capacity.type));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (capacity.used);
            (capacity.capacity);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "stock-meter" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
                ...{ style: ({ width: `${capacity.ratio * 100}%` }) },
            });
            if (capacity.capacity === 0) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        if (!__VLS_ctx.reserveLines.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "empty-state" },
            });
        }
        for (const [line] of __VLS_getVForSourceType((__VLS_ctx.reserveLines))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (line.productKey),
                ...{ class: "reserve-line" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (line.productName);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (line.quantity);
        }
    }
    else if (__VLS_ctx.tab === 'customers') {
        /** @type {[typeof CustomerAnalyticsPanel, ]} */ ;
        // @ts-ignore
        const __VLS_0 = __VLS_asFunctionalComponent(CustomerAnalyticsPanel, new CustomerAnalyticsPanel({
            ...(__VLS_ctx.customerAnalytics),
        }));
        const __VLS_1 = __VLS_0({
            ...(__VLS_ctx.customerAnalytics),
        }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    }
    else if (__VLS_ctx.tab === 'pricing') {
        /** @type {[typeof PricingPanel, ]} */ ;
        // @ts-ignore
        const __VLS_3 = __VLS_asFunctionalComponent(PricingPanel, new PricingPanel({
            ...{ 'onUpdatePrice': {} },
            ...{ 'onApplyMarkup': {} },
            lines: (__VLS_ctx.pricingLines),
        }));
        const __VLS_4 = __VLS_3({
            ...{ 'onUpdatePrice': {} },
            ...{ 'onApplyMarkup': {} },
            lines: (__VLS_ctx.pricingLines),
        }, ...__VLS_functionalComponentArgsRest(__VLS_3));
        let __VLS_6;
        let __VLS_7;
        let __VLS_8;
        const __VLS_9 = {
            onUpdatePrice: ((productKey, salePrice) => __VLS_ctx.$emit('update-price', productKey, salePrice))
        };
        const __VLS_10 = {
            onApplyMarkup: (...[$event]) => {
                if (!!(__VLS_ctx.tab === 'dashboard'))
                    return;
                if (!!(__VLS_ctx.tab === 'finances'))
                    return;
                if (!!(__VLS_ctx.tab === 'reserve'))
                    return;
                if (!!(__VLS_ctx.tab === 'customers'))
                    return;
                if (!(__VLS_ctx.tab === 'pricing'))
                    return;
                __VLS_ctx.$emit('apply-markup', $event);
            }
        };
        var __VLS_5;
    }
    else if (__VLS_ctx.tab === 'employees') {
        /** @type {[typeof EmployeesPanel, ]} */ ;
        // @ts-ignore
        const __VLS_11 = __VLS_asFunctionalComponent(EmployeesPanel, new EmployeesPanel({
            ...{ 'onHire': {} },
            ...{ 'onDismiss': {} },
            ...{ 'onAssign': {} },
            ...{ 'onRefreshCandidates': {} },
            employees: (__VLS_ctx.employees),
            candidates: (__VLS_ctx.candidates),
            roles: (__VLS_ctx.employeeRoles),
            checkouts: (__VLS_ctx.checkouts),
            payroll: (__VLS_ctx.payroll),
        }));
        const __VLS_12 = __VLS_11({
            ...{ 'onHire': {} },
            ...{ 'onDismiss': {} },
            ...{ 'onAssign': {} },
            ...{ 'onRefreshCandidates': {} },
            employees: (__VLS_ctx.employees),
            candidates: (__VLS_ctx.candidates),
            roles: (__VLS_ctx.employeeRoles),
            checkouts: (__VLS_ctx.checkouts),
            payroll: (__VLS_ctx.payroll),
        }, ...__VLS_functionalComponentArgsRest(__VLS_11));
        let __VLS_14;
        let __VLS_15;
        let __VLS_16;
        const __VLS_17 = {
            onHire: (...[$event]) => {
                if (!!(__VLS_ctx.tab === 'dashboard'))
                    return;
                if (!!(__VLS_ctx.tab === 'finances'))
                    return;
                if (!!(__VLS_ctx.tab === 'reserve'))
                    return;
                if (!!(__VLS_ctx.tab === 'customers'))
                    return;
                if (!!(__VLS_ctx.tab === 'pricing'))
                    return;
                if (!(__VLS_ctx.tab === 'employees'))
                    return;
                __VLS_ctx.$emit('hire', $event);
            }
        };
        const __VLS_18 = {
            onDismiss: (...[$event]) => {
                if (!!(__VLS_ctx.tab === 'dashboard'))
                    return;
                if (!!(__VLS_ctx.tab === 'finances'))
                    return;
                if (!!(__VLS_ctx.tab === 'reserve'))
                    return;
                if (!!(__VLS_ctx.tab === 'customers'))
                    return;
                if (!!(__VLS_ctx.tab === 'pricing'))
                    return;
                if (!(__VLS_ctx.tab === 'employees'))
                    return;
                __VLS_ctx.$emit('dismiss', $event);
            }
        };
        const __VLS_19 = {
            onAssign: ((employeeId, buildingId) => __VLS_ctx.$emit('assign', employeeId, buildingId))
        };
        const __VLS_20 = {
            onRefreshCandidates: (...[$event]) => {
                if (!!(__VLS_ctx.tab === 'dashboard'))
                    return;
                if (!!(__VLS_ctx.tab === 'finances'))
                    return;
                if (!!(__VLS_ctx.tab === 'reserve'))
                    return;
                if (!!(__VLS_ctx.tab === 'customers'))
                    return;
                if (!!(__VLS_ctx.tab === 'pricing'))
                    return;
                if (!(__VLS_ctx.tab === 'employees'))
                    return;
                __VLS_ctx.$emit('refresh-candidates');
            }
        };
        var __VLS_13;
    }
    else if (__VLS_ctx.tab === 'orders') {
        /** @type {[typeof PurchaseOrdersPanel, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(PurchaseOrdersPanel, new PurchaseOrdersPanel({
            ...{ 'onSubmit': {} },
            suppliers: (__VLS_ctx.suppliers),
            products: (__VLS_ctx.products),
            storageCapacities: (__VLS_ctx.storageCapacities),
            cash: (__VLS_ctx.ui.cash),
            orders: (__VLS_ctx.orders),
            message: (__VLS_ctx.orderMessage),
            messageType: (__VLS_ctx.orderMessageType),
        }));
        const __VLS_22 = __VLS_21({
            ...{ 'onSubmit': {} },
            suppliers: (__VLS_ctx.suppliers),
            products: (__VLS_ctx.products),
            storageCapacities: (__VLS_ctx.storageCapacities),
            cash: (__VLS_ctx.ui.cash),
            orders: (__VLS_ctx.orders),
            message: (__VLS_ctx.orderMessage),
            messageType: (__VLS_ctx.orderMessageType),
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        let __VLS_24;
        let __VLS_25;
        let __VLS_26;
        const __VLS_27 = {
            onSubmit: ((supplierKey, lines) => __VLS_ctx.$emit('submit-order', supplierKey, lines))
        };
        var __VLS_23;
    }
    else if (__VLS_ctx.tab === 'settings') {
        /** @type {[typeof SettingsPanel, ]} */ ;
        // @ts-ignore
        const __VLS_28 = __VLS_asFunctionalComponent(SettingsPanel, new SettingsPanel({}));
        const __VLS_29 = __VLS_28({}, ...__VLS_functionalComponentArgsRest(__VLS_28));
    }
    /** @type {__VLS_StyleScopedClasses['management-overlay']} */ ;
    /** @type {__VLS_StyleScopedClasses['management-window']} */ ;
    /** @type {__VLS_StyleScopedClasses['management-header']} */ ;
    /** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
    /** @type {__VLS_StyleScopedClasses['close-button']} */ ;
    /** @type {__VLS_StyleScopedClasses['management-nav']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['management-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['kpi-grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['save-actions']} */ ;
    /** @type {__VLS_StyleScopedClasses['panel-action']} */ ;
    /** @type {__VLS_StyleScopedClasses['secondary-action']} */ ;
    /** @type {__VLS_StyleScopedClasses['danger-action']} */ ;
    /** @type {__VLS_StyleScopedClasses['form-success']} */ ;
    /** @type {__VLS_StyleScopedClasses['success-state']} */ ;
    /** @type {__VLS_StyleScopedClasses['alert-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    /** @type {__VLS_StyleScopedClasses['order-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['management-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['finance-summary']} */ ;
    /** @type {__VLS_StyleScopedClasses['finance-list']} */ ;
    /** @type {__VLS_StyleScopedClasses['total']} */ ;
    /** @type {__VLS_StyleScopedClasses['management-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['capacity-grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['capacity-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['stock-meter']} */ ;
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    /** @type {__VLS_StyleScopedClasses['reserve-line']} */ ;
    var __VLS_dollars;
    const __VLS_self = (await import('vue')).defineComponent({
        setup() {
            return {
                CustomerAnalyticsPanel: CustomerAnalyticsPanel,
                EmployeesPanel: EmployeesPanel,
                PricingPanel: PricingPanel,
                PurchaseOrdersPanel: PurchaseOrdersPanel,
                SettingsPanel: SettingsPanel,
                t: t,
                tabs: tabs,
                supplierName: supplierName,
                storageLabel: storageLabel,
                money: money,
            };
        },
        __typeEmits: {},
        __typeProps: {},
    });
    return (await import('vue')).defineComponent({
        setup() {
            return {};
        },
        __typeEmits: {},
        __typeProps: {},
    });
})(); /* PartiallyEnd: #4569/main.vue */
