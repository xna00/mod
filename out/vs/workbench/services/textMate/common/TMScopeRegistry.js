/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources"], function (require, exports, resources) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TMScopeRegistry = void 0;
    class TMScopeRegistry {
        constructor() {
            this._scopeNameToLanguageRegistration = Object.create(null);
        }
        reset() {
            this._scopeNameToLanguageRegistration = Object.create(null);
        }
        register(def) {
            if (this._scopeNameToLanguageRegistration[def.scopeName]) {
                const existingRegistration = this._scopeNameToLanguageRegistration[def.scopeName];
                if (!resources.isEqual(existingRegistration.location, def.location)) {
                    console.warn(`Overwriting grammar scope name to file mapping for scope ${def.scopeName}.\n` +
                        `Old grammar file: ${existingRegistration.location.toString()}.\n` +
                        `New grammar file: ${def.location.toString()}`);
                }
            }
            this._scopeNameToLanguageRegistration[def.scopeName] = def;
        }
        getGrammarDefinition(scopeName) {
            return this._scopeNameToLanguageRegistration[scopeName] || null;
        }
    }
    exports.TMScopeRegistry = TMScopeRegistry;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVE1TY29wZVJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dE1hdGUvY29tbW9uL1RNU2NvcGVSZWdpc3RyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwQmhHLE1BQWEsZUFBZTtRQUkzQjtZQUNDLElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFTSxLQUFLO1lBQ1gsSUFBSSxDQUFDLGdDQUFnQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUVNLFFBQVEsQ0FBQyxHQUE0QjtZQUMzQyxJQUFJLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDMUQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNsRixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ3JFLE9BQU8sQ0FBQyxJQUFJLENBQ1gsNERBQTRELEdBQUcsQ0FBQyxTQUFTLEtBQUs7d0JBQzlFLHFCQUFxQixvQkFBb0IsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEtBQUs7d0JBQ2xFLHFCQUFxQixHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQzlDLENBQUM7Z0JBQ0gsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLENBQUMsZ0NBQWdDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUM1RCxDQUFDO1FBRU0sb0JBQW9CLENBQUMsU0FBaUI7WUFDNUMsT0FBTyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxDQUFDO1FBQ2pFLENBQUM7S0FDRDtJQTdCRCwwQ0E2QkMifQ==