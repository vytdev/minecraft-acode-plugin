/* ================================================================
main.js
================================================================ */

// escape regex
const escapeRe = /\\(?:u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|u{[0-9a-fA-F]{1,6}}|[0-2][0-7]{0,2}|3[0-7][0-7]?|[4-7][0-7]?|.)/;

/**
 * Main plugin instance
 */
class AcodePlugin {
    /**
     * Init function
     */
    async init() {
        this.addModes();
    }
    /**
     * Register minecraft files
     */
    addModes() {
        // register minecraft files
        ace.require("ace/ext/modelist").modes.push({
            caption: "Minecraft Language",
            extRe: /\.lang$/,
            extensions: "lang",
            mode: "ace/mode/lang",
            name: "Lang"
        }, {
            caption: "Minecraft Function",
            extRe: /\.mcfunction$/,
            extensions: "mcfunction",
            mode: "ace/mode/mcfunction",
            name: "Mcfunction"
        });
        
        // dot-lang highlighter
        define("ace/mode/lang_highlight_rules",[
            "require","exports","module",
            "ace/lib/oop",
            "ace/mode/text_highlight_rules"
        ],function(require, exports, module){
            "use strict";
            const oop = require("../lib/oop");
            const { TextHighlightRules } = require("./text_highlight_rules");
            function LangHighlightRules() {
                // add highlighting rules
                this.$rules = {
                    start: [
                        {
                            // a comment
                            token: "comment.mclang",
                            regex: /(^\s*##.*|\s+##.*)$/
                        },
                        {
                            // "=" character
                            token: "keyword.mclang",
                            regex: /=/
                        },
                        {
                            // translation value
                            token: "string.mclang",
                            regex: /(?<==)/,
                            push: [
                                {
                                    // parameters
                                    token: "identifier.mclang",
                                    regex: /%(%|[a-z]|[1-9]\d*(?:\$[a-z])?|\.\d+[df\$])/
                                },
                                {
                                    // icons
                                    token: "storage.mclang",
                                    regex: /:[_a-zA-Z0-9.]+:/
                                },
                                {
                                    defaultToken: "string.mclang"
                                },
                                {
                                    // end
                                    token: "string.mclang",
                                    regex: /((?=\t+##)|$)/,
                                    next: "pop"
                                }
                            ]
                        },
                        {
                            // translation key
                            token: "variable.mclang",
                            regex: /^[^=]+/
                        }
                    ]
                };
                this.normalizeRules();
            }
            LangHighlightRules.metaData = {
                fileTypes: ["lang"],
                name: "Lang"
            };
            oop.inherits(LangHighlightRules, TextHighlightRules);
            exports.LangHighlightRules = LangHighlightRules;
        });
        // dot-lang mode
        define("ace/mode/lang",[
            "require","exports","module",
            "ace/lib/oop",
            "ace/mode/text",
            "ace/mode/lang_highlight_rules"
        ],function(require,exports,module){
            "use strict";
            const oop = require("../lib/oop");
            const { Mode: TextMode } = require("./text");
            const { LangHighlightRules } = require("./lang_highlight_rules");
            function LangMode() {
                this.HighlightRules = LangHighlightRules;
                this.$behaviour = this.$defaultBehaviour;
            };
            oop.inherits(LangMode, TextMode);
            LangMode.prototype.$id = "ace/mode/lang";
            exports.Mode = LangMode;
        });
        
        // mcfunction highlighter
        define("ace/mode/mcfunction_highlight_rules",[
            "require","exports","module",
            "ace/lib/oop",
            "ace/mode/text_highlight_rules"
        ],function(require, exports, module){
            "use strict";
            const oop = require("../lib/oop");
            const { TextHighlightRules } = require("./text_highlight_rules");
            // commands and sub-commands, as of 1.20.12
            // commands
            const cmds = [
                "\\?", "ability", "alwaysday", "camerashake", "clear", "clearspawnpoint",
                "clone", "connect", "damage", "daylock", "deop", "dialogue", "difficulty",
                "effect", "enchant", "event", "execute", "fill", "fog", "function",
                "gamemode", "gamerule", "gametest", "give", "help", "immutableworld",
                "inputpermission", "kick", "kill", "list", "locate", "loot", "me",
                "mobevent", "msg", "music", "op", "particle", "playanimation", "playsound",
                "reload", "replaceitem", "ride", "say", "schedule", "scoreboard",
                "script", "scriptevent", "setblock", "setmaxplayers", "setworldspawn",
                "spawnpoint", "spreadplayers", "stopsound", "structure", "summon",
                "tag", "teleport", "tell", "tellraw", "testfor", "testforblock",
                "testforblocks", "tickingarea", "time", "title", "titleraw", "toggledownfall",
                "tp", "w", "wb", "weather", "worldbuilder", "wsserver", "xp"
            ];
            // sub-commands
            const subCmds = [
                "actionbar", "add", "align", "all", "anchored", "as", "ascending", "at",
                "belowname", "biome", "block", "circle", "structure", "block", "blocks",
                "change", "clear", "clearall", "close", "connect", "create", "debugger",
                "delete", "descending", "destroy", "dummy", "entity", "evict_riders",
                "exportstats", "eyes", "facing", "feet", "fill", "filtered", "fog", "give",
                "if", "in", "insert", "keep", "kill", "list", "listen", "load", "loot",
                "mainhand", "masked", "matches", "objectives", "offhand", "on_area_loaded",
                "open", "operation", "play", "players", "pos", "positioned", "preload",
                "profiler", "push", "queue", "query", "rain", "random", "remove", "remove_all",
                "replace", "reset", "rotated", "run", "runset", "runsetuntilfail", "runthese",
                "runthis", "save", "score", "set", "setdisplay", "sidebar", "spawn", "start",
                "start_riding", "stop", "stop_riding", "stopall", "subtitle", "summon_ride",
                "summon_rider", "test", "thunder", "tickingarea", "times", "title", "unless",
                "volume", "watchdog", "@p", "@a", "@e", "@s"
            ];
            // dimensions, used in some commands
            const dims = [
                "overworld", "nether", "the_end"
            ];
            function McfunctionHighlightRules() {
                // add keywords
                this.createKeywordMapper({
                    keyword: [...cmds, ...subCmds, ...dims].join("|")
                });
                // add highlighting rules
                this.$rules = {
                    start: [
                        {
                            // a comment
                            token: "comment.mcfunction",
                            regex: /\s*#.*/
                        },
                        {
                            // a string (text within double quotes)
                            token: "string.mcfunction",
                            regex: /"/,
                            push: [
                                {
                                    // escape characters
                                    token: "constant.language.escape.mcfunction",
                                    regex: escapeRe
                                },
                                {
                                    // back to parent rules
                                    token: "string.mcfunction",
                                    regex: /"/,
                                    next: "pop"
                                },
                                {
                                    // part of the string
                                    defaultToken: "string.mcfunction"
                                }
                            ]
                        },
                        {
                            // numbers
                            token: "constant.numeric.mcfunction",
                            regex: /[-+]?(0|[1-9]\d*)(\.\d+)?/
                        },
                        {
                            // boolean
                            token: "constant.language.boolean.mcfunction",
                            regex: /\b(true|false)\b/
                        },
                        {
                            // punctuation operators
                            token: "punctuation.operator.mcfunction",
                            regex: /[!,.:]/
                        },
                        {
                            // keyword operators
                            token: "keyword.operator.mcfunction",
                            regex: /[-+*/=^~]/
                        },
                        {
                            // selector
                            token: "storage.selector.mcfunction",
                            regex: /@[aerpsv]/
                        },
                        {
                            // variable (like in shell script), for target selectors
                            token: "variable.mcfunction",
                            regex: /[a-zA-Z0-9_]+(?==)/
                        },
                        {
                            // bracket
                            token: "paren.mcfunction",
                            regex: /[\[\]\{\}]/
                        },
                        {
                            // minecraft namespace
                            token: "identifier.class.mcfunction",
                            regex: /\bminecraft\b/
                        },
                        {
                            // commands
                            token: "keyword.mcfunction",
                            regex: "\\b(" + cmds.join("|") + ")\\b"
                        },
                        {
                            // sub-commands
                            token: "identifier.mcfunction",
                            regex: "\\b(" + subCmds.join("|") + ")\\b"
                        },
                        {
                            // dimensions
                            token: "constant.language.mcfunction",
                            regex: "\\b(" + dims.join("|") + ")\\b"
                        }
                    ]
                };
                this.normalizeRules();
            }
            McfunctionHighlightRules.metaData = {
                fileTypes: ["mcfunction"],
                name: "Mcfunction"
            };
            oop.inherits(McfunctionHighlightRules, TextHighlightRules);
            exports.McfunctionHighlightRules = McfunctionHighlightRules;
        });
        // mcfunction mode
        define("ace/mode/mcfunction",[
            "require","exports","module",
            "ace/lib/oop",
            "ace/mode/text",
            "ace/mode/mcfunction_highlight_rules"
        ],function(require,exports,module){
            "use strict";
            const oop = require("../lib/oop");
            const { Mode: TextMode } = require("./text");
            const { McfunctionHighlightRules } = require("./mcfunction_highlight_rules");
            function McfunctionMode() {
                this.HighlightRules = McfunctionHighlightRules;
                this.$behaviour = this.$defaultBehaviour;
            };
            oop.inherits(McfunctionMode, TextMode);
            McfunctionMode.prototype.$id = "ace/mode/mcfunction";
            exports.Mode = McfunctionMode;
        });
    }
    /**
     * Unmount function
     */
    async destroy() {
        // no-op
    }
}

if (window.acode) {
    const acodePlugin = new AcodePlugin();
    const pluginId = "vytdev.minecraft.util";
    acode.setPluginInit(pluginId, async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }
        acodePlugin.baseUrl = baseUrl;
        await acodePlugin.init($page, cacheFile, cacheFileUrl);
    });
    acode.setPluginUnmount(pluginId, () => {
        acodePlugin.destroy();
    });
}
