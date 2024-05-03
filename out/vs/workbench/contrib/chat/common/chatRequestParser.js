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
define(["require", "exports", "vs/editor/common/core/offsetRange", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables"], function (require, exports, offsetRange_1, position_1, range_1, chatAgents_1, chatParserTypes_1, chatSlashCommands_1, chatVariables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatRequestParser = void 0;
    const agentReg = /^@([\w_\-]+)(?=(\s|$|\b))/i; // An @-agent
    const variableReg = /^#([\w_\-]+)(:\d+)?(?=(\s|$|\b))/i; // A #-variable with an optional numeric : arg (@response:2)
    const slashReg = /\/([\w_\-]+)(?=(\s|$|\b))/i; // A / command
    let ChatRequestParser = class ChatRequestParser {
        constructor(agentService, variableService, slashCommandService) {
            this.agentService = agentService;
            this.variableService = variableService;
            this.slashCommandService = slashCommandService;
        }
        parseChatRequest(sessionId, message, location = chatAgents_1.ChatAgentLocation.Panel, context) {
            const parts = [];
            const references = this.variableService.getDynamicVariables(sessionId); // must access this list before any async calls
            let lineNumber = 1;
            let column = 1;
            for (let i = 0; i < message.length; i++) {
                const previousChar = message.charAt(i - 1);
                const char = message.charAt(i);
                let newPart;
                if (previousChar.match(/\s/) || i === 0) {
                    if (char === chatParserTypes_1.chatVariableLeader) {
                        newPart = this.tryToParseVariable(message.slice(i), i, new position_1.Position(lineNumber, column), parts);
                    }
                    else if (char === chatParserTypes_1.chatAgentLeader) {
                        newPart = this.tryToParseAgent(message.slice(i), message, i, new position_1.Position(lineNumber, column), parts, location, context);
                    }
                    else if (char === chatParserTypes_1.chatSubcommandLeader) {
                        newPart = this.tryToParseSlashCommand(message.slice(i), message, i, new position_1.Position(lineNumber, column), parts);
                    }
                    if (!newPart) {
                        newPart = this.tryToParseDynamicVariable(message.slice(i), i, new position_1.Position(lineNumber, column), references);
                    }
                }
                if (newPart) {
                    if (i !== 0) {
                        // Insert a part for all the text we passed over, then insert the new parsed part
                        const previousPart = parts.at(-1);
                        const previousPartEnd = previousPart?.range.endExclusive ?? 0;
                        const previousPartEditorRangeEndLine = previousPart?.editorRange.endLineNumber ?? 1;
                        const previousPartEditorRangeEndCol = previousPart?.editorRange.endColumn ?? 1;
                        parts.push(new chatParserTypes_1.ChatRequestTextPart(new offsetRange_1.OffsetRange(previousPartEnd, i), new range_1.Range(previousPartEditorRangeEndLine, previousPartEditorRangeEndCol, lineNumber, column), message.slice(previousPartEnd, i)));
                    }
                    parts.push(newPart);
                }
                if (char === '\n') {
                    lineNumber++;
                    column = 1;
                }
                else {
                    column++;
                }
            }
            const lastPart = parts.at(-1);
            const lastPartEnd = lastPart?.range.endExclusive ?? 0;
            if (lastPartEnd < message.length) {
                parts.push(new chatParserTypes_1.ChatRequestTextPart(new offsetRange_1.OffsetRange(lastPartEnd, message.length), new range_1.Range(lastPart?.editorRange.endLineNumber ?? 1, lastPart?.editorRange.endColumn ?? 1, lineNumber, column), message.slice(lastPartEnd, message.length)));
            }
            return {
                parts,
                text: message,
            };
        }
        tryToParseAgent(message, fullMessage, offset, position, parts, location, context) {
            const nextAgentMatch = message.match(agentReg);
            if (!nextAgentMatch) {
                return;
            }
            const [full, name] = nextAgentMatch;
            const agentRange = new offsetRange_1.OffsetRange(offset, offset + full.length);
            const agentEditorRange = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column + full.length);
            const agents = this.agentService.getAgentsByName(name);
            // If there is more than one agent with this name, and the user picked it from the suggest widget, then the selected agent should be in the
            // context and we use that one. Otherwise just pick the first.
            const agent = agents.length > 1 && context?.selectedAgent ?
                context.selectedAgent :
                agents[0];
            if (!agent || !agent.locations.includes(location)) {
                return;
            }
            if (parts.some(p => p instanceof chatParserTypes_1.ChatRequestAgentPart)) {
                // Only one agent allowed
                return;
            }
            // The agent must come first
            if (parts.some(p => (p instanceof chatParserTypes_1.ChatRequestTextPart && p.text.trim() !== '') || !(p instanceof chatParserTypes_1.ChatRequestAgentPart))) {
                return;
            }
            const previousPart = parts.at(-1);
            const previousPartEnd = previousPart?.range.endExclusive ?? 0;
            const textSincePreviousPart = fullMessage.slice(previousPartEnd, offset);
            if (textSincePreviousPart.trim() !== '') {
                return;
            }
            return new chatParserTypes_1.ChatRequestAgentPart(agentRange, agentEditorRange, agent);
        }
        tryToParseVariable(message, offset, position, parts) {
            const nextVariableMatch = message.match(variableReg);
            if (!nextVariableMatch) {
                return;
            }
            const [full, name] = nextVariableMatch;
            const variableArg = nextVariableMatch[2] ?? '';
            const varRange = new offsetRange_1.OffsetRange(offset, offset + full.length);
            const varEditorRange = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column + full.length);
            if (this.variableService.hasVariable(name)) {
                return new chatParserTypes_1.ChatRequestVariablePart(varRange, varEditorRange, name, variableArg);
            }
            return;
        }
        tryToParseSlashCommand(remainingMessage, fullMessage, offset, position, parts) {
            const nextSlashMatch = remainingMessage.match(slashReg);
            if (!nextSlashMatch) {
                return;
            }
            if (parts.some(p => p instanceof chatParserTypes_1.ChatRequestSlashCommandPart)) {
                // Only one slash command allowed
                return;
            }
            const [full, command] = nextSlashMatch;
            const slashRange = new offsetRange_1.OffsetRange(offset, offset + full.length);
            const slashEditorRange = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column + full.length);
            const usedAgent = parts.find((p) => p instanceof chatParserTypes_1.ChatRequestAgentPart);
            if (usedAgent) {
                // The slash command must come immediately after the agent
                if (parts.some(p => (p instanceof chatParserTypes_1.ChatRequestTextPart && p.text.trim() !== '') || !(p instanceof chatParserTypes_1.ChatRequestAgentPart) && !(p instanceof chatParserTypes_1.ChatRequestTextPart))) {
                    return;
                }
                const previousPart = parts.at(-1);
                const previousPartEnd = previousPart?.range.endExclusive ?? 0;
                const textSincePreviousPart = fullMessage.slice(previousPartEnd, offset);
                if (textSincePreviousPart.trim() !== '') {
                    return;
                }
                const subCommand = usedAgent.agent.slashCommands.find(c => c.name === command);
                if (subCommand) {
                    // Valid agent subcommand
                    return new chatParserTypes_1.ChatRequestAgentSubcommandPart(slashRange, slashEditorRange, subCommand);
                }
            }
            else {
                const slashCommands = this.slashCommandService.getCommands();
                const slashCommand = slashCommands.find(c => c.command === command);
                if (slashCommand) {
                    // Valid standalone slash command
                    return new chatParserTypes_1.ChatRequestSlashCommandPart(slashRange, slashEditorRange, slashCommand);
                }
            }
            return;
        }
        tryToParseDynamicVariable(message, offset, position, references) {
            const refAtThisPosition = references.find(r => r.range.startLineNumber === position.lineNumber &&
                r.range.startColumn === position.column);
            if (refAtThisPosition) {
                const length = refAtThisPosition.range.endColumn - refAtThisPosition.range.startColumn;
                const text = message.substring(0, length);
                const range = new offsetRange_1.OffsetRange(offset, offset + length);
                return new chatParserTypes_1.ChatRequestDynamicVariablePart(range, refAtThisPosition.range, text, refAtThisPosition.data);
            }
            return;
        }
    };
    exports.ChatRequestParser = ChatRequestParser;
    exports.ChatRequestParser = ChatRequestParser = __decorate([
        __param(0, chatAgents_1.IChatAgentService),
        __param(1, chatVariables_1.IChatVariablesService),
        __param(2, chatSlashCommands_1.IChatSlashCommandService)
    ], ChatRequestParser);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFJlcXVlc3RQYXJzZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvY29tbW9uL2NoYXRSZXF1ZXN0UGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVVoRyxNQUFNLFFBQVEsR0FBRyw0QkFBNEIsQ0FBQyxDQUFDLGFBQWE7SUFDNUQsTUFBTSxXQUFXLEdBQUcsbUNBQW1DLENBQUMsQ0FBQyw0REFBNEQ7SUFDckgsTUFBTSxRQUFRLEdBQUcsNEJBQTRCLENBQUMsQ0FBQyxjQUFjO0lBT3RELElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWlCO1FBQzdCLFlBQ3FDLFlBQStCLEVBQzNCLGVBQXNDLEVBQ25DLG1CQUE2QztZQUZwRCxpQkFBWSxHQUFaLFlBQVksQ0FBbUI7WUFDM0Isb0JBQWUsR0FBZixlQUFlLENBQXVCO1lBQ25DLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBMEI7UUFDckYsQ0FBQztRQUVMLGdCQUFnQixDQUFDLFNBQWlCLEVBQUUsT0FBZSxFQUFFLFdBQThCLDhCQUFpQixDQUFDLEtBQUssRUFBRSxPQUE0QjtZQUN2SSxNQUFNLEtBQUssR0FBNkIsRUFBRSxDQUFDO1lBQzNDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQywrQ0FBK0M7WUFFdkgsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNmLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sWUFBWSxHQUFHLE9BQU8s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