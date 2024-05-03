/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VariableError = exports.VariableKind = exports.IConfigurationResolverService = void 0;
    exports.IConfigurationResolverService = (0, instantiation_1.createDecorator)('configurationResolverService');
    var VariableKind;
    (function (VariableKind) {
        VariableKind["Unknown"] = "unknown";
        VariableKind["Env"] = "env";
        VariableKind["Config"] = "config";
        VariableKind["Command"] = "command";
        VariableKind["Input"] = "input";
        VariableKind["ExtensionInstallFolder"] = "extensionInstallFolder";
        VariableKind["WorkspaceFolder"] = "workspaceFolder";
        VariableKind["Cwd"] = "cwd";
        VariableKind["WorkspaceFolderBasename"] = "workspaceFolderBasename";
        VariableKind["UserHome"] = "userHome";
        VariableKind["LineNumber"] = "lineNumber";
        VariableKind["SelectedText"] = "selectedText";
        VariableKind["File"] = "file";
        VariableKind["FileWorkspaceFolder"] = "fileWorkspaceFolder";
        VariableKind["FileWorkspaceFolderBasename"] = "fileWorkspaceFolderBasename";
        VariableKind["RelativeFile"] = "relativeFile";
        VariableKind["RelativeFileDirname"] = "relativeFileDirname";
        VariableKind["FileDirname"] = "fileDirname";
        VariableKind["FileExtname"] = "fileExtname";
        VariableKind["FileBasename"] = "fileBasename";
        VariableKind["FileBasenameNoExtension"] = "fileBasenameNoExtension";
        VariableKind["FileDirnameBasename"] = "fileDirnameBasename";
        VariableKind["ExecPath"] = "execPath";
        VariableKind["ExecInstallFolder"] = "execInstallFolder";
        VariableKind["PathSeparator"] = "pathSeparator";
        VariableKind["PathSeparatorAlias"] = "/";
    })(VariableKind || (exports.VariableKind = VariableKind = {}));
    class VariableError extends Error {
        constructor(variable, message) {
            super(message);
            this.variable = variable;
        }
    }
    exports.VariableError = VariableError;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvblJlc29sdmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvY29uZmlndXJhdGlvblJlc29sdmVyL2NvbW1vbi9jb25maWd1cmF0aW9uUmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUW5GLFFBQUEsNkJBQTZCLEdBQUcsSUFBQSwrQkFBZSxFQUFnQyw4QkFBOEIsQ0FBQyxDQUFDO0lBdUU1SCxJQUFZLFlBNkJYO0lBN0JELFdBQVksWUFBWTtRQUN2QixtQ0FBbUIsQ0FBQTtRQUVuQiwyQkFBVyxDQUFBO1FBQ1gsaUNBQWlCLENBQUE7UUFDakIsbUNBQW1CLENBQUE7UUFDbkIsK0JBQWUsQ0FBQTtRQUNmLGlFQUFpRCxDQUFBO1FBRWpELG1EQUFtQyxDQUFBO1FBQ25DLDJCQUFXLENBQUE7UUFDWCxtRUFBbUQsQ0FBQTtRQUNuRCxxQ0FBcUIsQ0FBQTtRQUNyQix5Q0FBeUIsQ0FBQTtRQUN6Qiw2Q0FBNkIsQ0FBQTtRQUM3Qiw2QkFBYSxDQUFBO1FBQ2IsMkRBQTJDLENBQUE7UUFDM0MsMkVBQTJELENBQUE7UUFDM0QsNkNBQTZCLENBQUE7UUFDN0IsMkRBQTJDLENBQUE7UUFDM0MsMkNBQTJCLENBQUE7UUFDM0IsMkNBQTJCLENBQUE7UUFDM0IsNkNBQTZCLENBQUE7UUFDN0IsbUVBQW1ELENBQUE7UUFDbkQsMkRBQTJDLENBQUE7UUFDM0MscUNBQXFCLENBQUE7UUFDckIsdURBQXVDLENBQUE7UUFDdkMsK0NBQStCLENBQUE7UUFDL0Isd0NBQXdCLENBQUE7SUFDekIsQ0FBQyxFQTdCVyxZQUFZLDRCQUFaLFlBQVksUUE2QnZCO0lBRUQsTUFBYSxhQUFjLFNBQVEsS0FBSztRQUN2QyxZQUE0QixRQUFzQixFQUFFLE9BQWdCO1lBQ25FLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQURZLGFBQVEsR0FBUixRQUFRLENBQWM7UUFFbEQsQ0FBQztLQUNEO0lBSkQsc0NBSUMifQ==