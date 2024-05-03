/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/platform/terminal/common/environmentVariable"], function (require, exports, platform_1, environmentVariable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergedEnvironmentVariableCollection = void 0;
    const mutatorTypeToLabelMap = new Map([
        [environmentVariable_1.EnvironmentVariableMutatorType.Append, 'APPEND'],
        [environmentVariable_1.EnvironmentVariableMutatorType.Prepend, 'PREPEND'],
        [environmentVariable_1.EnvironmentVariableMutatorType.Replace, 'REPLACE']
    ]);
    class MergedEnvironmentVariableCollection {
        constructor(collections) {
            this.collections = collections;
            this.map = new Map();
            this.descriptionMap = new Map();
            collections.forEach((collection, extensionIdentifier) => {
                this.populateDescriptionMap(collection, extensionIdentifier);
                const it = collection.map.entries();
                let next = it.next();
                while (!next.done) {
                    const mutator = next.value[1];
                    const key = next.value[0];
                    let entry = this.map.get(key);
                    if (!entry) {
                        entry = [];
                        this.map.set(key, entry);
                    }
                    // If the first item in the entry is replace ignore any other entries as they would
                    // just get replaced by this one.
                    if (entry.length > 0 && entry[0].type === environmentVariable_1.EnvironmentVariableMutatorType.Replace) {
                        next = it.next();
                        continue;
                    }
                    const extensionMutator = {
                        extensionIdentifier,
                        value: mutator.value,
                        type: mutator.type,
                        scope: mutator.scope,
                        variable: mutator.variable,
                        options: mutator.options
                    };
                    if (!extensionMutator.scope) {
                        delete extensionMutator.scope; // Convenient for tests
                    }
                    // Mutators get applied in the reverse order than they are created
                    entry.unshift(extensionMutator);
                    next = it.next();
                }
            });
        }
        async applyToProcessEnvironment(env, scope, variableResolver) {
            let lowerToActualVariableNames;
            if (platform_1.isWindows) {
                lowerToActualVariableNames = {};
                Object.keys(env).forEach(e => lowerToActualVariableNames[e.toLowerCase()] = e);
            }
            for (const [variable, mutators] of this.getVariableMap(scope)) {
                const actualVariable = platform_1.isWindows ? lowerToActualVariableNames[variable.toLowerCase()] || variable : variable;
                for (const mutator of mutators) {
                    const value = variableResolver ? await variableResolver(mutator.value) : mutator.value;
                    // Default: true
                    if (mutator.options?.applyAtProcessCreation ?? true) {
                        switch (mutator.type) {
                            case environmentVariable_1.EnvironmentVariableMutatorType.Append:
                                env[actualVariable] = (env[actualVariable] || '') + value;
                                break;
                            case environmentVariable_1.EnvironmentVariableMutatorType.Prepend:
                                env[actualVariable] = value + (env[actualVariable] || '');
                                break;
                            case environmentVariable_1.EnvironmentVariableMutatorType.Replace:
                                env[actualVariable] = value;
                                break;
                        }
                    }
                    // Default: false
                    if (mutator.options?.applyAtShellIntegration ?? false) {
                        const key = `VSCODE_ENV_${mutatorTypeToLabelMap.get(mutator.type)}`;
                        env[key] = (env[key] ? env[key] + ':' : '') + variable + '=' + this._encodeColons(value);
                    }
                }
            }
        }
        _encodeColons(value) {
            return value.replaceAll(':', '\\x3a');
        }
        diff(other, scope) {
            const added = new Map();
            const changed = new Map();
            const removed = new Map();
            // Find added
            other.getVariableMap(scope).forEach((otherMutators, variable) => {
                const currentMutators = this.getVariableMap(scope).get(variable);
                const result = getMissingMutatorsFromArray(otherMutators, currentMutators);
                if (result) {
                    added.set(variable, result);
                }
            });
            // Find removed
            this.getVariableMap(scope).forEach((currentMutators, variable) => {
                const otherMutators = other.getVariableMap(scope).get(variable);
                const result = getMissingMutatorsFromArray(currentMutators, otherMutators);
                if (result) {
                    removed.set(variable, result);
                }
            });
            // Find changed
            this.getVariableMap(scope).forEach((currentMutators, variable) => {
                const otherMutators = other.getVariableMap(scope).get(variable);
                const result = getChangedMutatorsFromArray(currentMutators, otherMutators);
                if (result) {
                    changed.set(variable, result);
                }
            });
            if (added.size === 0 && changed.size === 0 && removed.size === 0) {
                return undefined;
            }
            return { added, changed, removed };
        }
        getVariableMap(scope) {
            const result = new Map();
            for (const mutators of this.map.values()) {
                const filteredMutators = mutators.filter(m => filterScope(m, scope));
                if (filteredMutators.length > 0) {
                    // All of these mutators are for the same variable because they are in the same scope, hence choose anyone to form a key.
                    result.set(filteredMutators[0].variable, filteredMutators);
                }
            }
            return result;
        }
        getDescriptionMap(scope) {
            const result = new Map();
            for (const mutators of this.descriptionMap.values()) {
                const filteredMutators = mutators.filter(m => filterScope(m, scope, true));
                for (const mutator of filteredMutators) {
                    result.set(mutator.extensionIdentifier, mutator.description);
                }
            }
            return result;
        }
        populateDescriptionMap(collection, extensionIdentifier) {
            if (!collection.descriptionMap) {
                return;
            }
            const it = collection.descriptionMap.entries();
            let next = it.next();
            while (!next.done) {
                const mutator = next.value[1];
                const key = next.value[0];
                let entry = this.descriptionMap.get(key);
                if (!entry) {
                    entry = [];
                    this.descriptionMap.set(key, entry);
                }
                const extensionMutator = {
                    extensionIdentifier,
                    scope: mutator.scope,
                    description: mutator.description
                };
                if (!extensionMutator.scope) {
                    delete extensionMutator.scope; // Convenient for tests
                }
                entry.push(extensionMutator);
                next = it.next();
            }
        }
    }
    exports.MergedEnvironmentVariableCollection = MergedEnvironmentVariableCollection;
    /**
     * Returns whether a mutator matches with the scope provided.
     * @param mutator Mutator to filter
     * @param scope Scope to be used for querying
     * @param strictFilter If true, mutators with global scope is not returned when querying for workspace scope.
     * i.e whether mutator scope should always exactly match with query scope.
     */
    function filterScope(mutator, scope, strictFilter = false) {
        if (!mutator.scope) {
            if (strictFilter) {
                return scope === mutator.scope;
            }
            return true;
        }
        // If a mutator is scoped to a workspace folder, only apply it if the workspace
        // folder matches.
        if (mutator.scope.workspaceFolder && scope?.workspaceFolder && mutator.scope.workspaceFolder.index === scope.workspaceFolder.index) {
            return true;
        }
        return false;
    }
    function getMissingMutatorsFromArray(current, other) {
        // If it doesn't exist, all are removed
        if (!other) {
            return current;
        }
        // Create a map to help
        const otherMutatorExtensions = new Set();
        other.forEach(m => otherMutatorExtensions.add(m.extensionIdentifier));
        // Find entries removed from other
        const result = [];
        current.forEach(mutator => {
            if (!otherMutatorExtensions.has(mutator.extensionIdentifier)) {
                result.push(mutator);
            }
        });
        return result.length === 0 ? undefined : result;
    }
    function getChangedMutatorsFromArray(current, other) {
        // If it doesn't exist, none are changed (they are removed)
        if (!other) {
            return undefined;
        }
        // Create a map to help
        const otherMutatorExtensions = new Map();
        other.forEach(m => otherMutatorExtensions.set(m.extensionIdentifier, m));
        // Find entries that exist in both but are not equal
        const result = [];
        current.forEach(mutator => {
            const otherMutator = otherMutatorExtensions.get(mutator.extensionIdentifier);
            if (otherMutator && (mutator.type !== otherMutator.type || mutator.value !== otherMutator.value || mutator.scope?.workspaceFolder?.index !== otherMutator.scope?.workspaceFolder?.index)) {
                // Return the new result, not the old one
                result.push(otherMutator);
            }
        });
        return result.length === 0 ? undefined : result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRWYXJpYWJsZUNvbGxlY3Rpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL2NvbW1vbi9lbnZpcm9ubWVudFZhcmlhYmxlQ29sbGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBTSxxQkFBcUIsR0FBZ0QsSUFBSSxHQUFHLENBQUM7UUFDbEYsQ0FBQyxvREFBOEIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDO1FBQ2pELENBQUMsb0RBQThCLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQztRQUNuRCxDQUFDLG9EQUE4QixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUM7S0FDbkQsQ0FBQyxDQUFDO0lBRUgsTUFBYSxtQ0FBbUM7UUFJL0MsWUFDVSxXQUFnRTtZQUFoRSxnQkFBVyxHQUFYLFdBQVcsQ0FBcUQ7WUFKekQsUUFBRyxHQUE2RCxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQzFFLG1CQUFjLEdBQWdFLElBQUksR0FBRyxFQUFFLENBQUM7WUFLeEcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsRUFBRSxtQkFBbUIsRUFBRSxFQUFFO2dCQUN2RCxJQUFJLENBQUMsc0JBQXNCLENBQUMsVUFBVSxFQUFFLG1CQUFtQixDQUFDLENBQUM7Z0JBQzdELE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3BDLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDckIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDbkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDOUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzlCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDWixLQUFLLEdBQUcsRUFBRSxDQUFDO3dCQUNYLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDMUIsQ0FBQztvQkFFRCxtRkFBbUY7b0JBQ25GLGlDQUFpQztvQkFDakMsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLG9EQUE4QixDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNsRixJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNqQixTQUFTO29CQUNWLENBQUM7b0JBRUQsTUFBTSxnQkFBZ0IsR0FBRzt3QkFDeEIsbUJBQW1CO3dCQUNuQixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7d0JBQ3BCLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTt3QkFDbEIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO3dCQUNwQixRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVE7d0JBQzFCLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTztxQkFDeEIsQ0FBQztvQkFDRixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQzdCLE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsdUJBQXVCO29CQUN2RCxDQUFDO29CQUNELGtFQUFrRTtvQkFDbEUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO29CQUVoQyxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNsQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLHlCQUF5QixDQUFDLEdBQXdCLEVBQUUsS0FBMkMsRUFBRSxnQkFBbUM7WUFDekksSUFBSSwwQkFBa0YsQ0FBQztZQUN2RixJQUFJLG9CQUFTLEVBQUUsQ0FBQztnQkFDZiwwQkFBMEIsR0FBRyxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsMEJBQTJCLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakYsQ0FBQztZQUNELEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQy9ELE1BQU0sY0FBYyxHQUFHLG9CQUFTLENBQUMsQ0FBQyxDQUFDLDBCQUEyQixDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO2dCQUM5RyxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO29CQUNoQyxNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7b0JBQ3ZGLGdCQUFnQjtvQkFDaEIsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLHNCQUFzQixJQUFJLElBQUksRUFBRSxDQUFDO3dCQUNyRCxRQUFRLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQzs0QkFDdEIsS0FBSyxvREFBOEIsQ0FBQyxNQUFNO2dDQUN6QyxHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO2dDQUMxRCxNQUFNOzRCQUNQLEtBQUssb0RBQThCLENBQUMsT0FBTztnQ0FDMUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztnQ0FDMUQsTUFBTTs0QkFDUCxLQUFLLG9EQUE4QixDQUFDLE9BQU87Z0NBQzFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsR0FBRyxLQUFLLENBQUM7Z0NBQzVCLE1BQU07d0JBQ1IsQ0FBQztvQkFDRixDQUFDO29CQUNELGlCQUFpQjtvQkFDakIsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLHVCQUF1QixJQUFJLEtBQUssRUFBRSxDQUFDO3dCQUN2RCxNQUFNLEdBQUcsR0FBRyxjQUFjLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFFLEVBQUUsQ0FBQzt3QkFDckUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzFGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sYUFBYSxDQUFDLEtBQWE7WUFDbEMsT0FBTyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRUQsSUFBSSxDQUFDLEtBQTJDLEVBQUUsS0FBMkM7WUFDNUYsTUFBTSxLQUFLLEdBQTZELElBQUksR0FBRyxFQUFFLENBQUM7WUFDbEYsTUFBTSxPQUFPLEdBQTZELElBQUksR0FBRyxFQUFFLENBQUM7WUFDcEYsTUFBTSxPQUFPLEdBQTZELElBQUksR0FBRyxFQUFFLENBQUM7WUFFcEYsYUFBYTtZQUNiLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxFQUFFO2dCQUMvRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDakUsTUFBTSxNQUFNLEdBQUcsMkJBQTJCLENBQUMsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFDO2dCQUMzRSxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNaLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM3QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxlQUFlO1lBQ2YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLEVBQUU7Z0JBQ2hFLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNoRSxNQUFNLE1BQU0sR0FBRywyQkFBMkIsQ0FBQyxlQUFlLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQzNFLElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ1osT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQy9CLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILGVBQWU7WUFDZixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGVBQWUsRUFBRSxRQUFRLEVBQUUsRUFBRTtnQkFDaEUsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sTUFBTSxHQUFHLDJCQUEyQixDQUFDLGVBQWUsRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDM0UsSUFBSSxNQUFNLEVBQUUsQ0FBQztvQkFDWixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDL0IsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNsRSxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDcEMsQ0FBQztRQUVELGNBQWMsQ0FBQyxLQUEyQztZQUN6RCxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBdUQsQ0FBQztZQUM5RSxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDMUMsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNyRSxJQUFJLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDakMseUhBQXlIO29CQUN6SCxNQUFNLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUM1RCxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVELGlCQUFpQixDQUFDLEtBQTJDO1lBQzVELE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO1lBQ3JELEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUNyRCxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMzRSxLQUFLLE1BQU0sT0FBTyxJQUFJLGdCQUFnQixFQUFFLENBQUM7b0JBQ3hDLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDOUQsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTyxzQkFBc0IsQ0FBQyxVQUEwQyxFQUFFLG1CQUEyQjtZQUNyRyxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNoQyxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDL0MsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ25CLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN6QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ1osS0FBSyxHQUFHLEVBQUUsQ0FBQztvQkFDWCxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3JDLENBQUM7Z0JBQ0QsTUFBTSxnQkFBZ0IsR0FBRztvQkFDeEIsbUJBQW1CO29CQUNuQixLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7b0JBQ3BCLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVztpQkFDaEMsQ0FBQztnQkFDRixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQzdCLE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsdUJBQXVCO2dCQUN2RCxDQUFDO2dCQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFFN0IsSUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsQixDQUFDO1FBRUYsQ0FBQztLQUNEO0lBN0tELGtGQTZLQztJQUVEOzs7Ozs7T0FNRztJQUNILFNBQVMsV0FBVyxDQUNuQixPQUFpRyxFQUNqRyxLQUEyQyxFQUMzQyxZQUFZLEdBQUcsS0FBSztRQUVwQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3BCLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sS0FBSyxLQUFLLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFDaEMsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNELCtFQUErRTtRQUMvRSxrQkFBa0I7UUFDbEIsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWUsSUFBSSxLQUFLLEVBQUUsZUFBZSxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3BJLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUVELFNBQVMsMkJBQTJCLENBQ25DLE9BQW9ELEVBQ3BELEtBQThEO1FBRTlELHVDQUF1QztRQUN2QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWixPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRUQsdUJBQXVCO1FBQ3ZCLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUNqRCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7UUFFdEUsa0NBQWtDO1FBQ2xDLE1BQU0sTUFBTSxHQUFnRCxFQUFFLENBQUM7UUFDL0QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUN6QixJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUM7Z0JBQzlELE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEIsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDakQsQ0FBQztJQUVELFNBQVMsMkJBQTJCLENBQ25DLE9BQW9ELEVBQ3BELEtBQThEO1FBRTlELDJEQUEyRDtRQUMzRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsdUJBQXVCO1FBQ3ZCLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxHQUFHLEVBQXFELENBQUM7UUFDNUYsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV6RSxvREFBb0Q7UUFDcEQsTUFBTSxNQUFNLEdBQWdELEVBQUUsQ0FBQztRQUMvRCxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3pCLE1BQU0sWUFBWSxHQUFHLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUM3RSxJQUFJLFlBQVksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssWUFBWSxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsS0FBSyxLQUFLLFlBQVksQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxlQUFlLEVBQUUsS0FBSyxLQUFLLFlBQVksQ0FBQyxLQUFLLEVBQUUsZUFBZSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzFMLHlDQUF5QztnQkFDekMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUNqRCxDQUFDIn0=