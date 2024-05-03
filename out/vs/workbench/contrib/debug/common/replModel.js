/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/severity", "vs/base/common/types", "vs/base/common/uuid", "vs/nls", "vs/workbench/contrib/debug/common/debugModel"], function (require, exports, event_1, severity_1, types_1, uuid_1, nls, debugModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplModel = exports.ReplGroup = exports.ReplEvaluationResult = exports.ReplEvaluationInput = exports.RawObjectReplElement = exports.ReplVariableElement = exports.ReplOutputElement = void 0;
    const MAX_REPL_LENGTH = 10000;
    let topReplElementCounter = 0;
    const getUniqueId = () => `topReplElement:${topReplElementCounter++}`;
    /**
     * General case of data from DAP the `output` event. {@link ReplVariableElement}
     * is used instead only if there is a `variablesReference` with no `output` text.
     */
    class ReplOutputElement {
        constructor(session, id, value, severity, sourceData, expression) {
            this.session = session;
            this.id = id;
            this.value = value;
            this.severity = severity;
            this.sourceData = sourceData;
            this.expression = expression;
            this._count = 1;
            this._onDidChangeCount = new event_1.Emitter();
        }
        toString(includeSource = false) {
            let valueRespectCount = this.value;
            for (let i = 1; i < this.count; i++) {
                valueRespectCount += (valueRespectCount.endsWith('\n') ? '' : '\n') + this.value;
            }
            const sourceStr = (this.sourceData && includeSource) ? ` ${this.sourceData.source.name}` : '';
            return valueRespectCount + sourceStr;
        }
        getId() {
            return this.id;
        }
        getChildren() {
            return this.expression?.getChildren() || Promise.resolve([]);
        }
        set count(value) {
            this._count = value;
            this._onDidChangeCount.fire();
        }
        get count() {
            return this._count;
        }
        get onDidChangeCount() {
            return this._onDidChangeCount.event;
        }
        get hasChildren() {
            return !!this.expression?.hasChildren;
        }
    }
    exports.ReplOutputElement = ReplOutputElement;
    /** Top-level variable logged via DAP output when there's no `output` string */
    class ReplVariableElement {
        constructor(expression, severity, sourceData) {
            this.expression = expression;
            this.severity = severity;
            this.sourceData = sourceData;
            this.id = (0, uuid_1.generateUuid)();
            this.hasChildren = expression.hasChildren;
        }
        getChildren() {
            return this.expression.getChildren();
        }
        toString() {
            return this.expression.toString();
        }
        getId() {
            return this.id;
        }
    }
    exports.ReplVariableElement = ReplVariableElement;
    class RawObjectReplElement {
        static { this.MAX_CHILDREN = 1000; } // upper bound of children per value
        constructor(id, name, valueObj, sourceData, annotation) {
            this.id = id;
            this.name = name;
            this.valueObj = valueObj;
            this.sourceData = sourceData;
            this.annotation = annotation;
        }
        getId() {
            return this.id;
        }
        get value() {
            if (this.valueObj === null) {
                return 'null';
            }
            else if (Array.isArray(this.valueObj)) {
                return `Array[${this.valueObj.length}]`;
            }
            else if ((0, types_1.isObject)(this.valueObj)) {
                return 'Object';
            }
            else if ((0, types_1.isString)(this.valueObj)) {
                return `"${this.valueObj}"`;
            }
            return String(this.valueObj) || '';
        }
        get hasChildren() {
            return (Array.isArray(this.valueObj) && this.valueObj.length > 0) || ((0, types_1.isObject)(this.valueObj) && Object.getOwnPropertyNames(this.valueObj).length > 0);
        }
        evaluateLazy() {
            throw new Error('Method not implemented.');
        }
        getChildren() {
            let result = [];
            if (Array.isArray(this.valueObj)) {
                result = this.valueObj.slice(0, RawObjectReplElement.MAX_CHILDREN)
                    .map((v, index) => new RawObjectReplElement(`${this.id}:${index}`, String(index), v));
            }
            else if ((0, types_1.isObject)(this.valueObj)) {
                result = Object.getOwnPropertyNames(this.valueObj).slice(0, RawObjectReplElement.MAX_CHILDREN)
                    .map((key, index) => new RawObjectReplElement(`${this.id}:${index}`, key, this.valueObj[key]));
            }
            return Promise.resolve(result);
        }
        toString() {
            return `${this.name}\n${this.value}`;
        }
    }
    exports.RawObjectReplElement = RawObjectReplElement;
    class ReplEvaluationInput {
        constructor(value) {
            this.value = value;
            this.id = (0, uuid_1.generateUuid)();
        }
        toString() {
            return this.value;
        }
        getId() {
            return this.id;
        }
    }
    exports.ReplEvaluationInput = ReplEvaluationInput;
    class ReplEvaluationResult extends debugModel_1.ExpressionContainer {
        get available() {
            return this._available;
        }
        constructor(originalExpression) {
            super(undefined, undefined, 0, (0, uuid_1.generateUuid)());
            this.originalExpression = originalExpression;
            this._available = true;
        }
        async evaluateExpression(expression, session, stackFrame, context) {
            const result = await super.evaluateExpression(expression, session, stackFrame, context);
            this._available = result;
            return result;
        }
        toString() {
            return `${this.value}`;
        }
    }
    exports.ReplEvaluationResult = ReplEvaluationResult;
    class ReplGroup {
        static { this.COUNTER = 0; }
        constructor(name, autoExpand, sourceData) {
            this.name = name;
            this.autoExpand = autoExpand;
            this.sourceData = sourceData;
            this.children = [];
            this.ended = false;
            this.id = `replGroup:${ReplGroup.COUNTER++}`;
        }
        get hasChildren() {
            return true;
        }
        getId() {
            return this.id;
        }
        toString(includeSource = false) {
            const sourceStr = (includeSource && this.sourceData) ? ` ${this.sourceData.source.name}` : '';
            return this.name + sourceStr;
        }
        addChild(child) {
            const lastElement = this.children.length ? this.children[this.children.length - 1] : undefined;
            if (lastElement instanceof ReplGroup && !lastElement.hasEnded) {
                lastElement.addChild(child);
            }
            else {
                this.children.push(child);
            }
        }
        getChildren() {
            return this.children;
        }
        end() {
            const lastElement = this.children.length ? this.children[this.children.length - 1] : undefined;
            if (lastElement instanceof ReplGroup && !lastElement.hasEnded) {
                lastElement.end();
            }
            else {
                this.ended = true;
            }
        }
        get hasEnded() {
            return this.ended;
        }
    }
    exports.ReplGroup = ReplGroup;
    function areSourcesEqual(first, second) {
        if (!first && !second) {
            return true;
        }
        if (first && second) {
            return first.column === second.column && first.lineNumber === second.lineNumber && first.source.uri.toString() === second.source.uri.toString();
        }
        return false;
    }
    class ReplModel {
        constructor(configurationService) {
            this.configurationService = configurationService;
            this.replElements = [];
            this._onDidChangeElements = new event_1.Emitter();
            this.onDidChangeElements = this._onDidChangeElements.event;
        }
        getReplElements() {
            return this.replElements;
        }
        async addReplExpression(session, stackFrame, name) {
            this.addReplElement(new ReplEvaluationInput(name));
            const result = new ReplEvaluationResult(name);
            await result.evaluateExpression(name, session, stackFrame, 'repl');
            this.addReplElement(result);
        }
        appendToRepl(session, { output, expression, sev, source }) {
            const clearAnsiSequence = '\u001b[2J';
            const clearAnsiIndex = output.lastIndexOf(clearAnsiSequence);
            if (clearAnsiIndex !== -1) {
                // [2J is the ansi escape sequence for clearing the display http://ascii-table.com/ansi-escape-sequences.php
                this.removeReplExpressions();
                this.appendToRepl(session, { output: nls.localize('consoleCleared', "Console was cleared"), sev: severity_1.default.Ignore });
                output = output.substring(clearAnsiIndex + clearAnsiSequence.length);
            }
            if (expression) {
                // if there is an output string, prefer to show that, since the DA could
                // have formatted it nicely e.g. with ANSI color codes.
                this.addReplElement(output
                    ? new ReplOutputElement(session, getUniqueId(), output, sev, source, expression)
                    : new ReplVariableElement(expression, sev, source));
                return;
            }
            const previousElement = this.replElements.length ? this.replElements[this.replElements.length - 1] : undefined;
            if (previousElement instanceof ReplOutputElement && previousElement.severity === sev) {
                const config = this.configurationService.getValue('debug');
                if (previousElement.value === output && areSourcesEqual(previousElement.sourceData, source) && config.console.collapseIdenticalLines) {
                    previousElement.count++;
                    // No need to fire an event, just the count updates and badge will adjust automatically
                    return;
                }
                if (!previousElement.value.endsWith('\n') && !previousElement.value.endsWith('\r\n') && previousElement.count === 1) {
                    this.replElements[this.replElements.length - 1] = new ReplOutputElement(session, getUniqueId(), previousElement.value + output, sev, source);
                    this._onDidChangeElements.fire();
                    return;
                }
            }
            const element = new ReplOutputElement(session, getUniqueId(), output, sev, source);
            this.addReplElement(element);
        }
        startGroup(name, autoExpand, sourceData) {
            const group = new ReplGroup(name, autoExpand, sourceData);
            this.addReplElement(group);
        }
        endGroup() {
            const lastElement = this.replElements[this.replElements.length - 1];
            if (lastElement instanceof ReplGroup) {
                lastElement.end();
            }
        }
        addReplElement(newElement) {
            const lastElement = this.replElements.length ? this.replElements[this.replElements.length - 1] : undefined;
            if (lastElement instanceof ReplGroup && !lastElement.hasEnded) {
                lastElement.addChild(newElement);
            }
            else {
                this.replElements.push(newElement);
                if (this.replElements.length > MAX_REPL_LENGTH) {
                    this.replElements.splice(0, this.replElements.length - MAX_REPL_LENGTH);
                }
            }
            this._onDidChangeElements.fire();
        }
        removeReplExpressions() {
            if (this.replElements.length > 0) {
                this.replElements = [];
                this._onDidChangeElements.fire();
            }
        }
        /** Returns a new REPL model that's a copy of this one. */
        clone() {
            const newRepl = new ReplModel(this.configurationService);
            newRepl.replElements = this.replElements.slice();
            return newRepl;
        }
    }
    exports.ReplModel = ReplModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9jb21tb24vcmVwbE1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUM7SUFDOUIsSUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7SUFDOUIsTUFBTSxXQUFXLEdBQUcsR0FBRyxFQUFFLENBQUMsa0JBQWtCLHFCQUFxQixFQUFFLEVBQUUsQ0FBQztJQUV0RTs7O09BR0c7SUFDSCxNQUFhLGlCQUFpQjtRQUs3QixZQUNRLE9BQXNCLEVBQ3JCLEVBQVUsRUFDWCxLQUFhLEVBQ2IsUUFBa0IsRUFDbEIsVUFBK0IsRUFDdEIsVUFBd0I7WUFMakMsWUFBTyxHQUFQLE9BQU8sQ0FBZTtZQUNyQixPQUFFLEdBQUYsRUFBRSxDQUFRO1lBQ1gsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLGFBQVEsR0FBUixRQUFRLENBQVU7WUFDbEIsZUFBVSxHQUFWLFVBQVUsQ0FBcUI7WUFDdEIsZUFBVSxHQUFWLFVBQVUsQ0FBYztZQVRqQyxXQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ1gsc0JBQWlCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztRQVVoRCxDQUFDO1FBRUQsUUFBUSxDQUFDLGFBQWEsR0FBRyxLQUFLO1lBQzdCLElBQUksaUJBQWlCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNuQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNyQyxpQkFBaUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMs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