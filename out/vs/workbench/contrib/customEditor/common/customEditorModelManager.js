/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/functional"], function (require, exports, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEditorModelManager = void 0;
    class CustomEditorModelManager {
        constructor() {
            this._references = new Map();
        }
        async getAllModels(resource) {
            const keyStart = `${resource.toString()}@@@`;
            const models = [];
            for (const [key, entry] of this._references) {
                if (key.startsWith(keyStart) && entry.model) {
                    models.push(await entry.model);
                }
            }
            return models;
        }
        async get(resource, viewType) {
            const key = this.key(resource, viewType);
            const entry = this._references.get(key);
            return entry?.model;
        }
        tryRetain(resource, viewType) {
            const key = this.key(resource, viewType);
            const entry = this._references.get(key);
            if (!entry) {
                return undefined;
            }
            entry.counter++;
            return entry.model.then(model => {
                return {
                    object: model,
                    dispose: (0, functional_1.createSingleCallFunction)(() => {
                        if (--entry.counter <= 0) {
                            entry.model.then(x => x.dispose());
                            this._references.delete(key);
                        }
                    }),
                };
            });
        }
        add(resource, viewType, model) {
            const key = this.key(resource, viewType);
            const existing = this._references.get(key);
            if (existing) {
                throw new Error('Model already exists');
            }
            this._references.set(key, { viewType, model, counter: 0 });
            return this.tryRetain(resource, viewType);
        }
        disposeAllModelsForView(viewType) {
            for (const [key, value] of this._references) {
                if (value.viewType === viewType) {
                    value.model.then(x => x.dispose());
                    this._references.delete(key);
                }
            }
        }
        key(resource, viewType) {
            return `${resource.toString()}@@@${viewType}`;
        }
    }
    exports.CustomEditorModelManager = CustomEditorModelManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tRWRpdG9yTW9kZWxNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jdXN0b21FZGl0b3IvY29tbW9uL2N1c3RvbUVkaXRvck1vZGVsTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSx3QkFBd0I7UUFBckM7WUFFa0IsZ0JBQVcsR0FBRyxJQUFJLEdBQUcsRUFJbEMsQ0FBQztRQWdFTixDQUFDO1FBOURPLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBYTtZQUN0QyxNQUFNLFFBQVEsR0FBRyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDO1lBQzdDLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNsQixLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUM3QyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUM3QyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNoQyxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUNNLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBYSxFQUFFLFFBQWdCO1lBQy9DLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3hDLE9BQU8sS0FBSyxFQUFFLEtBQUssQ0FBQztRQUNyQixD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