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
define(["require", "exports", "vs/nls", "vs/editor/common/services/languagesAssociations", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugSource", "vs/editor/common/services/editorWorker", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/base/common/cancellation", "vs/editor/common/languages/modesRegistry", "vs/base/common/errors"], function (require, exports, nls_1, languagesAssociations_1, model_1, language_1, resolverService_1, debug_1, debugSource_1, editorWorker_1, editOperation_1, range_1, cancellation_1, modesRegistry_1, errors_1) {
    "use strict";
    var DebugContentProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugContentProvider = void 0;
    /**
     * Debug URI format
     *
     * a debug URI represents a Source object and the debug session where the Source comes from.
     *
     *       debug:arbitrary_path?session=123e4567-e89b-12d3-a456-426655440000&ref=1016
     *       \___/ \____________/ \__________________________________________/ \______/
     *         |          |                             |                          |
     *      scheme   source.path                    session id            source.reference
     *
     * the arbitrary_path and the session id are encoded with 'encodeURIComponent'
     *
     */
    let DebugContentProvider = class DebugContentProvider {
        static { DebugContentProvider_1 = this; }
        constructor(textModelResolverService, debugService, modelService, languageService, editorWorkerService) {
            this.debugService = debugService;
            this.modelService = modelService;
            this.languageService = languageService;
            this.editorWorkerService = editorWorkerService;
            this.pendingUpdates = new Map();
            textModelResolverService.registerTextModelContentProvider(debug_1.DEBUG_SCHEME, this);
            DebugContentProvider_1.INSTANCE = this;
        }
        dispose() {
            this.pendingUpdates.forEach(cancellationSource => cancellationSource.dispose());
        }
        provideTextContent(resource) {
            return this.createOrUpdateContentModel(resource, true);
        }
        /**
         * Reload the model content of the given resource.
         * If there is no model for the given resource, this method does nothing.
         */
        static refreshDebugContent(resource) {
            DebugContentProvider_1.INSTANCE?.createOrUpdateContentModel(resource, false);
        }
        /**
         * Create or reload the model content of the given resource.
         */
        createOrUpdateContentModel(resource, createIfNotExists) {
            const model = this.modelService.getModel(resource);
            if (!model && !createIfNotExists) {
                // nothing to do
                return null;
            }
            let session;
            if (resource.query) {
                const data = debugSource_1.Source.getEncodedDebugData(resource);
                session = this.debugService.getModel().getSession(data.sessionId);
            }
            if (!session) {
                // fallback: use focused session
                session = this.debugService.getViewModel().focusedSession;
            }
            if (!session) {
                return Promise.reject(new errors_1.ErrorNoTelemetry((0, nls_1.localize)('unable', "Unable to resolve the resource without a debug session")));
            }
            const createErrModel = (errMsg) => {
                this.debugService.sourceIsNotAvailable(resource);
                const languageSelection = this.languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
                const message = errMsg
                    ? (0, nls_1.localize)('canNotResolveSourceWithError', "Could not load source '{0}': {1}.", resource.path, errMsg)
                    : (0, nls_1.localize)('canNotResolveSource', "Could not load source '{0}'.", resource.path);
                return this.modelService.createModel(message, languageSelection, resource);
            };
            return session.loadSource(resource).then(response => {
                if (response && response.body) {
                    if (model) {
                        const newContent = response.body.content;
                        // cancel and dispose an existing update
                        const cancellationSource = this.pendingUpdates.get(model.id);
                        cancellationSource?.cancel();
                        // create and keep update token
                        const myToken = new cancellation_1.CancellationTokenSource();
                        this.pendingUpdates.set(model.id, myToken);
                        // update text model
                        return this.editorWorkerService.computeMoreMinimalEdits(model.uri, [{ text: newContent, range: model.getFullModelRange() }]).then(edits => {
                            // remove token
                            this.pendingUpdates.delete(model.id);
                            if (!myToken.token.isCancellationRequested && edits && edits.length > 0) {
                                // use the evil-edit as these models show in readonly-editor only
                                model.applyEdits(edits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text)));
                            }
                            return model;
                        });
                    }
                    else {
                        // create text model
                        const mime = response.body.mimeType || (0, languagesAssociations_1.getMimeTypes)(resource)[0];
                        const languageSelection = this.languageService.createByMimeType(mime);
                        return this.modelService.createModel(response.body.content, languageSelection, resource);
                    }
                }
                return createErrModel();
            }, (err) => createErrModel(err.message));
        }
    };
    exports.DebugContentProvider = DebugContentProvider;
    exports.DebugContentProvider = DebugContentProvider = DebugContentProvider_1 = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, debug_1.IDebugService),
        __param(2, model_1.IModelService),
        __param(3, language_1.ILanguageService),
        __param(4, editorWorker_1.IEditorWorkerService)
    ], DebugContentProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdDb250ZW50UHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2NvbW1vbi9kZWJ1Z0NvbnRlbnRQcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBbUJoRzs7Ozs7Ozs7Ozs7O09BWUc7SUFDSSxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFvQjs7UUFNaEMsWUFDb0Isd0JBQTJDLEVBQy9DLFlBQTRDLEVBQzVDLFlBQTRDLEVBQ3pDLGVBQWtELEVBQzlDLG1CQUEwRDtZQUhoRCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUMzQixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUN4QixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDN0Isd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQVBoRSxtQkFBYyxHQUFHLElBQUksR0FBRyxFQUFtQyxDQUFDO1lBUzVFLHdCQUF3QixDQUFDLGdDQUFnQyxDQUFDLG9CQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDOUUsc0JBQW9CLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUN0QyxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ2pGLENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxRQUFhO1lBQy9CLE9BQU8sSUFBSSxDQUFDLDBCQUEwQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRUQ7OztXQUdHO1FBQ0gsTUFBTSxDQUFDLG1CQUFtQixDQUFDLFFBQWE7WUFDdkMsc0JBQW9CLENBQUMsUUFBUSxFQUFFLDBC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