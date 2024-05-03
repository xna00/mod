/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.localize = localize;
    exports.localize2 = localize2;
    exports.getConfiguredDefaultLocale = getConfiguredDefaultLocale;
    exports.setPseudoTranslation = setPseudoTranslation;
    exports.create = create;
    exports.load = load;
    let isPseudo = (typeof document !== 'undefined' && document.location && document.location.hash.indexOf('pseudo=true') >= 0);
    const DEFAULT_TAG = 'i-default';
    function _format(message, args) {
        let result;
        if (args.length === 0) {
            result = message;
        }
        else {
            result = message.replace(/\{(\d+)\}/g, (match, rest) => {
                const index = rest[0];
                const arg = args[index];
                let result = match;
                if (typeof arg === 'string') {
                    result = arg;
                }
                else if (typeof arg === 'number' || typeof arg === 'boolean' || arg === void 0 || arg === null) {
                    result = String(arg);
                }
                return result;
            });
        }
        if (isPseudo) {
            // FF3B and FF3D is the Unicode zenkaku representation for [ and ]
            result = '\uFF3B' + result.replace(/[aouei]/g, '$&$&') + '\uFF3D';
        }
        return result;
    }
    function findLanguageForModule(config, name) {
        let result = config[name];
        if (result) {
            return result;
        }
        result = config['*'];
        if (result) {
            return result;
        }
        return null;
    }
    function endWithSlash(path) {
        if (path.charAt(path.length - 1) === '/') {
            return path;
        }
        return path + '/';
    }
    async function getMessagesFromTranslationsService(translationServiceUrl, language, name) {
        const url = endWithSlash(translationServiceUrl) + endWithSlash(language) + 'vscode/' + endWithSlash(name);
        const res = await fetch(url);
        if (res.ok) {
            const messages = await res.json();
            return messages;
        }
        throw new Error(`${res.status} - ${res.statusText}`);
    }
    function createScopedLocalize(scope) {
        return function (idx, defaultValue) {
            const restArgs = Array.prototype.slice.call(arguments, 2);
            return _format(scope[idx], restArgs);
        };
    }
    function createScopedLocalize2(scope) {
        return (idx, defaultValue, ...args) => ({
            value: _format(scope[idx], args),
            original: _format(defaultValue, args)
        });
    }
    /**
     * @skipMangle
     */
    function localize(data, message, ...args) {
        return _format(message, args);
    }
    /**
     * @skipMangle
     */
    function localize2(data, message, ...args) {
        const original = _format(message, args);
        return {
            value: original,
            original
        };
    }
    /**
     * @skipMangle
     */
    function getConfiguredDefaultLocale(_) {
        // This returns undefined because this implementation isn't used and is overwritten by the loader
        // when loaded.
        return undefined;
    }
    /**
     * @skipMangle
     */
    function setPseudoTranslation(value) {
        isPseudo = value;
    }
    /**
     * Invoked in a built product at run-time
     * @skipMangle
     */
    function create(key, data) {
        return {
            localize: createScopedLocalize(data[key]),
            localize2: createScopedLocalize2(data[key]),
            getConfiguredDefaultLocale: data.getConfiguredDefaultLocale ?? ((_) => undefined)
        };
    }
    /**
     * Invoked by the loader at run-time
     * @skipMangle
     */
    function load(name, req, load, config) {
        const pluginConfig = config['vs/nls'] ?? {};
        if (!name || name.length === 0) {
            // TODO: We need to give back the mangled names here
            return load({
                localize: localize,
                localize2: localize2,
                getConfiguredDefaultLocale: () => pluginConfig.availableLanguages?.['*']
            });
        }
        const language = pluginConfig.availableLanguages ? findLanguageForModule(pluginConfig.availableLanguages, name) : null;
        const useDefaultLanguage = language === null || language === DEFAULT_TAG;
        let suffix = '.nls';
        if (!useDefaultLanguage) {
            suffix = suffix + '.' + language;
        }
        const messagesLoaded = (messages) => {
            if (Array.isArray(messages)) {
                messages.localize = createScopedLocalize(messages);
                messages.localize2 = createScopedLocalize2(messages);
            }
            else {
                messages.localize = createScopedLocalize(messages[name]);
                messages.localize2 = createScopedLocalize2(messages[name]);
            }
            messages.getConfiguredDefaultLocale = () => pluginConfig.availableLanguages?.['*'];
            load(messages);
        };
        if (typeof pluginConfig.loadBundle === 'function') {
            pluginConfig.loadBundle(name, language, (err, messages) => {
                // We have an error. Load the English default strings to not fail
                if (err) {
                    req([name + '.nls'], messagesLoaded);
                }
                else {
                    messagesLoaded(messages);
                }
            });
        }
        else if (pluginConfig.translationServiceUrl && !useDefaultLanguage) {
            (async () => {
                try {
                    const messages = await getMessagesFromTranslationsService(pluginConfig.translationServiceUrl, language, name);
                    return messagesLoaded(messages);
                }
                catch (err) {
                    // Language is already as generic as it gets, so require default messages
                    if (!language.includes('-')) {
                        console.error(err);
                        return req([name + '.nls'], messagesLoaded);
                    }
                    try {
                        // Since there is a dash, the language configured is a specific sub-language of the same generic language.
                        // Since we were unable to load the specific language, try to load the generic language. Ex. we failed to find a
                        // Swiss German (de-CH), so try to load the generic German (de) messages instead.
                        const genericLanguage = language.split('-')[0];
                        const messages = await getMessagesFromTranslationsService(pluginConfig.translationServiceUrl, genericLanguage, name);
                        // We got some messages, so we configure the configuration to use the generic language for this session.
                        pluginConfig.availableLanguages ??= {};
                        pluginConfig.availableLanguages['*'] = genericLanguage;
                        return messagesLoaded(messages);
                    }
                    catch (err) {
                        console.error(err);
                        return req([name + '.nls'], messagesLoaded);
                    }
                }
            })();
        }
        else {
            req([name + suffix], messagesLoaded, (err) => {
                if (suffix === '.nls') {
                    console.error('Failed trying to load default language strings', err);
                    return;
                }
                console.error(`Failed to load message bundle for language ${language}. Falling back to the default language:`, err);
                req([name + '.nls'], messagesLoaded);
            });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9ubHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUErSmhHLDRCQUVDO0lBbUNELDhCQU1DO0lBV0QsZ0VBSUM7SUFLRCxvREFFQztJQU1ELHdCQU1DO0lBTUQsb0JBeUVDO0lBelRELElBQUksUUFBUSxHQUFHLENBQUMsT0FBTyxRQUFRLEtBQUssV0FBVyxJQUFJLFFBQVEsQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzVILE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQztJQXVEaEMsU0FBUyxPQUFPLENBQUMsT0FBZSxFQUFFLElBQXNEO1FBQ3ZGLElBQUksTUFBYyxDQUFDO1FBRW5CLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN2QixNQUFNLEdBQUcsT0FBTyxDQUFDO1FBQ2xCLENBQUM7YUFBTSxDQUFDO1lBQ1AsTUFBTSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO2dCQUN0RCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDO2dCQUNuQixJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUM3QixNQUFNLEdBQUcsR0FBRyxDQUFDO2dCQUNkLENBQUM7cUJBQU0sSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksT0FBTyxHQUFHLEtBQUssU0FBUyxJQUFJ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