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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/base/common/uuid", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/telemetry/common/telemetry", "vs/platform/tunnel/common/tunnel", "vs/platform/webview/common/webviewPortMapping", "vs/base/browser/iframe", "vs/workbench/contrib/webview/browser/resourceLoading", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewFindWidget", "vs/workbench/contrib/webview/common/webview", "vs/workbench/services/environment/common/environmentService"], function (require, exports, browser_1, dom_1, async_1, buffer_1, cancellation_1, event_1, lifecycle_1, network_1, uri_1, uuid_1, nls_1, accessibility_1, actions_1, configuration_1, contextView_1, files_1, instantiation_1, log_1, notification_1, remoteAuthorityResolver_1, telemetry_1, tunnel_1, webviewPortMapping_1, iframe_1, resourceLoading_1, webview_1, webviewFindWidget_1, webview_2, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewElement = void 0;
    var WebviewState;
    (function (WebviewState) {
        let Type;
        (function (Type) {
            Type[Type["Initializing"] = 0] = "Initializing";
            Type[Type["Ready"] = 1] = "Ready";
        })(Type = WebviewState.Type || (WebviewState.Type = {}));
        class Initializing {
            constructor(pendingMessages) {
                this.pendingMessages = pendingMessages;
                this.type = 0 /* Type.Initializing */;
            }
        }
        WebviewState.Initializing = Initializing;
        WebviewState.Ready = { type: 1 /* Type.Ready */ };
    })(WebviewState || (WebviewState = {}));
    const webviewIdContext = 'webviewId';
    let WebviewElement = class WebviewElement extends lifecycle_1.Disposable {
        get window() { return typeof this._windowId === 'number' ? (0, dom_1.getWindowById)(this._windowId)?.window : undefined; }
        get platform() { return 'browser'; }
        get element() { return this._element; }
        get isFocused() {
            if (!this._focused) {
                return false;
            }
            // code window is only available after the webview is mounted.
            if (!this.window) {
                return false;
            }
            if (this.window.document.activeElement && this.window.document.activeElement !== this.element) {
                // looks like https://github.com/microsoft/vscode/issues/132641
                // where the focus is actually not in the `<iframe>`
                return false;
            }
            return true;
        }
        constructor(initInfo, webviewThemeDataProvider, configurationService, contextMenuService, notificationService, _environmentService, _fileService, _logService, _remoteAuthorityResolverService, _telemetryService, _tunnelService, instantiationService, _accessibilityService) {
            super();
            this.webviewThemeDataProvider = webviewThemeDataProvider;
            this._environmentService = _environmentService;
            this._fileService = _fileService;
            this._logService = _logService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._telemetryService = _telemetryService;
            this._tunnelService = _tunnelService;
            this._accessibilityService = _accessibilityService;
            this.id = (0, uuid_1.generateUuid)();
            this._windowId = undefined;
            this._expectedServiceWorkerVersion = 4; // Keep this in sync with the version in service-worker.js
            this._state = new WebviewState.Initializing([]);
            this._resourceLoadingCts = this._register(new cancellation_1.CancellationTokenSource());
            this._focusDelayer = this._register(new async_1.ThrottledDelayer(50));
            this._onDidHtmlChange = this._register(new event_1.Emitter());
            this.onDidHtmlChange = this._onDidHtmlChange.event;
            this._messageHandlers = new Map();
            this.checkImeCompletionState = true;
            this._disposed = false;
            this._onMissingCsp = this._register(new event_1.Emitter());
            this.onMissingCsp = this._onMissingCsp.event;
            this._onDidClickLink = this._register(new event_1.Emitter());
            this.onDidClickLink = this._onDidClickLink.event;
            this._onDidReload = this._register(new event_1.Emitter());
            this.onDidReload = this._onDidReload.event;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this._onDidWheel = this._register(new event_1.Emitter());
            this.onDidWheel = this._onDidWheel.event;
            this._onDidUpdateState = this._register(new event_1.Emitter());
            this.onDidUpdateState = this._onDidUpdateState.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onFatalError = this._register(new event_1.Emitter());
            this.onFatalError = this._onFatalError.event;
            this._onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this._onDidDispose.event;
            this._hasAlertedAboutMissingCsp = false;
            this._hasFindResult = this._register(new event_1.Emitter());
            this.hasFindResult = this._hasFindResult.event;
            this._onDidStopFind = this._register(new event_1.Emitter());
            this.onDidStopFind = this._onDidStopFind.event;
            this.providedViewType = initInfo.providedViewType;
            this.origin = initInfo.origin ?? this.id;
            this._options = initInfo.options;
            this.extension = initInfo.extension;
            this._content = {
                html: '',
                title: initInfo.title,
                options: initInfo.contentOptions,
                state: undefined
            };
            this._portMappingManager = this._register(new webviewPortMapping_1.WebviewPortMappingManager(() => this.extension?.location, () => this._content.options.portMapping || [], this._tunnelService));
            this._element = this._createElement(initInfo.options, initInfo.contentOptions);
            this._register(this.on('no-csp-found', () => {
                this.handleNoCspFound();
            }));
            this._register(this.on('did-click-link', ({ uri }) => {
                this._onDidClickLink.fire(uri);
            }));
            this._register(this.on('onmessage', ({ message, transfer }) => {
                this._onMessage.fire({ message, transfer });
            }));
            this._register(this.on('did-scroll', ({ scrollYPercentage }) => {
                this._onDidScroll.fire({ scrollYPercentage });
            }));
            this._register(this.on('do-reload', () => {
                this.reload();
            }));
            this._register(this.on('do-update-state', (state) => {
                this.state = state;
                this._onDidUpdateState.fire(state);
            }));
            this._register(this.on('did-focus', () => {
                this.handleFocusChange(true);
            }));
            this._register(this.on('did-blur', () => {
                this.handleFocusChange(false);
            }));
            this._register(this.on('did-scroll-wheel', (event) => {
                this._onDidWheel.fire(event);
            }));
            this._register(this.on('did-find', ({ didFind }) => {
                this._hasFindResult.fire(didFind);
            }));
            this._register(this.on('fatal-error', (e) => {
                notificationService.error((0, nls_1.localize)('fatalErrorMessage', "Error loading webview: {0}", e.message));
                this._onFatalError.fire({ message: e.message });
            }));
            this._register(this.on('did-keydown', (data) => {
                // Electron: workaround for https://github.com/electron/electron/issues/14258
                // We have to detect keyboard events in the <webview> and dispatch them to our
                // keybinding service because these events do not bubble to the parent window anymore.
                this.handleKeyEvent('keydown', data);
            }));
            this._register(this.on('did-keyup', (data) => {
                this.handleKeyEvent('keyup', data);
            }));
            this._register(this.on('did-context-menu', (data) => {
                if (!this.element) {
                    return;
                }
                if (!this._contextKeyService) {
                    return;
                }
                const elementBox = this.element.getBoundingClientRect();
                const contextKeyService = this._contextKeyService.createOverlay([
                    ...Object.entries(data.context),
                    [webviewIdContext, this.providedViewType],
                ]);
                contextMenuService.showContextMenu({
                    menuId: actions_1.MenuId.WebviewContext,
                    menuActionOptions: { shouldForwardArgs: true },
                    contextKeyService,
                    getActionsContext: () => ({ ...data.context, webview: this.providedViewType }),
                    getAnchor: () => ({
                        x: elementBox.x + data.clientX,
                        y: elementBox.y + data.clientY
                    })
                });
            }));
            this._register(this.on('load-resource', async (entry) => {
                try {
                    // Restore the authority we previously encoded
                    const authority = (0, webview_2.decodeAuthority)(entry.authority);
                    const uri = uri_1.URI.from({
                        scheme: entry.scheme,
                        authority: authority,
                        path: decodeURIComponent(entry.path), // This gets re-encoded
                        query: entry.query ? decodeURIComponent(entry.query) : entry.query,
                    });
                    this.loadResource(entry.id, uri, entry.ifNoneMatch);
                }
                catch (e) {
                    this._send('did-load-resource', {
                        id: entry.id,
                        status: 404,
                        path: entry.path,
                    });
                }
            }));
            this._register(this.on('load-localhost', (entry) => {
                this.localLocalhost(entry.id, entry.origin);
            }));
            this._register(event_1.Event.runAndSubscribe(webviewThemeDataProvider.onThemeDataChanged, () => this.style()));
            this._register(_accessibilityService.onDidChangeReducedMotion(() => this.style()));
            this._register(_accessibilityService.onDidChangeScreenReaderOptimized(() => this.style()));
            this._register(contextMenuService.onDidShowContextMenu(() => this._send('set-context-menu-visible', { visible: true })));
            this._register(contextMenuService.onDidHideContextMenu(() => this._send('set-context-menu-visible', { visible: false })));
            this._confirmBeforeClose = configurationService.getValue('window.confirmBeforeClose');
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.confirmBeforeClose')) {
                    this._confirmBeforeClose = configurationService.getValue('window.confirmBeforeClose');
                    this._send('set-confirm-before-close', this._confirmBeforeClose);
                }
            }));
            this._register(this.on('drag-start', () => {
                this._startBlockingIframeDragEvents();
            }));
            if (initInfo.options.enableFindWidget) {
                this._webviewFindWidget = this._register(instantiationService.createInstance(webviewFindWidget_1.WebviewFindWidget, this));
            }
        }
        dispose() {
            this._disposed = true;
            this.element?.remove();
            this._element = undefined;
            this._messagePort = undefined;
            if (this._state.type === 0 /* WebviewState.Type.Initializing */) {
                for (const message of this._state.pendingMessages) {
                    message.resolve(false);
                }
                this._state.pendingMessages = [];
            }
            this._onDidDispose.fire();
            this._resourceLoadingCts.dispose(true);
            super.dispose();
        }
        setContextKeyService(contextKeyService) {
            this._contextKeyService = contextKeyService;
        }
        postMessage(message, transfer) {
            return this._send('message', { message, transfer });
        }
        async _send(channel, data, _createElement = []) {
            if (this._state.type === 0 /* WebviewState.Type.Initializing */) {
                const { promise, resolve } = (0, async_1.promiseWithResolvers)();
                this._state.pendingMessages.push({ channel, data, transferable: _createElement, resolve });
                return promise;
            }
            else {
                return this.doPostMessage(channel, data, _createElement);
            }
        }
        _createElement(options, _contentOptions) {
            // Do not start loading the webview yet.
            // Wait the end of the ctor when all listeners have been hooked up.
            const element = document.createElement('iframe');
            element.name = this.id;
            element.className = `webview ${options.customClasses || ''}`;
            element.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-forms', 'allow-pointer-lock', 'allow-downloads');
            const allowRules = ['cross-origin-isolated', 'autoplay'];
            if (!browser_1.isFirefox) {
                allowRules.push('clipboard-read', 'clipboard-write');
            }
            element.setAttribute('allow', allowRules.join('; '));
            element.style.border = 'none';
            element.style.width = '100%';
            element.style.height = '100%';
            element.focus = () => {
                this._doFocus();
            };
            return element;
        }
        _initElement(encodedWebviewOrigin, extension, options, targetWindow) {
            // The extensionId and purpose in the URL are used for filtering in js-debug:
            const params = {
                id: this.id,
                origin: this.origin,
                swVersion: String(this._expectedServiceWorkerVersion),
                extensionId: extension?.id.value ?? '',
                platform: this.platform,
                'vscode-resource-base-authority': webview_2.webviewRootResourceAuthority,
                parentOrigin: targetWindow.origin,
            };
            if (this._options.disableServiceWorker) {
                params.disableServiceWorker = 'true';
            }
            if (this._environmentService.remoteAuthority) {
                params.remoteAuthority = this._environmentService.remoteAuthority;
            }
            if (options.purpose) {
                params.purpose = options.purpose;
            }
            network_1.COI.addSearchParam(params, true, true);
            const queryString = new URLSearchParams(params).toString();
            // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1754872
            const fileName = browser_1.isFirefox ? 'index-no-csp.html' : 'index.html';
            this.element.setAttribute('src', `${this.webviewContentEndpoint(encodedWebviewOrigin)}/${fileName}?${queryString}`);
        }
        mountTo(element, targetWindow) {
            if (!this.element) {
                return;
            }
            this._windowId = targetWindow.vscodeWindowId;
            this._encodedWebviewOriginPromise = (0, iframe_1.parentOriginHash)(targetWindow.origin, this.origin).then(id => this._encodedWebviewOrigin = id);
            this._encodedWebviewOriginPromise.then(encodedWebviewOrigin => {
                if (!this._disposed) {
                    this._initElement(encodedWebviewOrigin, this.extension, this._options, targetWindow);
                }
            });
            this._registerMessageHandler(targetWindow);
            if (this._webviewFindWidget) {
                element.appendChild(this._webviewFindWidget.getDomNode());
            }
            for (const eventName of [dom_1.EventType.MOUSE_DOWN, dom_1.EventType.MOUSE_MOVE, dom_1.EventType.DROP]) {
                this._register((0, dom_1.addDisposableListener)(element, eventName, () => {
                    this._stopBlockingIframeDragEvents();
                }));
            }
            for (const node of [element, targetWindow]) {
                this._register((0, dom_1.addDisposableListener)(node, dom_1.EventType.DRAG_END, () => {
                    this._stopBlockingIframeDragEvents();
                }));
            }
            element.id = this.id; // This is used by aria-flow for accessibility order
            element.appendChild(this.element);
        }
        _registerMessageHandler(targetWindow) {
            const subscription = this._register((0, dom_1.addDisposableListener)(targetWindow, 'message', (e) => {
                if (!this._encodedWebviewOrigin || e?.data?.target !== this.id) {
                    return;
                }
                if (e.origin !== this._webviewContentOrigin(this._encodedWebviewOrigin)) {
                    console.log(`Skipped renderer receiving message due to mismatched origins: ${e.origin} ${this._webviewContentOrigin}`);
                    return;
                }
                if (e.data.channel === 'webview-ready') {
                    if (this._messagePort) {
                        return;
                    }
                    this._logService.debug(`Webview(${this.id}): webview ready`);
                    this._messagePort = e.ports[0];
                    this._messagePort.onmessage = (e) => {
                        const handlers = this._messageHandlers.get(e.data.channel);
                        if (!handlers) {
                            console.log(`No handlers found for '${e.data.channel}'`);
                            return;
                        }
                        handlers?.forEach(handler => handler(e.data.data, e));
                    };
                    this.element?.classList.add('ready');
                    if (this._state.type === 0 /* WebviewState.Type.Initializing */) {
                        this._state.pendingMessages.forEach(({ channel, data, resolve }) => resolve(this.doPostMessage(channel, data)));
                    }
                    this._state = WebviewState.Ready;
                    subscription.dispose();
                }
            }));
        }
        _startBlockingIframeDragEvents() {
            if (this.element) {
                this.element.style.pointerEvents = 'none';
            }
        }
        _stopBlockingIframeDragEvents() {
            if (this.element) {
                this.element.style.pointerEvents = 'auto';
            }
        }
        webviewContentEndpoint(encodedWebviewOrigin) {
            const webviewExternalEndpoint = this._environmentService.webviewExternalEndpoint;
            if (!webviewExternalEndpoint) {
                throw new Error(`'webviewExternalEndpoint' has not been configured. Webviews will not work!`);
            }
            const endpoint = webviewExternalEndpoint.replace('{{uuid}}', encodedWebviewOrigin);
            if (endpoint[endpoint.length - 1] === '/') {
                return endpoint.slice(0, endpoint.length - 1);
            }
            return endpoint;
        }
        _webviewContentOrigin(encodedWebviewOrigin) {
            const uri = uri_1.URI.parse(this.webviewContentEndpoint(encodedWebviewOrigin));
            return uri.scheme + '://' + uri.authority.toLowerCase();
        }
        doPostMessage(channel, data, transferable = []) {
            if (this.element && this._messagePort) {
                this._messagePort.postMessage({ channel, args: data }, transferable);
                return true;
            }
            return false;
        }
        on(channel, handler) {
            let handlers = this._messageHandlers.get(channel);
            if (!handlers) {
                handlers = new Set();
                this._messageHandlers.set(channel, handlers);
            }
            handlers.add(handler);
            return (0, lifecycle_1.toDisposable)(() => {
                this._messageHandlers.get(channel)?.delete(handler);
            });
        }
        handleNoCspFound() {
            if (this._hasAlertedAboutMissingCsp) {
                return;
            }
            this._hasAlertedAboutMissingCsp = true;
            if (this.extension?.id) {
                if (this._environmentService.isExtensionDevelopment) {
                    this._onMissingCsp.fire(this.extension.id);
                }
                const payload = {
                    extension: this.extension.id.value
                };
                this._telemetryService.publicLog2('webviewMissingCsp', payload);
            }
        }
        reload() {
            this.doUpdateContent(this._content);
            const subscription = this._register(this.on('did-load', () => {
                this._onDidReload.fire();
                subscription.dispose();
            }));
        }
        setHtml(html) {
            this.doUpdateContent({ ...this._content, html });
            this._onDidHtmlChange.fire(html);
        }
        setTitle(title) {
            this._content = { ...this._content, title };
            this._send('set-title', title);
        }
        set contentOptions(options) {
            this._logService.debug(`Webview(${this.id}): will update content options`);
            if ((0, webview_1.areWebviewContentOptionsEqual)(options, this._content.options)) {
                this._logService.debug(`Webview(${this.id}): skipping content options update`);
                return;
            }
            this.doUpdateContent({ ...this._content, options });
        }
        set localResourcesRoot(resources) {
            this._content = {
                ...this._content,
                options: { ...this._content.options, localResourceRoots: resources }
            };
        }
        set state(state) {
            this._content = { ...this._content, state };
        }
        set initialScrollProgress(value) {
            this._send('initial-scroll-position', value);
        }
        doUpdateContent(newContent) {
            this._logService.debug(`Webview(${this.id}): will update content`);
            this._content = newContent;
            const allowScripts = !!this._content.options.allowScripts;
            this._send('content', {
                contents: this._content.html,
                title: this._content.title,
                options: {
                    allowMultipleAPIAcquire: !!this._content.options.allowMultipleAPIAcquire,
                    allowScripts: allowScripts,
                    allowForms: this._content.options.allowForms ?? allowScripts, // For back compat, we allow forms by default when scripts are enabled
                },
                state: this._content.state,
                cspSource: webview_2.webviewGenericCspSource,
                confirmBeforeClose: this._confirmBeforeClose,
            });
        }
        style() {
            let { styles, activeTheme, themeLabel, themeId } = this.webviewThemeDataProvider.getWebviewThemeData();
            if (this._options.transformCssVariables) {
                styles = this._options.transformCssVariables(styles);
            }
            const reduceMotion = this._accessibilityService.isMotionReduced();
            const screenReader = this._accessibilityService.isScreenReaderOptimized();
            this._send('styles', { styles, activeTheme, themeId, themeLabel, reduceMotion, screenReader });
        }
        handleFocusChange(isFocused) {
            this._focused = isFocused;
            if (isFocused) {
                this._onDidFocus.fire();
            }
            else {
                this._onDidBlur.fire();
            }
        }
        handleKeyEvent(type, event) {
            // Create a fake KeyboardEvent from the data provided
            const emulatedKeyboardEvent = new KeyboardEvent(type, event);
            // Force override the target
            Object.defineProperty(emulatedKeyboardEvent, 'target', {
                get: () => this.element,
            });
            // And re-dispatch
            this.window?.dispatchEvent(emulatedKeyboardEvent);
        }
        windowDidDragStart() {
            // Webview break drag and dropping around the main window (no events are generated when you are over them)
            // Work around this by disabling pointer events during the drag.
            // https://github.com/electron/electron/issues/18226
            this._startBlockingIframeDragEvents();
        }
        windowDidDragEnd() {
            this._stopBlockingIframeDragEvents();
        }
        selectAll() {
            this.execCommand('selectAll');
        }
        copy() {
            this.execCommand('copy');
        }
        paste() {
            this.execCommand('paste');
        }
        cut() {
            this.execCommand('cut');
        }
        undo() {
            this.execCommand('undo');
        }
        redo() {
            this.execCommand('redo');
        }
        execCommand(command) {
            if (this.element) {
                this._send('execCommand', command);
            }
        }
        async loadResource(id, uri, ifNoneMatch) {
            try {
                const result = await (0, resourceLoading_1.loadLocalResource)(uri, {
                    ifNoneMatch,
                    roots: this._content.options.localResourceRoots || [],
                }, this._fileService, this._logService, this._resourceLoadingCts.token);
                switch (result.type) {
                    case resourceLoading_1.WebviewResourceResponse.Type.Success: {
                        const buffer = await this.streamToBuffer(result.stream);
                        return this._send('did-load-resource', {
                            id,
                            status: 200,
                            path: uri.path,
                            mime: result.mimeType,
                            data: buffer,
                            etag: result.etag,
                            mtime: result.mtime
                        }, [buffer]);
                    }
                    case resourceLoading_1.WebviewResourceResponse.Type.NotModified: {
                        return this._send('did-load-resource', {
                            id,
                            status: 304, // not modified
                            path: uri.path,
                            mime: result.mimeType,
                            mtime: result.mtime
                        });
                    }
                    case resourceLoading_1.WebviewResourceResponse.Type.AccessDenied: {
                        return this._send('did-load-resource', {
                            id,
                            status: 401, // unauthorized
                            path: uri.path,
                        });
                    }
                }
            }
            catch {
                // noop
            }
            return this._send('did-load-resource', {
                id,
                status: 404,
                path: uri.path,
            });
        }
        async streamToBuffer(stream) {
            const vsBuffer = await (0, buffer_1.streamToBuffer)(stream);
            return vsBuffer.buffer.buffer;
        }
        async localLocalhost(id, origin) {
            const authority = this._environmentService.remoteAuthority;
            const resolveAuthority = authority ? await this._remoteAuthorityResolverService.resolveAuthority(authority) : undefined;
            const redirect = resolveAuthority ? await this._portMappingManager.getRedirect(resolveAuthority.authority, origin) : undefined;
            return this._send('did-load-localhost', {
                id,
                origin,
                location: redirect
            });
        }
        focus() {
            this._doFocus();
            // Handle focus change programmatically (do not rely on event from <webview>)
            this.handleFocusChange(true);
        }
        _doFocus() {
            if (!this.element) {
                return;
            }
            try {
                this.element.contentWindow?.focus();
            }
            catch {
                // noop
            }
            // Workaround for https://github.com/microsoft/vscode/issues/75209
            // Focusing the inner webview is async so for a sequence of actions such as:
            //
            // 1. Open webview
            // 1. Show quick pick from command palette
            //
            // We end up focusing the webview after showing the quick pick, which causes
            // the quick pick to instantly dismiss.
            //
            // Workaround this by debouncing the focus and making sure we are not focused on an input
            // when we try to re-focus.
            this._focusDelayer.trigger(async () => {
                if (!this.isFocused || !this.element) {
                    return;
                }
                if (this.window?.document.activeElement && this.window.document.activeElement !== this.element && this.window.document.activeElement?.tagName !== 'BODY') {
                    return;
                }
                // It is possible for the webview to be contained in another window
                // that does not have focus. As such, also focus the body of the
                // webview's window to ensure it is properly receiving keyboard focus.
                this.window?.document.body?.focus();
                this._send('focus', undefined);
            });
        }
        /**
         * Webviews expose a stateful find API.
         * Successive calls to find will move forward or backward through onFindResults
         * depending on the supplied options.
         *
         * @param value The string to search for. Empty strings are ignored.
         */
        find(value, previous) {
            if (!this.element) {
                return;
            }
            this._send('find', { value, previous });
        }
        updateFind(value) {
            if (!value || !this.element) {
                return;
            }
            this._send('find', { value });
        }
        stopFind(keepSelection) {
            if (!this.element) {
                return;
            }
            this._send('find-stop', { clearSelection: !keepSelection });
            this._onDidStopFind.fire();
        }
        showFind(animated = true) {
            this._webviewFindWidget?.reveal(undefined, animated);
        }
        hideFind(animated = true) {
            this._webviewFindWidget?.hide(animated);
        }
        runFindAction(previous) {
            this._webviewFindWidget?.find(previous);
        }
    };
    exports.WebviewElement = WebviewElement;
    exports.WebviewElement = WebviewElement = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, notification_1.INotificationService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, files_1.IFileService),
        __param(7, log_1.ILogService),
        __param(8, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, tunnel_1.ITunnelService),
        __param(11, instantiation_1.IInstantiationService),
        __param(12, accessibility_1.IAccessibilityService)
    ], WebviewElement);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld0VsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXcvYnJvd3Nlci93ZWJ2aWV3RWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE2Q2hHLElBQVUsWUFBWSxDQW1CckI7SUFuQkQsV0FBVSxZQUFZO1FBQ3JCLElBQWtCLElBQTRCO1FBQTlDLFdBQWtCLElBQUk7WUFBRywrQ0FBWSxDQUFBO1lBQUUsaUNBQUssQ0FBQTtRQUFDLENBQUMsRUFBNUIsSUFBSSxHQUFKLGlCQUFJLEtBQUosaUJBQUksUUFBd0I7UUFFOUMsTUFBYSxZQUFZO1lBR3hCLFlBQ1EsZUFLTDtnQkFMSyxvQkFBZSxHQUFmLGVBQWUsQ0FLcEI7Z0JBUk0sU0FBSSw2QkFBcUI7WUFTOUIsQ0FBQztTQUNMO1FBWFkseUJBQVksZUFXeEIsQ0FBQTtRQUVZLGtCQUFLLEdBQUcsRUFBRSxJQUFJLG9CQUFZLEVBQVcsQ0FBQztJQUdwRCxDQUFDLEVBbkJTLFlBQVksS0FBWixZQUFZLFFBbUJyQjtJQU9ELE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDO0lBRTlCLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSxzQkFBVTtRQWU3QyxJQUFZLE1BQU0sS0FBSyxPQUFPLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUEsbUJBQWEsRUFBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBS3ZILElBQWMsUUFBUSxLQUFhLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUt0RCxJQUFjLE9BQU8sS0FBb0MsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUdoRixJQUFXLFNBQVM7WUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDcEIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsOERBQThEO1lBQzlELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQy9GLCtEQUErRDtnQkFDL0Qsb0RBQW9EO2dCQUNwRCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUErQkQsWUFDQyxRQUF5QixFQUNOLHdCQUFrRCxFQUM5QyxvQkFBMkMsRUFDN0Msa0JBQXVDLEVBQ3RDLG1CQUF5QyxFQUNqQyxtQkFBa0UsRUFDbEYsWUFBMkMsRUFDNUMsV0FBeUMsRUFDckIsK0JBQWlGLEVBQy9GLGlCQUFxRCxFQUN4RCxjQUErQyxFQUN4QyxvQkFBMkMsRUFDM0MscUJBQTZEO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBYlcsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUl0Qix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQThCO1lBQ2pFLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBQzNCLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ0osb0NBQStCLEdBQS9CLCtCQUErQixDQUFpQztZQUM5RSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ3ZDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUV2QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBckZsRSxPQUFFLEdBQUcsSUFBQSxtQkFBWSxHQUFFLENBQUM7WUFZL0IsY0FBUyxHQUF1QixTQUFTLENBQUM7WUFRakMsa0NBQTZCLEdBQUcsQ0FBQyxDQUFDLENBQUMsMERBQTBEO1lBdUJ0RyxXQUFNLEdBQXVCLElBQUksWUFBWSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQU10RCx3QkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksc0NBQXVCLEVBQUUsQ0FBQyxDQUFDO1lBTXBFLGtCQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFekQscUJBQWdCLEdBQW9CLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO1lBQ3hFLG9CQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztZQUdoRCxxQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBcUQsQ0FBQztZQUdqRiw0QkFBdUIsR0FBRyxJQUFJLENBQUM7WUFFdkMsY0FBUyxHQUFHLEtBQUssQ0FBQztZQXVNVCxrQkFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXVCLENBQUMsQ0FBQztZQUNwRSxpQkFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO1lBRXZDLG9CQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7WUFDekQsbUJBQWMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQztZQUUzQyxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3BELGdCQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFFckMsZUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQStCLENBQUMsQ0FBQztZQUN6RSxjQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFFakMsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUEwQyxDQUFDLENBQUM7WUFDdEYsZ0JBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUVyQyxnQkFBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW9CLENBQUMsQ0FBQztZQUMvRCxlQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFFbkMsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBc0IsQ0FBQyxDQUFDO1lBQ3ZFLHFCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFFL0MsZ0JBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNuRCxlQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7WUFFbkMsZUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2xELGNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQUVqQyxrQkFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWdDLENBQUMsQ0FBQztZQUM3RSxpQkFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO1lBRXZDLGtCQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDckQsaUJBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztZQXlNaEQsK0JBQTBCLEdBQUcsS0FBSyxDQUFDO1lBb1J4QixtQkFBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVcsQ0FBQyxDQUFDO1lBQzNELGtCQUFhLEdBQW1CLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO1lBRXZELG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDeEQsa0JBQWEsR0FBZ0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7WUFockJ0RSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDO1lBQ2xELElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDO1lBRXpDLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQztZQUNqQyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUM7WUFFcEMsSUFBSSxDQUFDLFFBQVEsR0FBRztnQkFDZixJQUFJLEVBQUUsRUFBRTtnQkFDUixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7Z0JBQ3JCLE9BQU8sRUFBRSxRQUFRLENBQUMsY0FBYztnQkFDaEMsS0FBSyxFQUFFLFNBQVM7YUFDaEIsQ0FBQztZQUVGLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksOENBQXlCLENBQ3RFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUM5QixHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLElBQUksRUFBRSxFQUM3QyxJQUFJLENBQUMsY0FBYyxDQUNuQixDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFL0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUU7Z0JBQ3BELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRTtnQkFDN0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM3QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxFQUFFO2dCQUM5RCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQztZQUMvQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7Z0JBQ3hDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDbkQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO2dCQUN4QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUNwRCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtnQkFDbEQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDM0MsbUJBQW1CLENBQUMsS0FBSyxDQUFDLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLDRCQUE0QixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNsRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNqRCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUM5Qyw2RUFBNkU7Z0JBQzdFLDhFQUE4RTtnQkFDOUUsc0ZBQXNGO2dCQUN0RixJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN0QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUM1QyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGtCQUFrQixFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQ25ELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ25CLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7b0JBQzlCLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQ3hELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQztvQkFDL0QsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7b0JBQy9CLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDO2lCQUN6QyxDQUFDLENBQUM7Z0JBQ0gsa0JBQWtCLENBQUMsZUFBZSxDQUFDO29CQUNsQyxNQUFNLEVBQUUsZ0JBQU0sQ0FBQyxjQUFjO29CQUM3QixpQkFBaUIsRUFBRSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRTtvQkFDOUMsaUJBQWlCO29CQUNqQixpQkFBaUIsRUFBRSxHQUF5QixFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7b0JBQ3BHLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO3dCQUNqQixDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTzt3QkFDOUIsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU87cUJBQzlCLENBQUM7aUJBQ0YsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxlQUFlLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUN2RCxJQUFJLENBQUM7b0JBQ0osOENBQThDO29CQUM5QyxNQUFNLFNBQVMsR0FBRyxJQUFBLHlCQUFlLEVBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNuRCxNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDO3dCQUNwQixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07d0JBQ3BCLFNBQVMsRUFBRSxTQUFTO3dCQUNwQixJQUFJLEVBQUUsa0JBQWtCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLHVCQUF1Qjt3QkFDN0QsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUs7cUJBQ2xFLENBQUMsQ0FBQztvQkFDSCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDckQsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNaLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUU7d0JBQy9CLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFBRTt3QkFDWixNQUFNLEVBQUUsR0FBRzt3QkFDWCxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7cUJBQ2hCLENBQUMsQ0FBQztnQkFDSixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUNsRCxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzdDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxlQUFlLENBQUMsd0JBQXdCLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2RyxJQUFJLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxnQ0FBZ0MsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNGLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6SCxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFMUgsSUFBSSxDQUFDLG1CQUFtQixHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBUywyQkFBMkIsQ0FBQyxDQUFDO1lBRTlGLElBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hFLElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLDJCQUEyQixDQUFDLEVBQUUsQ0FBQztvQkFDekQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO29CQUN0RixJQUFJLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUNsRSxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO2dCQUN6QyxJQUFJLENBQUMsOEJBQThCLEVBQUUsQ0FBQztZQUN2QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxxQ0FBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hHLENBQUM7UUFDRixDQUFDO1FBRVEsT0FBTztZQUNmLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBRXRCLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxTQUFTLENBQUM7WUFFMUIsSUFBSSxDQUFDLFlBQVksR0FBRyxTQUFTLENBQUM7WUFFOUIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksMkNBQW1DLEVBQUUsQ0FBQztnQkFDekQsS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUNuRCxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixDQUFDO2dCQUNELElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztZQUNsQyxDQUFDO1lBRUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUUxQixJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXZDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRUQsb0JBQW9CLENBQUMsaUJBQXFDO1lBQ3pELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxpQkFBaUIsQ0FBQztRQUM3QyxDQUFDO1FBbUNNLFdBQVcsQ0FBQyxPQUFZLEVBQUUsUUFBd0I7WUFDeEQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFTyxLQUFLLENBQUMsS0FBSyxDQUFtQyxPQUFVLEVBQUUsSUFBeUIsRUFBRSxpQkFBaUMsRUFBRTtZQUMvSCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSwyQ0FBbUMsRUFBRSxDQUFDO2dCQUN6RCxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUEsNEJBQW9CLEdBQVcsQ0FBQztnQkFDN0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQzNGLE9BQU8sT0FBTyxDQUFDO1lBQ2hCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztZQUMxRCxDQUFDO1FBQ0YsQ0FBQztRQUVPLGNBQWMsQ0FBQyxPQUF1QixFQUFFLGVBQXNDO1lBQ3JGLHdDQUF3QztZQUN4QyxtRUFBbUU7WUFDbkUsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqRCxPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDdkIsT0FBTyxDQUFDLFNBQVMsR0FBRyxXQUFXLE9BQU8sQ0FBQyxhQUFhLElBQUksRUFBRSxFQUFFLENBQUM7WUFDN0QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBRWxILE1BQU0sVUFBVSxHQUFHLENBQUMsdUJBQXVCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLG1CQUFTLEVBQUUsQ0FBQztnQkFDaEIsVUFBVSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3RELENBQUM7WUFDRCxPQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFckQsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQzlCLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztZQUM3QixPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFFOUIsT0FBTyxDQUFDLEtBQUssR0FBRyxHQUFHLEVBQUU7Z0JBQ3BCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNqQixDQUFDLENBQUM7WUFFRixPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRU8sWUFBWSxDQUFDLG9CQUE0QixFQUFFLFNBQWtELEVBQUUsT0FBdUIsRUFBRSxZQUF3QjtZQUN2Siw2RUFBNkU7WUFDN0UsTUFBTSxNQUFNLEdBQThCO2dCQUN6QyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ1gsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO2dCQUNuQixTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQztnQkFDckQsV0FBVyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ3RDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtnQkFDdkIsZ0NBQWdDLEVBQUUsc0NBQTRCO2dCQUM5RCxZQUFZLEVBQUUsWUFBWSxDQUFDLE1BQU07YUFDakMsQ0FBQztZQUVGLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUN4QyxNQUFNLENBQUMsb0JBQW9CLEdBQUcsTUFBTSxDQUFDO1lBQ3RDLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDOUMsTUFBTSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsZUFBZSxDQUFDO1lBQ25FLENBQUM7WUFFRCxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQ2xDLENBQUM7WUFFRCxhQUFHLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFdkMsTUFBTSxXQUFXLEdBQUcsSUFBSSxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7WUFFM0Qsc0VBQXNFO1lBQ3RFLE1BQU0sUUFBUSxHQUFHLG1CQUFTLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7WUFFaEUsSUFBSSxDQUFDLE9BQVEsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLG9CQUFvQixDQUFDLElBQUksUUFBUSxJQUFJLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDdEgsQ0FBQztRQUVNLE9BQU8sQ0FBQyxPQUFvQixFQUFFLFlBQXdCO1lBQzVELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDO1lBQzdDLElBQUksQ0FBQyw0QkFBNEIsR0FBRyxJQUFBLHlCQUFnQixFQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNuSSxJQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEVBQUU7Z0JBQzdELElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxZQUFZLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUN0RixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFM0MsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUMzRCxDQUFDO1lBRUQsS0FBSyxNQUFNLFNBQVMsSUFBSSxDQUFDLGVBQVMsQ0FBQyxVQUFVLEVBQUUsZUFBUyxDQUFDLFVBQVUsRUFBRSxlQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDdEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLDJCQUFxQixFQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFO29CQUM3RCxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztnQkFDdEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7WUFFRCxLQUFLLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxFQUFFLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSwyQkFBcUIsRUFBQyxJQUFJLEVBQUUsZUFBUyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7b0JBQ25FLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDO2dCQUN0QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztZQUVELE9BQU8sQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLG9EQUFvRDtZQUUxRSxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRU8sdUJBQXVCLENBQUMsWUFBd0I7WUFDdkQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLDJCQUFxQixFQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFlLEVBQUUsRUFBRTtnQkFDdEcsSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sS0FBSyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ2hFLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLENBQUM7b0JBQ3pFLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUVBQWlFLENBQUMsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUMsQ0FBQztvQkFDdkgsT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssZUFBZSxFQUFFLENBQUM7b0JBQ3hDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUN2QixPQUFPO29CQUNSLENBQUM7b0JBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO29CQUU3RCxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQy9CLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUU7d0JBQ25DLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDM0QsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDOzRCQUNmLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQzs0QkFDekQsT0FBTzt3QkFDUixDQUFDO3dCQUNELFFBQVEsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdkQsQ0FBQyxDQUFDO29CQUVGLElBQUksQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFFckMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksMkNBQW1DLEVBQUUsQ0FBQzt3QkFDekQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNqSCxDQUFDO29CQUNELElBQUksQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQztvQkFFakMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN4QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyw4QkFBOEI7WUFDckMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7WUFDM0MsQ0FBQztRQUNGLENBQUM7UUFFTyw2QkFBNkI7WUFDcEMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7WUFDM0MsQ0FBQztRQUNGLENBQUM7UUFFUyxzQkFBc0IsQ0FBQyxvQkFBNEI7WUFDNUQsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsdUJBQXVCLENBQUM7WUFDakYsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQzlCLE1BQU0sSUFBSSxLQUFLLENBQUMsNEVBQTRFLENBQUMsQ0FBQztZQUMvRixDQUFDO1lBRUQsTUFBTSxRQUFRLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBQ25GLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQzNDLE9BQU8sUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMvQyxDQUFDO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVPLHFCQUFxQixDQUFDLG9CQUE0QjtZQUN6RCxNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDekUsT0FBTyxHQUFHLENBQUMsTUFBTSxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3pELENBQUM7UUFFTyxhQUFhLENBQUMsT0FBZSxFQUFFLElBQVUsRUFBRSxlQUErQixFQUFFO1lBQ25GLElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDckUsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU8sRUFBRSxDQUFxQyxPQUFVLEVBQUUsT0FBK0Q7WUFDekgsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsUUFBUSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzlDLENBQUM7WUFFRCxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RCLE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDeEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBR08sZ0JBQWdCO1lBQ3ZCLElBQUksSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7Z0JBQ3JDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQztZQUV2QyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ3hCLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLHNCQUFzQixFQUFFLENBQUM7b0JBQ3JELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzVDLENBQUM7Z0JBRUQsTUFBTSxPQUFPLEdBQUc7b0JBQ2YsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEtBQUs7aUJBQ3pCLENBQUM7Z0JBUVgsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBaUMsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakcsQ0FBQztRQUNGLENBQUM7UUFFTSxNQUFNO1lBQ1osSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFcEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBQzVELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3pCLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVNLE9BQU8sQ0FBQyxJQUFZO1lBQzFCLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNqRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFTSxRQUFRLENBQUMsS0FBYTtZQUM1QixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDO1lBQzVDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFRCxJQUFXLGNBQWMsQ0FBQyxPQUE4QjtZQUN2RCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxXQUFXLElBQUksQ0FBQyxFQUFFLGdDQUFnQyxDQUFDLENBQUM7WUFFM0UsSUFBSSxJQUFBLHVDQUE2QixFQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ25FLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFdBQVcsSUFBSSxDQUFDLEVBQUUsb0NBQW9DLENBQUMsQ0FBQztnQkFDL0UsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVELElBQVcsa0JBQWtCLENBQUMsU0FBeUI7WUFDdEQsSUFBSSxDQUFDLFFBQVEsR0FBRztnQkFDZixHQUFHLElBQUksQ0FBQyxRQUFRO2dCQUNoQixPQUFPLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLGtCQUFrQixFQUFFLFNBQVMsRUFBRTthQUNwRSxDQUFDO1FBQ0gsQ0FBQztRQUVELElBQVcsS0FBSyxDQUFDLEtBQXlCO1lBQ3pDLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDN0MsQ0FBQztRQUVELElBQVcscUJBQXFCLENBQUMsS0FBYTtZQUM3QyxJQUFJLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFTyxlQUFlLENBQUMsVUFBMEI7WUFDakQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLENBQUMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1lBRW5FLElBQUksQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO1lBRTNCLE1BQU0sWUFBWSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUM7WUFDMUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUU7Z0JBQ3JCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUk7Z0JBQzVCLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUs7Z0JBQzFCLE9BQU8sRUFBRTtvQkFDUix1QkFBdUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsdUJBQXVCO29CQUN4RSxZQUFZLEVBQUUsWUFBWTtvQkFDMUIsVUFBVSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsSUFBSSxZQUFZLEVBQUUsc0VBQXNFO2lCQUNwSTtnQkFDRCxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLO2dCQUMxQixTQUFTLEVBQUUsaUNBQXVCO2dCQUNsQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsbUJBQW1CO2FBQzVDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUyxLQUFLO1lBQ2QsSUFBSSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQ3ZHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUN6QyxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0RCxDQUFDO1lBRUQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ2xFLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBRTFFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQ2hHLENBQUM7UUFHUyxpQkFBaUIsQ0FBQyxTQUFrQjtZQUM3QyxJQUFJLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQztZQUMxQixJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNmLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDekIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDeEIsQ0FBQztRQUNGLENBQUM7UUFFTyxjQUFjLENBQUMsSUFBeUIsRUFBRSxLQUFlO1lBQ2hFLHFEQUFxRDtZQUNyRCxNQUFNLHFCQUFxQixHQUFHLElBQUksYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3RCw0QkFBNEI7WUFDNUIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxxQkFBcUIsRUFBRSxRQUFRLEVBQUU7Z0JBQ3RELEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTzthQUN2QixDQUFDLENBQUM7WUFDSCxrQkFBa0I7WUFDbEIsSUFBSSxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRUQsa0JBQWtCO1lBQ2pCLDBHQUEwRztZQUMxRyxnRUFBZ0U7WUFDaEUsb0RBQW9EO1lBQ3BELElBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxnQkFBZ0I7WUFDZixJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztRQUN0QyxDQUFDO1FBRU0sU0FBUztZQUNmLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVNLElBQUk7WUFDVixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFTSxLQUFLO1lBQ1gsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRU0sR0FBRztZQUNULElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekIsQ0FBQztRQUVNLElBQUk7WUFDVixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFTSxJQUFJO1lBQ1YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBRU8sV0FBVyxDQUFDLE9BQWU7WUFDbEMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3BDLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLFlBQVksQ0FBQyxFQUFVLEVBQUUsR0FBUSxFQUFFLFdBQStCO1lBQy9FLElBQUksQ0FBQztnQkFDSixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsbUNBQWlCLEVBQUMsR0FBRyxFQUFFO29CQUMzQyxXQUFXO29CQUNYLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsSUFBSSxFQUFFO2lCQUNyRCxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRXhFLFFBQVEsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNyQixLQUFLLHlDQUF1QixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO3dCQUMzQyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUN4RCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUU7NEJBQ3RDLEVBQUU7NEJBQ0YsTUFBTSxFQUFFLEdBQUc7NEJBQ1gsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJOzRCQUNkLElBQUksRUFBRSxNQUFNLENBQUMsUUFBUTs0QkFDckIsSUFBSSxFQUFFLE1BQU07NEJBQ1osSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJOzRCQUNqQixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7eUJBQ25CLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNkLENBQUM7b0JBQ0QsS0FBSyx5Q0FBdUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQzt3QkFDL0MsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixFQUFFOzRCQUN0QyxFQUFFOzRCQUNGLE1BQU0sRUFBRSxHQUFHLEVBQUUsZUFBZTs0QkFDNUIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJOzRCQUNkLElBQUksRUFBRSxNQUFNLENBQUMsUUFBUTs0QkFDckIsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLO3lCQUNuQixDQUFDLENBQUM7b0JBQ0osQ0FBQztvQkFDRCxLQUFLLHlDQUF1QixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO3dCQUNoRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUU7NEJBQ3RDLEVBQUU7NEJBQ0YsTUFBTSxFQUFFLEdBQUcsRUFBRSxlQUFlOzRCQUM1QixJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7eUJBQ2QsQ0FBQyxDQUFDO29CQUNKLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFBQyxNQUFNLENBQUM7Z0JBQ1IsT0FBTztZQUNSLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUU7Z0JBQ3RDLEVBQUU7Z0JBQ0YsTUFBTSxFQUFFLEdBQUc7Z0JBQ1gsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJO2FBQ2QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVTLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBOEI7WUFDNUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFBLHVCQUFjLEVBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUMsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUMvQixDQUFDO1FBRU8sS0FBSyxDQUFDLGNBQWMsQ0FBQyxFQUFVLEVBQUUsTUFBYztZQUN0RCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsZUFBZSxDQUFDO1lBQzNELE1BQU0sZ0JBQWdCLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ3hILE1BQU0sUUFBUSxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDL0gsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFO2dCQUN2QyxFQUFFO2dCQUNGLE1BQU07Z0JBQ04sUUFBUSxFQUFFLFFBQVE7YUFDbEIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVNLEtBQUs7WUFDWCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFFaEIsNkVBQTZFO1lBQzdFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRU8sUUFBUTtZQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxDQUFDO1lBQ3JDLENBQUM7WUFBQyxNQUFNLENBQUM7Z0JBQ1IsT0FBTztZQUNSLENBQUM7WUFFRCxrRUFBa0U7WUFDbEUsNEVBQTRFO1lBQzVFLEVBQUU7WUFDRixrQkFBa0I7WUFDbEIsMENBQTBDO1lBQzFDLEVBQUU7WUFDRiw0RUFBNEU7WUFDNUUsdUNBQXVDO1lBQ3ZDLEVBQUU7WUFDRix5RkFBeUY7WUFDekYsMkJBQTJCO1lBQzNCLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDdEMsT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsS0FBSyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxPQUFPLEtBQUssTUFBTSxFQUFFLENBQUM7b0JBQzFKLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxtRUFBbUU7Z0JBQ25FLGdFQUFnRTtnQkFDaEUsc0VBQXNFO2dCQUN0RSxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUM7Z0JBRXBDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQVFEOzs7Ozs7V0FNRztRQUNJLElBQUksQ0FBQyxLQUFhLEVBQUUsUUFBaUI7WUFDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFTSxVQUFVLENBQUMsS0FBYTtZQUM5QixJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM3QixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRU0sUUFBUSxDQUFDLGFBQXVCO1lBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsRUFBRSxjQUFjLEVBQUUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDNUIsQ0FBQztRQUVNLFFBQVEsQ0FBQyxRQUFRLEdBQUcsSUFBSTtZQUM5QixJQUFJLENBQUMsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRU0sUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJO1lBQzlCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVNLGFBQWEsQ0FBQyxRQUFpQjtZQUNyQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FDRCxDQUFBO0lBdHpCWSx3Q0FBYzs2QkFBZCxjQUFjO1FBNkV4QixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSxtQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLGlEQUE0QixDQUFBO1FBQzVCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEseURBQStCLENBQUE7UUFDL0IsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixZQUFBLHVCQUFjLENBQUE7UUFDZCxZQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFlBQUEscUNBQXFCLENBQUE7T0F2RlgsY0FBYyxDQXN6QjFCIn0=