/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/action/common/actionCommonCategories", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/performance/browser/perfviewEditor", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/instantiationService", "vs/base/common/event", "vs/workbench/contrib/performance/browser/inputLatencyContrib"], function (require, exports, nls_1, actions_1, instantiation_1, platform_1, actionCommonCategories_1, contributions_1, editor_1, perfviewEditor_1, editorService_1, instantiationService_1, event_1, inputLatencyContrib_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // -- startup performance view
    (0, contributions_1.registerWorkbenchContribution2)(perfviewEditor_1.PerfviewContrib.ID, perfviewEditor_1.PerfviewContrib, { lazy: true });
    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer(perfviewEditor_1.PerfviewInput.Id, class {
        canSerialize() {
            return true;
        }
        serialize() {
            return '';
        }
        deserialize(instantiationService) {
            return instantiationService.createInstance(perfviewEditor_1.PerfviewInput);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'perfview.show',
                title: (0, nls_1.localize2)('show.label', 'Startup Performance'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const contrib = perfviewEditor_1.PerfviewContrib.get();
            return editorService.openEditor(contrib.getEditorInput(), { pinned: true });
        }
    });
    (0, actions_1.registerAction2)(class PrintServiceCycles extends actions_1.Action2 {
        constructor() {
            super({
                id: 'perf.insta.printAsyncCycles',
                title: (0, nls_1.localize2)('cycles', 'Print Service Cycles'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            if (instaService instanceof instantiationService_1.InstantiationService) {
                const cycle = instaService._globalGraph?.findCycleSlow();
                if (cycle) {
                    console.warn(`CYCLE`, cycle);
                }
                else {
                    console.warn(`YEAH, no more cycles`);
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class PrintServiceTraces extends actions_1.Action2 {
        constructor() {
            super({
                id: 'perf.insta.printTraces',
                title: (0, nls_1.localize2)('insta.trace', 'Print Service Traces'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run() {
            if (instantiationService_1.Trace.all.size === 0) {
                console.log('Enable via `instantiationService.ts#_enableAllTracing`');
                return;
            }
            for (const item of instantiationService_1.Trace.all) {
                console.log(item);
            }
        }
    });
    (0, actions_1.registerAction2)(class PrintEventProfiling extends actions_1.Action2 {
        constructor() {
            super({
                id: 'perf.event.profiling',
                title: (0, nls_1.localize2)('emitter', 'Print Emitter Profiles'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run() {
            if (event_1.EventProfiling.all.size === 0) {
                console.log('USE `EmitterOptions._profName` to enable profiling');
                return;
            }
            for (const item of event_1.EventProfiling.all) {
                console.log(`${item.name}: ${item.invocationCount} invocations COST ${item.elapsedOverall}ms, ${item.listenerCount} listeners, avg cost is ${item.durations.reduce((a, b) => a + b, 0) / item.durations.length}ms`);
            }
        }
    });
    // -- input latency
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(inputLatencyContrib_1.InputLatencyContrib, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyZm9ybWFuY2UuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wZXJmb3JtYW5jZS9icm93c2VyL3BlcmZvcm1hbmNlLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWdCaEcsOEJBQThCO0lBRTlCLElBQUEsOENBQThCLEVBQzdCLGdDQUFlLENBQUMsRUFBRSxFQUNsQixnQ0FBZSxFQUNmLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUNkLENBQUM7SUFFRixtQkFBUSxDQUFDLEVBQUUsQ0FBeUIseUJBQWdCLENBQUMsYUFBYSxDQUFDLENBQUMsd0JBQXdCLENBQzNGLDhCQUFhLENBQUMsRUFBRSxFQUNoQjtRQUNDLFlBQVk7WUFDWCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDRCxTQUFTO1lBQ1IsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBQ0QsV0FBVyxDQUFDLG9CQUEyQztZQUN0RCxPQUFPLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyw4QkFBYSxDQUFDLENBQUM7UUFDM0QsQ0FBQztLQUNELENBQ0QsQ0FBQztJQUdGLElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87UUFFcEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGVBQWU7Z0JBQ25CLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxZQUFZLEVBQUUscUJBQXFCLENBQUM7Z0JBQ3JELFFBQVEsRUFBRSxtQ0FBVSxDQUFDLFNBQVM7Z0JBQzlCLEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUEwQjtZQUM3QixNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENB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