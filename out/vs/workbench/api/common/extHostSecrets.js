/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/base/common/event"], function (require, exports, extensions_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionSecrets = void 0;
    class ExtensionSecrets {
        #secretState;
        constructor(extensionDescription, secretState) {
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._id = extensions_1.ExtensionIdentifier.toKey(extensionDescription.identifier);
            this.#secretState = secretState;
            this.#secretState.onDidChangePassword(e => {
                if (e.extensionId === this._id) {
                    this._onDidChange.fire({ key: e.key });
                }
            });
        }
        get(key) {
            return this.#secretState.get(this._id, key);
        }
        store(key, value) {
            return this.#secretState.store(this._id, key, value);
        }
        delete(key) {
            return this.#secretState.delete(this._id, key);
        }
    }
    exports.ExtensionSecrets = ExtensionSecrets;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFNlY3JldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RTZWNyZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLGdCQUFnQjtRQUduQixZQUFZLENBQXFCO1FBTTFDLFlBQVksb0JBQTJDLEVBQUUsV0FBK0I7WUFKaEYsaUJBQVksR0FBRyxJQUFJLGVBQU8sRUFBbUMsQ0FBQztZQUM3RCxnQkFBVyxHQUEyQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUl0RixJQUFJLENBQUMsR0FBRyxHQUFHLGdDQUFtQixDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztZQUVoQyxJQUFJLENBQUMsWUFBWSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN6QyxJQUFJLENBQUMsQ0FBQyxXQUFXLEtBQUssSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUNoQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDeEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEdBQUcsQ0FBQyxHQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBVyxFQUFFLEtBQWE7WUFDL0IsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsTUFBTSxDQUFDLEdBQVc7WUFDakIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2hELENBQUM7S0FDRDtJQS9CRCw0Q0ErQkMifQ==