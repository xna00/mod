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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "./inlineChatSessionService", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, errors_1, lifecycle_1, network_1, resources_1, inlineChatController_1, inlineChatSessionService_1, notebookEditorService_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatNotebookContribution = void 0;
    let InlineChatNotebookContribution = class InlineChatNotebookContribution {
        constructor(sessionService, notebookEditorService) {
            this._store = new lifecycle_1.DisposableStore();
            this._store.add(sessionService.registerSessionKeyComputer(network_1.Schemas.vscodeNotebookCell, {
                getComparisonKey: (editor, uri) => {
                    const data = notebookCommon_1.CellUri.parse(uri);
                    if (!data) {
                        throw (0, errors_1.illegalState)('Expected notebook cell uri');
                    }
                    let fallback;
                    for (const notebookEditor of notebookEditorService.listNotebookEditors()) {
                        if (notebookEditor.hasModel() && (0, resources_1.isEqual)(notebookEditor.textModel.uri, data.notebook)) {
                            const candidate = `<notebook>${notebookEditor.getId()}#${uri}`;
                            if (!fallback) {
                                fallback = candidate;
                            }
                            // find the code editor in the list of cell-code editors
                            if (notebookEditor.codeEditors.find((tuple) => tuple[1] === editor)) {
                                return candidate;
                            }
                            // 	// reveal cell and try to find code editor again
                            // 	const cell = notebookEditor.getCellByHandle(data.handle);
                            // 	if (cell) {
                            // 		notebookEditor.revealInViewAtTop(cell);
                            // 		if (notebookEditor.codeEditors.find((tuple) => tuple[1] === editor)) {
                            // 			return candidate;
                            // 		}
                            // 	}
                        }
                    }
                    if (fallback) {
                        return fallback;
                    }
                    throw (0, errors_1.illegalState)('Expected notebook editor');
                }
            }));
            this._store.add(sessionService.onWillStartSession(newSessionEditor => {
                const candidate = notebookCommon_1.CellUri.parse(newSessionEditor.getModel().uri);
                if (!candidate) {
                    return;
                }
                for (const notebookEditor of notebookEditorService.listNotebookEditors()) {
                    if ((0, resources_1.isEqual)(notebookEditor.textModel?.uri, candidate.notebook)) {
                        let found = false;
                        const editors = [];
                        for (const [, codeEditor] of notebookEditor.codeEditors) {
                            editors.push(codeEditor);
                            found = codeEditor === newSessionEditor || found;
                        }
                        if (found) {
                            // found the this editor in the outer notebook editor -> make sure to
                            // cancel all sibling sessions
                            for (const editor of editors) {
                                if (editor !== newSessionEditor) {
                                    inlineChatController_1.InlineChatController.get(editor)?.finishExistingSession();
                                }
                            }
                            break;
                        }
                    }
                }
            }));
        }
        dispose() {
            this._store.dispose();
        }
    };
    exports.InlineChatNotebookContribution = InlineChatNotebookContribution;
    exports.InlineChatNotebookContribution = InlineChatNotebookContribution = __decorate([
        __param(0, inlineChatSessionService_1.IInlineChatSessionService),
        __param(1, notebookEditorService_1.INotebookEditorService)
    ], InlineChatNotebookContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdE5vdGVib29rLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L2Jyb3dzZXIvaW5saW5lQ2hhdE5vdGVib29rLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVl6RixJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUE4QjtRQUkxQyxZQUM0QixjQUF5QyxFQUM1QyxxQkFBNkM7WUFKckQsV0FBTSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBTy9DLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQywwQkFBMEIsQ0FBQyxpQkFBTyxDQUFDLGtCQUFrQixFQUFFO2dCQUNyRixnQkFBZ0IsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRTtvQkFDakMsTUFBTSxJQUFJLEdBQUcsd0JBQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2hDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzt3QkFDWCxNQUFNLElBQUEscUJBQVksRUFBQyw0QkFBNEIsQ0FBQyxDQUFDO29CQUNsRCxDQUFDO29CQUNELElBQUksUUFBNEIsQ0FBQztvQkFDakMsS0FBSyxNQUFNLGNBQWMsSUFBSSxxQkFBcUIsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUM7d0JBQzFFLElBQUksY0FBYyxDQUFDLFFBQVEsRUFBRSxJQUFJLElBQUEsbUJBQU8sRUFBQyxjQUFjLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQzs0QkFFdkYsTUFBTSxTQUFTLEdBQUcsYUFBYSxjQUFjLENBQUMsS0FBSyxFQUFFLElBQUksR0FBRyxFQUFFLENBQUM7NEJBRS9ELElBQUksQ0FB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