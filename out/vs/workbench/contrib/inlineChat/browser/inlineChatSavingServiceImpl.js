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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/configuration/common/configuration", "./inlineChatSessionService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/iterator", "vs/base/common/network", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/base/common/strings", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/log/common/log", "vs/base/common/event", "vs/workbench/contrib/inlineChat/browser/inlineChatController"], function (require, exports, async_1, lifecycle_1, editorBrowser_1, nls_1, configuration_1, inlineChatSessionService_1, editorGroupsService_1, editorService_1, filesConfigurationService_1, textfiles_1, iterator_1, network_1, notebookCommon_1, notebookBrowser_1, strings_1, workingCopyFileService_1, log_1, event_1, inlineChatController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatSavingServiceImpl = void 0;
    let InlineChatSavingServiceImpl = class InlineChatSavingServiceImpl {
        constructor(_fileConfigService, _editorGroupService, _textFileService, _editorService, _inlineChatSessionService, _configService, _workingCopyFileService, _logService) {
            this._fileConfigService = _fileConfigService;
            this._editorGroupService = _editorGroupService;
            this._textFileService = _textFileService;
            this._editorService = _editorService;
            this._inlineChatSessionService = _inlineChatSessionService;
            this._configService = _configService;
            this._workingCopyFileService = _workingCopyFileService;
            this._logService = _logService;
            this._store = new lifecycle_1.DisposableStore();
            this._saveParticipant = this._store.add(new lifecycle_1.MutableDisposable());
            this._sessionData = new Map();
            this._store.add(event_1.Event.any(_inlineChatSessionService.onDidEndSession, _inlineChatSessionService.onDidStashSession)(e => {
                this._sessionData.get(e.session)?.dispose();
            }));
        }
        dispose() {
            this._store.dispose();
            (0, lifecycle_1.dispose)(this._sessionData.values());
        }
        markChanged(session) {
            if (!this._sessionData.has(session)) {
                let uri = session.targetUri;
                // notebooks: use the notebook-uri because saving happens on the notebook-level
                if (uri.scheme === network_1.Schemas.vscodeNotebookCell) {
                    const data = notebookCommon_1.CellUri.parse(uri);
                    if (!data) {
                        return;
                    }
                    uri = data?.notebook;
                }
                if (this._sessionData.size === 0) {
                    this._installSaveParticpant();
                }
                const saveConfigOverride = this._fileConfigService.disableAutoSave(uri);
                this._sessionData.set(session, {
                    resourceUri: uri,
                    groupCandidate: this._editorGroupService.activeGroup,
                    session,
                    dispose: () => {
                        saveConfigOverride.dispose();
                        this._sessionData.delete(session);
                        if (this._sessionData.size === 0) {
                            this._saveParticipant.clear();
                        }
                    }
                });
            }
        }
        _installSaveParticpant() {
            const queue = new async_1.Queue();
            const d1 = this._textFileService.files.addSaveParticipant({
                participate: (model, ctx, progress, token) => {
                    return queue.queue(() => this._participate(ctx.savedFrom ?? model.textEditorModel?.uri, ctx.reason, progress, token));
                }
            });
            const d2 = this._workingCopyFileService.addSaveParticipant({
                participate: (workingCopy, ctx, progress, token) => {
                    return queue.queue(() => this._participate(ctx.savedFrom ?? workingCopy.resource, ctx.reason, progress, token));
                }
            });
            this._saveParticipant.value = (0, lifecycle_1.combinedDisposable)(d1, d2, queue);
        }
        async _participate(uri, reason, progress, token) {
            if (reason !== 1 /* SaveReason.EXPLICIT */) {
                // all saves that we are concerned about are explicit
                // because we have disabled auto-save for them
                return;
            }
            if (!this._configService.getValue("inlineChat.acceptedOrDiscardBeforeSave" /* InlineChatConfigKeys.AcceptedOrDiscardBeforeSave */)) {
                // disabled
                return;
            }
            const sessions = new Map();
            for (const [session, data] of this._sessionData) {
                if (uri?.toString() === data.resourceUri.toString()) {
                    sessions.set(session, data);
                }
            }
            if (sessions.size === 0) {
                return;
            }
            progress.report({
                message: sessions.size === 1
                    ? (0, nls_1.localize)('inlineChat', "Waiting for Inline Chat changes to be Accepted or Discarded...")
                    : (0, nls_1.localize)('inlineChat.N', "Waiting for Inline Chat changes in {0} editors to be Accepted or Discarded...", sessions.size)
            });
            // reveal all sessions in order and also show dangling sessions
            const { groups, orphans } = this._getGroupsAndOrphans(sessions.values());
            const editorsOpenedAndSessionsEnded = this._openAndWait(groups, token).then(() => {
                if (token.isCancellationRequested) {
                    return;
                }
                return this._openAndWait(iterator_1.Iterable.map(orphans, s => [this._editorGroupService.activeGroup, s]), token);
            });
            // fallback: resolve when all sessions for this model have been resolved. this is independent of the editor opening
            const allSessionsEnded = this._whenSessionsEnded(iterator_1.Iterable.concat(groups.map(tuple => tuple[1]), orphans), token);
            await Promise.race([allSessionsEnded, editorsOpenedAndSessionsEnded]);
        }
        _getGroupsAndOrphans(sessions) {
            const groupByEditor = new Map();
            for (const group of this._editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                const candidate = group.activeEditorPane?.getControl();
                if ((0, editorBrowser_1.isCodeEditor)(candidate)) {
                    groupByEditor.set(candidate, group);
                }
            }
            const groups = [];
            const orphans = new Set();
            for (const data of sessions) {
                const editor = this._inlineChatSessionService.getCodeEditor(data.session);
                const group = groupByEditor.get(editor);
                if (group) {
                    // there is only one session per group because all sessions have the same model
                    // because we save one file.
                    groups.push([group, data]);
                }
                else if (this._editorGroupService.groups.includes(data.groupCandidate)) {
                    // the group candidate is still there. use it
                    groups.push([data.groupCandidate, data]);
                }
                else {
                    orphans.add(data);
                }
            }
            return { groups, orphans };
        }
        async _openAndWait(groups, token) {
            const dataByGroup = new Map();
            for (const [group, data] of groups) {
                let array = dataByGroup.get(group);
                if (!array) {
                    array = [];
                    dataByGroup.set(group, array);
                }
                array.push(data);
            }
            for (const [group, array] of dataByGroup) {
                if (token.isCancellationRequested) {
                    break;
                }
                array.sort((a, b) => (0, strings_1.compare)(a.session.targetUri.toString(), b.session.targetUri.toString()));
                for (const data of array) {
                    const input = { resource: data.resourceUri };
                    const pane = await this._editorService.openEditor(input, group);
                    let editor;
                    if (data.session.targetUri.scheme === network_1.Schemas.vscodeNotebookCell) {
                        const notebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(pane);
                        const uriData = notebookCommon_1.CellUri.parse(data.session.targetUri);
                        if (notebookEditor && notebookEditor.hasModel() && uriData) {
                            const cell = notebookEditor.getCellByHandle(uriData.handle);
                            if (cell) {
                                await notebookEditor.revealRangeInCenterIfOutsideViewportAsync(cell, data.session.wholeRange.value);
                            }
                            const tuple = notebookEditor.codeEditors.find(tuple => tuple[1].getModel()?.uri.toString() === data.session.targetUri.toString());
                            editor = tuple?.[1];
                        }
                    }
                    else {
                        if ((0, editorBrowser_1.isCodeEditor)(pane?.getControl())) {
                            editor = pane.getControl();
                        }
                    }
                    if (!editor) {
                        // PANIC
                        break;
                    }
                    this._inlineChatSessionService.moveSession(data.session, editor);
                    inlineChatController_1.InlineChatController.get(editor)?.showSaveHint();
                    this._logService.info('WAIT for session to end', editor.getId(), data.session.targetUri.toString());
                    await this._whenSessionsEnded(iterator_1.Iterable.single(data), token);
                }
            }
        }
        async _whenSessionsEnded(iterable, token) {
            const sessions = new Map();
            for (const item of iterable) {
                sessions.set(item.session, item);
            }
            if (sessions.size === 0) {
                // nothing to do
                return;
            }
            let listener;
            const whenEnded = new Promise(resolve => {
                listener = event_1.Event.any(this._inlineChatSessionService.onDidEndSession, this._inlineChatSessionService.onDidStashSession)(e => {
                    const data = sessions.get(e.session);
                    if (data) {
                        data.dispose();
                        sessions.delete(e.session);
                        if (sessions.size === 0) {
                            resolve(); // DONE, release waiting
                        }
                    }
                });
            });
            try {
                await (0, async_1.raceCancellation)(whenEnded, token);
            }
            finally {
                listener?.dispose();
            }
        }
    };
    exports.InlineChatSavingServiceImpl = InlineChatSavingServiceImpl;
    exports.InlineChatSavingServiceImpl = InlineChatSavingServiceImpl = __decorate([
        __param(0, filesConfigurationService_1.IFilesConfigurationService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, editorService_1.IEditorService),
        __param(4, inlineChatSessionService_1.IInlineChatSessionService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, workingCopyFileService_1.IWorkingCopyFileService),
        __param(7, log_1.ILogService)
    ], InlineChatSavingServiceImpl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFNhdmluZ1NlcnZpY2VJbXBsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L2Jyb3dzZXIvaW5saW5lQ2hhdFNhdmluZ1NlcnZpY2VJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFDekYsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBMkI7UUFRdkMsWUFDNkIsa0JBQStELEVBQ3JFLG1CQUEwRCxFQUM5RCxnQkFBbUQsRUFDckQsY0FBK0MsRUFDcEMseUJBQXFFLEVBQ3pFLGNBQXNELEVBQ3BELHVCQUFpRSxFQUM3RSxXQUF5QztZQVBULHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBNEI7WUFDcEQsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUM3QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ3BDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUNuQiw4QkFBeUIsR0FBekIseUJBQXlCLENBQTJCO1lBQ3hELG1CQUFjLEdBQWQsY0FBYyxDQUF1QjtZQUNuQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1lBQzVELGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBWnRDLFdBQU0sR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMvQixxQkFBZ0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQUM1RCxpQkFBWSxHQUFHLElBQUksR0FBRyxFQUF3QixDQUFDO1lBWS9ELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsZUFBZSxFQUFFLHlCQUF5QixDQUFDLGlCQUFpQixDQUFDLENB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