/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Severity;
    (function (Severity) {
        Severity[Severity["Ignore"] = 0] = "Ignore";
        Severity[Severity["Info"] = 1] = "Info";
        Severity[Severity["Warning"] = 2] = "Warning";
        Severity[Severity["Error"] = 3] = "Error";
    })(Severity || (Severity = {}));
    (function (Severity) {
        const _error = 'error';
        const _warning = 'warning';
        const _warn = 'warn';
        const _info = 'info';
        const _ignore = 'ignore';
        /**
         * Parses 'error', 'warning', 'warn', 'info' in call casings
         * and falls back to ignore.
         */
        function fromValue(value) {
            if (!value) {
                return Severity.Ignore;
            }
            if (strings.equalsIgnoreCase(_error, value)) {
                return Severity.Error;
            }
            if (strings.equalsIgnoreCase(_warning, value) || strings.equalsIgnoreCase(_warn, value)) {
                return Severity.Warning;
            }
            if (strings.equalsIgnoreCase(_info, value)) {
                return Severity.Info;
            }
            return Severity.Ignore;
        }
        Severity.fromValue = fromValue;
        function toString(severity) {
            switch (severity) {
                case Severity.Error: return _error;
                case Severity.Warning: return _warning;
                case Severity.Info: return _info;
                default: return _ignore;
            }
        }
        Severity.toString = toString;
    })(Severity || (Severity = {}));
    exports.default = Severity;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V2ZXJpdHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3NldmVyaXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBSWhHLElBQUssUUFLSjtJQUxELFdBQUssUUFBUTtRQUNaLDJDQUFVLENBQUE7UUFDVix1Q0FBUSxDQUFBO1FBQ1IsNkNBQVcsQ0FBQTtRQUNYLHlDQUFTLENBQUE7SUFDVixDQUFDLEVBTEksUUFBUSxLQUFSLFFBQVEsUUFLWjtJQUVELFdBQVUsUUFBUTtRQUVqQixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUM7UUFDdkIsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDO1FBQzNCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQztRQUNyQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUM7UUFDckIsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDO1FBRXpCOzs7V0FHRztRQUNILFNBQWdCLFNBQVMsQ0FBQyxLQUFhO1lBQ3RDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUM7WUFDeEIsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM3QyxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFDdkIsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3pGLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQztZQUN6QixDQUFDO1lBRUQsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzVDLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQztZQUN0QixDQUFDO1lBQ0QsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQ3hCLENBQUM7UUFqQmUsa0JBQVMsWUFpQnhCLENBQUE7UUFFRCxTQUFnQixRQUFRLENBQUMsUUFBa0I7WUFDMUMsUUFBUSxRQUFRLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxNQUFNLENBQUM7Z0JBQ25DLEtBQUssUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sUUFBUSxDQUFDO2dCQUN2QyxLQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQztnQkFDakMsT0FBTyxDQUFDLENBQUMsT0FBTyxPQUFPLENBQUM7WUFDekIsQ0FBQztRQUNGLENBQUM7UUFQZSxpQkFBUSxXQU92QixDQUFBO0lBQ0YsQ0FBQyxFQXZDUyxRQUFRLEtBQVIsUUFBUSxRQXVDakI7SUFFRCxrQkFBZSxRQUFRLENBQUMifQ==