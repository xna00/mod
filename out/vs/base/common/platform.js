define(["require", "exports", "vs/nls"], function (require, exports, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAndroid = exports.isEdge = exports.isSafari = exports.isFirefox = exports.isChrome = exports.OS = exports.OperatingSystem = exports.setTimeout0 = exports.setTimeout0IsFaster = exports.translationsConfigFile = exports.platformLocale = exports.locale = exports.Language = exports.language = exports.userAgent = exports.platform = exports.isCI = exports.isMobile = exports.isIOS = exports.webWorkerOrigin = exports.isWebWorker = exports.isWeb = exports.isElectron = exports.isNative = exports.isLinuxSnap = exports.isLinux = exports.isMacintosh = exports.isWindows = exports.Platform = exports.LANGUAGE_DEFAULT = void 0;
    exports.PlatformToString = PlatformToString;
    exports.isLittleEndian = isLittleEndian;
    exports.isBigSurOrNewer = isBigSurOrNewer;
    exports.LANGUAGE_DEFAULT = 'en';
    let _isWindows = false;
    let _isMacintosh = false;
    let _isLinux = false;
    let _isLinuxSnap = false;
    let _isNative = false;
    let _isWeb = false;
    let _isElectron = false;
    let _isIOS = false;
    let _isCI = false;
    let _isMobile = false;
    let _locale = undefined;
    let _language = exports.LANGUAGE_DEFAULT;
    let _platformLocale = exports.LANGUAGE_DEFAULT;
    let _translationsConfigFile = undefined;
    let _userAgent = undefined;
    const $globalThis = globalThis;
    let nodeProcess = undefined;
    if (typeof $globalThis.vscode !== 'undefined' && typeof $globalThis.vscode.process !== 'undefined') {
        // Native environment (sandboxed)
        nodeProcess = $globalThis.vscode.process;
    }
    else if (typeof process !== 'undefined' && typeof process?.versions?.node === 'string') {
        // Native environment (non-sandboxed)
        nodeProcess = process;
    }
    const isElectronProcess = typeof nodeProcess?.versions?.electron === 'string';
    const isElectronRenderer = isElectronProcess && nodeProcess?.type === 'renderer';
    // Native environment
    if (typeof nodeProcess === 'object') {
        _isWindows = (nodeProcess.platform === 'win32');
        _isMacintosh = (nodeProcess.platform === 'darwin');
        _isLinux = (nodeProcess.platform === 'linux');
        _isLinuxSnap = _isLinux && !!nodeProcess.env['SNAP'] && !!nodeProcess.env['SNAP_REVISION'];
        _isElectron = isElectronProcess;
        _isCI = !!nodeProcess.env['CI'] || !!nodeProcess.env['BUILD_ARTIFACTSTAGINGDIRECTORY'];
        _locale = exports.LANGUAGE_DEFAULT;
        _language = exports.LANGUAGE_DEFAULT;
        const rawNlsConfig = nodeProcess.env['VSCODE_NLS_CONFIG'];
        if (rawNlsConfig) {
            try {
                const nlsConfig = JSON.parse(rawNlsConfig);
                const resolved = nlsConfig.availableLanguages['*'];
                _locale = nlsConfig.locale;
                _platformLocale = nlsConfig.osLocale;
                // VSCode's default language is 'en'
                _language = resolved ? resolved : exports.LANGUAGE_DEFAULT;
                _translationsConfigFile = nlsConfig._translationsConfigFile;
            }
            catch (e) {
            }
        }
        _isNative = true;
    }
    // Web environment
    else if (typeof navigator === 'object' && !isElectronRenderer) {
        _userAgent = navigator.userAgent;
        _isWindows = _userAgent.indexOf('Windows') >= 0;
        _isMacintosh = _userAgent.indexOf('Macintosh') >= 0;
        _isIOS = (_userAgent.indexOf('Macintosh') >= 0 || _userAgent.indexOf('iPad') >= 0 || _userAgent.indexOf('iPhone') >= 0) && !!navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
        _isLinux = _userAgent.indexOf('Linux') >= 0;
        _isMobile = _userAgent?.indexOf('Mobi') >= 0;
        _isWeb = true;
        const configuredLocale = nls.getConfiguredDefaultLocale(
        // This call _must_ be done in the file that calls `nls.getConfiguredDefaultLocale`
        // to ensure that the NLS AMD Loader plugin has been loaded and configured.
        // This is because the loader plugin decides what the default locale is based on
        // how it's able to resolve the strings.
        nls.localize({ key: 'ensureLoaderPluginIsLoaded', comment: ['{Locked}'] }, '_'));
        _locale = configuredLocale || exports.LANGUAGE_DEFAULT;
        _language = _locale;
        _platformLocale = navigator.language;
    }
    // Unknown environment
    else {
        console.error('Unable to resolve platform.');
    }
    var Platform;
    (function (Platform) {
        Platform[Platform["Web"] = 0] = "Web";
        Platform[Platform["Mac"] = 1] = "Mac";
        Platform[Platform["Linux"] = 2] = "Linux";
        Platform[Platform["Windows"] = 3] = "Windows";
    })(Platform || (exports.Platform = Platform = {}));
    function PlatformToString(platform) {
        switch (platform) {
            case 0 /* Platform.Web */: return 'Web';
            case 1 /* Platform.Mac */: return 'Mac';
            case 2 /* Platform.Linux */: return 'Linux';
            case 3 /* Platform.Windows */: return 'Windows';
        }
    }
    let _platform = 0 /* Platform.Web */;
    if (_isMacintosh) {
        _platform = 1 /* Platform.Mac */;
    }
    else if (_isWindows) {
        _platform = 3 /* Platform.Windows */;
    }
    else if (_isLinux) {
        _platform = 2 /* Platform.Linux */;
    }
    exports.isWindows = _isWindows;
    exports.isMacintosh = _isMacintosh;
    exports.isLinux = _isLinux;
    exports.isLinuxSnap = _isLinuxSnap;
    exports.isNative = _isNative;
    exports.isElectron = _isElectron;
    exports.isWeb = _isWeb;
    exports.isWebWorker = (_isWeb && typeof $globalThis.importScripts === 'function');
    exports.webWorkerOrigin = exports.isWebWorker ? $globalThis.origin : undefined;
    exports.isIOS = _isIOS;
    exports.isMobile = _isMobile;
    /**
     * Whether we run inside a CI environment, such as
     * GH actions or Azure Pipelines.
     */
    exports.isCI = _isCI;
    exports.platform = _platform;
    exports.userAgent = _userAgent;
    /**
     * The language used for the user interface. The format of
     * the string is all lower case (e.g. zh-tw for Traditional
     * Chinese)
     */
    exports.language = _language;
    var Language;
    (function (Language) {
        function value() {
            return exports.language;
        }
        Language.value = value;
        function isDefaultVariant() {
            if (exports.language.length === 2) {
                return exports.language === 'en';
            }
            else if (exports.language.length >= 3) {
                return exports.language[0] === 'e' && exports.language[1] === 'n' && exports.language[2] === '-';
            }
            else {
                return false;
            }
        }
        Language.isDefaultVariant = isDefaultVariant;
        function isDefault() {
            return exports.language === 'en';
        }
        Language.isDefault = isDefault;
    })(Language || (exports.Language = Language = {}));
    /**
     * The OS locale or the locale specified by --locale. The format of
     * the string is all lower case (e.g. zh-tw for Traditional
     * Chinese). The UI is not necessarily shown in the provided locale.
     */
    exports.locale = _locale;
    /**
     * This will always be set to the OS/browser's locale regardless of
     * what was specified by --locale. The format of the string is all
     * lower case (e.g. zh-tw for Traditional Chinese). The UI is not
     * necessarily shown in the provided locale.
     */
    exports.platformLocale = _platformLocale;
    /**
     * The translations that are available through language packs.
     */
    exports.translationsConfigFile = _translationsConfigFile;
    exports.setTimeout0IsFaster = (typeof $globalThis.postMessage === 'function' && !$globalThis.importScripts);
    /**
     * See https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#:~:text=than%204%2C%20then-,set%20timeout%20to%204,-.
     *
     * Works similarly to `setTimeout(0)` but doesn't suffer from the 4ms artificial delay
     * that browsers set when the nesting level is > 5.
     */
    exports.setTimeout0 = (() => {
        if (exports.setTimeout0IsFaster) {
            const pending = [];
            $globalThis.addEventListener('message', (e) => {
                if (e.data && e.data.vscodeScheduleAsyncWork) {
                    for (let i = 0, len = pending.length; i < len; i++) {
                        const candidate = pending[i];
                        if (candidate.id === e.data.vscodeScheduleAsyncWork) {
                            pending.splice(i, 1);
                            candidate.callback();
                            return;
                        }
                    }
                }
            });
            let lastId = 0;
            return (callback) => {
                const myId = ++lastId;
                pending.push({
                    id: myId,
                    callback: callback
                });
                $globalThis.postMessage({ vscodeScheduleAsyncWork: myId }, '*');
            };
        }
        return (callback) => setTimeout(callback);
    })();
    var OperatingSystem;
    (function (OperatingSystem) {
        OperatingSystem[OperatingSystem["Windows"] = 1] = "Windows";
        OperatingSystem[OperatingSystem["Macintosh"] = 2] = "Macintosh";
        OperatingSystem[OperatingSystem["Linux"] = 3] = "Linux";
    })(OperatingSystem || (exports.OperatingSystem = OperatingSystem = {}));
    exports.OS = (_isMacintosh || _isIOS ? 2 /* OperatingSystem.Macintosh */ : (_isWindows ? 1 /* OperatingSystem.Windows */ : 3 /* OperatingSystem.Linux */));
    let _isLittleEndian = true;
    let _isLittleEndianComputed = false;
    function isLittleEndian() {
        if (!_isLittleEndianComputed) {
            _isLittleEndianComputed = true;
            const test = new Uint8Array(2);
            test[0] = 1;
            test[1] = 2;
            const view = new Uint16Array(test.buffer);
            _isLittleEndian = (view[0] === (2 << 8) + 1);
        }
        return _isLittleEndian;
    }
    exports.isChrome = !!(exports.userAgent && exports.userAgent.indexOf('Chrome') >= 0);
    exports.isFirefox = !!(exports.userAgent && exports.userAgent.indexOf('Firefox') >= 0);
    exports.isSafari = !!(!exports.isChrome && (exports.userAgent && exports.userAgent.indexOf('Safari') >= 0));
    exports.isEdge = !!(exports.userAgent && exports.userAgent.indexOf('Edg/') >= 0);
    exports.isAndroid = !!(exports.userAgent && exports.userAgent.indexOf('Android') >= 0);
    function isBigSurOrNewer(osVersion) {
        return parseFloat(osVersion) >= 20;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhdGZvcm0uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3BsYXRmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUE0SUEsNENBT0M7SUFnSUQsd0NBVUM7SUFRRCwwQ0FFQztJQWpTWSxRQUFBLGdCQUFnQixHQUFHLElBQUksQ0FBQztJQUVyQyxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDdkIsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3pCLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQztJQUNyQixJQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7SUFDekIsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQztJQUNuQixJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFDeEIsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBQ25CLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNsQixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDdEIsSUFBSSxPQUFPLEdBQXVCLFNBQVMsQ0FBQztJQUM1QyxJQUFJLFNBQVMsR0FBVyx3QkFBZ0IsQ0FBQztJQUN6QyxJQUFJLGVBQWUsR0FBVyx3QkFBZ0IsQ0FBQztJQUMvQyxJQUFJLHVCQUF1QixHQUF1QixTQUFTLENBQUM7SUFDNUQsSUFBSSxVQUFVLEdBQXVCLFNBQVMsQ0FBQztJQW1DL0MsTUFBTSxXQUFXLEdBQVEsVUFBVSxDQUFDO0lBRXBDLElBQUksV0FBVyxHQUE2QixTQUFTLENBQUM7SUFDdEQsSUFBSSxPQUFPLFdBQVcsQ0FBQyxNQUFNLEtBQUssV0FBVyxJQUFJLE9BQU8sV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEtBQUssV0FBVyxFQUFFLENBQUM7UUFDcEcsaUNBQWlDO1FBQ2pDLFdBQVcs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