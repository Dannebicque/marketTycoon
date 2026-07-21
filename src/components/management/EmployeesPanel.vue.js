/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
const props = defineProps();
const __VLS_emit = defineEmits();
function role(key) { return props.roles.find(item => item.key === key); }
function money(value) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0); }
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['employee-main']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-main']} */ ;
/** @type {__VLS_StyleScopedClasses['candidate-card']} */ ;
/** @type {__VLS_StyleScopedClasses['quality-meter']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-task']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-task']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-task']} */ ;
/** @type {__VLS_StyleScopedClasses['working']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-card']} */ ;
/** @type {__VLS_StyleScopedClasses['employees-layout']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "management-content employees-layout" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-heading" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.money(__VLS_ctx.payroll));
if (!__VLS_ctx.employees.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
}
for (const [employee] of __VLS_getVForSourceType((__VLS_ctx.employees))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (employee.id),
        ...{ class: "employee-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "employee-main" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "employee-icon" },
    });
    (__VLS_ctx.role(employee.roleKey)?.icon);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (employee.firstName);
    (employee.lastName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (__VLS_ctx.role(employee.roleKey)?.name);
    (employee.quality);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "quality-meter" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
        ...{ style: ({ width: `${employee.quality}%` }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "employee-task" },
        ...{ class: ({ working: employee.status === 'working' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (employee.status === 'working' ? 'En tâche' : 'Statut');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (employee.currentTask?.label ?? (employee.assignedBuildingId ? 'Affecté' : 'Disponible'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "employee-meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.money(employee.dailySalary));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (employee.completedTasks ?? 0);
    if (employee.roleKey === 'cashier') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            ...{ onChange: (...[$event]) => {
                    if (!(employee.roleKey === 'cashier'))
                        return;
                    __VLS_ctx.$emit('assign', employee.id, $event.target.value || undefined);
                } },
            value: (employee.assignedBuildingId ?? ''),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            value: "",
        });
        for (const [checkout] of __VLS_getVForSourceType((__VLS_ctx.checkouts))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: (checkout.id),
                value: (checkout.id),
            });
            (checkout.buildingName);
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.$emit('dismiss', employee.id);
            } },
        ...{ class: "danger-action" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-heading" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('refresh-candidates');
        } },
    ...{ class: "secondary-action" },
});
for (const [candidate] of __VLS_getVForSourceType((__VLS_ctx.candidates))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (candidate.id),
        ...{ class: "candidate-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "employee-main" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "employee-icon" },
    });
    (__VLS_ctx.role(candidate.roleKey)?.icon);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (candidate.firstName);
    (candidate.lastName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    (__VLS_ctx.role(candidate.roleKey)?.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.role(candidate.roleKey)?.description);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "employee-meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (candidate.quality);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.money(candidate.dailySalary));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.$emit('hire', candidate.id);
            } },
        ...{ class: "panel-action" },
    });
}
/** @type {__VLS_StyleScopedClasses['management-content']} */ ;
/** @type {__VLS_StyleScopedClasses['employees-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-card']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-main']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['quality-meter']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-task']} */ ;
/** @type {__VLS_StyleScopedClasses['working']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['danger-action']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-action']} */ ;
/** @type {__VLS_StyleScopedClasses['candidate-card']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-main']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['employee-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-action']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            role: role,
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
