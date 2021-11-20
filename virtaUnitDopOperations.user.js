// ==UserScript==
// @name VIRTA::Unit Dop Operations
// @description - Очистка кеша юнита
// @description - Удаление юнита
// @namespace virtonomica
// @author SAQOT
// @version 1.6
// @include https://virtonomica.ru/vera/main/unit/view/*
// @run-at document-idle
// ==/UserScript==

/* global $, unsafeWindow */

let run = async function () {
    let win = (typeof (unsafeWindow) != 'undefined' ? unsafeWindow : top.window);
    $ = win.$;
    
    // ==================================================
    let ver = '1.6';
    
    function consoleEcho(text, isRrror = false) {
        const bg = isRrror === true ? '#af1a00' : '#3897c7'
        console.log(`\n %c VIRTA::UDO / ${ver} %c ${text} \n\n`, 'color: #FFFFFF; background: #030307; padding:5px 0;', `color: #FFFFFF; background: ${bg}; padding:5px 0;`);
    }
    
    consoleEcho('Unit Dop Operations');
    
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
    
    function deleteUnit(unitID, token) {
        return new Promise((resolve) => {
            $.ajax({
                async      : true,
                type       : 'POST',
                url        : 'https://virtonomica.ru/api/vera/main/unit/destroy?format=json&app=adapter_vrt',
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
    
    let $iconClearCache;
    let $iconDelete;
    
    const $blockNew = $('ul.tabu');
    if ($blockNew.length) {
        $iconClearCache = $(`<li><a href="" data-name="itour-tab-unit-view--supply pull-right">Очистить кеш</a></li>`);
        $blockNew.append($iconClearCache);
        $iconDelete = $(`<li><a href="" data-name="itour-tab-unit-view--supply pull-right">Удалить юнит</a></li>`);
        $blockNew.append($iconDelete);
    } else {
        const $blockOld = $('#unit_subtab');
        if ($blockOld.length) {
            $iconClearCache = $(`<div><a href="" class="clear-cache-o"> <i class="fa fa-trash"></i> Очистить кеш</a></div>`);
            $blockOld.append($iconClearCache);
        }
    }
    
    if ($iconClearCache) {
        $iconClearCache.off('click').on('click', async function (e) {
            e.preventDefault();
        
            const token = await getToken();
            await clearCache(unitID, token);
        
            setTimeout(function () {
                window.location.reload();
            }, 100);
        
        });
    }
    
    if ($iconDelete) {
        $iconDelete.off('click').on('click', async function (e) {
            e.preventDefault();
    
            let isConfirm = confirm('Точно удалить юнит ?');
            if (isConfirm) {
                const token = await getToken();
                await deleteUnit(unitID, token);
    
                setTimeout(function () {
                    window.location.href = `https://virtonomica.ru/vera/main/user/privat/headquarters`;
                }, 100);
            }
            
        });
    }
    
    let sheet = document.createElement('style')
    sheet.innerHTML = `
        .vi-icon i.fa {
            padding: 5px 0px;
            height: 25px;
            margin: 7px auto 2px auto;
            display: block;
            font-size: 24px;
            color: #105b88;
        }
        .page-inline-menu .menu-container .item {
            width: unset;
            border: 1px solid #d9d8d8;
            padding: 5px;
        }

        `;
    document.body.appendChild(sheet);

    
}

if (window.top === window) {
    let script = document.createElement("script");
    script.textContent = '(' + run.toString() + ')();';
    document.documentElement.appendChild(script);
}