/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/uri", "vs/workbench/services/extensions/common/extensions", "./extHost.protocol"], function (require, exports, lifecycle_1, types_1, uri_1, extensions_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostProfileContentHandlers = void 0;
    class ExtHostProfileContentHandlers {
        constructor(mainContext) {
            this.handlers = new Map();
            this.proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadProfileContentHandlers);
        }
        registerProfileContentHandler(extension, id, handler) {
            (0, extensions_1.checkProposedApiEnabled)(extension, 'profileContentHandlers');
            if (this.handlers.has(id)) {
                throw new Error(`Handler with id '${id}' already registered`);
            }
            this.handlers.set(id, handler);
            this.proxy.$registerProfileContentHandler(id, handler.name, handler.description, extension.identifier.value);
            return (0, lifecycle_1.toDisposable)(() => {
                this.handlers.delete(id);
                this.proxy.$unregisterProfileContentHandler(id);
            });
        }
        async $saveProfile(id, name, content, token) {
            const handler = this.handlers.get(id);
            if (!handler) {
                throw new Error(`Unknown handler with id: ${id}`);
            }
            return handler.saveProfile(name, content, token);
        }
        async $readProfile(id, idOrUri, token) {
            const handler = this.handlers.get(id);
            if (!handler) {
                throw new Error(`Unknown handler with id: ${id}`);
            }
            return handler.readProfile((0, types_1.isString)(idOrUri) ? idOrUri : uri_1.URI.revive(idOrUri), token);
        }
    }
    exports.ExtHostProfileContentHandlers = ExtHostProfileContentHandlers;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFByb2ZpbGVDb250ZW50SGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFByb2ZpbGVDb250ZW50SGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFhaEcsTUFBYSw2QkFBNkI7UUFNekMsWUFDQyxXQUF5QjtZQUhULGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBd0MsQ0FBQztZQUszRSxJQUFJLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO1FBQ2pGLENBQUM7UUFFRCw2QkFBNkIsQ0FDNUIsU0FBZ0MsRUFDaEMsRUFBVSxFQUNWLE9BQXFDO1lBRXJDLElBQUEsb0NBQXVCLEVBQUMsU0FBUyxFQUFFLHdCQUF3QixDQUFDLENBQUM7WUFDN0QsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixFQUFFLHNCQUFzQixDQUFDLENBQUM7WUFDL0QsQ0FBQztZQUVELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsS0FBSyxDQUFDLDhCQUE4QixDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUU3RyxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN6QixJQUFJLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBVSxFQUFFLElBQVksRUFBRSxPQUFlLEVBQUUsS0FBd0I7WUFDckYsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbkQsQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFRCxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQVUsRUFBRSxPQUErQixFQUFFLEtBQXdCO1lBQ3ZGLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ25ELENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBQSxnQkFBUSxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEYsQ0FBQztLQUNEO0lBaERELHNFQWdEQyJ9