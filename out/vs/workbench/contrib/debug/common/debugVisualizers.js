/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/types", "vs/platform/contextkey/common/contextkey", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugContext", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry"], function (require, exports, lifecycle_1, types_1, contextkey_1, extensions_1, instantiation_1, log_1, debug_1, debugContext_1, debugModel_1, extensions_2, extensionsRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugVisualizerService = exports.DebugVisualizer = exports.IDebugVisualizerService = void 0;
    exports.IDebugVisualizerService = (0, instantiation_1.createDecorator)('debugVisualizerService');
    class DebugVisualizer {
        get name() {
            return this.viz.name;
        }
        get iconPath() {
            return this.viz.iconPath;
        }
        get iconClass() {
            return this.viz.iconClass;
        }
        constructor(handle, viz) {
            this.handle = handle;
            this.viz = viz;
        }
        async resolve(token) {
            return this.viz.visualization ??= await this.handle.resolveDebugVisualizer(this.viz, token);
        }
        async execute() {
            await this.handle.executeDebugVisualizerCommand(this.viz.id);
        }
    }
    exports.DebugVisualizer = DebugVisualizer;
    const emptyRef = { object: [], dispose: () => { } };
    let DebugVisualizerService = class DebugVisualizerService {
        constructor(contextKeyService, extensionService, logService) {
            this.contextKeyService = contextKeyService;
            this.extensionService = extensionService;
            this.logService = logService;
            this.handles = new Map();
            this.trees = new Map();
            this.didActivate = new Map();
            this.registrations = [];
            visualizersExtensionPoint.setHandler((_, { added, removed }) => {
                this.registrations = this.registrations.filter(r => !removed.some(e => extensions_1.ExtensionIdentifier.equals(e.description.identifier, r.extensionId)));
                added.forEach(e => this.processExtensionRegistration(e.description));
            });
        }
        /** @inheritdoc */
        async getApplicableFor(variable, token) {
            if (!(variable instanceof debugModel_1.Variable)) {
                return emptyRef;
            }
            const threadId = variable.getThreadId();
            if (threadId === undefined) { // an expression, not a variable
                return emptyRef;
            }
            const context = this.getVariableContext(threadId, variable);
            const overlay = (0, debugContext_1.getContextForVariable)(this.contextKeyService, variable, [
                [debug_1.CONTEXT_VARIABLE_NAME.key, variable.name],
                [debug_1.CONTEXT_VARIABLE_VALUE.key, variable.value],
                [debug_1.CONTEXT_VARIABLE_TYPE.key, variable.type],
            ]);
            const maybeVisualizers = await Promise.all(this.registrations.map(async (registration) => {
                if (!overlay.contextMatchesRules(registration.expr)) {
                    return;
                }
                let prom = this.didActivate.get(registration.id);
                if (!prom) {
                    prom = this.extensionService.activateByEvent(`onDebugVisualizer:${registration.id}`);
                    this.didActivate.set(registration.id, prom);
                }
                await prom;
                if (token.isCancellationRequested) {
                    return;
                }
                const handle = this.handles.get(toKey(registration.extensionId, registration.id));
                return handle && { handle, result: await handle.provideDebugVisualizers(context, token) };
            }));
            const ref = {
                object: maybeVisualizers.filter(types_1.isDefined).flatMap(v => v.result.map(r => new DebugVisualizer(v.handle, r))),
                dispose: () => {
                    for (const viz of maybeVisualizers) {
                        viz?.handle.disposeDebugVisualizers(viz.result.map(r => r.id));
                    }
                },
            };
            if (token.isCancellationRequested) {
                ref.dispose();
            }
            return ref;
        }
        /** @inheritdoc */
        register(handle) {
            const key = toKey(handle.extensionId, handle.id);
            this.handles.set(key, handle);
            return (0, lifecycle_1.toDisposable)(() => this.handles.delete(key));
        }
        /** @inheritdoc */
        registerTree(treeId, handle) {
            this.trees.set(treeId, handle);
            return (0, lifecycle_1.toDisposable)(() => this.trees.delete(treeId));
        }
        /** @inheritdoc */
        async getVisualizedNodeFor(treeId, expr) {
            if (!(expr instanceof debugModel_1.Variable)) {
                return;
            }
            const threadId = expr.getThreadId();
            if (threadId === undefined) {
                return;
            }
            const tree = this.trees.get(treeId);
            if (!tree) {
                return;
            }
            try {
                const treeItem = await tree.getTreeItem(this.getVariableContext(threadId, expr));
                if (!treeItem) {
                    return;
                }
                return new debugModel_1.VisualizedExpression(this, treeId, treeItem, expr);
            }
            catch (e) {
                this.logService.warn('Failed to get visualized node', e);
                return;
            }
        }
        /** @inheritdoc */
        async getVisualizedChildren(treeId, treeElementId) {
            const children = await this.trees.get(treeId)?.getChildren(treeElementId) || [];
            return children.map(c => new debugModel_1.VisualizedExpression(this, treeId, c, undefined));
        }
        /** @inheritdoc */
        async editTreeItem(treeId, treeItem, newValue) {
            const newItem = await this.trees.get(treeId)?.editItem?.(treeItem.id, newValue);
            if (newItem) {
                Object.assign(treeItem, newItem); // replace in-place so rerenders work
            }
        }
        getVariableContext(threadId, variable) {
            const context = {
                sessionId: variable.getSession()?.getId() || '',
                containerId: (variable.parent instanceof debugModel_1.Variable ? variable.reference : undefined),
                threadId,
                variable: {
                    name: variable.name,
                    value: variable.value,
                    type: variable.type,
                    evaluateName: variable.evaluateName,
                    variablesReference: variable.reference || 0,
                    indexedVariables: variable.indexedVariables,
                    memoryReference: variable.memoryReference,
                    namedVariables: variable.namedVariables,
                    presentationHint: variable.presentationHint,
                }
            };
            for (let p = variable; p instanceof debugModel_1.Variable; p = p.parent) {
                if (p.parent instanceof debugModel_1.Scope) {
                    context.frameId = p.parent.stackFrame.frameId;
                }
            }
            return context;
        }
        processExtensionRegistration(ext) {
            const viz = ext.contributes?.debugVisualizers;
            if (!(viz instanceof Array)) {
                return;
            }
            for (const { when, id } of viz) {
                try {
                    const expr = contextkey_1.ContextKeyExpr.deserialize(when);
                    if (expr) {
                        this.registrations.push({ expr, id, extensionId: ext.identifier });
                    }
                }
                catch (e) {
                    this.logService.error(`Error processing debug visualizer registration from extension '${ext.identifier.value}'`, e);
                }
            }
        }
    };
    exports.DebugVisualizerService = DebugVisualizerService;
    exports.DebugVisualizerService = DebugVisualizerService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, extensions_2.IExtensionService),
        __param(2, log_1.ILogService)
    ], DebugVisualizerService);
    const toKey = (extensionId, id) => `${extensions_1.ExtensionIdentifier.toKey(extensionId)}\0${id}`;
    const visualizersExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'debugVisualizers',
        jsonSchema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'Name of the debug visualizer'
                    },
                    when: {
                        type: 'string',
                        description: 'Condition when the debug visualizer is applicable'
                    }
                },
                required: ['id', 'when']
            }
        },
        activationEventsGenerator: (contribs, result) => {
            for (const contrib of contribs) {
                if (contrib.id) {
                    result.push(`onDebugVisualizer:${contrib.id}`);
                }
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdWaXN1YWxpemVycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvY29tbW9uL2RlYnVnVmlzdWFsaXplcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZW5GLFFBQUEsdUJBQXVCLEdBQUcsSUFBQSwrQkFBZSxFQUEwQix3QkFBd0IsQ0FBQyxDQUFDO0lBa0IxRyxNQUFhLGVBQWU7UUFDM0IsSUFBVyxJQUFJO1lBQ2QsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBVyxRQUFRO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7UUFDMUIsQ0FBQztRQUVELElBQVcsU0FBUztZQUNuQixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO1FBQzNCLENBQUM7UUFFRCxZQUE2QixNQUF3QixFQUFtQixHQUF3QjtZQUFuRSxXQUFNLEdBQU4sTUFBTSxDQUFrQjtZQUFtQixRQUFHLEdBQUgsR0FBRyxDQUFxQjtRQUFJLENBQUM7UUFFOUYsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUF3QjtZQUM1QyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxLQUFLLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdGLENBQUM7UUFFTSxLQUFLLENBQUMsT0FBTztZQUNuQixNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5RCxDQUFDO0tBQ0Q7SUF0QkQsMENBc0JDO0lBb0NELE1BQU0sUUFBUSxHQUFrQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO0lBRTVFLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXNCO1FBUWxDLFlBQ3FCLGlCQUFzRCxFQUN2RCxnQkFBb0QsRUFDMUQsVUFBd0M7WUFGaEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUN0QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3pDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFSckMsWUFBTyxHQUFHLElBQUksR0FBRyxFQUFxRCxDQUFDO1lBQ3ZFLFVBQUssR0FBRyxJQUFJLEdBQUcsRUFBMEQsQ0FBQztZQUMxRSxnQkFBVyxHQUFHLElBQUksR0FBRyxFQUF5QixDQUFDO1lBQ3hELGtCQUFhLEdBQW1GLEVBQUUsQ0FBQztZQU8xRyx5QkFBeUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtnQkFDOUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUNsRCxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxnQ0FBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUYsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUN0RSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxrQkFBa0I7UUFDWCxLQUFLLENBQUMsZ0JBQWdCLENBQUMsUUFBcUIsRUFBRSxLQUF3QjtZQUM1RSxJQUFJLENBQUMsQ0FBQyxRQUFRLFlBQVkscUJBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sUUFBUSxDQUFDO1lBQ2pCLENBQUM7WUFDRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDeEMsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUMsQ0FBQyxnQ0FBZ0M7Z0JBQzdELE9BQU8sUUFBUSxDQUFDO1lBQ2pCLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzVELE1BQU0sT0FBTyxHQUFHLElBQUEsb0NBQXFCLEVBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLFFBQVEsRUFBRTtnQkFDdkUsQ0FBQyw2QkFBcUIsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQztnQkFDMUMsQ0FBQyw4QkFBc0IsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQztnQkFDNUMsQ0FBQyw2QkFBcUIsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQzthQUMxQyxDQUFDLENBQUM7WUFFSCxNQUFNLGdCQUFnQixHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUMsWUFBWSxFQUFDLEVBQUU7Z0JBQ3RGLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3JELE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxJQUFJLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxxQkFBcUIsWUFBWSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQ3JGLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzdDLENBQUM7Z0JBRUQsTUFBTSxJQUFJLENBQUM7Z0JBQ1gsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztvQkFDbkMsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNsRixPQUFPLE1BQU0sSUFBSSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxNQUFNLENBQUMsdUJBQXVCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDM0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sR0FBRyxHQUFHO2dCQUNYLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsaUJBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxlQUFlLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM1RyxPQUFPLEVBQUUsR0FBRyxFQUFFO29CQUNiLEtBQUssTUFBTSxHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQzt3QkFDcEMsR0FBRyxFQUFFLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNoRSxDQUFDO2dCQUNGLENBQUM7YUFDRCxDQUFDO1lBRUYsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDbkMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2YsQ0FBQztZQUVELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUVELGtCQUFrQjtRQUNYLFFBQVEsQ0FBQyxNQUF3QjtZQUN2QyxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzlCLE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVELGtCQUFrQjtRQUNYLFlBQVksQ0FBQyxNQUFjLEVBQUUsTUFBNEI7WUFDL0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQy9CLE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVELGtCQUFrQjtRQUNYLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxNQUFjLEVBQUUsSUFBaUI7WUFDbEUsSUFBSSxDQUFDLENBQUMsSUFBSSxZQUFZLHFCQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNqQyxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNwQyxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDNUIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDakYsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNmLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxPQUFPLElBQUksaUNBQW9CLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDL0QsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsK0JBQStCLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pELE9BQU87WUFDUixDQUFDO1FBQ0YsQ0FBQztRQUVELGtCQUFrQjtRQUNYLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxNQUFjLEVBQUUsYUFBcUI7WUFDdkUsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxXQUFXLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2hGLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksaUNBQW9CLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNoRixDQUFDO1FBRUQsa0JBQWtCO1FBQ1gsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFjLEVBQUUsUUFBcUMsRUFBRSxRQUFnQjtZQUNoRyxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDaEYsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDYixNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLHFDQUFxQztZQUN4RSxDQUFDO1FBQ0YsQ0FBQztRQUVPLGtCQUFrQixDQUFDLFFBQWdCLEVBQUUsUUFBa0I7WUFDOUQsTUFBTSxPQUFPLEdBQStCO2dCQUMzQyxTQUFTLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7Z0JBQy9DLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLFlBQVkscUJBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUNuRixRQUFRO2dCQUNSLFFBQVEsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUk7b0JBQ25CLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztvQkFDckIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJO29CQUNuQixZQUFZLEVBQUUsUUFBUSxDQUFDLFlBQVk7b0JBQ25DLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxTQUFTLElBQUksQ0FBQztvQkFDM0MsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLGdCQUFnQjtvQkFDM0MsZUFBZSxFQUFFLFFBQVEsQ0FBQyxlQUFlO29CQUN6QyxjQUFjLEVBQUUsUUFBUSxDQUFDLGNBQWM7b0JBQ3ZDLGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxnQkFBZ0I7aUJBQzNDO2FBQ0QsQ0FBQztZQUVGLEtBQUssSUFBSSxDQUFDLEdBQXlCLFFBQVEsRUFBRSxDQUFDLFlBQVkscUJBQVEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsRixJQUFJLENBQUMsQ0FBQyxNQUFNLFlBQVksa0JBQUssRUFBRSxDQUFDO29CQUMvQixPQUFPLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztnQkFDL0MsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRU8sNEJBQTRCLENBQUMsR0FBMkM7WUFDL0UsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLFdBQVcsRUFBRSxnQkFBZ0IsQ0FBQztZQUM5QyxJQUFJLENBQUMsQ0FBQyxHQUFHLFlBQVksS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsT0FBTztZQUNSLENBQUM7WUFFRCxLQUFLLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQztvQkFDSixNQUFNLElBQUksR0FBRywyQkFBYyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDOUMsSUFBSSxJQUFJLEVBQUUsQ0FBQzt3QkFDVixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO29CQUNwRSxDQUFDO2dCQUNGLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDWixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxrRUFBa0UsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckgsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQTdLWSx3REFBc0I7cUNBQXRCLHNCQUFzQjtRQVNoQyxXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsOEJBQWlCLENBQUE7UUFDakIsV0FBQSxpQkFBVyxDQUFBO09BWEQsc0JBQXNCLENBNktsQztJQUVELE1BQU0sS0FBSyxHQUFHLENBQUMsV0FBZ0MsRUFBRSxFQUFVLEVBQUUsRUFBRSxDQUFDLEdBQUcsZ0NBQW1CLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDO0lBRW5ILE1BQU0seUJBQXlCLEdBQUcsdUNBQWtCLENBQUMsc0JBQXNCLENBQWlDO1FBQzNHLGNBQWMsRUFBRSxrQkFBa0I7UUFDbEMsVUFBVSxFQUFFO1lBQ1gsSUFBSSxFQUFFLE9BQU87WUFDYixLQUFLLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsVUFBVSxFQUFFO29CQUNYLEVBQUUsRUFBRTt3QkFDSCxJQUFJLEVBQUUsUUFBUTt3QkFDZCxXQUFXLEVBQUUsOEJBQThCO3FCQUMzQztvQkFDRCxJQUFJLEVBQUU7d0JBQ0wsSUFBSSxFQUFFLFFBQVE7d0JBQ2QsV0FBVyxFQUFFLG1EQUFtRDtxQkFDaEU7aUJBQ0Q7Z0JBQ0QsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQzthQUN4QjtTQUNEO1FBQ0QseUJBQXlCLEVBQUUsQ0FBQyxRQUFRLEVBQUUsTUFBb0MsRUFBRSxFQUFFO1lBQzdFLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2hDLElBQUksT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFxQixPQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDaEQsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQyxDQUFDIn0=