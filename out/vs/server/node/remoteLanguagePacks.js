/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/network", "vs/base/common/path", "vs/base/node/languagePacks", "vs/platform/product/common/product"], function (require, exports, fs, network_1, path, lp, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InternalNLSConfiguration = void 0;
    exports.getNLSConfiguration = getNLSConfiguration;
    const metaData = path.join(network_1.FileAccess.asFileUri('').fsPath, 'nls.metadata.json');
    const _cache = new Map();
    function exists(file) {
        return new Promise(c => fs.exists(file, c));
    }
    function getNLSConfiguration(language, userDataPath) {
        return exists(metaData).then((fileExists) => {
            if (!fileExists || !product_1.default.commit) {
                // console.log(`==> MetaData or commit unknown. Using default language.`);
                // The OS Locale on the remote side really doesn't matter, so we return the default locale
                return Promise.resolve({ locale: 'en', osLocale: 'en', availableLanguages: {} });
            }
            const key = `${language}||${userDataPath}`;
            let result = _cache.get(key);
            if (!result) {
                // The OS Locale on the remote side really doesn't matter, so we pass in the same language
                result = lp.getNLSConfiguration(product_1.default.commit, userDataPath, metaData, language, language).then(value => {
                    if (InternalNLSConfiguration.is(value)) {
                        value._languagePackSupport = true;
                    }
                    return value;
                });
                _cache.set(key, result);
            }
            return result;
        });
    }
    var InternalNLSConfiguration;
    (function (InternalNLSConfiguration) {
        function is(value) {
            const candidate = value;
            return candidate && typeof candidate._languagePackId === 'string';
        }
        InternalNLSConfiguration.is = is;
    })(InternalNLSConfiguration || (exports.InternalNLSConfiguration = InternalNLSConfiguration = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlTGFuZ3VhZ2VQYWNrcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvc2VydmVyL25vZGUvcmVtb3RlTGFuZ3VhZ2VQYWNrcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHLGtEQXFCQztJQTVCRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBQ2pGLE1BQU0sTUFBTSxHQUE4QyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBRXBFLFNBQVMsTUFBTSxDQUFDLElBQVk7UUFDM0IsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELFNBQWdCLG1CQUFtQixDQUFDLFFBQWdCLEVBQUUsWUFBb0I7UUFDekUsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUU7WUFDM0MsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLGlCQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3BDLDBFQUEwRTtnQkFDMUUsMEZBQTBGO2dCQUMxRixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNsRixDQUFDO1lBQ0QsTUFBTSxHQUFHLEdBQUcsR0FBRyxRQUFRLEtBQUssWUFBWSxFQUFFLENBQUM7WUFDM0MsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2IsMEZBQTBGO2dCQUMxRixNQUFNLEdBQUcsRUFBRSxDQUFDLG1CQUFtQixDQUFDLGlCQUFPLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDeEcsSUFBSSx3QkFBd0IsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDeEMsS0FBSyxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztvQkFDbkMsQ0FBQztvQkFDRCxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDLENBQUMsQ0FBQztnQkFDSCxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN6QixDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxJQUFpQix3QkFBd0IsQ0FLeEM7SUFMRCxXQUFpQix3QkFBd0I7UUFDeEMsU0FBZ0IsRUFBRSxDQUFDLEtBQTBCO1lBQzVDLE1BQU0sU0FBUyxHQUFnQyxLQUFvQyxDQUFDO1lBQ3BGLE9BQU8sU0FBUyxJQUFJLE9BQU8sU0FBUyxDQUFDLGVBQWUsS0FBSyxRQUFRLENBQUM7UUFDbkUsQ0FBQztRQUhlLDJCQUFFLEtBR2pCLENBQUE7SUFDRixDQUFDLEVBTGdCLHdCQUF3Qix3Q0FBeEIsd0JBQXdCLFFBS3hDIn0=