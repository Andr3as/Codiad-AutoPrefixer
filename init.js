/*
 * Copyright (c) Codiad & Andr3as, distributed
 * as-is and without warranty under the MIT License. 
 * See http://opensource.org/licenses/MIT for more information. 
 * This information must remain intact.
 * @author Andr3as
 * @version 0.1.0
 */

(function(global, $){
    
    var codiad  = global.codiad,
        scripts = document.getElementsByTagName('script'),
        path    = scripts[scripts.length-1].src.split('?')[0],
        curpath = path.split('/').slice(0, -1).join('/')+'/',
        Range   = ace.require('ace/range').Range;

    $(function() {    
        codiad.Prefixer.init();
    });

    codiad.Prefixer = {

        path: curpath,

        init: function() {
            var _this       = this;
            amplify.subscribe('active.onOpen', function(path){
                if (/(\.css)$/.test(path)) {
                    _this.addKeyBindings();
                }
            });
            amplify.subscribe("context-menu.onShow", function(obj){
                if (/(\.css)$/.test(obj.path)) {
                    $('#context-menu').append('<hr class="file-only prefixer">');
                    $('#context-menu').append('<a class="file-only prefixer" onclick="codiad.Prefixer.contextMenu($(\'#context-menu\').attr(\'data-path\'));"><span class="icon-traffic-cone"></span>AutoPrefixer</a>');
                }
            });
            amplify.subscribe("context-menu.onHide", function(){
                $('.prefixer').remove();
            });
            //Load lib
            $.getScript(this.path + 'autoprefixer.js');
        },

        //////////////////////////////////////////////////////////
        //
        //  Add key bindings
        //
        //////////////////////////////////////////////////////////
        addKeyBindings: function() {
            if (codiad.editor.getActive() !== null) {
                var _this   = this;
                var manager = codiad.editor.getActive().commands;
                
                manager.addCommand({
                    name: 'autoprefixer',
                    bindKey: {
                        "win": "Ctrl-Alt-P",
                        "mac": "Command-Alt-P"
                    },
                    exec: function() {
                        _this.command();
                    }
                });
            }
        },

        //////////////////////////////////////////////////////////
        //
        //  Command
        //
        //////////////////////////////////////////////////////////
        command: function() {
            var _this = this;
            var editor      = codiad.editor.getActive();
            var session     = editor.getSession();
            var selText     = codiad.editor.getSelectedText();
            if (selText === "") {
                codiad.editor.getActive().selectAll();
            }

            if (editor.inMultiSelectMode) {
                //Multiselection
                var multiRanges = editor.multiSelect.getAllRanges();
                for (var i = 0; i < multiRanges.length; i++) {
                    this.runCommandForRange(multiRanges[i], this.runPrefixer.bind(this));
                }
            } else {
                //Singleselection
                this.runCommandForRange(editor.getSelectionRange(), this.runPrefixer.bind(this));
            }
            return true;
        },

        runCommandForRange: function(range, handler) {
            var session = codiad.editor.getActive().getSession();
            if ((range.start.row == range.end.row) && (range.start.column == range.end.column)) {
                return false;
            }
            //Get selection
            var selection = session.getTextRange(range);
            if (selection === "") {
                /* No selection at the given position. */
                return false;
            }
            selection = handler(selection);
            if (selection === false) {
                return false;
            }
            session.replace(range, selection);
            return true;
        },

        contextMenu: function(path) {
            var _this = this;
            $.getJSON(this.path + 'controller.php?action=getContent&path='+ path, function(result){
                if (result.status == "success") {
                    var prefixed = _this.runPrefixer(result.content);
                    $.post(_this.path + 'controller.php?action=saveContent&path=' + path, {content: prefixed}, function(result){
                        result = JSON.parse(result);
                        codiad.message[result.status](result.message);
                        if (result.status == "success") {
                            codiad.filemanager.rescan($('#project-root').attr('data-path'));
                        }
                    });
                }
            });
        },

        runPrefixer: function(content) {
            return autoprefixer.process(content).css;
        },
    };
})(this, jQuery);