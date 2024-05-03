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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/ternarySearchTree", "vs/editor/common/languages", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage"], function (require, exports, async_1, lifecycle_1, map_1, ternarySearchTree_1, languages_1, configuration_1, extensions_1, instantiation_1, storage_1) {
    "use strict";
    var SuggestMemoryService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ISuggestMemoryService = exports.SuggestMemoryService = exports.PrefixMemory = exports.LRUMemory = exports.NoMemory = exports.Memory = void 0;
    class Memory {
        constructor(name) {
            this.name = name;
        }
        select(model, pos, items) {
            if (items.length === 0) {
                return 0;
            }
            const topScore = items[0].score[0];
            for (let i = 0; i < items.length; i++) {
                const { score, completion: suggestion } = items[i];
                if (score[0] !== topScore) {
                    // stop when leaving the group of top matches
                    break;
                }
                if (suggestion.preselect) {
                    // stop when seeing an auto-select-item
                    return i;
                }
            }
            return 0;
        }
    }
    exports.Memory = Memory;
    class NoMemory extends Memory {
        constructor() {
            super('first');
        }
        memorize(model, pos, item) {
            // no-op
        }
        toJSON() {
            return undefined;
        }
        fromJSON() {
            //
        }
    }
    exports.NoMemory = NoMemory;
    class LRUMemory extends Memory {
        constructor() {
            super('recentlyUsed');
            this._cache = new map_1.LRUCache(300, 0.66);
            this._seq = 0;
        }
        memorize(model, pos, item) {
            const key = `${model.getLanguageId()}/${item.textLabel}`;
            this._cache.set(key, {
                touch: this._seq++,
                type: item.completion.kind,
                insertText: item.completion.insertText
            });
        }
        select(model, pos, items) {
            if (items.length === 0) {
                return 0;
            }
            const lineSuffix = model.getLineContent(pos.lineNumber).substr(pos.column - 10, pos.column - 1);
            if (/\s$/.test(lineSuffix)) {
                return super.select(model, pos, items);
            }
            const topScore = items[0].score[0];
            let indexPreselect = -1;
            let indexRecency = -1;
            let seq = -1;
            for (let i = 0; i < items.length; i++) {
                if (items[i].score[0] !== topScore) {
                    // consider only top items
                    break;
                }
                const key = `${model.getLanguageId()}/${items[i].textLabel}`;
                const item = this._cache.peek(key);
                if (item && item.touch > seq && item.type === items[i].completion.kind && item.insertText === items[i].completion.insertText) {
                    seq = item.touch;
                    indexRecency = i;
                }
                if (items[i].completion.preselect && indexPreselect === -1) {
                    // stop when seeing an auto-select-item
                    return indexPreselect = i;
                }
            }
            if (indexRecency !== -1) {
                return indexRecency;
            }
            else if (indexPreselect !== -1) {
                return indexPreselect;
            }
            else {
                return 0;
            }
        }
        toJSON() {
            return this._cache.toJSON();
        }
        fromJSON(data) {
            this._cache.clear();
            const seq = 0;
            for (const [key, value] of data) {
                value.touch = seq;
                value.type = typeof value.type === 'number' ? value.type : languages_1.CompletionItemKinds.fromString(value.type);
                this._cache.set(key, value);
            }
            this._seq = this._cache.size;
        }
    }
    exports.LRUMemory = LRUMemory;
    class PrefixMemory extends Memory {
        constructor() {
            super('recentlyUsedByPrefix');
            this._trie = ternarySearchTree_1.TernarySearchTree.forStrings();
            this._seq = 0;
        }
        memorize(model, pos, item) {
            const { word } = model.getWordUntilPosition(pos);
            const key = `${model.getLanguageId()}/${word}`;
            this._trie.set(key, {
                type: item.completion.kind,
                insertText: item.completion.insertText,
                touch: this._seq++
            });
        }
        select(model, pos, items) {
            const { word } = model.getWordUntilPosition(pos);
            if (!word) {
                return super.select(model, pos, items);
            }
            const key = `${model.getLanguageId()}/${word}`;
            let item = this._trie.get(key);
            if (!item) {
                item = this._trie.findSubstr(key);
            }
            if (item) {
                for (let i = 0; i < items.length; i++) {
                    const { kind, insertText } = items[i].completion;
                    if (kind === item.type && insertText === item.insertText) {
                        return i;
                    }
                }
            }
            return super.select(model, pos, items);
        }
        toJSON() {
            const entries = [];
            this._trie.forEach((value, key) => entries.push([key, value]));
            // sort by last recently used (touch), then
            // take the top 200 item and normalize their
            // touch
            entries
                .sort((a, b) => -(a[1].touch - b[1].touch))
                .forEach((value, i) => value[1].touch = i);
            return entries.slice(0, 200);
        }
        fromJSON(data) {
            this._trie.clear();
            if (data.length > 0) {
                this._seq = data[0][1].touch + 1;
                for (const [key, value] of data) {
                    value.type = typeof value.type === 'number' ? value.type : languages_1.CompletionItemKinds.fromString(value.type);
                    this._trie.set(key, value);
                }
            }
        }
    }
    exports.PrefixMemory = PrefixMemory;
    let SuggestMemoryService = class SuggestMemoryService {
        static { SuggestMemoryService_1 = this; }
        static { this._strategyCtors = new Map([
            ['recentlyUsedByPrefix', PrefixMemory],
            ['recentlyUsed', LRUMemory],
            ['first', NoMemory]
        ]); }
        static { this._storagePrefix = 'suggest/memories'; }
        constructor(_storageService, _configService) {
            this._storageService = _storageService;
            this._configService = _configService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._persistSoon = new async_1.RunOnceScheduler(() => this._saveState(), 500);
            this._disposables.add(_storageService.onWillSaveState(e => {
                if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    this._saveState();
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
            this._persistSoon.dispose();
        }
        memorize(model, pos, item) {
            this._withStrategy(model, pos).memorize(model, pos, item);
            this._persistSoon.schedule();
        }
        select(model, pos, items) {
            return this._withStrategy(model, pos).select(model, pos, items);
        }
        _withStrategy(model, pos) {
            const mode = this._configService.getValue('editor.suggestSelection', {
                overrideIdentifier: model.getLanguageIdAtPosition(pos.lineNumber, pos.column),
                resource: model.uri
            });
            if (this._strategy?.name !== mode) {
                this._saveState();
                const ctor = SuggestMemoryService_1._strategyCtors.get(mode) || NoMemory;
                this._strategy = new ctor();
                try {
                    const share = this._configService.getValue('editor.suggest.shareSuggestSelections');
                    const scope = share ? 0 /* StorageScope.PROFILE */ : 1 /* StorageScope.WORKSPACE */;
                    const raw = this._storageService.get(`${SuggestMemoryService_1._storagePrefix}/${mode}`, scope);
                    if (raw) {
                        this._strategy.fromJSON(JSON.parse(raw));
                    }
                }
                catch (e) {
                    // things can go wrong with JSON...
                }
            }
            return this._strategy;
        }
        _saveState() {
            if (this._strategy) {
                const share = this._configService.getValue('editor.suggest.shareSuggestSelections');
                const scope = share ? 0 /* StorageScope.PROFILE */ : 1 /* StorageScope.WORKSPACE */;
                const raw = JSON.stringify(this._strategy);
                this._storageService.store(`${SuggestMemoryService_1._storagePrefix}/${this._strategy.name}`, raw, scope, 1 /* StorageTarget.MACHINE */);
            }
        }
    };
    exports.SuggestMemoryService = SuggestMemoryService;
    exports.SuggestMemoryService = SuggestMemoryService = SuggestMemoryService_1 = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, configuration_1.IConfigurationService)
    ], SuggestMemoryService);
    exports.ISuggestMemoryService = (0, instantiation_1.createDecorator)('ISuggestMemories');
    (0, extensions_1.registerSingleton)(exports.ISuggestMemoryService, SuggestMemoryService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdE1lbW9yeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3VnZ2VzdC9icm93c2VyL3N1Z2dlc3RNZW1vcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWdCaEcsTUFBc0IsTUFBTTtRQUUzQixZQUFxQixJQUFhO1lBQWIsU0FBSSxHQUFKLElBQUksQ0FBUztRQUFJLENBQUM7UUFFdkMsTUFBTSxDQUFDLEtBQWlCLEVBQUUsR0FBYyxFQUFFLEtBQXVCO1lBQ2hFLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBQ0QsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUMzQiw2Q0FBNkM7b0JBQzdDLE1BQU07Z0JBQ1AsQ0FBQztnQkFDRCxJQUFJLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDMUIsdUNBQXVDO29CQUN2QyxPQUFPLENBQUMsQ0FBQztnQkFDVixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztLQU9EO0lBNUJELHdCQTRCQztJQUVELE1BQWEsUUFBUyxTQUFR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