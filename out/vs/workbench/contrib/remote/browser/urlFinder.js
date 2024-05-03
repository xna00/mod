/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UrlFinder = void 0;
    class UrlFinder extends lifecycle_1.Disposable {
        static { this.terminalCodesRegex = /(?:\u001B|\u009B)[\[\]()#;?]*(?:(?:(?:[a-zA-Z0-9]*(?:;[a-zA-Z0-9]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[0-9A-PR-TZcf-ntqry=><~]))/g; }
        /**
         * Local server url pattern matching following urls:
         * http://localhost:3000/ - commonly used across multiple frameworks
         * https://127.0.0.1:5001/ - ASP.NET
         * http://:8080 - Beego Golang
         * http://0.0.0.0:4000 - Elixir Phoenix
         */
        static { this.localUrlRegex = /\b\w{0,20}(?::\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|:\d{2,5})[\w\-\.\~:\/\?\#[\]\@!\$&\(\)\*\+\,\;\=]*/gim; }
        static { this.extractPortRegex = /(localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{1,5})/; }
        /**
         * https://github.com/microsoft/vscode-remote-release/issues/3949
         */
        static { this.localPythonServerRegex = /HTTP\son\s(127\.0\.0\.1|0\.0\.0\.0)\sport\s(\d+)/; }
        static { this.excludeTerminals = ['Dev Containers']; }
        constructor(terminalService, debugService) {
            super();
            this._onDidMatchLocalUrl = new event_1.Emitter();
            this.onDidMatchLocalUrl = this._onDidMatchLocalUrl.event;
            this.listeners = new Map();
            this.replPositions = new Map();
            // Terminal
            terminalService.instances.forEach(instance => {
                this.registerTerminalInstance(instance);
            });
            this._register(terminalService.onDidCreateInstance(instance => {
                this.registerTerminalInstance(instance);
            }));
            this._register(terminalService.onDidDisposeInstance(instance => {
                this.listeners.get(instance)?.dispose();
                this.listeners.delete(instance);
            }));
            // Debug
            this._register(debugService.onDidNewSession(session => {
                if (!session.parentSession || (session.parentSession && session.hasSeparateRepl())) {
                    this.listeners.set(session.getId(), session.onDidChangeReplElements(() => {
                        this.processNewReplElements(session);
                    }));
                }
            }));
            this._register(debugService.onDidEndSession(({ session }) => {
                if (this.listeners.has(session.getId())) {
                    this.listeners.get(session.getId())?.dispose();
                    this.listeners.delete(session.getId());
                }
            }));
        }
        registerTerminalInstance(instance) {
            if (!UrlFinder.excludeTerminals.includes(instance.title)) {
                this.listeners.set(instance, instance.onData(data => {
                    this.processData(data);
                }));
            }
        }
        processNewReplElements(session) {
            const oldReplPosition = this.replPositions.get(session.getId());
            const replElements = session.getReplElements();
            this.replPositions.set(session.getId(), { position: replElements.length - 1, tail: replElements[replElements.length - 1] });
            if (!oldReplPosition && replElements.length > 0) {
                replElements.forEach(element => this.processData(element.toString()));
            }
            else if (oldReplPosition && (replElements.length - 1 !== oldReplPosition.position)) {
                // Process lines until we reach the old "tail"
                for (let i = replElements.length - 1; i >= 0; i--) {
                    const element = replElements[i];
                    if (element === oldReplPosition.tail) {
                        break;
                    }
                    else {
                        this.processData(element.toString());
                    }
                }
            }
        }
        dispose() {
            super.dispose();
            const listeners = this.listeners.values();
            for (const listener of listeners) {
                listener.dispose();
            }
        }
        processData(data) {
            // strip ANSI terminal codes
            data = data.replace(UrlFinder.terminalCodesRegex, '');
            const urlMatches = data.match(UrlFinder.localUrlRegex) || [];
            if (urlMatches && urlMatches.length > 0) {
                urlMatches.forEach((match) => {
                    // check if valid url
                    let serverUrl;
                    try {
                        serverUrl = new URL(match);
                    }
                    catch (e) {
                        // Not a valid URL
                    }
                    if (serverUrl) {
                        // check if the port is a valid integer value
                        const portMatch = match.match(UrlFinder.extractPortRegex);
                        const port = parseFloat(serverUrl.port ? serverUrl.port : (portMatch ? portMatch[2] : 'NaN'));
                        if (!isNaN(port) && Number.isInteger(port) && port > 0 && port <= 65535) {
                            // normalize the host name
                            let host = serverUrl.hostname;
                            if (host !== '0.0.0.0' && host !== '127.0.0.1') {
                                host = 'localhost';
                            }
                            // Exclude node inspect, except when using default port
                            if (port !== 9229 && data.startsWith('Debugger listening on')) {
                                return;
                            }
                            this._onDidMatchLocalUrl.fire({ port, host });
                        }
                    }
                });
            }
            else {
                // Try special python case
                const pythonMatch = data.match(UrlFinder.localPythonServerRegex);
                if (pythonMatch && pythonMatch.length === 3) {
                    this._onDidMatchLocalUrl.fire({ host: pythonMatch[1], port: Number(pythonMatch[2]) });
                }
            }
        }
    }
    exports.UrlFinder = UrlFinder;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsRmluZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9yZW1vdGUvYnJvd3Nlci91cmxGaW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQWEsU0FBVSxTQUFRLHNCQUFVO2lCQUNoQix1QkFBa0IsR0FBRyx1SUFBdUksQUFBMUksQ0FBMkk7UUFDckw7Ozs7OztXQU1HO2lCQUNxQixrQkFBYSxHQUFHLGdIQUFnSCxBQUFuSCxDQUFvSDtpQkFDakkscUJBQWdCLEdBQUcsK0NBQStDLEFBQWxELENBQW1EO1FBQzNGOztXQUVHO2lCQUNxQiwyQkFBc0IsR0FBRyxrREFBa0QsQUFBckQsQ0FBc0Q7aUJBRTVFLHFCQUFnQixHQUFHLENBQUMsZ0JBQWdCLENBQUMsQUFBckIsQ0FBc0I7UUFNOUQsWUFBWSxlQUFpQyxFQUFFLFlBQTJCO1lBQ3pFLEtBQUssRUFBRSxDQUFDO1lBTEQsd0JBQW1CLEdBQTRDLElBQUksZUFBTyxFQUFFLENBQUM7WUFDckUsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQztZQUM1RCxjQUFTLEdBQWlELElBQUksR0FBRyxFQUFFLENBQUM7WUF3Q3BFLGtCQUFhLEdBQTBELElBQUksR0FBRyxFQUFFLENBQUM7WUFwQ3hGLFdBQVc7WUFDWCxlQUFlLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDNUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzdELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxRQUFR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