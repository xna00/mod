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
define(["require", "exports", "vs/base/common/event", "../common/decorations", "vs/base/common/ternarySearchTree", "vs/base/common/lifecycle", "vs/base/common/async", "vs/base/common/linkedList", "vs/base/browser/dom", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/base/common/strings", "vs/nls", "vs/base/common/errors", "vs/base/common/cancellation", "vs/platform/instantiation/common/extensions", "vs/base/common/hash", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/arrays", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry"], function (require, exports, event_1, decorations_1, ternarySearchTree_1, lifecycle_1, async_1, linkedList_1, dom_1, themeService_1, themables_1, strings_1, nls_1, errors_1, cancellation_1, extensions_1, hash_1, uriIdentity_1, arrays_1, colorRegistry_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecorationsService = void 0;
    class DecorationRule {
        static keyOf(data) {
            if (Array.isArray(data)) {
                return data.map(DecorationRule.keyOf).join(',');
            }
            else {
                const { color, letter } = data;
                if (themables_1.ThemeIcon.isThemeIcon(letter)) {
                    return `${color}+${letter.id}`;
                }
                else {
                    return `${color}/${letter}`;
                }
            }
        }
        static { this._classNamesPrefix = 'monaco-decoration'; }
        constructor(themeService, data, key) {
            this.themeService = themeService;
            this._refCounter = 0;
            this.data = data;
            const suffix = (0, hash_1.hash)(key).toString(36);
            this.itemColorClassName = `${DecorationRule._classNamesPrefix}-itemColor-${suffix}`;
            this.itemBadgeClassName = `${DecorationRule._classNamesPrefix}-itemBadge-${suffix}`;
            this.bubbleBadgeClassName = `${DecorationRule._classNamesPrefix}-bubbleBadge-${suffix}`;
            this.iconBadgeClassName = `${DecorationRule._classNamesPrefix}-iconBadge-${suffix}`;
        }
        acquire() {
            this._refCounter += 1;
        }
        release() {
            return --this._refCounter === 0;
        }
        appendCSSRules(element) {
            if (!Array.isArray(this.data)) {
                this._appendForOne(this.data, element);
            }
            else {
                this._appendForMany(this.data, element);
            }
        }
        _appendForOne(data, element) {
            const { color, letter } = data;
            // label
            (0, dom_1.createCSSRule)(`.${this.itemColorClassName}`, `color: ${getColor(color)};`, element);
            if (themables_1.ThemeIcon.isThemeIcon(letter)) {
                this._createIconCSSRule(letter, color, element);
            }
            else if (letter) {
                (0, dom_1.createCSSRule)(`.${this.itemBadgeClassName}::after`, `content: "${letter}"; color: ${getColor(color)};`, element);
            }
        }
        _appendForMany(data, element) {
            // label
            const { color } = data.find(d => !!d.color) ?? data[0];
            (0, dom_1.createCSSRule)(`.${this.itemColorClassName}`, `color: ${getColor(color)};`, element);
            // badge or icon
            const letters = [];
            let icon;
            for (const d of data) {
                if (themables_1.ThemeIcon.isThemeIcon(d.letter)) {
                    icon = d.letter;
                    break;
                }
                else if (d.letter) {
                    letters.push(d.letter);
                }
            }
            if (icon) {
                this._createIconCSSRule(icon, color, element);
            }
            else {
                if (letters.length) {
                    (0, dom_1.createCSSRule)(`.${this.itemBadgeClassName}::after`, `content: "${letters.join(', ')}"; color: ${getColor(color)};`, element);
                }
                // bubble badge
                // TODO @misolori update bubble badge to adopt letter: ThemeIcon instead of unicode
                (0, dom_1.createCSSRule)(`.${this.bubbleBadgeClassName}::after`, `content: "\uea71"; color: ${getColor(color)}; font-family: codicon; font-size: 14px; margin-right: 14px; opacity: 0.4;`, element);
            }
        }
        _createIconCSSRule(icon, color, element) {
            const modifier = themables_1.ThemeIcon.getModifier(icon);
            if (modifier) {
                icon = themables_1.ThemeIcon.modify(icon, undefined);
            }
            const iconContribution = (0, iconRegistry_1.getIconRegistry)().getIcon(icon.id);
            if (!iconContribution) {
                return;
            }
            const definition = this.themeService.getProductIconTheme().getIcon(iconContribution);
            if (!definition) {
                return;
            }
            (0, dom_1.createCSSRule)(`.${this.iconBadgeClassName}::after`, `content: '${definition.fontCharacter}';
			color: ${icon.color ? getColor(icon.color.id) : getColor(color)};
			font-family: ${(0, dom_1.asCSSPropertyValue)(definition.font?.id ?? 'codicon')};
			font-size: 16px;
			margin-right: 14px;
			font-weight: normal;
			${modifier === 'spin' ? 'animation: codicon-spin 1.5s steps(30) infinite' : ''};
			`, element);
        }
        removeCSSRules(element) {
            (0, dom_1.removeCSSRulesContainingSelector)(this.itemColorClassName, element);
            (0, dom_1.removeCSSRulesContainingSelector)(this.itemBadgeClassName, element);
            (0, dom_1.removeCSSRulesContainingSelector)(this.bubbleBadgeClassName, element);
            (0, dom_1.removeCSSRulesContainingSelector)(this.iconBadgeClassName, element);
        }
    }
    class DecorationStyles {
        constructor(_themeService) {
            this._themeService = _themeService;
            this._dispoables = new lifecycle_1.DisposableStore();
            this._styleElement = (0, dom_1.createStyleSheet)(undefined, undefined, this._dispoables);
            this._decorationRules = new Map();
        }
        dispose() {
            this._dispoables.dispose();
        }
        asDecoration(data, onlyChildren) {
            // sort by weight
            data.sort((a, b) => (b.weight || 0) - (a.weight || 0));
            const key = DecorationRule.keyOf(data);
            let rule = this._decorationRules.get(key);
            if (!rule) {
                // new css rule
                rule = new DecorationRule(this._themeService, data, key);
                this._decorationRules.set(key, rule);
                rule.appendCSSRules(this._styleElement);
            }
            rule.acquire();
            const labelClassName = rule.itemColorClassName;
            let badgeClassName = rule.itemBadgeClassName;
            const iconClassName = rule.iconBadgeClassName;
            let tooltip = (0, arrays_1.distinct)(data.filter(d => !(0, strings_1.isFalsyOrWhitespace)(d.tooltip)).map(d => d.tooltip)).join(' • ');
            const strikethrough = data.some(d => d.strikethrough);
            if (onlyChildren) {
                // show items from its children only
                badgeClassName = rule.bubbleBadgeClassName;
                tooltip = (0, nls_1.localize)('bubbleTitle', "Contains emphasized items");
            }
            return {
                labelClassName,
                badgeClassName,
                iconClassName,
                strikethrough,
                tooltip,
                dispose: () => {
                    if (rule?.release()) {
                        this._decorationRules.delete(key);
                        rule.removeCSSRules(this._styleElement);
                        rule = undefined;
                    }
                }
            };
        }
    }
    class FileDecorationChangeEvent {
        constructor(all) {
            this._data = ternarySearchTree_1.TernarySearchTree.forUris(_uri => true); // events ignore all path casings
            this._data.fill(true, (0, arrays_1.asArray)(all));
        }
        affectsResource(uri) {
            return this._data.hasElementOrSubtree(uri);
        }
    }
    class DecorationDataRequest {
        constructor(source, thenable) {
            this.source = source;
            this.thenable = thenable;
        }
    }
    function getColor(color) {
        return color ? (0, colorRegistry_1.asCssVariable)(color) : 'inherit';
    }
    let DecorationsService = class DecorationsService {
        constructor(uriIdentityService, themeService) {
            this._onDidChangeDecorationsDelayed = new event_1.DebounceEmitter({ merge: all => all.flat() });
            this._onDidChangeDecorations = new event_1.Emitter();
            this.onDidChangeDecorations = this._onDidChangeDecorations.event;
            this._provider = new linkedList_1.LinkedList();
            this._decorationStyles = new DecorationStyles(themeService);
            this._data = ternarySearchTree_1.TernarySearchTree.forUris(key => uriIdentityService.extUri.ignorePathCasing(key));
            this._onDidChangeDecorationsDelayed.event(event => { this._onDidChangeDecorations.fire(new FileDecorationChangeEvent(event)); });
        }
        dispose() {
            this._onDidChangeDecorations.dispose();
            this._onDidChangeDecorationsDelayed.dispose();
            this._data.clear();
        }
        registerDecorationsProvider(provider) {
            const rm = this._provider.unshift(provider);
            this._onDidChangeDecorations.fire({
                // everything might have changed
                affectsResource() { return true; }
            });
            // remove everything what came from this provider
            const removeAll = () => {
                const uris = [];
                for (const [uri, map] of this._data) {
                    if (map.delete(provider)) {
                        uris.push(uri);
                    }
                }
                if (uris.length > 0) {
                    this._onDidChangeDecorationsDelayed.fire(uris);
                }
            };
            const listener = provider.onDidChange(uris => {
                if (!uris) {
                    // flush event -> drop all data, can affect everything
                    removeAll();
                }
                else {
                    // selective changes -> drop for resource, fetch again, send event
                    for (const uri of uris) {
                        const map = this._ensureEntry(uri);
                        this._fetchData(map, uri, provider);
                    }
                }
            });
            return (0, lifecycle_1.toDisposable)(() => {
                rm();
                listener.dispose();
                removeAll();
            });
        }
        _ensureEntry(uri) {
            let map = this._data.get(uri);
            if (!map) {
                // nothing known about this uri
                map = new Map();
                this._data.set(uri, map);
            }
            return map;
        }
        getDecoration(uri, includeChildren) {
            const all = [];
            let containsChildren = false;
            const map = this._ensureEntry(uri);
            for (const provider of this._provider) {
                let data = map.get(provider);
                if (data === undefined) {
                    // sets data if fetch is sync
                    data = this._fetchData(map, uri, provider);
                }
                if (data && !(data instanceof DecorationDataRequest)) {
                    // having data
                    all.push(data);
                }
            }
            if (includeChildren) {
                // (resolved) children
                const iter = this._data.findSuperstr(uri);
                if (iter) {
                    for (const tuple of iter) {
                        for (const data of tuple[1].values()) {
                            if (data && !(data instanceof DecorationDataRequest)) {
                                if (data.bubble) {
                                    all.push(data);
                                    containsChildren = true;
                                }
                            }
                        }
                    }
                }
            }
            return all.length === 0
                ? undefined
                : this._decorationStyles.asDecoration(all, containsChildren);
        }
        _fetchData(map, uri, provider) {
            // check for pending request and cancel it
            const pendingRequest = map.get(provider);
            if (pendingRequest instanceof DecorationDataRequest) {
                pendingRequest.source.cancel();
                map.delete(provider);
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const dataOrThenable = provider.provideDecorations(uri, cts.token);
            if (!(0, async_1.isThenable)(dataOrThenable)) {
                // sync -> we have a result now
                cts.dispose();
                return this._keepItem(map, provider, uri, dataOrThenable);
            }
            else {
                // async -> we have a result soon
                const request = new DecorationDataRequest(cts, Promise.resolve(dataOrThenable).then(data => {
                    if (map.get(provider) === request) {
                        this._keepItem(map, provider, uri, data);
                    }
                }).catch(err => {
                    if (!(0, errors_1.isCancellationError)(err) && map.get(provider) === request) {
                        map.delete(provider);
                    }
                }).finally(() => {
                    cts.dispose();
                }));
                map.set(provider, request);
                return null;
            }
        }
        _keepItem(map, provider, uri, data) {
            const deco = data ? data : null;
            const old = map.get(provider);
            map.set(provider, deco);
            if (deco || old) {
                // only fire event when something changed
                this._onDidChangeDecorationsDelayed.fire(uri);
            }
            return deco;
        }
    };
    exports.DecorationsService = DecorationsService;
    exports.DecorationsService = DecorationsService = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService),
        __param(1, themeService_1.IThemeService)
    ], DecorationsService);
    (0, extensions_1.registerSingleton)(decorations_1.IDecorationsService, DecorationsService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdGlvbnNTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZGVjb3JhdGlvbnMvYnJvd3Nlci9kZWNvcmF0aW9uc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdUJoRyxNQUFNLGNBQWM7UUFFbkIsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUF5QztZQUNyRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDO2dCQUMvQixJQUFJLHFCQUFTLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQ25DLE9BQU8sR0FBRyxLQUFLLElBQUksTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNoQyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxHQUFHLEtBQUssSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDN0IsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO2lCQUV1QixzQkFBaUIsR0FBRyxtQkFBbUIsQUFBdEIsQ0FBdUI7UUFVaEUsWUFBcUIsWUFBMkIsRUFBRSxJQUF5QyxFQUFFLEdBQVc7WUFBbkYsaUJBQVksR0FBWixZQUFZLENBQWU7WUFGeEMsZ0JBQVcsR0FBVyxDQUFDLENBQUM7WUFHL0IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDakIsTUFBTSxNQUFNLEdBQUcsSUFBQSxXQUFJLEVB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