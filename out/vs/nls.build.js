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
    exports.load = load;
    exports.write = write;
    exports.writeFile = writeFile;
    exports.finishBuild = finishBuild;
    const buildMap = {};
    const buildMapKeys = {};
    const entryPoints = {};
    function localize(data, message, ...args) {
        throw new Error(`Not supported at build time!`);
    }
    function localize2(data, message, ...args) {
        throw new Error(`Not supported at build time!`);
    }
    function getConfiguredDefaultLocale() {
        throw new Error(`Not supported at build time!`);
    }
    /**
     * Invoked by the loader at build-time
     */
    function load(name, req, load, config) {
        if (!name || name.length === 0) {
            load({ localize, localize2, getConfiguredDefaultLocale });
        }
        else {
            req([name + '.nls', name + '.nls.keys'], function (messages, keys) {
                buildMap[name] = messages;
                buildMapKeys[name] = keys;
                load(messages);
            });
        }
    }
    /**
     * Invoked by the loader at build-time
     */
    function write(pluginName, moduleName, write) {
        const entryPoint = write.getEntryPoint();
        entryPoints[entryPoint] = entryPoints[entryPoint] || [];
        entryPoints[entryPoint].push(moduleName);
        if (moduleName !== entryPoint) {
            write.asModule(pluginName + '!' + moduleName, 'define([\'vs/nls\', \'vs/nls!' + entryPoint + '\'], function(nls, data) { return nls.create("' + moduleName + '", data); });');
        }
    }
    /**
     * Invoked by the loader at build-time
     */
    function writeFile(pluginName, moduleName, req, write, config) {
        if (entryPoints.hasOwnProperty(moduleName)) {
            const fileName = req.toUrl(moduleName + '.nls.js');
            const contents = [
                '/*---------------------------------------------------------',
                ' * Copyright (c) Microsoft Corporation. All rights reserved.',
                ' *--------------------------------------------------------*/'
            ], entries = entryPoints[moduleName];
            const data = {};
            for (let i = 0; i < entries.length; i++) {
                data[entries[i]] = buildMap[entries[i]];
            }
            contents.push('define("' + moduleName + '.nls", ' + JSON.stringify(data, null, '\t') + ');');
            write(fileName, contents.join('\r\n'));
        }
    }
    /**
     * Invoked by the loader at build-time
     */
    function finishBuild(write) {
        write('nls.metadata.json', JSON.stringify({
            keys: buildMapKeys,
            messages: buildMap,
            bundles: entryPoints
        }, null, '\t'));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmxzLmJ1aWxkLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9ubHMuYnVpbGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsNEJBRUM7SUFFRCw4QkFFQztJQUVELGdFQUVDO0lBS0Qsb0JBVUM7SUFLRCxzQkFTQztJQUtELDhCQWtCQztJQUtELGtDQU1DO0lBbEZELE1BQU0sUUFBUSxHQUFpQyxFQUFFLENBQUM7SUFDbEQsTUFBTSxZQUFZLEdBQWlDLEVBQUUsQ0FBQztJQUN0RCxNQUFNLFdBQVcsR0FBdUMsRUFBRSxDQUFDO0lBTzNELFNBQWdCLFFBQVEsQ0FBQyxJQUE0QixFQUFFLE9BQWUsRUFBRSxHQUFHLElBQXNEO1FBQ2hJLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQsU0FBZ0IsU0FBUyxDQUFDLElBQTRCLEVBQUUsT0FBZSxFQUFFLEdBQUcsSUFBc0Q7UUFDakksTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRCxTQUFnQiwwQkFBMEI7UUFDekMsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRDs7T0FFRztJQUNILFNBQWdCLElBQUksQ0FBQyxJQUFZLEVBQUUsR0FBK0IsRUFBRSxJQUFtQyxFQUFFLE1BQXVDO1FBQy9JLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNoQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLDBCQUEwQixFQUFFLENBQUMsQ0FBQztRQUMzRCxDQUFDO2FBQU0sQ0FBQztZQUNQLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxNQUFNLEVBQUUsSUFBSSxH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