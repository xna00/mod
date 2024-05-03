/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageDetectionStatsId = exports.AutomaticLanguageDetectionLikelyWrongId = exports.LanguageDetectionLanguageEventSource = exports.ILanguageDetectionService = void 0;
    exports.ILanguageDetectionService = (0, instantiation_1.createDecorator)('ILanguageDetectionService');
    exports.LanguageDetectionLanguageEventSource = 'languageDetection';
    //#region Telemetry events
    exports.AutomaticLanguageDetectionLikelyWrongId = 'automaticlanguagedetection.likelywrong';
    exports.LanguageDetectionStatsId = 'automaticlanguagedetection.stats';
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VEZXRlY3Rpb25Xb3JrZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvbGFuZ3VhZ2VEZXRlY3Rpb24vY29tbW9uL2xhbmd1YWdlRGV0ZWN0aW9uV29ya2VyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLbkYsUUFBQSx5QkFBeUIsR0FBRyxJQUFBLCtCQUFlLEVBQTRCLDJCQUEyQixDQUFDLENBQUM7SUFFcEcsUUFBQSxvQ0FBb0MsR0FBRyxtQkFBbUIsQ0FBQztJQXdCeEUsMEJBQTBCO0lBRWIsUUFBQSx1Q0FBdUMsR0FBRyx3Q0FBd0MsQ0FBQztJQWtCbkYsUUFBQSx3QkFBd0IsR0FBRyxrQ0FBa0MsQ0FBQzs7QUFnQjNFLFlBQVkifQ==