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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatVariables"], function (require, exports, arrays_1, htmlContent_1, lifecycle_1, resources_1, uri_1, range_1, resolverService_1, nls_1, actions_1, label_1, log_1, quickInput_1, chatWidget_1, chatVariables_1) {
    "use strict";
    var ChatDynamicVariableModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AddDynamicVariableAction = exports.SelectAndInsertFileAction = exports.ChatDynamicVariableModel = exports.dynamicVariableDecorationType = void 0;
    exports.dynamicVariableDecorationType = 'chat-dynamic-variable';
    let ChatDynamicVariableModel = class ChatDynamicVariableModel extends lifecycle_1.Disposable {
        static { ChatDynamicVariableModel_1 = this; }
        static { this.ID = 'chatDynamicVariableModel'; }
        get variables() {
            return [...this._variables];
        }
        get id() {
            return ChatDynamicVariableModel_1.ID;
        }
        constructor(widget, labelService, logService) {
            super();
            this.widget = widget;
            this.labelService = labelService;
            this.logService = logService;
            this._variables = [];
            this._register(widget.inputEditor.onDidChangeModelContent(e => {
                e.changes.forEach(c => {
                    // Don't mutate entries in _variables, since they will be returned from the getter
                    this._variables = (0, arrays_1.coalesce)(this._variables.map(ref => {
                        const intersection = range_1.Range.intersectRanges(ref.range, c.range);
                        if (intersection && !intersection.isEmpty()) {
                            // The reference text was changed, it's broken
                            const rangeToDelete = new range_1.Range(ref.range.startLineNumber, ref.range.startColumn, ref.range.endLineNumber, ref.range.endColumn - 1);
                            this.widget.inputEditor.executeEdits(this.id, [{
                                    range: rangeToDelete,
                                    text: '',
                                }]);
                            return null;
                        }
                        else if (range_1.Range.compareRangesUsingStarts(ref.range, c.range) > 0) {
                            const delta = c.text.length - c.rangeLength;
                            return {
                                ...ref,
                                range: {
                                    startLineNumber: ref.range.startLineNumber,
                                    startColumn: ref.range.startColumn + delta,
                                    endLineNumber: ref.range.endLineNumber,
                                    endColumn: ref.range.endColumn + delta
                                }
                            };
                        }
                        return ref;
                    }));
                });
                this.updateDecorations();
            }));
        }
        getInputState() {
            return this.variables;
        }
        setInputState(s) {
            if (!Array.isArray(s)) {
                // Something went wrong
                this.logService.warn('ChatDynamicVariableModel.setInputState called with invalid state: ' + JSON.stringify(s));
                return;
            }
            this._variables = s;
            this.updateDecorations();
        }
        addReference(ref) {
            this._variables.push(ref);
            this.updateDecorations();
        }
        updateDecorations() {
            this.widget.inputEditor.setDecorationsByType('chat', exports.dynamicVariableDecorationType, this._variables.map(r => ({
                range: r.range,
                hoverMessage: this.getHoverForReference(r)
            })));
        }
        getHoverForReference(ref) {
            const value = ref.data[0];
            if (uri_1.URI.isUri(value.value)) {
                return new htmlContent_1.MarkdownString(this.labelService.getUriLabel(value.value, { relative: true }));
            }
            else {
                return value.value.toString();
            }
        }
    };
    exports.ChatDynamicVariableModel = ChatDynamicVariableModel;
    exports.ChatDynamicVariableModel = ChatDynamicVariableModel = ChatDynamicVariableModel_1 = __decorate([
        __param(1, label_1.ILabelService),
        __param(2, log_1.ILogService)
    ], ChatDynamicVariableModel);
    chatWidget_1.ChatWidget.CONTRIBS.push(ChatDynamicVariableModel);
    function isSelectAndInsertFileActionContext(context) {
        return 'widget' in context && 'range' in context;
    }
    class SelectAndInsertFileAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.selectAndInsertFile'; }
        constructor() {
            super({
                id: SelectAndInsertFileAction.ID,
                title: '' // not displayed
            });
        }
        async run(accessor, ...args) {
            const textModelService = accessor.get(resolverService_1.ITextModelService);
            const logService = accessor.get(log_1.ILogService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const chatVariablesService = accessor.get(chatVariables_1.IChatVariablesService);
            const context = args[0];
            if (!isSelectAndInsertFileActionContext(context)) {
                return;
            }
            const doCleanup = () => {
                // Failed, remove the dangling `file`
                context.widget.inputEditor.executeEdits('chatInsertFile', [{ range: context.range, text: `` }]);
            };
            let options;
            const filesVariableName = 'files';
            const filesItem = {
                label: (0, nls_1.localize)('allFiles', 'All Files'),
                description: (0, nls_1.localize)('allFilesDescription', 'Search for relevant files in the workspace and provide context from them'),
            };
            // If we have a `files` variable, add an option to select all files in the picker.
            // This of course assumes that the `files` variable has the behavior that it searches
            // through files in the workspace.
            if (chatVariablesService.hasVariable(filesVariableName)) {
                options = {
                    providerOptions: {
                        additionPicks: [filesItem, { type: 'separator' }]
                    },
                };
            }
            // TODO: have dedicated UX for this instead of using the quick access picker
            const picks = await quickInputService.quickAccess.pick('', options);
            if (!picks?.length) {
                logService.trace('SelectAndInsertFileAction: no file selected');
                doCleanup();
                return;
            }
            const editor = context.widget.inputEditor;
            const range = context.range;
            // Handle the special case of selecting all files
            if (picks[0] === filesItem) {
                const text = `#${filesVariableName}`;
                const success = editor.executeEdits('chatInsertFile', [{ range, text: text + ' ' }]);
                if (!success) {
                    logService.trace(`SelectAndInsertFileAction: failed to insert "${text}"`);
                    doCleanup();
                }
                return;
            }
            // Handle the case of selecting a specific file
            const resource = picks[0].resource;
            if (!textModelService.canHandleResource(resource)) {
                logService.trace('SelectAndInsertFileAction: non-text resource selected');
                doCleanup();
                return;
            }
            const fileName = (0, resources_1.basename)(resource);
            const text = `#file:${fileName}`;
            const success = editor.executeEdits('chatInsertFile', [{ range, text: text + ' ' }]);
            if (!success) {
                logService.trace(`SelectAndInsertFileAction: failed to insert "${text}"`);
                doCleanup();
                return;
            }
            context.widget.getContrib(ChatDynamicVariableModel.ID)?.addReference({
                range: { startLineNumber: range.startLineNumber, startColumn: range.startColumn, endLineNumber: range.endLineNumber, endColumn: range.startColumn + text.length },
                data: [{ level: 'full', value: resource }]
            });
        }
    }
    exports.SelectAndInsertFileAction = SelectAndInsertFileAction;
    (0, actions_1.registerAction2)(SelectAndInsertFileAction);
    function isAddDynamicVariableContext(context) {
        return 'widget' in context &&
            'range' in context &&
            'variableData' in context;
    }
    class AddDynamicVariableAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.addDynamicVariable'; }
        constructor() {
            super({
                id: AddDynamicVariableAction.ID,
                title: '' // not displayed
            });
        }
        async run(accessor, ...args) {
            const context = args[0];
            if (!isAddDynamicVariableContext(context)) {
                return;
            }
            context.widget.getContrib(ChatDynamicVariableModel.ID)?.addReference({
                range: context.range,
                data: context.variableData
            });
        }
    }
    exports.AddDynamicVariableAction = AddDynamicVariableAction;
    (0, actions_1.registerAction2)(AddDynamicVariableAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdER5bmFtaWNWYXJpYWJsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jb250cmliL2NoYXREeW5hbWljVmFyaWFibGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFxQm5GLFFBQUEsNkJBQTZCLEdBQUcsdUJBQXVCLENBQUM7SUFFOUQsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTs7aUJBQ2hDLE9BQUUsR0FBRywwQkFBMEIsQUFBN0IsQ0FBOEI7UUFHdkQsSUFBSSxTQUFTO1lBQ1osT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFRCxJQUFJLEVBQUU7WUFDTCxPQUFPLDBCQUF3QixDQUFDLEVBQUUsQ0FBQztRQUNwQyxDQUFDO1FBRUQsWUFDa0IsTUFBbUIsRUFDckIsWUFBNEMsRUFDOUMsVUFBd0M7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFKUyxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBQ0osaUJBQVksR0FBWixZQUFZLENBQWU7WUFDN0IsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQVo5QyxlQUFVLEdBQXVCLEVBQUUsQ0FBQztZQWUzQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzdELENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUNyQixrRkFBa0Y7b0JBQ2xGLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBQSxpQkFBUSxFQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO3dCQUNwRCxN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