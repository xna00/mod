/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getParseErrorMessage = getParseErrorMessage;
    function getParseErrorMessage(errorCode) {
        switch (errorCode) {
            case 1 /* ParseErrorCode.InvalidSymbol */: return (0, nls_1.localize)('error.invalidSymbol', 'Invalid symbol');
            case 2 /* ParseErrorCode.InvalidNumberFormat */: return (0, nls_1.localize)('error.invalidNumberFormat', 'Invalid number format');
            case 3 /* ParseErrorCode.PropertyNameExpected */: return (0, nls_1.localize)('error.propertyNameExpected', 'Property name expected');
            case 4 /* ParseErrorCode.ValueExpected */: return (0, nls_1.localize)('error.valueExpected', 'Value expected');
            case 5 /* ParseErrorCode.ColonExpected */: return (0, nls_1.localize)('error.colonExpected', 'Colon expected');
            case 6 /* ParseErrorCode.CommaExpected */: return (0, nls_1.localize)('error.commaExpected', 'Comma expected');
            case 7 /* ParseErrorCode.CloseBraceExpected */: return (0, nls_1.localize)('error.closeBraceExpected', 'Closing brace expected');
            case 8 /* ParseErrorCode.CloseBracketExpected */: return (0, nls_1.localize)('error.closeBracketExpected', 'Closing bracket expected');
            case 9 /* ParseErrorCode.EndOfFileExpected */: return (0, nls_1.localize)('error.endOfFileExpected', 'End of file expected');
            default:
                return '';
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbkVycm9yTWVzc2FnZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2pzb25FcnJvck1lc3NhZ2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLG9EQWNDO0lBZEQsU0FBZ0Isb0JBQW9CLENBQUMsU0FBeUI7UUFDN0QsUUFBUSxTQUFTLEVBQUUsQ0FBQztZQUNuQix5Q0FBaUMsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUM1RiwrQ0FBdUMsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQUMvRyxnREFBd0MsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztZQUNsSCx5Q0FBaUMsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUM1Rix5Q0FBaUMsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUM1Rix5Q0FBaUMsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUM1Riw4Q0FBc0MsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMsMEJBQTBCLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztZQUM5RyxnREFBd0MsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztZQUNwSCw2Q0FBcUMsQ0FBQyxDQUFDLE9BQU8sSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztZQUMxRztnQkFDQyxPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUM7SUFDRixDQUFDIn0=