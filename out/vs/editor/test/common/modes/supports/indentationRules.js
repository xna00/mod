/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.goIndentationRules = exports.phpIndentationRules = exports.rubyIndentationRules = exports.javascriptIndentationRules = void 0;
    exports.javascriptIndentationRules = {
        decreaseIndentPattern: /^((?!.*?\/\*).*\*\/)?\s*[\}\]\)].*$/,
        increaseIndentPattern: /^((?!\/\/).)*(\{([^}"'`]*|(\t|[ ])*\/\/.*)|\([^)"'`]*|\[[^\]"'`]*)$/,
        // e.g.  * ...| or */| or *-----*/|
        unIndentedLinePattern: /^(\t|[ ])*[ ]\*[^/]*\*\/\s*$|^(\t|[ ])*[ ]\*\/\s*$|^(\t|[ ])*[ ]\*([ ]([^\*]|\*(?!\/))*)?$/,
        indentNextLinePattern: /^((.*=>\s*)|((.*[^\w]+|\s*)(if|while|for)\s*\(.*\)\s*))$/,
    };
    exports.rubyIndentationRules = {
        decreaseIndentPattern: /^\s*([}\]]([,)]?\s*(#|$)|\.[a-zA-Z_]\w*\b)|(end|rescue|ensure|else|elsif)\b|(in|when)\s)/,
        increaseIndentPattern: /^\s*((begin|class|(private|protected)\s+def|def|else|elsif|ensure|for|if|module|rescue|unless|until|when|in|while|case)|([^#]*\sdo\b)|([^#]*=\s*(case|if|unless)))\b([^#\{;]|(\"|'|\/).*\4)*(#.*)?$/,
    };
    exports.phpIndentationRules = {
        increaseIndentPattern: /({(?!.*}).*|\(|\[|((else(\s)?)?if|else|for(each)?|while|switch|case).*:)\s*((\/[/*].*|)?$|\?>)/,
        decreaseIndentPattern: /^(.*\*\/)?\s*((\})|(\)+[;,])|(\]\)*[;,])|\b(else:)|\b((end(if|for(each)?|while|switch));))/,
    };
    exports.goIndentationRules = {
        decreaseIndentPattern: /^\s*(\bcase\b.*:|\bdefault\b:|}[)}]*[),]?|\)[,]?)$/,
        increaseIndentPattern: /^.*(\bcase\b.*:|\bdefault\b:|(\b(func|if|else|switch|select|for|struct)\b.*)?{[^}"'`]*|\([^)"'`]*)$/,
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50YXRpb25SdWxlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL21vZGVzL3N1cHBvcnRzL2luZGVudGF0aW9uUnVsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBRW5GLFFBQUEsMEJBQTBCLEdBQUc7UUFDekMscUJBQXFCLEVBQUUscUNBQXFDO1FBQzVELHFCQUFxQixFQUFFLHFFQUFxRTtRQUM1RixtQ0FBbUM7UUFDbkMscUJBQXFCLEVBQUUsNEZBQTRGO1FBQ25ILHFCQUFxQixFQUFFLDBEQUEwRDtLQUNqRixDQUFDO0lBRVcsUUFBQSxvQkFBb0IsR0FBRztRQUNuQyxxQkFBcUIsRUFBRSwwRkFBMEY7UUFDakgscUJBQXFCLEVBQUUscU1BQXFNO0tBQzVOLENBQUM7SUFFVyxRQUFBLG1CQUFtQixHQUFHO1FBQ2xDLHFCQUFxQixFQUFFLGdHQUFnRztRQUN2SCxxQkFBcUIsRUFBRSw0RkFBNEY7S0FDbkgsQ0FBQztJQUVXLFFBQUEsa0JBQWtCLEdBQUc7UUFDakMscUJBQXFCLEVBQUUsb0RBQW9EO1FBQzNFLHFCQUFxQixFQUFFLHFHQUFxRztLQUM1SCxDQUFDIn0=