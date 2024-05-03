/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/base/common/errors"], function (require, exports, types_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Memento = void 0;
    class Memento {
        static { this.applicationMementos = new Map(); }
        static { this.profileMementos = new Map(); }
        static { this.workspaceMementos = new Map(); }
        static { this.COMMON_PREFIX = 'memento/'; }
        constructor(id, storageService) {
            this.storageService = storageService;
            this.id = Memento.COMMON_PREFIX + id;
        }
        getMemento(scope, target) {
            switch (scope) {
                case 1 /* StorageScope.WORKSPACE */: {
                    let workspaceMemento = Memento.workspaceMementos.get(this.id);
                    if (!workspaceMemento) {
                        workspaceMemento = new ScopedMemento(this.id, scope, target, this.storageService);
                        Memento.workspaceMementos.set(this.id, workspaceMemento);
                    }
                    return workspaceMemento.getMemento();
                }
                case 0 /* StorageScope.PROFILE */: {
                    let profileMemento = Memento.profileMementos.get(this.id);
                    if (!profileMemento) {
                        profileMemento = new ScopedMemento(this.id, scope, target, this.storageService);
                        Memento.profileMementos.set(this.id, profileMemento);
                    }
                    return profileMemento.getMemento();
                }
                case -1 /* StorageScope.APPLICATION */: {
                    let applicationMemento = Memento.applicationMementos.get(this.id);
                    if (!applicationMemento) {
                        applicationMemento = new ScopedMemento(this.id, scope, target, this.storageService);
                        Memento.applicationMementos.set(this.id, applicationMemento);
                    }
                    return applicationMemento.getMemento();
                }
            }
        }
        onDidChangeValue(scope, disposables) {
            return this.storageService.onDidChangeValue(scope, this.id, disposables);
        }
        saveMemento() {
            Memento.workspaceMementos.get(this.id)?.save();
            Memento.profileMementos.get(this.id)?.save();
            Memento.applicationMementos.get(this.id)?.save();
        }
        reloadMemento(scope) {
            let memento;
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    memento = Memento.applicationMementos.get(this.id);
                    break;
                case 0 /* StorageScope.PROFILE */:
                    memento = Memento.profileMementos.get(this.id);
                    break;
                case 1 /* StorageScope.WORKSPACE */:
                    memento = Memento.workspaceMementos.get(this.id);
                    break;
            }
            memento?.reload();
        }
        static clear(scope) {
            switch (scope) {
                case 1 /* StorageScope.WORKSPACE */:
                    Memento.workspaceMementos.clear();
                    break;
                case 0 /* StorageScope.PROFILE */:
                    Memento.profileMementos.clear();
                    break;
                case -1 /* StorageScope.APPLICATION */:
                    Memento.applicationMementos.clear();
                    break;
            }
        }
    }
    exports.Memento = Memento;
    class ScopedMemento {
        constructor(id, scope, target, storageService) {
            this.id = id;
            this.scope = scope;
            this.target = target;
            this.storageService = storageService;
            this.mementoObj = this.doLoad();
        }
        doLoad() {
            try {
                return this.storageService.getObject(this.id, this.scope, {});
            }
            catch (error) {
                // Seeing reports from users unable to open editors
                // from memento parsing exceptions. Log the contents
                // to diagnose further
                // https://github.com/microsoft/vscode/issues/102251
                (0, errors_1.onUnexpectedError)(`[memento]: failed to parse contents: ${error} (id: ${this.id}, scope: ${this.scope}, contents: ${this.storageService.get(this.id, this.scope)})`);
            }
            return {};
        }
        getMemento() {
            return this.mementoObj;
        }
        reload() {
            // Clear old
            for (const name of Object.getOwnPropertyNames(this.mementoObj)) {
                delete this.mementoObj[name];
            }
            // Assign new
            Object.assign(this.mementoObj, this.doLoad());
        }
        save() {
            if (!(0, types_1.isEmptyObject)(this.mementoObj)) {
                this.storageService.store(this.id, this.mementoObj, this.scope, this.target);
            }
            else {
                this.storageService.remove(this.id, this.scope);
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVtZW50by5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9tZW1lbnRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLE9BQU87aUJBRUssd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQXlCLENBQUM7aUJBQ3ZELG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQXlCLENBQUM7aUJBQ25ELHNCQUFpQixHQUFHLElBQUksR0FBRyxFQUF5QixDQUFDO2lCQUVyRCxrQkFBYSxHQUFHLFVBQVUsQ0FBQztRQUluRCxZQUFZLEVBQVUsRUFBVSxjQUErQjtZQUEvQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDOUQsSUFBSSxDQUFDLEVBQUUsR0FBRyxPQUFPLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN0QyxDQUFDO1FBRUQsVUFBVSxDQUFDLEtBQW1CLEVBQUUsTUFBcUI7WUFDcEQsUUFBUSxLQUFLLEVBQUUsQ0FBQztnQkFDZixtQ0FBMkIsQ0FBQyxDQUFDLENBQUM7b0JBQzdCLElBQUksZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzlELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO3dCQUN2QixnQkFBZ0IsR0FBRyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO3dCQUNsRixPQUFPLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztvQkFDMUQsQ0FBQztvQkFFRCxPQUFPLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFD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