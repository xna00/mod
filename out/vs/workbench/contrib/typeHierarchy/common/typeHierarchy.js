/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/base/common/cancellation", "vs/editor/common/languageFeatureRegistry", "vs/base/common/uri", "vs/editor/common/core/position", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/base/common/types", "vs/editor/common/services/model", "vs/editor/common/services/resolverService"], function (require, exports, range_1, cancellation_1, languageFeatureRegistry_1, uri_1, position_1, arrays_1, errors_1, lifecycle_1, commands_1, types_1, model_1, resolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TypeHierarchyModel = exports.TypeHierarchyProviderRegistry = exports.TypeHierarchyDirection = void 0;
    var TypeHierarchyDirection;
    (function (TypeHierarchyDirection) {
        TypeHierarchyDirection["Subtypes"] = "subtypes";
        TypeHierarchyDirection["Supertypes"] = "supertypes";
    })(TypeHierarchyDirection || (exports.TypeHierarchyDirection = TypeHierarchyDirection = {}));
    exports.TypeHierarchyProviderRegistry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
    class TypeHierarchyModel {
        static async create(model, position, token) {
            const [provider] = exports.TypeHierarchyProviderRegistry.ordered(model);
            if (!provider) {
                return undefined;
            }
            const session = await provider.prepareTypeHierarchy(model, position, token);
            if (!session) {
                return undefined;
            }
            return new TypeHierarchyModel(session.roots.reduce((p, c) => p + c._sessionId, ''), provider, session.roots, new lifecycle_1.RefCountedDisposable(session));
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
            return new class extends TypeHierarchyModel {
                constructor() {
                    super(that.id, that.provider, [item], that.ref.acquire());
                }
            };
        }
        async provideSupertypes(item, token) {
            try {
                const result = await this.provider.provideSupertypes(item, token);
                if ((0, arrays_1.isNonEmptyArray)(result)) {
                    return result;
                }
            }
            catch (e) {
                (0, errors_1.onUnexpectedExternalError)(e);
            }
            return [];
        }
        async provideSubtypes(item, token) {
            try {
                const result = await this.provider.provideSubtypes(item, token);
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
    exports.TypeHierarchyModel = TypeHierarchyModel;
    // --- API command support
    const _models = new Map();
    commands_1.CommandsRegistry.registerCommand('_executePrepareTypeHierarchy', async (accessor, ...args) => {
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
            const model = await TypeHierarchyModel.create(textModel, position, cancellation_1.CancellationToken.None);
            if (!model) {
                return [];
            }
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
    function isTypeHierarchyItemDto(obj) {
        const item = obj;
        return typeof obj === 'object'
            && typeof item.name === 'string'
            && typeof item.kind === 'number'
            && uri_1.URI.isUri(item.uri)
            && range_1.Range.isIRange(item.range)
            && range_1.Range.isIRange(item.selectionRange);
    }
    commands_1.CommandsRegistry.registerCommand('_executeProvideSupertypes', async (_accessor, ...args) => {
        const [item] = args;
        (0, types_1.assertType)(isTypeHierarchyItemDto(item));
        // find model
        const model = _models.get(item._sessionId);
        if (!model) {
            return undefined;
        }
        return model.provideSupertypes(item, cancellation_1.CancellationToken.None);
    });
    commands_1.CommandsRegistry.registerCommand('_executeProvideSubtypes', async (_accessor, ...args) => {
        const [item] = args;
        (0, types_1.assertType)(isTypeHierarchyItemDto(item));
        // find model
        const model = _models.get(item._sessionId);
        if (!model) {
            return undefined;
        }
        return model.provideSubtypes(item, cancellation_1.CancellationToken.None);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZUhpZXJhcmNoeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdHlwZUhpZXJhcmNoeS9jb21tb24vdHlwZUhpZXJhcmNoeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHLElBQWtCLHNCQUdqQjtJQUhELFdBQWtCLHNCQUFzQjtRQUN2QywrQ0FBcUIsQ0FBQTtRQUNyQixtREFBeUIsQ0FBQTtJQUMxQixDQUFDLEVBSGlCLHNCQUFzQixzQ0FBdEIsc0JBQXNCLFFBR3ZDO0lBeUJZLFFBQUEsNkJBQTZCLEdBQUcsSUFBSSxpREFBdUIsRUFBeUIsQ0FBQztJQUlsRyxNQUFhLGtCQUFrQjtRQUU5QixNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFpQixFQUFFLFFBQW1CLEVBQUUsS0FBd0I7WUFDbkYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLHFDQUE2QixDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sUUFBUSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxPQUFPLElBQUksa0JBQWtCLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxD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