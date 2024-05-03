/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/editor/common/standaloneStrings", "vs/platform/quickinput/browser/helpQuickAccess"], function (require, exports, platform_1, quickAccess_1, standaloneStrings_1, helpQuickAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: helpQuickAccess_1.HelpQuickAccessProvider,
        prefix: '',
        helpEntries: [{ description: standaloneStrings_1.QuickHelpNLS.helpQuickAccessActionLabel }]
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUhlbHBRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3N0YW5kYWxvbmUvYnJvd3Nlci9xdWlja0FjY2Vzcy9zdGFuZGFsb25lSGVscFF1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLG1CQUFRLENBQUMsRUFBRSxDQUF1Qix3QkFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLDJCQUEyQixDQUFDO1FBQ3JGLElBQUksRUFBRSx5Q0FBdUI7UUFDN0IsTUFBTSxFQUFFLEVBQUU7UUFDVixXQUFXLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxnQ0FBWSxDQUFDLDBCQUEwQixFQUFFLENBQUM7S0FDdkUsQ0FBQyxDQUFDIn0=