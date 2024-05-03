/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/common/extHostCommands"], function (require, exports, uri_1, extHostCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostInteractive = void 0;
    class ExtHostInteractive {
        constructor(mainContext, _extHostNotebooks, _textDocumentsAndEditors, _commands, _logService) {
            this._extHostNotebooks = _extHostNotebooks;
            this._textDocumentsAndEditors = _textDocumentsAndEditors;
            this._commands = _commands;
            const openApiCommand = new extHostCommands_1.ApiCommand('interactive.open', '_interactive.open', 'Open interactive window and return notebook editor and input URI', [
                new extHostCommands_1.ApiCommandArgument('showOptions', 'Show Options', v => true, v => v),
                new extHostCommands_1.ApiCommandArgument('resource', 'Interactive resource Uri', v => true, v => v),
                new extHostCommands_1.ApiCommandArgument('controllerId', 'Notebook controller Id', v => true, v => v),
                new extHostCommands_1.ApiCommandArgument('title', 'Interactive editor title', v => true, v => v)
            ], new extHostCommands_1.ApiCommandResult('Notebook and input URI', (v) => {
                _logService.debug('[ExtHostInteractive] open iw with notebook editor id', v.notebookEditorId);
                if (v.notebookEditorId !== undefined) {
                    const editor = this._extHostNotebooks.getEditorById(v.notebookEditorId);
                    _logService.debug('[ExtHostInteractive] notebook editor found', editor.id);
                    return { notebookUri: uri_1.URI.revive(v.notebookUri), inputUri: uri_1.URI.revive(v.inputUri), notebookEditor: editor.apiEditor };
                }
                _logService.debug('[ExtHostInteractive] notebook editor not found, uris for the interactive document', v.notebookUri, v.inputUri);
                return { notebookUri: uri_1.URI.revive(v.notebookUri), inputUri: uri_1.URI.revive(v.inputUri) };
            }));
            this._commands.registerApiCommand(openApiCommand);
        }
        $willAddInteractiveDocument(uri, eol, languageId, notebookUri) {
            this._textDocumentsAndEditors.acceptDocumentsAndEditorsDelta({
                addedDocuments: [{
                        EOL: eol,
                        lines: [''],
                        languageId: languageId,
                        uri: uri,
                        isDirty: false,
                        versionId: 1,
                    }]
            });
        }
        $willRemoveInteractiveDocument(uri, notebookUri) {
            this._textDocumentsAndEditors.acceptDocumentsAndEditorsDelta({
                removedDocuments: [uri]
            });
        }
    }
    exports.ExtHostInteractive = ExtHostInteractive;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEludGVyYWN0aXZlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0SW50ZXJhY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQWEsa0JBQWtCO1FBQzlCLFlBQ0MsV0FBeUIsRUFDakIsaUJBQTRDLEVBQzVDLHdCQUFvRCxFQUNwRCxTQUEwQixFQUNsQyxXQUF3QjtZQUhoQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQTJCO1lBQzVDLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBNEI7WUFDcEQsY0FBUyxHQUFULFNBQVMsQ0FBaUI7WUFHbEMsTUFBTSxjQUFjLEdBQUcsSUFBSSw0QkFBVSxDQUNwQyxrQkFBa0IsRUFDbEIsbUJBQW1CLEVBQ25CLGtFQUFrRSxFQUNsRTtnQkFDQyxJQUFJLG9DQUFrQixDQUFDLGFBQWEsRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hFLElBQUksb0NBQWtCLENBQUMsVUFBVSxFQUFFLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNqRixJQUFJLG9DQUFrQixDQUFDLGNBQWMsRUFBRSx3QkFBd0IsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbkYsSUFBSSxvQ0FBa0IsQ0FBQyxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDOUUsRUFDRCxJQUFJLGtDQUFnQixDQUEySix3QkFBd0IsRUFBRSxDQUFDLENBQXFGLEVBQUUsRUFBRTtnQkFDbFMsV0FBVyxDQUFDLEtBQUssQ0FBQyxzREFBc0QsRUFBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDOUYsSUFBSSxDQUFDLENBQUMsZ0JBQWdCLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQ3RDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUM7b0JBQ3hFLFdBQVcsQ0FBQyxLQUFLLENBQUMsNENBQTRDLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUMzRSxPQUFPLEVBQUUsV0FBVyxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxTQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxjQUFjLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN2SCxDQUFDO2dCQUNELFdBQVcsQ0FBQyxLQUFLLENBQUMsbUZBQW1GLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2xJLE9BQU8sRUFBRSxXQUFXLEVBQUUsU0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQUUsUUFBUSxFQUFFLFNBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDckYsQ0FBQyxDQUFDLENBQ0YsQ0FBQztZQUNGLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVELDJCQUEyQixDQUFDLEdBQWtCLEVBQUUsR0FBVyxFQUFFLFVBQWtCLEVBQUUsV0FBMEI7WUFDMUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLDhCQUE4QixDQUFDO2dCQUM1RCxjQUFjLEVBQUUsQ0FBQzt3QkFDaEIsR0FBRyxFQUFFLEdBQUc7d0JBQ1IsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO3dCQUNYLFVBQVUsRUFBRSxVQUFVO3dCQUN0QixHQUFHLEVBQUUsR0FBRzt3QkFDUixPQUFPLEVBQUUsS0FBSzt3QkFDZCxTQUFTLEVBQUUsQ0FBQztxQkFDWixDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELDhCQUE4QixDQUFDLEdBQWtCLEVBQUUsV0FBMEI7WUFDNUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLDhCQUE4QixDQUFDO2dCQUM1RCxnQkFBZ0IsRUFBRSxDQUFDLEdBQUcsQ0FBQzthQUN2QixDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUFsREQsZ0RBa0RDIn0=