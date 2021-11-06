// ==UserScript==
// @name VIRTA::Clear Cache Unit
// @description Очистка кеша юнита
// @namespace virtonomica
// @author SAQOT
// @version 1.2
// @include https://virtonomica.ru/vera/main/unit/view/*
// @run-at document-idle
// ==/UserScript==

/* global $, unsafeWindow */

let run = async function () {
    let win = (typeof (unsafeWindow) != 'undefined' ? unsafeWindow : top.window);
    $ = win.$;
    
    // проверка на точность соответсвия страницы
    const t = window.location.href.match(/\/(\w+)\/main\/unit\/view\/(\d+)$/)
    if (!t) {
        return;
    }
    
    // ==================================================
    let ver = '1.2';
    
    function consoleEcho(text, isRrror = false) {
        const bg = isRrror === true ? '#af1a00' : '#3897c7'
        console.log(`\n %c VIRTA::CCH / ${ver} %c ${text} \n\n`, 'color: #FFFFFF; background: #030307; padding:5px 0;', `color: #FFFFFF; background: ${bg}; padding:5px 0;`);
    }
    
    consoleEcho('Очистка кеша юнита');
    
    // ==================================================
    
    const m = window.location.href.match(/\/(\w+)\/main\/unit\/view\/(\d+)/);
    const unitID = m[2];
    if (!unitID) {
        consoleEcho('unitID не определен', true);
        return;
    }
    
    function getToken() {
        return new Promise((resolve) => {
            $.ajax({
                async      : true,
                type       : 'GET',
                url        : `https://virtonomica.ru/api/vera/main/token`,
                crossDomain: true,
                xhrFields  : {
                    withCredentials: true,
                },
                global     : false,
                dataType   : "json",
                success    : function (res) {
                    resolve(res);
                },
                error      : function (a, b, c) {
                    console.error(a, b, c);
                },
            });
        });
    }
    
    function clearCache(unitID, token) {
        return new Promise((resolve) => {
            $.ajax({
                async      : true,
                type       : 'POST',
                url        : 'https://virtonomica.ru/api/vera/main/unit/refresh',
                crossDomain: true,
                data       : {
                    id   : unitID,
                    token: token,
                },
                success    : function (res) {
                    resolve(res);
                },
                error      : function (jqXHR, textStatus, error) {
                    consoleEcho(`FAIL (ajax) {textStatus=${textStatus} , error=${error}}`, true);
                },
            });
        });
    }
    
    let $icon;
    
    const $blockNew = $('.page-inline-menu > div');
    if ($blockNew.length) {
        $icon = $(`<a href="" class="item item-width- clear-cache-n"><i class="fa fa-trash"></i><span>Очистить кеш</span></a>`);
        $blockNew.append($icon);
    } else {
        const $blockOld = $('#unit_subtab');
        if ($blockOld.length) {
            $icon = $(`<div><a href="" class="clear-cache-o"> <i class="fa fa-trash"></i> Очистить кеш</a></div>`);
            $blockOld.append($icon);
        }
    }
    
    if ($icon) {
        $icon.off('click').on('click', async function (e) {
            e.preventDefault();
        
            const token = await getToken();
            await clearCache(unitID, token);
        
            setTimeout(function () {
                window.location.reload();
            }, 100);
        
        });
    
    
        let sheet = document.createElement('style')
        sheet.innerHTML = `
        .clear-cache-n i.fa {
            padding: 5px 0px;
            height: 32px;
            margin: 0 auto 2px auto;
            display: block;
            font-size: 24px;
            color: #888;
        }
        `;
        document.body.appendChild(sheet);
    }

    
}

if (window.top === window) {
    let script = document.createElement("script");
    script.textContent = '(' + run.toString() + ')();';
    document.documentElement.appendChild(script);
}