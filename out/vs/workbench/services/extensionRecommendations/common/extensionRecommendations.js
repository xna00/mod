/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtensionIgnoredRecommendationsService = exports.IExtensionRecommendationsService = exports.ExtensionRecommendationReason = void 0;
    var ExtensionRecommendationReason;
    (function (ExtensionRecommendationReason) {
        ExtensionRecommendationReason[ExtensionRecommendationReason["Workspace"] = 0] = "Workspace";
        ExtensionRecommendationReason[ExtensionRecommendationReason["File"] = 1] = "File";
        ExtensionRecommendationReason[ExtensionRecommendationReason["Executable"] = 2] = "Executable";
        ExtensionRecommendationReason[ExtensionRecommendationReason["WorkspaceConfig"] = 3] = "WorkspaceConfig";
        ExtensionRecommendationReason[ExtensionRecommendationReason["DynamicWorkspace"] = 4] = "DynamicWorkspace";
        ExtensionRecommendationReason[ExtensionRecommendationReason["Experimental"] = 5] = "Experimental";
        ExtensionRecommendationReason[ExtensionRecommendationReason["Application"] = 6] = "Application";
    })(ExtensionRecommendationReason || (exports.ExtensionRecommendationReason = ExtensionRecommendationReason = {}));
    exports.IExtensionRecommendationsService = (0, instantiation_1.createDecorator)('extensionRecommendationsService');
    exports.IExtensionIgnoredRecommendationsService = (0, instantiation_1.createDecorator)('IExtensionIgnoredRecommendationsService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUmVjb21tZW5kYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9uUmVjb21tZW5kYXRpb25zL2NvbW1vbi9leHRlbnNpb25SZWNvbW1lbmRhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLElBQWtCLDZCQVFqQjtJQVJELFdBQWtCLDZCQUE2QjtRQUM5QywyRkFBUyxDQUFBO1FBQ1QsaUZBQUksQ0FBQTtRQUNKLDZGQUFVLENBQUE7UUFDVix1R0FBZSxDQUFBO1FBQ2YseUdBQWdCLENBQUE7UUFDaEIsaUdBQVksQ0FBQTtRQUNaLCtGQUFXLENBQUE7SUFDWixDQUFDLEVBUmlCLDZCQUE2Qiw2Q0FBN0IsNkJBQTZCLFFBUTlDO0lBT1ksUUFBQSxnQ0FBZ0MsR0FBRyxJQUFBLCtCQUFlLEVBQW1DLGlDQUFpQyxDQUFDLENBQUM7SUF3QnhILFFBQUEsdUNBQXVDLEdBQUcsSUFBQSwrQkFBZSxFQUEwQyx5Q0FBeUMsQ0FBQyxDQUFDIn0=