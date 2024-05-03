/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "./extHost.protocol"], function (require, exports, lifecycle_1, network_1, uri_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostUriOpeners = void 0;
    class ExtHostUriOpeners {
        static { this.supportedSchemes = new Set([network_1.Schemas.http, network_1.Schemas.https]); }
        constructor(mainContext) {
            this._openers = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadUriOpeners);
        }
        registerExternalUriOpener(extensionId, id, opener, metadata) {
            if (this._openers.has(id)) {
                throw new Error(`Opener with id '${id}' already registered`);
            }
            const invalidScheme = metadata.schemes.find(scheme => !ExtHostUriOpeners.supportedSchemes.has(scheme));
            if (invalidScheme) {
                throw new Error(`Scheme '${invalidScheme}' is not supported. Only http and https are currently supported.`);
            }
            this._openers.set(id, opener);
            this._proxy.$registerUriOpener(id, metadata.schemes, extensionId, metadata.label);
            return (0, lifecycle_1.toDisposable)(() => {
                this._openers.delete(id);
                this._proxy.$unregisterUriOpener(id);
            });
        }
        async $canOpenUri(id, uriComponents, token) {
            const opener = this._openers.get(id);
            if (!opener) {
                throw new Error(`Unknown opener with id: ${id}`);
            }
            const uri = uri_1.URI.revive(uriComponents);
            return opener.canOpenExternalUri(uri, token);
        }
        async $openUri(id, context, token) {
            const opener = this._openers.get(id);
            if (!opener) {
                throw new Error(`Unknown opener id: '${id}'`);
            }
            return opener.openExternalUri(uri_1.URI.revive(context.resolvedUri), {
                sourceUri: uri_1.URI.revive(context.sourceUri)
            }, token);
        }
    }
    exports.ExtHostUriOpeners = ExtHostUriOpeners;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFVyaU9wZW5lci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFVyaU9wZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsTUFBYSxpQkFBaUI7aUJBRUwscUJBQWdCLEdBQUcsSUFBSSxHQUFHLENBQVMsQ0FBQyxpQkFBTyxDQUFDLElBQUksRUFBRSxpQkFBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEFBQWpELENBQWtEO1FBTTFGLFlBQ0MsV0FBeUI7WUFIVCxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQW9DLENBQUM7WUFLdkUsSUFBSSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBRUQseUJBQXlCLENBQ3hCLFdBQWdDLEVBQ2hDLEVBQVUsRUFDVixNQUFnQyxFQUNoQyxRQUEwQztZQUUxQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBRUQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3ZHLElBQUksYUFBYSxFQUFFLENBQUM7Z0JBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxhQUFhLGtFQUFrRSxDQUFDLENBQUM7WUFDN0csQ0FBQztZQUVELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM5QixJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbEYsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDekIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN0QyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQVUsRUFBRSxhQUE0QixFQUFFLEtBQXdCO1lBQ25GLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELENBQUM7WUFFRCxNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3RDLE9BQU8sTUFBTSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFVLEVBQUUsT0FBaUUsRUFBRSxLQUF3QjtZQUNySCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMvQyxDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dCQUM5RCxTQUFTLEVBQUUsU0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO2FBQ3hDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDWCxDQUFDOztJQXpERiw4Q0EwREMifQ==