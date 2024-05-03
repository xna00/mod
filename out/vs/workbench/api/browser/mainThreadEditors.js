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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/platform/commands/common/commands", "vs/platform/editor/common/editor", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/environment/common/environment", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/editor/browser/editorBrowser", "vs/platform/configuration/common/configuration"], function (require, exports, errors_1, lifecycle_1, objects_1, uri_1, codeEditorService_1, commands_1, editor_1, extHost_protocol_1, editorGroupColumn_1, editorService_1, editorGroupsService_1, environment_1, workingCopyService_1, editorBrowser_1, configuration_1) {
    "use strict";
    var MainThreadTextEditors_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTextEditors = void 0;
    let MainThreadTextEditors = class MainThreadTextEditors {
        static { MainThreadTextEditors_1 = this; }
        static { this.INSTANCE_COUNT = 0; }
        constructor(_editorLocator, extHostContext, _codeEditorService, _editorService, _editorGroupService, _configurationService) {
            this._editorLocator = _editorLocator;
            this._codeEditorService = _codeEditorService;
            this._editorService = _editorService;
            this._editorGroupService = _editorGroupService;
            this._configurationService = _configurationService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._instanceId = String(++MainThreadTextEditors_1.INSTANCE_COUNT);
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostEditors);
            this._textEditorsListenersMap = Object.create(null);
            this._editorPositionData = null;
            this._toDispose.add(this._editorService.onDidVisibleEditorsChange(() => this._updateActiveAndVisibleTextEditors()));
            this._toDispose.add(this._editorGroupService.onDidRemoveGroup(() => this._updateActiveAndVisibleTextEditors()));
            this._toDispose.add(this._editorGroupService.onDidMoveGroup(() => this._updateActiveAndVisibleTextEditors()));
            this._registeredDecorationTypes = Object.create(null);
        }
        dispose() {
            Object.keys(this._textEditorsListenersMap).forEach((editorId) => {
                (0, lifecycle_1.dispose)(this._textEditorsListenersMap[editorId]);
            });
            this._textEditorsListenersMap = Object.create(null);
            this._toDispose.dispose();
            for (const decorationType in this._registeredDecorationTypes) {
                this._codeEditorService.removeDecorationType(decorationType);
            }
            this._registeredDecorationTypes = Object.create(null);
        }
        handleTextEditorAdded(textEditor) {
            const id = textEditor.getId();
            const toDispose = [];
            toDispose.push(textEditor.onPropertiesChanged((data) => {
                this._proxy.$acceptEditorPropertiesChanged(id, data);
            }));
            this._textEditorsListenersMap[id] = toDispose;
        }
        handleTextEditorRemoved(id) {
            (0, lifecycle_1.dispose)(this._textEditorsListenersMap[id]);
            delete this._textEditorsListenersMap[id];
        }
        _updateActiveAndVisibleTextEditors() {
            // editor columns
            const editorPositionData = this._getTextEditorPositionData();
            if (!(0, objects_1.equals)(this._editorPositionData, editorPositionData)) {
                this._editorPositionData = editorPositionData;
                this._proxy.$acceptEditorPositionData(this._editorPositionData);
            }
        }
        _getTextEditorPositionData() {
            const result = Object.create(null);
            for (const editorPane of this._editorService.visibleEditorPanes) {
                const id = this._editorLocator.findTextEditorIdFor(editorPane);
                if (id) {
                    result[id] = (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupService, editorPane.group);
                }
            }
            return result;
        }
        // --- from extension host process
        async $tryShowTextDocument(resource, options) {
            const uri = uri_1.URI.revive(resource);
            const editorOptions = {
                preserveFocus: options.preserveFocus,
                pinned: options.pinned,
                selection: options.selection,
                // preserve pre 1.38 behaviour to not make group active when preserveFocus: true
                // but make sure to restore the editor to fix https://github.com/microsoft/vscode/issues/79633
                activation: options.preserveFocus ? editor_1.EditorActivation.RESTORE : undefined,
                override: editor_1.EditorResolution.EXCLUSIVE_ONLY
            };
            const input = {
                resource: uri,
                options: editorOptions
            };
            const editor = await this._editorService.openEditor(input, (0, editorGroupColumn_1.columnToEditorGroup)(this._editorGroupService, this._configurationService, options.position));
            if (!editor) {
                return undefined;
            }
            // Composite editors are made up of many editors so we return the active one at the time of opening
            const editorControl = editor.getControl();
            const codeEditor = (0, editorBrowser_1.getCodeEditor)(editorControl);
            return codeEditor ? this._editorLocator.getIdOfCodeEditor(codeEditor) : undefined;
        }
        async $tryShowEditor(id, position) {
            const mainThreadEditor = this._editorLocator.getEditor(id);
            if (mainThreadEditor) {
                const model = mainThreadEditor.getModel();
                await this._editorService.openEditor({
                    resource: model.uri,
                    options: { preserveFocus: false }
                }, (0, editorGroupColumn_1.columnToEditorGroup)(this._editorGroupService, this._configurationService, position));
                return;
            }
        }
        async $tryHideEditor(id) {
            const mainThreadEditor = this._editorLocator.getEditor(id);
            if (mainThreadEditor) {
                const editorPanes = this._editorService.visibleEditorPanes;
                for (const editorPane of editorPanes) {
                    if (mainThreadEditor.matches(editorPane)) {
                        await editorPane.group.closeEditor(editorPane.input);
                        return;
                    }
                }
            }
        }
        $trySetSelections(id, selections) {
            const editor = this._editorLocator.getEditor(id);
            if (!editor) {
                return Promise.reject((0, errors_1.illegalArgument)(`TextEditor(${id})`));
            }
            editor.setSelections(selections);
            return Promise.resolve(undefined);
        }
        $trySetDecorations(id, key, ranges) {
            key = `${this._instanceId}-${key}`;
            const editor = this._editorLocator.getEditor(id);
            if (!editor) {
                return Promise.reject((0, errors_1.illegalArgument)(`TextEditor(${id})`));
            }
            editor.setDecorations(key, ranges);
            return Promise.resolve(undefined);
        }
        $trySetDecorationsFast(id, key, ranges) {
            key = `${this._instanceId}-${key}`;
            const editor = this._editorLocator.getEditor(id);
            if (!editor) {
                return Promise.reject((0, errors_1.illegalArgument)(`TextEditor(${id})`));
            }
            editor.setDecorationsFast(key, ranges);
            return Promise.resolve(undefined);
        }
        $tryRevealRange(id, range, revealType) {
            const editor = this._editorLocator.getEditor(id);
            if (!editor) {
                return Promise.reject((0, errors_1.illegalArgument)(`TextEditor(${id})`));
            }
            editor.revealRange(range, revealType);
            return Promise.resolve();
        }
        $trySetOptions(id, options) {
            const editor = this._editorLocator.getEditor(id);
            if (!editor) {
                return Promise.reject((0, errors_1.illegalArgument)(`TextEditor(${id})`));
            }
            editor.setConfiguration(options);
            return Promise.resolve(undefined);
        }
        $tryApplyEdits(id, modelVersionId, edits, opts) {
            const editor = this._editorLocator.getEditor(id);
            if (!editor) {
                return Promise.reject((0, errors_1.illegalArgument)(`TextEditor(${id})`));
            }
            return Promise.resolve(editor.applyEdits(modelVersionId, edits, opts));
        }
        $tryInsertSnippet(id, modelVersionId, template, ranges, opts) {
            const editor = this._editorLocator.getEditor(id);
            if (!editor) {
                return Promise.reject((0, errors_1.illegalArgument)(`TextEditor(${id})`));
            }
            return Promise.resolve(editor.insertSnippet(modelVersionId, template, ranges, opts));
        }
        $registerTextEditorDecorationType(extensionId, key, options) {
            key = `${this._instanceId}-${key}`;
            this._registeredDecorationTypes[key] = true;
            this._codeEditorService.registerDecorationType(`exthost-api-${extensionId}`, key, options);
        }
        $removeTextEditorDecorationType(key) {
            key = `${this._instanceId}-${key}`;
            delete this._registeredDecorationTypes[key];
            this._codeEditorService.removeDecorationType(key);
        }
        $getDiffInformation(id) {
            const editor = this._editorLocator.getEditor(id);
            if (!editor) {
                return Promise.reject(new Error('No such TextEditor'));
            }
            const codeEditor = editor.getCodeEditor();
            if (!codeEditor) {
                return Promise.reject(new Error('No such CodeEditor'));
            }
            const codeEditorId = codeEditor.getId();
            const diffEditors = this._codeEditorService.listDiffEditors();
            const [diffEditor] = diffEditors.filter(d => d.getOriginalEditor().getId() === codeEditorId || d.getModifiedEditor().getId() === codeEditorId);
            if (diffEditor) {
                return Promise.resolve(diffEditor.getLineChanges() || []);
            }
            const dirtyDiffContribution = codeEditor.getContribution('editor.contrib.dirtydiff');
            if (dirtyDiffContribution) {
                return Promise.resolve(dirtyDiffContribution.getChanges());
            }
            return Promise.resolve([]);
        }
    };
    exports.MainThreadTextEditors = MainThreadTextEditors;
    exports.MainThreadTextEditors = MainThreadTextEditors = MainThreadTextEditors_1 = __decorate([
        __param(2, codeEditorService_1.ICodeEditorService),
        __param(3, editorService_1.IEditorService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, configuration_1.IConfigurationService)
    ], MainThreadTextEditors);
    // --- commands
    commands_1.CommandsRegistry.registerCommand('_workbench.revertAllDirty', async function (accessor) {
        const environmentService = accessor.get(environment_1.IEnvironmentService);
        if (!environmentService.extensionTestsLocationURI) {
            throw new Error('Command is only available when running extension tests.');
        }
        const workingCopyService = accessor.get(workingCopyService_1.IWorkingCopyService);
        for (const workingCopy of workingCopyService.dirtyWorkingCopies) {
            await workingCopy.revert({ soft: true });
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEVkaXRvcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkRWRpdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBbUN6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFxQjs7aUJBRWxCLG1CQUFjLEdBQVcsQ0FBQyxBQUFaLENBQWE7UUFTMUMsWUFDa0IsY0FBd0MsRUFDekQsY0FBK0IsRUFDWCxrQkFBdUQsRUFDM0QsY0FBK0MsRUFDekMsbUJBQTBELEVBQ3pELHFCQUE2RDtZQUxuRSxtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFFcEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUMxQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDeEIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUN4QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBWHBFLGVBQVUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQWFuRCxJQUFJLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxFQUFFLHVCQUFxQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ2xFLElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRXJFLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7WUFFaEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMs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