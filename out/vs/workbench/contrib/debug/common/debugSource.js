/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/path", "vs/base/common/resources", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/editor/common/editorService", "vs/base/common/network", "vs/workbench/contrib/debug/common/debugUtils"], function (require, exports, nls, uri_1, path_1, resources, debug_1, editorService_1, network_1, debugUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Source = exports.UNKNOWN_SOURCE_LABEL = void 0;
    exports.getUriFromSource = getUriFromSource;
    exports.UNKNOWN_SOURCE_LABEL = nls.localize('unknownSource', "Unknown Source");
    /**
     * Debug URI format
     *
     * a debug URI represents a Source object and the debug session where the Source comes from.
     *
     *       debug:arbitrary_path?session=123e4567-e89b-12d3-a456-426655440000&ref=1016
     *       \___/ \____________/ \__________________________________________/ \______/
     *         |          |                             |                          |
     *      scheme   source.path                    session id            source.reference
     *
     *
     */
    class Source {
        constructor(raw_, sessionId, uriIdentityService, logService) {
            let path;
            if (raw_) {
                this.raw = raw_;
                path = this.raw.path || this.raw.name || '';
                this.available = true;
            }
            else {
                this.raw = { name: exports.UNKNOWN_SOURCE_LABEL };
                this.available = false;
                path = `${debug_1.DEBUG_SCHEME}:${exports.UNKNOWN_SOURCE_LABEL}`;
            }
            this.uri = getUriFromSource(this.raw, path, sessionId, uriIdentityService, logService);
        }
        get name() {
            return this.raw.name || resources.basenameOrAuthority(this.uri);
        }
        get origin() {
            return this.raw.origin;
        }
        get presentationHint() {
            return this.raw.presentationHint;
        }
        get reference() {
            return this.raw.sourceReference;
        }
        get inMemory() {
            return this.uri.scheme === debug_1.DEBUG_SCHEME;
        }
        openInEditor(editorService, selection, preserveFocus, sideBySide, pinned) {
            return !this.available ? Promise.resolve(undefined) : editorService.openEditor({
                resource: this.uri,
                description: this.origin,
                options: {
                    preserveFocus,
                    selection,
                    revealIfOpened: true,
                    selectionRevealType: 1 /* TextEditorSelectionRevealType.CenterIfOutsideViewport */,
                    pinned
                }
            }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
        }
        static getEncodedDebugData(modelUri) {
            let path;
            let sourceReference;
            let sessionId;
            switch (modelUri.scheme) {
                case network_1.Schemas.file:
                    path = (0, path_1.normalize)(modelUri.fsPath);
                    break;
                case debug_1.DEBUG_SCHEME:
                    path = modelUri.path;
                    if (modelUri.query) {
                        const keyvalues = modelUri.query.split('&');
                        for (const keyvalue of keyvalues) {
                            const pair = keyvalue.split('=');
                            if (pair.length === 2) {
                                switch (pair[0]) {
                                    case 'session':
                                        sessionId = pair[1];
                                        break;
                                    case 'ref':
                                        sourceReference = parseInt(pair[1]);
                                        break;
                                }
                            }
                        }
                    }
                    break;
                default:
                    path = modelUri.toString();
                    break;
            }
            return {
                name: resources.basenameOrAuthority(modelUri),
                path,
                sourceReference,
                sessionId
            };
        }
    }
    exports.Source = Source;
    function getUriFromSource(raw, path, sessionId, uriIdentityService, logService) {
        const _getUriFromSource = (path) => {
            if (typeof raw.sourceReference === 'number' && raw.sourceReference > 0) {
                return uri_1.URI.from({
                    scheme: debug_1.DEBUG_SCHEME,
                    path: path?.replace(/^\/+/g, '/'), // #174054
                    query: `session=${sessionId}&ref=${raw.sourceReference}`
                });
            }
            if (path && (0, debugUtils_1.isUri)(path)) { // path looks like a uri
                return uriIdentityService.asCanonicalUri(uri_1.URI.parse(path));
            }
            // assume a filesystem path
            if (path && (0, path_1.isAbsolute)(path)) {
                return uriIdentityService.asCanonicalUri(uri_1.URI.file(path));
            }
            // path is relative: since VS Code cannot deal with this by itself
            // create a debug url that will result in a DAP 'source' request when the url is resolved.
            return uriIdentityService.asCanonicalUri(uri_1.URI.from({
                scheme: debug_1.DEBUG_SCHEME,
                path,
                query: `session=${sessionId}`
            }));
        };
        try {
            return _getUriFromSource(path);
        }
        catch (err) {
            logService.error('Invalid path from debug adapter: ' + path);
            return _getUriFromSource('/invalidDebugSource');
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdTb3VyY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2NvbW1vbi9kZWJ1Z1NvdXJjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnSWhHLDRDQWlDQztJQWpKWSxRQUFBLG9CQUFvQixHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLGdCQUFnQixDQUFDLENBQUM7SUFFcEY7Ozs7Ozs7Ozs7O09BV0c7SUFFSCxNQUFhLE1BQU07UUFNbEIsWUFBWSxJQUFzQyxFQUFFLFNBQWlCLEVBQUUsa0JBQXVDLEVBQUUsVUFBdUI7WUFDdEksSUFBSSxJQUFZLENBQUM7WUFDakIsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDVixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztnQkFDaEIsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDNUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDdkIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsNEJBQW9CLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7Z0JBQ3ZCLElBQUksR0FBRyxHQUFHLG9CQUFZLElBQUksNEJBQW9CLEVBQUUsQ0FBQztZQUNsRCxDQUFDO1lBRUQsSUFBSSxDQUFDLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDeEYsQ0FBQztRQUVELElBQUksSUFBSTtZ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