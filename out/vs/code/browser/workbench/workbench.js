/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/window", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/product/common/product", "vs/platform/window/common/window", "vs/workbench/workbench.web.main"], function (require, exports, browser_1, window_1, buffer_1, event_1, lifecycle_1, marshalling_1, network_1, path_1, resources_1, strings_1, uri_1, product_1, window_2, workbench_web_main_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalStorageSecretStorageProvider = void 0;
    class TransparentCrypto {
        async seal(data) {
            return data;
        }
        async unseal(data) {
            return data;
        }
    }
    var AESConstants;
    (function (AESConstants) {
        AESConstants["ALGORITHM"] = "AES-GCM";
        AESConstants[AESConstants["KEY_LENGTH"] = 256] = "KEY_LENGTH";
        AESConstants[AESConstants["IV_LENGTH"] = 12] = "IV_LENGTH";
    })(AESConstants || (AESConstants = {}));
    class ServerKeyedAESCrypto {
        /** Gets whether the algorithm is supported; requires a secure context */
        static supported() {
            return !!crypto.subtle;
        }
        constructor(authEndpoint) {
            this.authEndpoint = authEndpoint;
        }
        async seal(data) {
            // Get a new key and IV on every change, to avoid the risk of reusing the same key and IV pair with AES-GCM
            // (see also: https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams#properties)
            const iv = window_1.mainWindow.crypto.getRandomValues(new Uint8Array(12 /* AESConstants.IV_LENGTH */));
            // crypto.getRandomValues isn't a good-enough PRNG to generate crypto keys, so we need to use crypto.subtle.generateKey and export the key instead
            const clientKeyObj = await window_1.mainWindow.crypto.subtle.generateKey({ name: "AES-GCM" /* AESConstants.ALGORITHM */, length: 256 /* AESConstants.KEY_LENGTH */ }, true, ['encrypt', 'decrypt']);
            const clientKey = new Uint8Array(await window_1.mainWindow.crypto.subtle.exportKey('raw', clientKeyObj));
            const key = await this.getKey(clientKey);
            const dataUint8Array = new TextEncoder().encode(data);
            const cipherText = await window_1.mainWindow.crypto.subtle.encrypt({ name: "AES-GCM" /* AESConstants.ALGORITHM */, iv }, key, dataUint8Array);
            // Base64 encode the result and store the ciphertext, the key, and the IV in localStorage
            // Note that the clientKey and IV don't need to be secret
            const result = new Uint8Array([...clientKey, ...iv, ...new Uint8Array(cipherText)]);
            return (0, buffer_1.encodeBase64)(buffer_1.VSBuffer.wrap(result));
        }
        async unseal(data) {
            // encrypted should contain, in order: the key (32-byte), the IV for AES-GCM (12-byte) and the ciphertext (which has the GCM auth tag at the end)
            // Minimum length must be 44 (key+IV length) + 16 bytes (1 block encrypted with AES - regardless of key size)
            const dataUint8Array = (0, buffer_1.decodeBase64)(data);
            if (dataUint8Array.byteLength < 60) {
                throw Error('Invalid length for the value for credentials.crypto');
            }
            const keyLength = 256 /* AESConstants.KEY_LENGTH */ / 8;
            const clientKey = dataUint8Array.slice(0, keyLength);
            const iv = dataUint8Array.slice(keyLength, keyLength + 12 /* AESConstants.IV_LENGTH */);
            const cipherText = dataUint8Array.slice(keyLength + 12 /* AESConstants.IV_LENGTH */);
            // Do the decryption and parse the result as JSON
            const key = await this.getKey(clientKey.buffer);
            const decrypted = await window_1.mainWindow.crypto.subtle.decrypt({ name: "AES-GCM" /* AESConstants.ALGORITHM */, iv: iv.buffer }, key, cipherText.buffer);
            return new TextDecoder().decode(new Uint8Array(decrypted));
        }
        /**
         * Given a clientKey, returns the CryptoKey object that is used to encrypt/decrypt the data.
         * The actual key is (clientKey XOR serverKey)
         */
        async getKey(clientKey) {
            if (!clientKey || clientKey.byteLength !== 256 /* AESConstants.KEY_LENGTH */ / 8) {
                throw Error('Invalid length for clientKey');
            }
            const serverKey = await this.getServerKeyPart();
            const keyData = new Uint8Array(256 /* AESConstants.KEY_LENGTH */ / 8);
            for (let i = 0; i < keyData.byteLength; i++) {
                keyData[i] = clientKey[i] ^ serverKey[i];
            }
            return window_1.mainWindow.crypto.subtle.importKey('raw', keyData, {
                name: "AES-GCM" /* AESConstants.ALGORITHM */,
                length: 256 /* AESConstants.KEY_LENGTH */,
            }, true, ['encrypt', 'decrypt']);
        }
        async getServerKeyPart() {
            if (this._serverKey) {
                return this._serverKey;
            }
            let attempt = 0;
            let lastError;
            while (attempt <= 3) {
                try {
                    const res = await fetch(this.authEndpoint, { credentials: 'include', method: 'POST' });
                    if (!res.ok) {
                        throw new Error(res.statusText);
                    }
                    const serverKey = new Uint8Array(await await res.arrayBuffer());
                    if (serverKey.byteLength !== 256 /* AESConstants.KEY_LENGTH */ / 8) {
                        throw Error(`The key retrieved by the server is not ${256 /* AESConstants.KEY_LENGTH */} bit long.`);
                    }
                    this._serverKey = serverKey;
                    return this._serverKey;
                }
                catch (e) {
                    lastError = e;
                    attempt++;
                    // exponential backoff
                    await new Promise(resolve => setTimeout(resolve, attempt * attempt * 100));
                }
            }
            throw lastError;
        }
    }
    class LocalStorageSecretStorageProvider {
        constructor(crypto) {
            this.crypto = crypto;
            this._storageKey = 'secrets.provider';
            this._secretsPromise = this.load();
            this.type = 'persisted';
        }
        async load() {
            const record = this.loadAuthSessionFromElement();
            // Get the secrets from localStorage
            const encrypted = localStorage.getItem(this._storageKey);
            if (encrypted) {
                try {
                    const decrypted = JSON.parse(await this.crypto.unseal(encrypted));
                    return { ...record, ...decrypted };
                }
                catch (err) {
                    // TODO: send telemetry
                    console.error('Failed to decrypt secrets from localStorage', err);
                    localStorage.removeItem(this._storageKey);
                }
            }
            return record;
        }
        loadAuthSessionFromElement() {
            let authSessionInfo;
            const authSessionElement = window_1.mainWindow.document.getElementById('vscode-workbench-auth-session');
            const authSessionElementAttribute = authSessionElement ? authSessionElement.getAttribute('data-settings') : undefined;
            if (authSessionElementAttribute) {
                try {
                    authSessionInfo = JSON.parse(authSessionElementAttribute);
                }
                catch (error) { /* Invalid session is passed. Ignore. */ }
            }
            if (!authSessionInfo) {
                return {};
            }
            const record = {};
            // Settings Sync Entry
            record[`${product_1.default.urlProtocol}.loginAccount`] = JSON.stringify(authSessionInfo);
            // Auth extension Entry
            if (authSessionInfo.providerId !== 'github') {
                console.error(`Unexpected auth provider: ${authSessionInfo.providerId}. Expected 'github'.`);
                return record;
            }
            const authAccount = JSON.stringify({ extensionId: 'vscode.github-authentication', key: 'github.auth' });
            record[authAccount] = JSON.stringify(authSessionInfo.scopes.map(scopes => ({
                id: authSessionInfo.id,
                scopes,
                accessToken: authSessionInfo.accessToken
            })));
            return record;
        }
        async get(key) {
            const secrets = await this._secretsPromise;
            return secrets[key];
        }
        async set(key, value) {
            const secrets = await this._secretsPromise;
            secrets[key] = value;
            this._secretsPromise = Promise.resolve(secrets);
            this.save();
        }
        async delete(key) {
            const secrets = await this._secretsPromise;
            delete secrets[key];
            this._secretsPromise = Promise.resolve(secrets);
            this.save();
        }
        async save() {
            try {
                const encrypted = await this.crypto.seal(JSON.stringify(await this._secretsPromise));
                localStorage.setItem(this._storageKey, encrypted);
            }
            catch (err) {
                console.error(err);
            }
        }
    }
    exports.LocalStorageSecretStorageProvider = LocalStorageSecretStorageProvider;
    class LocalStorageURLCallbackProvider extends lifecycle_1.Disposable {
        static { this.REQUEST_ID = 0; }
        static { this.QUERY_KEYS = [
            'scheme',
            'authority',
            'path',
            'query',
            'fragment'
        ]; }
        constructor(_callbackRoute) {
            super();
            this._callbackRoute = _callbackRoute;
            this._onCallback = this._register(new event_1.Emitter());
            this.onCallback = this._onCallback.event;
            this.pendingCallbacks = new Set();
            this.lastTimeChecked = Date.now();
            this.checkCallbacksTimeout = undefined;
        }
        create(options = {}) {
            const id = ++LocalStorageURLCallbackProvider.REQUEST_ID;
            const queryParams = [`vscode-reqid=${id}`];
            for (const key of LocalStorageURLCallbackProvider.QUERY_KEYS) {
                const value = options[key];
                if (value) {
                    queryParams.push(`vscode-${key}=${encodeURIComponent(value)}`);
                }
            }
            // TODO@joao remove eventually
            // https://github.com/microsoft/vscode-dev/issues/62
            // https://github.com/microsoft/vscode/blob/159479eb5ae451a66b5dac3c12d564f32f454796/extensions/github-authentication/src/githubServer.ts#L50-L50
            if (!(options.authority === 'vscode.github-authentication' && options.path === '/dummy')) {
                const key = `vscode-web.url-callbacks[${id}]`;
                localStorage.removeItem(key);
                this.pendingCallbacks.add(id);
                this.startListening();
            }
            return uri_1.URI.parse(window_1.mainWindow.location.href).with({ path: this._callbackRoute, query: queryParams.join('&') });
        }
        startListening() {
            if (this.onDidChangeLocalStorageDisposable) {
                return;
            }
            const fn = () => this.onDidChangeLocalStorage();
            window_1.mainWindow.addEventListener('storage', fn);
            this.onDidChangeLocalStorageDisposable = { dispose: () => window_1.mainWindow.removeEventListener('storage', fn) };
        }
        stopListening() {
            this.onDidChangeLocalStorageDisposable?.dispose();
            this.onDidChangeLocalStorageDisposable = undefined;
        }
        // this fires every time local storage changes, but we
        // don't want to check more often than once a second
        async onDidChangeLocalStorage() {
            const ellapsed = Date.now() - this.lastTimeChecked;
            if (ellapsed > 1000) {
                this.checkCallbacks();
            }
            else if (this.checkCallbacksTimeout === undefined) {
                this.checkCallbacksTimeout = setTimeout(() => {
                    this.checkCallbacksTimeout = undefined;
                    this.checkCallbacks();
                }, 1000 - ellapsed);
            }
        }
        checkCallbacks() {
            let pendingCallbacks;
            for (const id of this.pendingCallbacks) {
                const key = `vscode-web.url-callbacks[${id}]`;
                const result = localStorage.getItem(key);
                if (result !== null) {
                    try {
                        this._onCallback.fire(uri_1.URI.revive(JSON.parse(result)));
                    }
                    catch (error) {
                        console.error(error);
                    }
                    pendingCallbacks = pendingCallbacks ?? new Set(this.pendingCallbacks);
                    pendingCallbacks.delete(id);
                    localStorage.removeItem(key);
                }
            }
            if (pendingCallbacks) {
                this.pendingCallbacks = pendingCallbacks;
                if (this.pendingCallbacks.size === 0) {
                    this.stopListening();
                }
            }
            this.lastTimeChecked = Date.now();
        }
    }
    class WorkspaceProvider {
        static { this.QUERY_PARAM_EMPTY_WINDOW = 'ew'; }
        static { this.QUERY_PARAM_FOLDER = 'folder'; }
        static { this.QUERY_PARAM_WORKSPACE = 'workspace'; }
        static { this.QUERY_PARAM_PAYLOAD = 'payload'; }
        static create(config) {
            let foundWorkspace = false;
            let workspace;
            let payload = Object.create(null);
            const query = new URL(document.location.href).searchParams;
            query.forEach((value, key) => {
                switch (key) {
                    // Folder
                    case WorkspaceProvider.QUERY_PARAM_FOLDER:
                        if (config.remoteAuthority && value.startsWith(path_1.posix.sep)) {
                            // when connected to a remote and having a value
                            // that is a path (begins with a `/`), assume this
                            // is a vscode-remote resource as simplified URL.
                            workspace = { folderUri: uri_1.URI.from({ scheme: network_1.Schemas.vscodeRemote, path: value, authority: config.remoteAuthority }) };
                        }
                        else {
                            workspace = { folderUri: uri_1.URI.parse(value) };
                        }
                        foundWorkspace = true;
                        break;
                    // Workspace
                    case WorkspaceProvider.QUERY_PARAM_WORKSPACE:
                        if (config.remoteAuthority && value.startsWith(path_1.posix.sep)) {
                            // when connected to a remote and having a value
                            // that is a path (begins with a `/`), assume this
                            // is a vscode-remote resource as simplified URL.
                            workspace = { workspaceUri: uri_1.URI.from({ scheme: network_1.Schemas.vscodeRemote, path: value, authority: config.remoteAuthority }) };
                        }
                        else {
                            workspace = { workspaceUri: uri_1.URI.parse(value) };
                        }
                        foundWorkspace = true;
                        break;
                    // Empty
                    case WorkspaceProvider.QUERY_PARAM_EMPTY_WINDOW:
                        workspace = undefined;
                        foundWorkspace = true;
                        break;
                    // Payload
                    case WorkspaceProvider.QUERY_PARAM_PAYLOAD:
                        try {
                            payload = (0, marshalling_1.parse)(value); // use marshalling#parse() to revive potential URIs
                        }
                        catch (error) {
                            console.error(error); // possible invalid JSON
                        }
                        break;
                }
            });
            // If no workspace is provided through the URL, check for config
            // attribute from server
            if (!foundWorkspace) {
                if (config.folderUri) {
                    workspace = { folderUri: uri_1.URI.revive(config.folderUri) };
                }
                else if (config.workspaceUri) {
                    workspace = { workspaceUri: uri_1.URI.revive(config.workspaceUri) };
                }
            }
            return new WorkspaceProvider(workspace, payload, config);
        }
        constructor(workspace, payload, config) {
            this.workspace = workspace;
            this.payload = payload;
            this.config = config;
            this.trusted = true;
        }
        async open(workspace, options) {
            if (options?.reuse && !options.payload && this.isSame(this.workspace, workspace)) {
                return true; // return early if workspace and environment is not changing and we are reusing window
            }
            const targetHref = this.createTargetUrl(workspace, options);
            if (targetHref) {
                if (options?.reuse) {
                    window_1.mainWindow.location.href = targetHref;
                    return true;
                }
                else {
                    let result;
                    if ((0, browser_1.isStandalone)()) {
                        result = window_1.mainWindow.open(targetHref, '_blank', 'toolbar=no'); // ensures to open another 'standalone' window!
                    }
                    else {
                        result = window_1.mainWindow.open(targetHref);
                    }
                    return !!result;
                }
            }
            return false;
        }
        createTargetUrl(workspace, options) {
            // Empty
            let targetHref = undefined;
            if (!workspace) {
                targetHref = `${document.location.origin}${document.location.pathname}?${WorkspaceProvider.QUERY_PARAM_EMPTY_WINDOW}=true`;
            }
            // Folder
            else if ((0, window_2.isFolderToOpen)(workspace)) {
                const queryParamFolder = this.encodeWorkspacePath(workspace.folderUri);
                targetHref = `${document.location.origin}${document.location.pathname}?${WorkspaceProvider.QUERY_PARAM_FOLDER}=${queryParamFolder}`;
            }
            // Workspace
            else if ((0, window_2.isWorkspaceToOpen)(workspace)) {
                const queryParamWorkspace = this.encodeWorkspacePath(workspace.workspaceUri);
                targetHref = `${document.location.origin}${document.location.pathname}?${WorkspaceProvider.QUERY_PARAM_WORKSPACE}=${queryParamWorkspace}`;
            }
            // Append payload if any
            if (options?.payload) {
                targetHref += `&${WorkspaceProvider.QUERY_PARAM_PAYLOAD}=${encodeURIComponent(JSON.stringify(options.payload))}`;
            }
            return targetHref;
        }
        encodeWorkspacePath(uri) {
            if (this.config.remoteAuthority && uri.scheme === network_1.Schemas.vscodeRemote) {
                // when connected to a remote and having a folder
                // or workspace for that remote, only use the path
                // as query value to form shorter, nicer URLs.
                // however, we still need to `encodeURIComponent`
                // to ensure to preserve special characters, such
                // as `+` in the path.
                return encodeURIComponent(`${path_1.posix.sep}${(0, strings_1.ltrim)(uri.path, path_1.posix.sep)}`).replaceAll('%2F', '/');
            }
            return encodeURIComponent(uri.toString(true));
        }
        isSame(workspaceA, workspaceB) {
            if (!workspaceA || !workspaceB) {
                return workspaceA === workspaceB; // both empty
            }
            if ((0, window_2.isFolderToOpen)(workspaceA) && (0, window_2.isFolderToOpen)(workspaceB)) {
                return (0, resources_1.isEqual)(workspaceA.folderUri, workspaceB.folderUri); // same workspace
            }
            if ((0, window_2.isWorkspaceToOpen)(workspaceA) && (0, window_2.isWorkspaceToOpen)(workspaceB)) {
                return (0, resources_1.isEqual)(workspaceA.workspaceUri, workspaceB.workspaceUri); // same workspace
            }
            return false;
        }
        hasRemote() {
            if (this.workspace) {
                if ((0, window_2.isFolderToOpen)(this.workspace)) {
                    return this.workspace.folderUri.scheme === network_1.Schemas.vscodeRemote;
                }
                if ((0, window_2.isWorkspaceToOpen)(this.workspace)) {
                    return this.workspace.workspaceUri.scheme === network_1.Schemas.vscodeRemote;
                }
            }
            return true;
        }
    }
    function readCookie(name) {
        const cookies = document.cookie.split('; ');
        for (const cookie of cookies) {
            if (cookie.startsWith(name + '=')) {
                return cookie.substring(name.length + 1);
            }
        }
        return undefined;
    }
    (function () {
        // Find config by checking for DOM
        const configElement = window_1.mainWindow.document.getElementById('vscode-workbench-web-configuration');
        const configElementAttribute = configElement ? configElement.getAttribute('data-settings') : undefined;
        if (!configElement || !configElementAttribute) {
            throw new Error('Missing web configuration element');
        }
        const config = JSON.parse(configElementAttribute);
        const secretStorageKeyPath = readCookie('vscode-secret-key-path');
        const secretStorageCrypto = secretStorageKeyPath && ServerKeyedAESCrypto.supported()
            ? new ServerKeyedAESCrypto(secretStorageKeyPath) : new TransparentCrypto();
        // Create workbench
        (0, workbench_web_main_1.create)(window_1.mainWindow.document.body, {
            ...config,
            windowIndicator: config.windowIndicator ?? { label: '$(remote)', tooltip: `${product_1.default.nameShort} Web` },
            settingsSyncOptions: config.settingsSyncOptions ? { enabled: config.settingsSyncOptions.enabled, } : undefined,
            workspaceProvider: WorkspaceProvider.create(config),
            urlCallbackProvider: new LocalStorageURLCallbackProvider(config.callbackRoute),
            secretStorageProvider: config.remoteAuthority && !secretStorageKeyPath
                ? undefined /* with a remote without embedder-preferred storage, store on the remote */
                : new LocalStorageSecretStorageProvider(secretStorageCrypto),
        });
    })();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9jb2RlL2Jyb3dzZXIvd29ya2JlbmNoL3dvcmtiZW5jaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwQmhHLE1BQU0saUJBQWlCO1FBQ3RCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBWTtZQUN0QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQVk7WUFDeEIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO0tBQ0Q7SUFFRCxJQUFXLFlBSVY7SUFKRCxXQUFXLFlBQVk7UUFDdEIscUNBQXFCLENBQUE7UUFDckIsNkRBQWdCLENBQUE7UUFDaEIsMERBQWMsQ0FBQTtJQUNmLENBQUMsRUFKVSxZQUFZLEtBQVosWUFBWSxRQUl0QjtJQUVELE1BQU0sb0JBQW9CO1FBR3pCLHlFQUF5RTtRQUNsRSxNQUFNLENBQUMsU0FBUztZQUN0QixPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ3hCLENBQUM7UUFFRCxZQUE2QixZQUFvQjtZQUFwQixpQkFBWSxHQUFaLFlBQVksQ0FBUTtRQUFJLENBQUM7UUFFdEQsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFZO1lBQ3RCLDJHQUEyRztZQUMzRyx1RkFBdUY7WUFDdkYsTUFBTSxFQUFFLEdBQUcsbUJBQVUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksVUFBVSxpQ0FBd0IsQ0FBQyxDQUFDO1lBQ3JGLGtKQUFrSjtZQUNsSixNQUFNLFlBQVksR0FBRyxNQUFNLG1CQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQzlELEVBQUUsSUFBSSxFQUFFLHNDQUErQixFQUFFLE1BQU0sRUFBRSxpQ0FBZ0MsRUFBRSxFQUNuRixJQUFJ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