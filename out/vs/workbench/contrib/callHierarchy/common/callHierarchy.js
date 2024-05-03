/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/editor/common/languageFeatureRegistry", "vs/base/common/uri", "vs/editor/common/core/position", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/base/common/types", "vs/editor/common/services/model", "vs/editor/common/services/resolverService"], function (require, exports, cancellation_1, languageFeatureRegistry_1, uri_1, position_1, arrays_1, errors_1, lifecycle_1, commands_1, types_1, model_1, resolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallHierarchyModel = exports.CallHierarchyProviderRegistry = exports.CallHierarchyDirection = void 0;
    var CallHierarchyDirection;
    (function (CallHierarchyDirection) {
        CallHierarchyDirection["CallsTo"] = "incomingCalls";
        CallHierarchyDirection["CallsFrom"] = "outgoingCalls";
    })(CallHierarchyDirection || (exports.CallHierarchyDirection = CallHierarchyDirection = {}));
    exports.CallHierarchyProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    class CallHierarchyModel {
        static async create(model, position, token) {
            const [provider] = exports.CallHierarchyProviderRegistry.ordered(model);
            if (!provider) {
                return undefined;
            }
            const session = await provider.prepareCallHierarchy(model, position, token);
            if (!session) {
                return undefined;
            }
            return new CallHierarchyModel(session.roots.reduce((p, c) => p + c._sessionId, ''), provider, session.roots, new lifecycle_1.RefCountedDisposable(session));
        }
        constructor(id, provider, roots, ref) {
            this.id = id;
            this.provider = provider;
            this.roots = roots;
            this.ref = ref;
            this.root = roots[0];
        }
        dispose() {
            this.ref.release();
        }
        fork(item) {
            const that = this;
            return new class extends CallHierarchyModel {
                constructor() {
                    super(that.id, that.provider, [item], that.ref.acquire());
                }
            };
        }
        async resolveIncomingCalls(item, token) {
            try {
                const result = await this.provider.provideIncomingCalls(item, token);
                if ((0, arrays_1.isNonEmptyArray)(result)) {
                    return result;
                }
            }
            catch (e) {
                (0, errors_1.onUnexpectedExternalError)(e);
            }
            return [];
        }
        async resolveOutgoingCalls(item, token) {
            try {
                const result = await this.provider.provideOutgoingCalls(item, token);
                if ((0, arrays_1.isNonEmptyArray)(result)) {
                    return result;
                }
            }
            catch (e) {
                (0, errors_1.onUnexpectedExternalError)(e);
            }
            return [];
        }
    }
    exports.CallHierarchyModel = CallHierarchyModel;
    // --- API command support
    const _models = new Map();
    commands_1.CommandsRegistry.registerCommand('_executePrepareCallHierarchy', async (accessor, ...args) => {
        const [resource, position] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(resource));
        (0, types_1.assertType)(position_1.Position.isIPosition(position));
        const modelService = accessor.get(model_1.IModelService);
        let textModel = modelService.getModel(resource);
        let textModelReference;
        if (!textModel) {
            const textModelService = accessor.get(resolverService_1.ITextModelService);
            const result = await textModelService.createModelReference(resource);
            textModel = result.object.textEditorModel;
            textModelReference = result;
        }
        try {
            const model = await CallHierarchyModel.create(textModel, position, cancellation_1.CancellationToken.None);
            if (!model) {
                return [];
            }
            //
            _models.set(model.id, model);
            _models.forEach((value, key, map) => {
                if (map.size > 10) {
                    value.dispose();
                    _models.delete(key);
                }
            });
            return [model.root];
        }
        finally {
            textModelReference?.dispose();
        }
    });
    function isCallHierarchyItemDto(obj) {
        return true;
    }
    commands_1.CommandsRegistry.registerCommand('_executeProvideIncomingCalls', async (_accessor, ...args) => {
        const [item] = args;
        (0, types_1.assertType)(isCallHierarchyItemDto(item));
        // find model
        const model = _models.get(item._sessionId);
        if (!model) {
            return undefined;
        }
        return model.resolveIncomingCalls(item, cancellation_1.CancellationToken.None);
    });
    commands_1.CommandsRegistry.registerCommand('_executeProvideOutgoingCalls', async (_accessor, ...args) => {
        const [item] = args;
        (0, types_1.assertType)(isCallHierarchyItemDto(item));
        // find model
        const model = _models.get(item._sessionId);
        if (!model) {
            return undefined;
        }
        return model.resolveOutgoingCalls(item, cancellation_1.CancellationToken.None);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbEhpZXJhcmNoeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2FsbEhpZXJhcmNoeS9jb21tb24vY2FsbEhpZXJhcmNoeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHLElBQWtCLHNCQUdqQjtJQUhELFdBQWtCLHNCQUFzQjtRQUN2QyxtREFBeUIsQ0FBQTtRQUN6QixxREFBMkIsQ0FBQTtJQUM1QixDQUFDLEVBSGlCLHNCQUFzQixzQ0FBdEIsc0JBQXNCLFFBR3ZDO0lBc0NZLFFBQUEsNkJBQTZCLEdBQUcsSUFBSSxpREFBdUIsRUFBeUIsQ0FBQztJQUdsRyxNQUFhLGtCQUFrQjtRQUU5QixNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFpQixFQUFFLFFBQW1CLEVBQUUsS0FBd0I7WUFDbkYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLHFDQUE2QixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sUUFBUSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxPQUFPLElBQUksa0JBQWtCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLGdDQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDakosQ0FBQztRQUlELFlBQ1UsRUFBVSxFQUNWLFFBQStCLEVBQy9CLEtBQTBCLEVBQzFCLEdBQXlCO1lBSHpCLE9BQUUsR0FBRixFQUFFLENBQVE7WUFDVixhQUFRLEdBQVIsUUFBUSxDQUF1QjtZQUMvQixVQUFLLEdBQUwsS0FBSyxDQUFxQjtZQUMxQixRQUFHLEdBQUgsR0FBRyxDQUFzQjtZQUVsQyxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEIsQ0FBQztRQUVELElBQUksQ0FBQyxJQUF1QjtZQUMzQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7WUFDbEIsT0FBTyxJQUFJLEtBQU0sU0FBUSxrQkFBa0I7Z0JBQzFDO29CQUNDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQzNELENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUF1QixFQUFFLEtBQXdCO1lBQzNFLElBQUksQ0FBQztnQkFDSixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNyRSxJQUFJLElBQUEsd0JBQWUsRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUM3QixPQUFPLE1BQU0sQ0FBQztnQkFDZixDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osSUFBQSxrQ0FBeUIsRUFBQyxDQUFDLENBQUMsQ0FBQztZQUM5QixDQUFDO1lBQ0QsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQsS0FBSyxDQUFDLG9CQUFvQixDQUFDLElBQXVCLEVBQUUsS0FBd0I7WUFDM0UsSUFBSSxDQUFDO2dCQUNKLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3JFLElBQUksSUFBQSx3QkFBZSxFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQzdCLE9BQU8sTUFBTSxDQUFDO2dCQUNmLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixJQUFBLGtDQUF5QixFQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlCLENBQUM7WUFDRCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7S0FDRDtJQTdERCxnREE2REM7SUFFRCwwQkFBMEI7SUFFMUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQThCLENBQUM7SUFFdEQsMkJBQWdCLENBQUMsZUFBZSxDQUFDLDhCQUE4QixFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyxJQUFJLEVBQUUsRUFBRTtRQUM1RixNQUFNLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUNsQyxJQUFBLGtCQUFVLEVBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLElBQUEsa0JBQVUsRUFBQyxtQkFBUSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBRTNDLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUJBQWEsQ0FBQyxDQUFDO1FBQ2pELElBQUksU0FBUyxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEQsSUFBSSxrQkFBMkMsQ0FBQztRQUNoRCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDaEIsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG1DQUFpQixDQUFDLENBQUM7WUFDekQsTUFBTSxNQUFNLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNyRSxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUM7WUFDMUMsa0JBQWtCLEdBQUcsTUFBTSxDQUFDO1FBQzdCLENBQUM7UUFFRCxJQUFJLENBQUM7WUFDSixNQUFNLEtBQUssR0FBRyxNQUFNLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNGLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFDRCxFQUFFO1lBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdCLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUNuQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUM7b0JBQ25CLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDaEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDckIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVyQixDQUFDO2dCQUFTLENBQUM7WUFDVixrQkFBa0IsRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUMvQixDQUFDO0lBQ0YsQ0FBQyxDQUFDLENBQUM7SUFFSCxTQUFTLHNCQUFzQixDQUFDLEdBQVE7UUFDdkMsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsMkJBQWdCLENBQUMsZUFBZSxDQUFDLDhCQUE4QixFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsR0FBRyxJQUFJLEVBQUUsRUFBRTtRQUM3RixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLElBQUEsa0JBQVUsRUFBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRXpDLGFBQWE7UUFDYixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsT0FBTyxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pFLENBQUMsQ0FBQyxDQUFDO0lBRUgsMkJBQWdCLENBQUMsZUFBZSxDQUFDLDhCQUE4QixFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsR0FBRyxJQUFJLEVBQUUsRUFBRTtRQUM3RixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLElBQUEsa0JBQVUsRUFBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRXpDLGFBQWE7UUFDYixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsT0FBTyxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pFLENBQUMsQ0FBQyxDQUFDIn0=