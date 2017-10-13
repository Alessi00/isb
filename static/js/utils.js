/**
 *
 * Copyright 2017, Institute for Systems Biology
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

// Common utilities which are pulled into base.js (and used there)

require.config({
    baseUrl: STATIC_FILES_URL+'js/',
    paths: {
        jquery: 'libs/jquery-1.11.1.min',
        bootstrap: 'libs/bootstrap.min',
        jqueryui: 'libs/jquery-ui.min',
        session_security: 'session_security',
        underscore: 'libs/underscore-min',
        assetscore: 'libs/assets.core',
        assetsresponsive: 'libs/assets.responsive',
        tablesorter:'libs/jquery.tablesorter.min'
    },
    shim: {
        'bootstrap': ['jquery'],
        'jqueryui': ['jquery'],
        'session_security': ['jquery'],
        'assetscore': ['jquery', 'bootstrap', 'jqueryui'],
        'assetsresponsive': ['jquery', 'bootstrap', 'jqueryui'],
        'tablesorter': ['jquery'],
        'underscore': {exports: '_'}
    }
});

// Return an object for consts/methods used by most views
define(['jquery'], function($) {

    return {
        // Simple method for displaying an alert-<type> message at a given selector or DOM element location.
        //
        // type: One of the accepted alert types (danger, error, info, warning)
        // text: Content of the alert, added via jQuery.text() (and so escaped)
        // withEmpty: Truthy boolean for indicating if the element represented by rootSelector should first be emptied
        // rootSelector: text selector or DOM element which will be the parent of the alert; defaults to #js-messages
        //  (the DIV present on all pages which shows document-level JS messages)
        showJsMessage: function(type,text,withEmpty,rootSelector) {
            rootSelector = rootSelector || '#js-messages';
            withEmpty && $(rootSelector).empty();
            var msg = "";
            if(text instanceof Array){
                for(var i=0; i<text.length; i++) {
                    msg += text[i] + '<br />';
                }
            } else {
                msg = text;
            }
            $(rootSelector).append(
                $('<div>')
                    .addClass('alert alert-'+type +' alert-dismissible')
                    .html(msg)
                    .prepend(
                        '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">'
                        +'&times;</span><span class="sr-only">Close</span></button>'
                    )
            );
        }
    };
});