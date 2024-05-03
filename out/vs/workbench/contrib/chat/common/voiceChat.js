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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/speech/common/speechService"], function (require, exports, event_1, lifecycle_1, strings_1, instantiation_1, chatAgents_1, chatParserTypes_1, speechService_1) {
    "use strict";
    var VoiceChatService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VoiceChatService = exports.IVoiceChatService = void 0;
    exports.IVoiceChatService = (0, instantiation_1.createDecorator)('voiceChatService');
    var PhraseTextType;
    (function (PhraseTextType) {
        PhraseTextType[PhraseTextType["AGENT"] = 1] = "AGENT";
        PhraseTextType[PhraseTextType["COMMAND"] = 2] = "COMMAND";
        PhraseTextType[PhraseTextType["AGENT_AND_COMMAND"] = 3] = "AGENT_AND_COMMAND";
    })(PhraseTextType || (PhraseTextType = {}));
    let VoiceChatService = class VoiceChatService extends lifecycle_1.Disposable {
        static { VoiceChatService_1 = this; }
        static { this.AGENT_PREFIX = chatParserTypes_1.chatAgentLeader; }
        static { this.COMMAND_PREFIX = chatParserTypes_1.chatSubcommandLeader; }
        static { this.PHRASES_LOWER = {
            [VoiceChatService_1.AGENT_PREFIX]: 'at',
            [VoiceChatService_1.COMMAND_PREFIX]: 'slash'
        }; }
        static { this.PHRASES_UPPER = {
            [VoiceChatService_1.AGENT_PREFIX]: 'At',
            [VoiceChatService_1.COMMAND_PREFIX]: 'Slash'
        }; }
        static { this.CHAT_AGENT_ALIAS = new Map([['vscode', 'code']]); }
        constructor(speechService, chatAgentService) {
            super();
            this.speechService = speechService;
            this.chatAgentService = chatAgentService;
        }
        createPhrases(model) {
            const phrases = new Map();
            for (const agent of this.chatAgentService.getActivatedAgents()) {
                const agentPhrase = `${VoiceChatService_1.PHRASES_LOWER[VoiceChatService_1.AGENT_PREFIX]} ${VoiceChatService_1.CHAT_AGENT_ALIAS.get(agent.id) ?? agent.id}`.toLowerCase();
                phrases.set(agentPhrase, { agent: agent.id });
                for (const slashCommand of agent.slashCommands) {
                    const slashCommandPhrase = `${VoiceChatService_1.PHRASES_LOWER[VoiceChatService_1.COMMAND_PREFIX]} ${slashCommand.name}`.toLowerCase();
                    phrases.set(slashCommandPhrase, { agent: agent.id, command: slashCommand.name });
                    const agentSlashCommandPhrase = `${agentPhrase} ${slashCommandPhrase}`.toLowerCase();
                    phrases.set(agentSlashCommandPhrase, { agent: agent.id, command: slashCommand.name });
                }
            }
            return phrases;
        }
        toText(value, type) {
            switch (type) {
                case PhraseTextType.AGENT:
                    return `${VoiceChatService_1.AGENT_PREFIX}${value.agent}`;
                case PhraseTextType.COMMAND:
                    return `${VoiceChatService_1.COMMAND_PREFIX}${value.command}`;
                case PhraseTextType.AGENT_AND_COMMAND:
                    return `${VoiceChatService_1.AGENT_PREFIX}${value.agent} ${VoiceChatService_1.COMMAND_PREFIX}${value.command}`;
            }
        }
        async createVoiceChatSession(token, options) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(token.onCancellationRequested(() => disposables.dispose()));
            let detectedAgent = false;
            let detectedSlashCommand = false;
            const emitter = disposables.add(new event_1.Emitter());
            const session = await this.speechService.createSpeechToTextSession(token, 'chat');
            const phrases = this.createPhrases(options.model);
            disposables.add(session.onDidChange(e => {
                switch (e.status) {
                    case speechService_1.SpeechToTextStatus.Recognizing:
                    case speechService_1.SpeechToTextStatus.Recognized:
                        if (e.text) {
                            const startsWithAgent = e.text.startsWith(VoiceChatService_1.PHRASES_UPPER[VoiceChatService_1.AGENT_PREFIX]) || e.text.startsWith(VoiceChatService_1.PHRASES_LOWER[VoiceChatService_1.AGENT_PREFIX]);
                            const startsWithSlashCommand = e.text.startsWith(VoiceChatService_1.PHRASES_UPPER[VoiceChatService_1.COMMAND_PREFIX]) || e.text.startsWith(VoiceChatService_1.PHRASES_LOWER[VoiceChatService_1.COMMAND_PREFIX]);
                            if (startsWithAgent || startsWithSlashCommand) {
                                const originalWords = e.text.split(' ');
                                let transformedWords;
                                let waitingForInput = false;
                                // Check for agent + slash command
                                if (options.usesAgents && startsWithAgent && !detectedAgent && !detectedSlashCommand && originalWords.length >= 4) {
                                    const phrase = phrases.get(originalWords.slice(0, 4).map(word => this.normalizeWord(word)).join(' '));
                                    if (phrase) {
                                        transformedWords = [this.toText(phrase, PhraseTextType.AGENT_AND_COMMAND), ...originalWords.slice(4)];
                                        waitingForInput = originalWords.length === 4;
                                        if (e.status === speechService_1.SpeechToTextStatus.Recognized) {
                                            detectedAgent = true;
                                            detectedSlashCommand = true;
                                        }
                                    }
                                }
                                // Check for agent (if not done already)
                                if (options.usesAgents && startsWithAgent && !detectedAgent && !transformedWords && originalWords.length >= 2) {
                                    const phrase = phrases.get(originalWords.slice(0, 2).map(word => this.normalizeWord(word)).join(' '));
                                    if (phrase) {
                                        transformedWords = [this.toText(phrase, PhraseTextType.AGENT), ...originalWords.slice(2)];
                                        waitingForInput = originalWords.length === 2;
                                        if (e.status === speechService_1.SpeechToTextStatus.Recognized) {
                                            detectedAgent = true;
                                        }
                                    }
                                }
                                // Check for slash command (if not done already)
                                if (startsWithSlashCommand && !detectedSlashCommand && !transformedWords && originalWords.length >= 2) {
                                    const phrase = phrases.get(originalWords.slice(0, 2).map(word => this.normalizeWord(word)).join(' '));
                                    if (phrase) {
                                        transformedWords = [this.toText(phrase, options.usesAgents && !detectedAgent ?
                                                PhraseTextType.AGENT_AND_COMMAND : // rewrite `/fix` to `@workspace /foo` in this case
                                                PhraseTextType.COMMAND // when we have not yet detected an agent before
                                            ), ...originalWords.slice(2)];
                                        waitingForInput = originalWords.length === 2;
                                        if (e.status === speechService_1.SpeechToTextStatus.Recognized) {
                                            detectedSlashCommand = true;
                                        }
                                    }
                                }
                                emitter.fire({
                                    status: e.status,
                                    text: (transformedWords ?? originalWords).join(' '),
                                    waitingForInput
                                });
                                break;
                            }
                        }
                    default:
                        emitter.fire(e);
                        break;
                }
            }));
            return {
                onDidChange: emitter.event
            };
        }
        normalizeWord(word) {
            word = (0, strings_1.rtrim)(word, '.');
            word = (0, strings_1.rtrim)(word, ',');
            word = (0, strings_1.rtrim)(word, '?');
            return word.toLowerCase();
        }
    };
    exports.VoiceChatService = VoiceChatService;
    exports.VoiceChatService = VoiceChatService = VoiceChatService_1 = __decorate([
        __param(0, speechService_1.ISpeechService),
        __param(1, chatAgents_1.IChatAgentService)
    ], VoiceChatService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidm9pY2VDaGF0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2NvbW1vbi92b2ljZUNoYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQVluRixRQUFBLGlCQUFpQixHQUFHLElBQUEsK0JBQWUsRUFBb0Isa0JBQWtCLENBQUMsQ0FBQztJQXVDeEYsSUFBSyxjQUlKO0lBSkQsV0FBSyxjQUFjO1FBQ2xCLHFEQUFTLENBQUE7UUFDVCx5REFBVyxDQUFBO1FBQ1gsNkVBQXFCLENBQUE7SUFDdEIsQ0FBQyxFQUpJLGNBQWMsS0FBZCxjQUFjLFFBSWxCO0lBRU0sSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSxzQkFBVTs7aUJBSXZCLGlCQUFZLEdBQUcsaUNBQWUsQUFBbEIsQ0FBbUI7aUJBQy9CLG1CQUFjLEdBQUcsc0NBQW9CLEFBQXZCLENBQXdCO2lCQUV0QyxrQkFBYSxHQUFHO1lBQ3ZDLENBQUMsa0JBQWdCLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSTtZQUNyQyxDQUFDLGtCQUFnQixDQUFDLGNBQWMsQ0FBQyxFQUFFLE9BQU87U0FDMUMsQUFIb0MsQ0FHbkM7aUJBRXNCLGtCQUFhLEdBQUc7WUFDdkMsQ0FBQyxrQkFBZ0IsQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJO1lBQ3JDLENBQUMsa0JBQWdCLENBQUMsY0FBYyxDQUFDLEVBQUUsT0FBTztTQUMxQyxBQUhvQyxDQUduQztpQkFFc0IscUJBQWdCLEdBQUcsSUFBSSxHQUFHLENBQWlCLENBQUMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxBQUFoRCxDQUFpRDtRQUV6RixZQUNrQyxhQUE2QixFQUMxQixnQkFBbUM7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFI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