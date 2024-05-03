/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/severity", "vs/nls", "vs/platform/instantiation/common/instantiation"], function (require, exports, severity_1, nls_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IMarkerService = exports.IMarkerData = exports.MarkerSeverity = exports.MarkerTag = void 0;
    var MarkerTag;
    (function (MarkerTag) {
        MarkerTag[MarkerTag["Unnecessary"] = 1] = "Unnecessary";
        MarkerTag[MarkerTag["Deprecated"] = 2] = "Deprecated";
    })(MarkerTag || (exports.MarkerTag = MarkerTag = {}));
    var MarkerSeverity;
    (function (MarkerSeverity) {
        MarkerSeverity[MarkerSeverity["Hint"] = 1] = "Hint";
        MarkerSeverity[MarkerSeverity["Info"] = 2] = "Info";
        MarkerSeverity[MarkerSeverity["Warning"] = 4] = "Warning";
        MarkerSeverity[MarkerSeverity["Error"] = 8] = "Error";
    })(MarkerSeverity || (exports.MarkerSeverity = MarkerSeverity = {}));
    (function (MarkerSeverity) {
        function compare(a, b) {
            return b - a;
        }
        MarkerSeverity.compare = compare;
        const _displayStrings = Object.create(null);
        _displayStrings[MarkerSeverity.Error] = (0, nls_1.localize)('sev.error', "Error");
        _displayStrings[MarkerSeverity.Warning] = (0, nls_1.localize)('sev.warning', "Warning");
        _displayStrings[MarkerSeverity.Info] = (0, nls_1.localize)('sev.info', "Info");
        function toString(a) {
            return _displayStrings[a] || '';
        }
        MarkerSeverity.toString = toString;
        function fromSeverity(severity) {
            switch (severity) {
                case severity_1.default.Error: return MarkerSeverity.Error;
                case severity_1.default.Warning: return MarkerSeverity.Warning;
                case severity_1.default.Info: return MarkerSeverity.Info;
                case severity_1.default.Ignore: return MarkerSeverity.Hint;
            }
        }
        MarkerSeverity.fromSeverity = fromSeverity;
        function toSeverity(severity) {
            switch (severity) {
                case MarkerSeverity.Error: return severity_1.default.Error;
                case MarkerSeverity.Warning: return severity_1.default.Warning;
                case MarkerSeverity.Info: return severity_1.default.Info;
                case MarkerSeverity.Hint: return severity_1.default.Ignore;
            }
        }
        MarkerSeverity.toSeverity = toSeverity;
    })(MarkerSeverity || (exports.MarkerSeverity = MarkerSeverity = {}));
    var IMarkerData;
    (function (IMarkerData) {
        const emptyString = '';
        function makeKey(markerData) {
            return makeKeyOptionalMessage(markerData, true);
        }
        IMarkerData.makeKey = makeKey;
        function makeKeyOptionalMessage(markerData, useMessage) {
            const result = [emptyString];
            if (markerData.source) {
                result.push(markerData.source.replace('¦', '\\¦'));
            }
            else {
                result.push(emptyString);
            }
            if (markerData.code) {
                if (typeof markerData.code === 'string') {
                    result.push(markerData.code.replace('¦', '\\¦'));
                }
                else {
                    result.push(markerData.code.value.replace('¦', '\\¦'));
                }
            }
            else {
                result.push(emptyString);
            }
            if (markerData.severity !== undefined && markerData.severity !== null) {
                result.push(MarkerSeverity.toString(markerData.severity));
            }
            else {
                result.push(emptyString);
            }
            // Modifed to not include the message as part of the marker key to work around
            // https://github.com/microsoft/vscode/issues/77475
            if (markerData.message && useMessage) {
                result.push(markerData.message.replace('¦', '\\¦'));
            }
            else {
                result.push(emptyString);
            }
            if (markerData.startLineNumber !== undefined && markerData.startLineNumber !== null) {
                result.push(markerData.startLineNumber.toString());
            }
            else {
                result.push(emptyString);
            }
            if (markerData.startColumn !== undefined && markerData.startColumn !== null) {
                result.push(markerData.startColumn.toString());
            }
            else {
                result.push(emptyString);
            }
            if (markerData.endLineNumber !== undefined && markerData.endLineNumber !== null) {
                result.push(markerData.endLineNumber.toString());
            }
            else {
                result.push(emptyString);
            }
            if (markerData.endColumn !== undefined && markerData.endColumn !== null) {
                result.push(markerData.endColumn.toString());
            }
            else {
                result.push(emptyString);
            }
            result.push(emptyString);
            return result.join('¦');
        }
        IMarkerData.makeKeyOptionalMessage = makeKeyOptionalMessage;
    })(IMarkerData || (exports.IMarkerData = IMarkerData = {}));
    exports.IMarkerService = (0, instantiation_1.createDecorator)('markerService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbWFya2Vycy9jb21tb24vbWFya2Vycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvQ2hHLElBQWtCLFNBR2pCO0lBSEQsV0FBa0IsU0FBUztRQUMxQix1REFBZSxDQUFBO1FBQ2YscURBQWMsQ0FBQTtJQUNmLENBQUMsRUFIaUIsU0FBUyx5QkFBVCxTQUFTLFFBRzFCO0lBRUQsSUFBWSxjQUtYO0lBTEQsV0FBWSxjQUFjO1FBQ3pCLG1EQUFRLENBQUE7UUFDUixtREFBUSxDQUFBO1FBQ1IseURBQVcsQ0FBQTtRQUNYLHFEQUFTLENBQUE7SUFDVixDQUFDLEVBTFcsY0FBYyw4QkFBZCxjQUFjLFFBS3pCO0lBRUQsV0FBaUIsY0FBYztRQUU5QixTQUFnQixPQUFPLENBQUMsQ0FBaUIsRUFBRSxDQUFpQjtZQUMzRCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDZCxDQUFDO1FBRmUsc0JBQU8sVUFFdEIsQ0FBQTtRQUVELE1BQU0sZUFBZSxHQUFnQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pFLGVBQWUsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZFLGVBQWUsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBQSxjQUFRLEVBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzdFLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRXBFLFNBQWdCLFFBQVEsQ0FBQyxDQUFpQjtZQUN6QyxPQUFPLGVBQWUsQ0FB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