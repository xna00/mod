/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/json", "vs/base/common/jsonEdit", "vs/base/common/jsonFormatter", "vs/base/common/objects", "vs/platform/userDataSync/common/content", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, arrays_1, json_1, jsonEdit_1, jsonFormatter_1, objects, contentUtil, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getIgnoredSettings = getIgnoredSettings;
    exports.removeComments = removeComments;
    exports.updateIgnoredSettings = updateIgnoredSettings;
    exports.merge = merge;
    exports.isEmpty = isEmpty;
    exports.addSetting = addSetting;
    function getIgnoredSettings(defaultIgnoredSettings, configurationService, settingsContent) {
        let value = [];
        if (settingsContent) {
            value = getIgnoredSettingsFromContent(settingsContent);
        }
        else {
            value = getIgnoredSettingsFromConfig(configurationService);
        }
        const added = [], removed = [...(0, userDataSync_1.getDisallowedIgnoredSettings)()];
        if (Array.isArray(value)) {
            for (const key of value) {
                if (key.startsWith('-')) {
                    removed.push(key.substring(1));
                }
                else {
                    added.push(key);
                }
            }
        }
        return (0, arrays_1.distinct)([...defaultIgnoredSettings, ...added,].filter(setting => !removed.includes(setting)));
    }
    function getIgnoredSettingsFromConfig(configurationService) {
        let userValue = configurationService.inspect('settingsSync.ignoredSettings').userValue;
        if (userValue !== undefined) {
            return userValue;
        }
        userValue = configurationService.inspect('sync.ignoredSettings').userValue;
        if (userValue !== undefined) {
            return userValue;
        }
        return configurationService.getValue('settingsSync.ignoredSettings') || [];
    }
    function getIgnoredSettingsFromContent(settingsContent) {
        const parsed = (0, json_1.parse)(settingsContent);
        return parsed ? parsed['settingsSync.ignoredSettings'] || parsed['sync.ignoredSettings'] || [] : [];
    }
    function removeComments(content, formattingOptions) {
        const source = (0, json_1.parse)(content) || {};
        let result = '{}';
        for (const key of Object.keys(source)) {
            const edits = (0, jsonEdit_1.setProperty)(result, [key], source[key], formattingOptions);
            result = (0, jsonEdit_1.applyEdits)(result, edits);
        }
        return result;
    }
    function updateIgnoredSettings(targetContent, sourceContent, ignoredSettings, formattingOptions) {
        if (ignoredSettings.length) {
            const sourceTree = parseSettings(sourceContent);
            const source = (0, json_1.parse)(sourceContent) || {};
            const target = (0, json_1.parse)(targetContent);
            if (!target) {
                return targetContent;
            }
            const settingsToAdd = [];
            for (const key of ignoredSettings) {
                const sourceValue = source[key];
                const targetValue = target[key];
                // Remove in target
                if (sourceValue === undefined) {
                    targetContent = contentUtil.edit(targetContent, [key], undefined, formattingOptions);
                }
                // Update in target
                else if (targetValue !== undefined) {
                    targetContent = contentUtil.edit(targetContent, [key], sourceValue, formattingOptions);
                }
                else {
                    settingsToAdd.push(findSettingNode(key, sourceTree));
                }
            }
            settingsToAdd.sort((a, b) => a.startOffset - b.startOffset);
            settingsToAdd.forEach(s => targetContent = addSetting(s.setting.key, sourceContent, targetContent, formattingOptions));
        }
        return targetContent;
    }
    function merge(originalLocalContent, originalRemoteContent, baseContent, ignoredSettings, resolvedConflicts, formattingOptions) {
        const localContentWithoutIgnoredSettings = updateIgnoredSettings(originalLocalContent, originalRemoteContent, ignoredSettings, formattingOptions);
        const localForwarded = baseContent !== localContentWithoutIgnoredSettings;
        const remoteForwarded = baseContent !== originalRemoteContent;
        /* no changes */
        if (!localForwarded && !remoteForwarded) {
            return { conflictsSettings: [], localContent: null, remoteContent: null, hasConflicts: false };
        }
        /* local has changed and remote has not */
        if (localForwarded && !remoteForwarded) {
            return { conflictsSettings: [], localContent: null, remoteContent: localContentWithoutIgnoredSettings, hasConflicts: false };
        }
        /* remote has changed and local has not */
        if (remoteForwarded && !localForwarded) {
            return { conflictsSettings: [], localContent: updateIgnoredSettings(originalRemoteContent, originalLocalContent, ignoredSettings, formattingOptions), remoteContent: null, hasConflicts: false };
        }
        /* local is empty and not synced before */
        if (baseContent === null && isEmpty(originalLocalContent)) {
            const localContent = areSame(originalLocalContent, originalRemoteContent, ignoredSettings) ? null : updateIgnoredSettings(originalRemoteContent, originalLocalContent, ignoredSettings, formattingOptions);
            return { conflictsSettings: [], localContent, remoteContent: null, hasConflicts: false };
        }
        /* remote and local has changed */
        let localContent = originalLocalContent;
        let remoteContent = originalRemoteContent;
        const local = (0, json_1.parse)(originalLocalContent);
        const remote = (0, json_1.parse)(originalRemoteContent);
        const base = baseContent ? (0, json_1.parse)(baseContent) : null;
        const ignored = ignoredSettings.reduce((set, key) => { set.add(key); return set; }, new Set());
        const localToRemote = compare(local, remote, ignored);
        const baseToLocal = compare(base, local, ignored);
        const baseToRemote = compare(base, remote, ignored);
        const conflicts = new Map();
        const handledConflicts = new Set();
        const handleConflict = (conflictKey) => {
            handledConflicts.add(conflictKey);
            const resolvedConflict = resolvedConflicts.filter(({ key }) => key === conflictKey)[0];
            if (resolvedConflict) {
                localContent = contentUtil.edit(localContent, [conflictKey], resolvedConflict.value, formattingOptions);
                remoteContent = contentUtil.edit(remoteContent, [conflictKey], resolvedConflict.value, formattingOptions);
            }
            else {
                conflicts.set(conflictKey, { key: conflictKey, localValue: local[conflictKey], remoteValue: remote[conflictKey] });
            }
        };
        // Removed settings in Local
        for (const key of baseToLocal.removed.values()) {
            // Conflict - Got updated in remote.
            if (baseToRemote.updated.has(key)) {
                handleConflict(key);
            }
            // Also remove in remote
            else {
                remoteContent = contentUtil.edit(remoteContent, [key], undefined, formattingOptions);
            }
        }
        // Removed settings in Remote
        for (const key of baseToRemote.removed.values()) {
            if (handledConflicts.has(key)) {
                continue;
            }
            // Conflict - Got updated in local
            if (baseToLocal.updated.has(key)) {
                handleConflict(key);
            }
            // Also remove in locals
            else {
                localContent = contentUtil.edit(localContent, [key], undefined, formattingOptions);
            }
        }
        // Updated settings in Local
        for (const key of baseToLocal.updated.values()) {
            if (handledConflicts.has(key)) {
                continue;
            }
            // Got updated in remote
            if (baseToRemote.updated.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    handleConflict(key);
                }
            }
            else {
                remoteContent = contentUtil.edit(remoteContent, [key], local[key], formattingOptions);
            }
        }
        // Updated settings in Remote
        for (const key of baseToRemote.updated.values()) {
            if (handledConflicts.has(key)) {
                continue;
            }
            // Got updated in local
            if (baseToLocal.updated.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    handleConflict(key);
                }
            }
            else {
                localContent = contentUtil.edit(localContent, [key], remote[key], formattingOptions);
            }
        }
        // Added settings in Local
        for (const key of baseToLocal.added.values()) {
            if (handledConflicts.has(key)) {
                continue;
            }
            // Got added in remote
            if (baseToRemote.added.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    handleConflict(key);
                }
            }
            else {
                remoteContent = addSetting(key, localContent, remoteContent, formattingOptions);
            }
        }
        // Added settings in remote
        for (const key of baseToRemote.added.values()) {
            if (handledConflicts.has(key)) {
                continue;
            }
            // Got added in local
            if (baseToLocal.added.has(key)) {
                // Has different value
                if (localToRemote.updated.has(key)) {
                    handleConflict(key);
                }
            }
            else {
                localContent = addSetting(key, remoteContent, localContent, formattingOptions);
            }
        }
        const hasConflicts = conflicts.size > 0 || !areSame(localContent, remoteContent, ignoredSettings);
        const hasLocalChanged = hasConflicts || !areSame(localContent, originalLocalContent, []);
        const hasRemoteChanged = hasConflicts || !areSame(remoteContent, originalRemoteContent, []);
        return { localContent: hasLocalChanged ? localContent : null, remoteContent: hasRemoteChanged ? remoteContent : null, conflictsSettings: [...conflicts.values()], hasConflicts };
    }
    function areSame(localContent, remoteContent, ignoredSettings) {
        if (localContent === remoteContent) {
            return true;
        }
        const local = (0, json_1.parse)(localContent);
        const remote = (0, json_1.parse)(remoteContent);
        const ignored = ignoredSettings.reduce((set, key) => { set.add(key); return set; }, new Set());
        const localTree = parseSettings(localContent).filter(node => !(node.setting && ignored.has(node.setting.key)));
        const remoteTree = parseSettings(remoteContent).filter(node => !(node.setting && ignored.has(node.setting.key)));
        if (localTree.length !== remoteTree.length) {
            return false;
        }
        for (let index = 0; index < localTree.length; index++) {
            const localNode = localTree[index];
            const remoteNode = remoteTree[index];
            if (localNode.setting && remoteNode.setting) {
                if (localNode.setting.key !== remoteNode.setting.key) {
                    return false;
                }
                if (!objects.equals(local[localNode.setting.key], remote[localNode.setting.key])) {
                    return false;
                }
            }
            else if (!localNode.setting && !remoteNode.setting) {
                if (localNode.value !== remoteNode.value) {
                    return false;
                }
            }
            else {
                return false;
            }
        }
        return true;
    }
    function isEmpty(content) {
        if (content) {
            const nodes = parseSettings(content);
            return nodes.length === 0;
        }
        return true;
    }
    function compare(from, to, ignored) {
        const fromKeys = from ? Object.keys(from).filter(key => !ignored.has(key)) : [];
        const toKeys = Object.keys(to).filter(key => !ignored.has(key));
        const added = toKeys.filter(key => !fromKeys.includes(key)).reduce((r, key) => { r.add(key); return r; }, new Set());
        const removed = fromKeys.filter(key => !toKeys.includes(key)).reduce((r, key) => { r.add(key); return r; }, new Set());
        const updated = new Set();
        if (from) {
            for (const key of fromKeys) {
                if (removed.has(key)) {
                    continue;
                }
                const value1 = from[key];
                const value2 = to[key];
                if (!objects.equals(value1, value2)) {
                    updated.add(key);
                }
            }
        }
        return { added, removed, updated };
    }
    function addSetting(key, sourceContent, targetContent, formattingOptions) {
        const source = (0, json_1.parse)(sourceContent);
        const sourceTree = parseSettings(sourceContent);
        const targetTree = parseSettings(targetContent);
        const insertLocation = getInsertLocation(key, sourceTree, targetTree);
        return insertAtLocation(targetContent, key, source[key], insertLocation, targetTree, formattingOptions);
    }
    function getInsertLocation(key, sourceTree, targetTree) {
        const sourceNodeIndex = sourceTree.findIndex(node => node.setting?.key === key);
        const sourcePreviousNode = sourceTree[sourceNodeIndex - 1];
        if (sourcePreviousNode) {
            /*
                Previous node in source is a setting.
                Find the same setting in the target.
                Insert it after that setting
            */
            if (sourcePreviousNode.setting) {
                const targetPreviousSetting = findSettingNode(sourcePreviousNode.setting.key, targetTree);
                if (targetPreviousSetting) {
                    /* Insert after target's previous setting */
                    return { index: targetTree.indexOf(targetPreviousSetting), insertAfter: true };
                }
            }
            /* Previous node in source is a comment */
            else {
                const sourcePreviousSettingNode = findPreviousSettingNode(sourceNodeIndex, sourceTree);
                /*
                    Source has a setting defined before the setting to be added.
                    Find the same previous setting in the target.
                    If found, insert before its next setting so that comments are retrieved.
                    Otherwise, insert at the end.
                */
                if (sourcePreviousSettingNode) {
                    const targetPreviousSetting = findSettingNode(sourcePreviousSettingNode.setting.key, targetTree);
                    if (targetPreviousSetting) {
                        const targetNextSetting = findNextSettingNode(targetTree.indexOf(targetPreviousSetting), targetTree);
                        const sourceCommentNodes = findNodesBetween(sourceTree, sourcePreviousSettingNode, sourceTree[sourceNodeIndex]);
                        if (targetNextSetting) {
                            const targetCommentNodes = findNodesBetween(targetTree, targetPreviousSetting, targetNextSetting);
                            const targetCommentNode = findLastMatchingTargetCommentNode(sourceCommentNodes, targetCommentNodes);
                            if (targetCommentNode) {
                                return { index: targetTree.indexOf(targetCommentNode), insertAfter: true }; /* Insert after comment */
                            }
                            else {
                                return { index: targetTree.indexOf(targetNextSetting), insertAfter: false }; /* Insert before target next setting */
                            }
                        }
                        else {
                            const targetCommentNodes = findNodesBetween(targetTree, targetPreviousSetting, targetTree[targetTree.length - 1]);
                            const targetCommentNode = findLastMatchingTargetCommentNode(sourceCommentNodes, targetCommentNodes);
                            if (targetCommentNode) {
                                return { index: targetTree.indexOf(targetCommentNode), insertAfter: true }; /* Insert after comment */
                            }
                            else {
                                return { index: targetTree.length - 1, insertAfter: true }; /* Insert at the end */
                            }
                        }
                    }
                }
            }
            const sourceNextNode = sourceTree[sourceNodeIndex + 1];
            if (sourceNextNode) {
                /*
                    Next node in source is a setting.
                    Find the same setting in the target.
                    Insert it before that setting
                */
                if (sourceNextNode.setting) {
                    const targetNextSetting = findSettingNode(sourceNextNode.setting.key, targetTree);
                    if (targetNextSetting) {
                        /* Insert before target's next setting */
                        return { index: targetTree.indexOf(targetNextSetting), insertAfter: false };
                    }
                }
                /* Next node in source is a comment */
                else {
                    const sourceNextSettingNode = findNextSettingNode(sourceNodeIndex, sourceTree);
                    /*
                        Source has a setting defined after the setting to be added.
                        Find the same next setting in the target.
                        If found, insert after its previous setting so that comments are retrieved.
                        Otherwise, insert at the beginning.
                    */
                    if (sourceNextSettingNode) {
                        const targetNextSetting = findSettingNode(sourceNextSettingNode.setting.key, targetTree);
                        if (targetNextSetting) {
                            const targetPreviousSetting = findPreviousSettingNode(targetTree.indexOf(targetNextSetting), targetTree);
                            const sourceCommentNodes = findNodesBetween(sourceTree, sourceTree[sourceNodeIndex], sourceNextSettingNode);
                            if (targetPreviousSetting) {
                                const targetCommentNodes = findNodesBetween(targetTree, targetPreviousSetting, targetNextSetting);
                                const targetCommentNode = findLastMatchingTargetCommentNode(sourceCommentNodes.reverse(), targetCommentNodes.reverse());
                                if (targetCommentNode) {
                                    return { index: targetTree.indexOf(targetCommentNode), insertAfter: false }; /* Insert before comment */
                                }
                                else {
                                    return { index: targetTree.indexOf(targetPreviousSetting), insertAfter: true }; /* Insert after target previous setting */
                                }
                            }
                            else {
                                const targetCommentNodes = findNodesBetween(targetTree, targetTree[0], targetNextSetting);
                                const targetCommentNode = findLastMatchingTargetCommentNode(sourceCommentNodes.reverse(), targetCommentNodes.reverse());
                                if (targetCommentNode) {
                                    return { index: targetTree.indexOf(targetCommentNode), insertAfter: false }; /* Insert before comment */
                                }
                                else {
                                    return { index: 0, insertAfter: false }; /* Insert at the beginning */
                                }
                            }
                        }
                    }
                }
            }
        }
        /* Insert at the end */
        return { index: targetTree.length - 1, insertAfter: true };
    }
    function insertAtLocation(content, key, value, location, tree, formattingOptions) {
        let edits;
        /* Insert at the end */
        if (location.index === -1) {
            edits = (0, jsonEdit_1.setProperty)(content, [key], value, formattingOptions);
        }
        else {
            edits = getEditToInsertAtLocation(content, key, value, location, tree, formattingOptions).map(edit => (0, jsonEdit_1.withFormatting)(content, edit, formattingOptions)[0]);
        }
        return (0, jsonEdit_1.applyEdits)(content, edits);
    }
    function getEditToInsertAtLocation(content, key, value, location, tree, formattingOptions) {
        const newProperty = `${JSON.stringify(key)}: ${JSON.stringify(value)}`;
        const eol = (0, jsonFormatter_1.getEOL)(formattingOptions, content);
        const node = tree[location.index];
        if (location.insertAfter) {
            const edits = [];
            /* Insert after a setting */
            if (node.setting) {
                edits.push({ offset: node.endOffset, length: 0, content: ',' + newProperty });
            }
            /* Insert after a comment */
            else {
                const nextSettingNode = findNextSettingNode(location.index, tree);
                const previousSettingNode = findPreviousSettingNode(location.index, tree);
                const previousSettingCommaOffset = previousSettingNode?.setting?.commaOffset;
                /* If there is a previous setting and it does not has comma then add it */
                if (previousSettingNode && previousSettingCommaOffset === undefined) {
                    edits.push({ offset: previousSettingNode.endOffset, length: 0, content: ',' });
                }
                const isPreviouisSettingIncludesComment = previousSettingCommaOffset !== undefined && previousSettingCommaOffset > node.endOffset;
                edits.push({
                    offset: isPreviouisSettingIncludesComment ? previousSettingCommaOffset + 1 : node.endOffset,
                    length: 0,
                    content: nextSettingNode ? eol + newProperty + ',' : eol + newProperty
                });
            }
            return edits;
        }
        else {
            /* Insert before a setting */
            if (node.setting) {
                return [{ offset: node.startOffset, length: 0, content: newProperty + ',' }];
            }
            /* Insert before a comment */
            const content = (tree[location.index - 1] && !tree[location.index - 1].setting /* previous node is comment */ ? eol : '')
                + newProperty
                + (findNextSettingNode(location.index, tree) ? ',' : '')
                + eol;
            return [{ offset: node.startOffset, length: 0, content }];
        }
    }
    function findSettingNode(key, tree) {
        return tree.filter(node => node.setting?.key === key)[0];
    }
    function findPreviousSettingNode(index, tree) {
        for (let i = index - 1; i >= 0; i--) {
            if (tree[i].setting) {
                return tree[i];
            }
        }
        return undefined;
    }
    function findNextSettingNode(index, tree) {
        for (let i = index + 1; i < tree.length; i++) {
            if (tree[i].setting) {
                return tree[i];
            }
        }
        return undefined;
    }
    function findNodesBetween(nodes, from, till) {
        const fromIndex = nodes.indexOf(from);
        const tillIndex = nodes.indexOf(till);
        return nodes.filter((node, index) => fromIndex < index && index < tillIndex);
    }
    function findLastMatchingTargetCommentNode(sourceComments, targetComments) {
        if (sourceComments.length && targetComments.length) {
            let index = 0;
            for (; index < targetComments.length && index < sourceComments.length; index++) {
                if (sourceComments[index].value !== targetComments[index].value) {
                    return targetComments[index - 1];
                }
            }
            return targetComments[index - 1];
        }
        return undefined;
    }
    function parseSettings(content) {
        const nodes = [];
        let hierarchyLevel = -1;
        let startOffset;
        let key;
        const visitor = {
            onObjectBegin: (offset) => {
                hierarchyLevel++;
            },
            onObjectProperty: (name, offset, length) => {
                if (hierarchyLevel === 0) {
                    // this is setting key
                    startOffset = offset;
                    key = name;
                }
            },
            onObjectEnd: (offset, length) => {
                hierarchyLevel--;
                if (hierarchyLevel === 0) {
                    nodes.push({
                        startOffset,
                        endOffset: offset + length,
                        value: content.substring(startOffset, offset + length),
                        setting: {
                            key,
                            commaOffset: undefined
                        }
                    });
                }
            },
            onArrayBegin: (offset, length) => {
                hierarchyLevel++;
            },
            onArrayEnd: (offset, length) => {
                hierarchyLevel--;
                if (hierarchyLevel === 0) {
                    nodes.push({
                        startOffset,
                        endOffset: offset + length,
                        value: content.substring(startOffset, offset + length),
                        setting: {
                            key,
                            commaOffset: undefined
                        }
                    });
                }
            },
            onLiteralValue: (value, offset, length) => {
                if (hierarchyLevel === 0) {
                    nodes.push({
                        startOffset,
                        endOffset: offset + length,
                        value: content.substring(startOffset, offset + length),
                        setting: {
                            key,
                            commaOffset: undefined
                        }
                    });
                }
            },
            onSeparator: (sep, offset, length) => {
                if (hierarchyLevel === 0) {
                    if (sep === ',') {
                        let index = nodes.length - 1;
                        for (; index >= 0; index--) {
                            if (nodes[index].setting) {
                                break;
                            }
                        }
                        const node = nodes[index];
                        if (node) {
                            nodes.splice(index, 1, {
                                startOffset: node.startOffset,
                                endOffset: node.endOffset,
                                value: node.value,
                                setting: {
                                    key: node.setting.key,
                                    commaOffset: offset
                                }
                            });
                        }
                    }
                }
            },
            onComment: (offset, length) => {
                if (hierarchyLevel === 0) {
                    nodes.push({
                        startOffset: offset,
                        endOffset: offset + length,
                        value: content.substring(offset, offset + length),
                    });
                }
            }
        };
        (0, json_1.visit)(content, visitor);
        return nodes;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NNZXJnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL2NvbW1vbi9zZXR0aW5nc01lcmdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBbUJoRyxnREFrQkM7SUFtQkQsd0NBUUM7SUFFRCxzREFnQ0M7SUFFRCxzQkFtSkM7SUF1Q0QsMEJBTUM7SUF5QkQsZ0NBTUM7SUFoVEQsU0FBZ0Isa0JBQWtCLENBQUMsc0JBQWdDLEVBQUUsb0JBQTJDLEVBQUUsZUFBd0I7UUFDekksSUFBSSxLQUFLLEdBQTBCLEVBQUUsQ0FBQztRQUN0QyxJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQ3JCLEtBQUssR0FBRyw2QkFBNkIsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUN4RCxDQUFDO2FBQU0sQ0FBQztZQUNQLEtBQUssR0FBRyw0QkFBNEIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFDRCxNQUFNLEtBQUssR0FBYSxFQUFFLEVBQUUsT0FBTyxHQUFhLENBQUMsR0FBRyxJQUFBLDJDQUE0QixHQUFFLENBQUMsQ0FBQztRQUNwRixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMxQixLQUFLLE1BQU0sR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUN6QixJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDekIsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNqQixDQUFDO1lBQ0YsQ0FBQztRQUNGLENB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