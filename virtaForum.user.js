// ==UserScript==
// @name VIRTA::Forum
// @description Скрытие ачивок в спойлер
// @namespace virtonomica
// @author SAQOT
// @version 1.1
// @include https://virtonomica.ru/*/forum/*/topic/*
// @run-at document-idle
// ==/UserScript==

/* global $, unsafeWindow */

let run = async function () {
    let win = (typeof (unsafeWindow) != 'undefined' ? unsafeWindow : top.window);
    $ = win.$;
    
    // ==================================================
    let ver = '1.1';
    
    function consoleEcho(text, isRrror = false) {
        const bg = isRrror === true ? '#af1a00' : '#3897c7'
        console.log(`\n %c VIRTA::F / ${ver} %c ${text} \n\n`, 'color: #FFFFFF; background: #030307; padding:5px 0;', `color: #FFFFFF; background: ${bg}; padding:5px 0;`);
    }
    
    consoleEcho('Forum Helper');
    
    // ==================================================
    
    let $blocks = $('td.forum_message_userinfo');
    if ($blocks.length) {
        $blocks.find('table:first').after('<fieldset class="fieldset-awards ">' +
            '<legend>Награды <span class="cnt-awards">(0)<span></legend>' +
            '	<div class="line-awards"></div>' +
            '	<div class="block-awards"></div>' +
            '</fieldset>');
    
        const $legend = $blocks.find('legend');
        $legend.on('click', function (e) {
            e.preventDefault();
        
            const $fieldset = $(this).parent();
        
            if ($fieldset.hasClass('show')) {
                $fieldset.removeClass('show');
            } else {
                $fieldset.addClass('show');
            }
        
        });
    
        
        $blocks.each(function () {
            const $el = $(this);
            const $b = $el.find('.block-awards');
            const toHide = [];
            let cnt = 0;
        
            $el.find("img[src*='reward']").each(function() {
                const $img = $(this);
                toHide.push($img.parent());
                $b.append($img);
                cnt++;
            });
            
            toHide.map(function($d) {
                $d.remove();
            });
            $el.find('.cnt-awards').html(`(${cnt})`);
        });
    
    }

    let sheet = document.createElement('style')
    sheet.innerHTML = `
		.fieldset-awards {
            border: 1px solid #d1d8e0 !important;
            padding: 0 !important;
            margin: 5px;
        }
        .line-awards {
            padding: 5px;
            display: block;
        }
        .block-awards {
            display: none;
             padding: 5px;
        }
        .fieldset-awards.show .line-awards {
            display: none;
        }
        .fieldset-awards.show .block-awards {
            display: block;
        }
        .fieldset-awards legend {
            cursor: pointer;
            margin: 0;
            border-bottom: none;
            width: auto;
            color: #94a0b2;
            font-weight: normal !important;
        }
         .block-awards img {
            margin: 2px;
        }
        .cnt-awards:after {
            content: " ▼";
        }
        .fieldset-awards.show .cnt-awards:after {
            content: " ▲";
        }
        `;
    document.body.appendChild(sheet);
    
}

if (window.top === window) {
    let script = document.createElement("script");
    script.textContent = '(' + run.toString() + ')();';
    document.documentElement.appendChild(script);
}