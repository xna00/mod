/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/extensionManagement/common/configRemotes"], function (require, exports, instantiation_1, configRemotes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWorkspaceTagsService = void 0;
    exports.getHashedRemotesFromConfig = getHashedRemotesFromConfig;
    exports.IWorkspaceTagsService = (0, instantiation_1.createDecorator)('workspaceTagsService');
    async function getHashedRemotesFromConfig(text, stripEndingDotGit = false, sha1Hex) {
        return Promise.all((0, configRemotes_1.getRemotes)(text, stripEndingDotGit).map(remote => sha1Hex(remote)));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVGFncy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFncy9jb21tb24vd29ya3NwYWNlVGFncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5QmhHLGdFQUVDO0lBbEJZLFFBQUEscUJBQXFCLEdBQUcsSUFBQSwrQkFBZSxFQUF3QixzQkFBc0IsQ0FBQyxDQUFDO0lBZ0I3RixLQUFLLFVBQVUsMEJBQTBCLENBQUMsSUFBWSxFQUFFLG9CQUE2QixLQUFLLEVBQUUsT0FBeUM7UUFDM0ksT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUEsMEJBQVUsRUFBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hGLENBQUMifQ==