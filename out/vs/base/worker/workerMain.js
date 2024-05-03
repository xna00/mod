"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
(function () {
    const monacoEnvironment = globalThis.MonacoEnvironment;
    const monacoBaseUrl = monacoEnvironment && monacoEnvironment.baseUrl ? monacoEnvironment.baseUrl : '../../../';
    function createTrustedTypesPolicy(policyName, policyOptions) {
        if (monacoEnvironment?.createTrustedTypesPolicy) {
            try {
                return monacoEnvironment.createTrustedTypesPolicy(policyName, policyOptions);
            }
            catch (err) {
                console.warn(err);
                return undefined;
            }
        }
        try {
            return self.trustedTypes?.createPolicy(policyName, policyOptions);
        }
        catch (err) {
            console.warn(err);
            return undefined;
        }
    }
    const trustedTypesPolicy = createTrustedTypesPolicy('amdLoader', {
        createScriptURL: value => value,
        createScript: (_, ...args) => {
            // workaround a chrome issue not allowing to create new functions
            // see https://github.com/w3c/webappsec-trusted-types/wiki/Trusted-Types-for-function-constructor
            const fnArgs = args.slice(0, -1).join(',');
            const fnBody = args.pop().toString();
            // Do not add a new line to fnBody, as this will confuse source maps.
            const body = `(function anonymous(${fnArgs}) { ${fnBody}\n})`;
            return body;
        }
    });
    function canUseEval() {
        try {
            const func = (trustedTypesPolicy
                ? globalThis.eval(trustedTypesPolicy.createScript('', 'true')) // CodeQL [SM01632] fetch + eval is used on the web worker instead of importScripts if possible because importScripts is synchronous and we observed deadlocks on Safari
                : new Function('true') // CodeQL [SM01632] fetch + eval is used on the web worker instead of importScripts if possible because importScripts is synchronous and we observed deadlocks on Safari
            );
            func.call(globalThis);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    function loadAMDLoader() {
        return new Promise((resolve, reject) => {
            if (typeof globalThis.define === 'function' && globalThis.define.amd) {
                return resolve();
            }
            const loaderSrc = monacoBaseUrl + 'vs/loader.js';
            const isCrossOrigin = (/^((http:)|(https:)|(file:))/.test(loaderSrc) && loaderSrc.substring(0, globalThis.origin.length) !== globalThis.origin);
            if (!isCrossOrigin && canUseEval()) {
                // use `fetch` if possible because `importScripts`
                // is synchronous and can lead to deadlocks on Safari
                fetch(loaderSrc).then((response) => {
                    if (response.status !== 200) {
                        throw new Error(response.statusText);
                    }
                    return response.text();
                }).then((text) => {
                    text = `${text}\n//# sourceURL=${loaderSrc}`;
                    const func = (trustedTypesPolicy
                        ? globalThis.eval(trustedTypesPolicy.createScript('', text)) // CodeQL [SM01632] fetch + eval is used on the web worker instead of importScripts if possible because importScripts is synchronous and we observed deadlocks on Safari
                        : new Function(text) // CodeQL [SM01632] fetch + eval is used on the web worker instead of importScripts if possible because importScripts is synchronous and we observed deadlocks on Safari
                    );
                    func.call(globalThis);
                    resolve();
                }).then(undefined, reject);
                return;
            }
            if (trustedTypesPolicy) {
                importScripts(trustedTypesPolicy.createScriptURL(loaderSrc));
            }
            else {
                importScripts(loaderSrc);
            }
            resolve();
        });
    }
    function configureAMDLoader() {
        require.config({
            baseUrl: monacoBaseUrl,
            catchError: true,
            trustedTypesPolicy,
            amdModulesPattern: /^vs\//
        });
    }
    function loadCode(moduleId) {
        loadAMDLoader().then(() => {
            configureAMDLoader();
            require([moduleId], function (ws) {
                setTimeout(function () {
                    const messageHandler = ws.create((msg, transfer) => {
                        globalThis.postMessage(msg, transfer);
                    }, null);
                    globalThis.onmessage = (e) => messageHandler.onmessage(e.data, e.ports);
                    while (beforeReadyMessages.length > 0) {
                        const e = beforeReadyMessages.shift();
                        messageHandler.onmessage(e.data, e.ports);
                    }
                }, 0);
            });
        });
    }
    // If the loader is already defined, configure it immediately
    // This helps in the bundled case, where we must load nls files
    // and they need a correct baseUrl to be loaded.
    if (typeof globalThis.define === 'function' && globalThis.define.amd) {
        configureAMDLoader();
    }
    let isFirstMessage = true;
    const beforeReadyMessages = [];
    globalThis.onmessage = (message) => {
        if (!isFirstMessage) {
            beforeReadyMessages.push(message);
            return;
        }
        isFirstMessage = false;
        loadCode(message.data);
    };
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyTWFpbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS93b3JrZXIvd29ya2VyTWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztnR0FHZ0c7QUFFaEcsQ0FBQztJQVNBLE1BQU0saUJBQWlCLEdBQW9DLFVBQWtCLENBQUMsaUJBQWlCLENBQUM7SUFDaEcsTUFBTSxhQUFhLEdBQUcsaUJBQWlCLElBQUksaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztJQUUvRyxTQUFTLHdCQUF3QixDQUNoQyxVQUFrQixFQUNsQixhQUF1QjtRQUd2QixJQUFJLGlCQUFpQixFQUFFLHdCQUF3QixFQUFFLENBQUM7WUFDakQsSUFBSSxDQUFDO2dCQUNKLE9BQU8saUJBQWlCLENBQUMsd0JBQXdCLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQzlFLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNkLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2xCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBSSxDQUFDO1lBQ0osT0FBTyxJQUFJLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDZCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7SUFDRixDQUFDO0lBRUQsTUFBTSxrQkFBa0IsR0FBRyx3QkFBd0IsQ0FBQyxXQUFXLEVBQUU7UUFDaEUsZUFBZSxFQUFFLEtBQUssQ0FBQyxF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