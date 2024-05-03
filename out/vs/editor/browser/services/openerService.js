/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/cancellation", "vs/base/common/linkedList", "vs/base/common/map", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/platform/commands/common/commands", "vs/platform/editor/common/editor", "vs/platform/opener/common/opener"], function (require, exports, dom, window_1, cancellation_1, linkedList_1, map_1, marshalling_1, network_1, resources_1, uri_1, codeEditorService_1, commands_1, editor_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenerService = void 0;
    let CommandOpener = class CommandOpener {
        constructor(_commandService) {
            this._commandService = _commandService;
        }
        async open(target, options) {
            if (!(0, network_1.matchesScheme)(target, network_1.Schemas.command)) {
                return false;
            }
            if (!options?.allowCommands) {
                // silently ignore commands when command-links are disabled, also
                // suppress other openers by returning TRUE
                return true;
            }
            if (typeof target === 'string') {
                target = uri_1.URI.parse(target);
            }
            if (Array.isArray(options.allowCommands)) {
                // Only allow specific commands
                if (!options.allowCommands.includes(target.path)) {
                    // Suppress other openers by returning TRUE
                    return true;
                }
            }
            // execute as command
            let args = [];
            try {
                args = (0, marshalling_1.parse)(decodeURIComponent(target.query));
            }
            catch {
                // ignore and retry
                try {
                    args = (0, marshalling_1.parse)(target.query);
                }
                catch {
                    // ignore error
                }
            }
            if (!Array.isArray(args)) {
                args = [args];
            }
            await this._commandService.executeCommand(target.path, ...args);
            return true;
        }
    };
    CommandOpener = __decorate([
        __param(0, commands_1.ICommandService)
    ], CommandOpener);
    let EditorOpener = class EditorOpener {
        constructor(_editorService) {
            this._editorService = _editorService;
        }
        async open(target, options) {
            if (typeof target === 'string') {
                target = uri_1.URI.parse(target);
            }
            const { selection, uri } = (0, opener_1.extractSelection)(target);
            target = uri;
            if (target.scheme === network_1.Schemas.file) {
                target = (0, resources_1.normalizePath)(target); // workaround for non-normalized paths (https://github.com/microsoft/vscode/issues/12954)
            }
            await this._editorService.openCodeEditor({
                resource: target,
                options: {
                    selection,
                    source: options?.fromUserGesture ? editor_1.EditorOpenSource.USER : editor_1.EditorOpenSource.API,
                    ...options?.editorOptions
                }
            }, this._editorService.getFocusedCodeEditor(), options?.openToSide);
            return true;
        }
    };
    EditorOpener = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService)
    ], EditorOpener);
    let OpenerService = class OpenerService {
        constructor(editorService, commandService) {
            this._openers = new linkedList_1.LinkedList();
            this._validators = new linkedList_1.LinkedList();
            this._resolvers = new linkedList_1.LinkedList();
            this._resolvedUriTargets = new map_1.ResourceMap(uri => uri.with({ path: null, fragment: null, query: null }).toString());
            this._externalOpeners = new linkedList_1.LinkedList();
            // Default external opener is going through window.open()
            this._defaultExternalOpener = {
                openExternal: async (href) => {
                    // ensure to open HTTP/HTTPS links into new windows
                    // to not trigger a navigation. Any other link is
                    // safe to be set as HREF to prevent a blank window
                    // from opening.
                    if ((0, network_1.matchesSomeScheme)(href, network_1.Schemas.http, network_1.Schemas.https)) {
                        dom.windowOpenNoOpener(href);
                    }
                    else {
                        window_1.mainWindow.location.href = href;
                    }
                    return true;
                }
            };
            // Default opener: any external, maito, http(s), command, and catch-all-editors
            this._openers.push({
                open: async (target, options) => {
                    if (options?.openExternal || (0, network_1.matchesSomeScheme)(target, network_1.Schemas.mailto, network_1.Schemas.http, network_1.Schemas.https, network_1.Schemas.vsls)) {
                        // open externally
                        await this._doOpenExternal(target, options);
                        return true;
                    }
                    return false;
                }
            });
            this._openers.push(new CommandOpener(commandService));
            this._openers.push(new EditorOpener(editorService));
        }
        registerOpener(opener) {
            const remove = this._openers.unshift(opener);
            return { dispose: remove };
        }
        registerValidator(validator) {
            const remove = this._validators.push(validator);
            return { dispose: remove };
        }
        registerExternalUriResolver(resolver) {
            const remove = this._resolvers.push(resolver);
            return { dispose: remove };
        }
        setDefaultExternalOpener(externalOpener) {
            this._defaultExternalOpener = externalOpener;
        }
        registerExternalOpener(opener) {
            const remove = this._externalOpeners.push(opener);
            return { dispose: remove };
        }
        async open(target, options) {
            // check with contributed validators
            const targetURI = typeof target === 'string' ? uri_1.URI.parse(target) : target;
            // validate against the original URI that this URI resolves to, if one exists
            const validationTarget = this._resolvedUriTargets.get(targetURI) ?? target;
            for (const validator of this._validators) {
                if (!(await validator.shouldOpen(validationTarget, options))) {
                    return false;
                }
            }
            // check with contributed openers
            for (const opener of this._openers) {
                const handled = await opener.open(target, options);
                if (handled) {
                    return true;
                }
            }
            return false;
        }
        async resolveExternalUri(resource, options) {
            for (const resolver of this._resolvers) {
                try {
                    const result = await resolver.resolveExternalUri(resource, options);
                    if (result) {
                        if (!this._resolvedUriTargets.has(result.resolved)) {
                            this._resolvedUriTargets.set(result.resolved, resource);
                        }
                        return result;
                    }
                }
                catch {
                    // noop
                }
            }
            throw new Error('Could not resolve external URI: ' + resource.toString());
        }
        async _doOpenExternal(resource, options) {
            //todo@jrieken IExternalUriResolver should support `uri: URI | string`
            const uri = typeof resource === 'string' ? uri_1.URI.parse(resource) : resource;
            let externalUri;
            try {
                externalUri = (await this.resolveExternalUri(uri, options)).resolved;
            }
            catch {
                externalUri = uri;
            }
            let href;
            if (typeof resource === 'string' && uri.toString() === externalUri.toString()) {
                // open the url-string AS IS
                href = resource;
            }
            else {
                // open URI using the toString(noEncode)+encodeURI-trick
                href = encodeURI(externalUri.toString(true));
            }
            if (options?.allowContributedOpeners) {
                const preferredOpenerId = typeof options?.allowContributedOpeners === 'string' ? options?.allowContributedOpeners : undefined;
                for (const opener of this._externalOpeners) {
                    const didOpen = await opener.openExternal(href, {
                        sourceUri: uri,
                        preferredOpenerId,
                    }, cancellation_1.CancellationToken.None);
                    if (didOpen) {
                        return true;
                    }
                }
            }
            return this._defaultExternalOpener.openExternal(href, { sourceUri: uri }, cancellation_1.CancellationToken.None);
        }
        dispose() {
            this._validators.clear();
        }
    };
    exports.OpenerService = OpenerService;
    exports.OpenerService = OpenerService = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService),
        __param(1, commands_1.ICommandService)
    ], OpenerService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbmVyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvc2VydmljZXMvb3BlbmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQmhHLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWE7UUFFbEIsWUFBOEMsZUFBZ0M7WUFBaEMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1FBQUksQ0FBQztRQUVuRixLQUFLLENBQUMsSUFBSSxDQUFDLE1BQW9CLEVBQUUsT0FBcUI7WUFDckQsSUFBSSxDQUFDLElBQUEsdUJBQWEsRUFBQyxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUM3QyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxDQUFDO2dCQUM3QixpRUFBaUU7Z0JBQ2pFLDJDQUEyQztnQkFDM0MsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUIsQ0FBQztZQUVELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztnQkFDMUMsK0JBQStCO2dCQUMvQixJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ2xELDJDQUEyQztvQkFDM0MsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztZQUNGLENBQUM7WUFFRCxxQkFBcUI7WUFDckIsSUFBSSxJQUFJLEdBQVEs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