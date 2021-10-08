// ==UserScript==
// @name VIRTA::Unit Page More Info
// @description Дополнительные данные на странице юнита
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
    
    // ==================================================
    let ver = '1.2';
    
    function consoleEcho(text, isRrror = false) {
        const bg = isRrror === true ? '#af1a00' : '#3897c7'
        console.log(`\n %c VIRTA::UPMI / ${ver} %c ${text} \n\n`, 'color: #FFFFFF; background: #030307; padding:5px 0;', `color: #FFFFFF; background: ${bg}; padding:5px 0;`);
    }
    
    consoleEcho('Дополнительные данные на странице юнита');
    // ==================================================
    
    
    const m = window.location.href.match(/\/(\w+)\/main\/unit\/view\/(\d+)/);
    const unitID = m[2];
    if (!unitID) {
        consoleEcho('unitID не определен', true);
        return;
    }
    
    let $el =  $('li:contains("Квалификация игрока")')
    if ($el.length <= 0) {
        consoleEcho('Элемент Квалификация игрока не нашли. Останавливаемся');
        return;
    }
    
    function getUnitData(unitID) {
        return new Promise((resolve) => {
            $.ajax({
                async      : true,
                type       : 'GET',
                url        : `https://virtonomica.ru/api/vera/main/unit/view?id=${unitID}`,
                crossDomain: true,
                xhrFields  : {
                    withCredentials: true,
                },
                global     : false,
                dataType   : "json",
                success    : function (res) {
                    resolve(res);
                },
                error      : function (jqXHR, textStatus, error) {
                    consoleEcho(`FAIL (ajax) {textStatus=${textStatus} , error=${error}}`, true);
                },
            });
        });
    }
    
    function getUserKvala(userID) {
        return new Promise((resolve) => {
            $.ajax({
                async      : true,
                type       : 'GET',
                url        : `https://virtonomica.ru/api/vera/main/user/competences/browse?id=${userID}`,
                crossDomain: true,
                xhrFields  : {
                    withCredentials: true,
                },
                global     : false,
                dataType   : "json",
                success    : function (data) {
                    const kvala = {};
                    Object.entries(data).forEach(([key, v]) => {
                        let kk = v['kind'];
                        v['delta'] = (parseFloat(v['delta']) * 100);
                        v['progress'] = parseFloat(v['progress']);
                        v['step'] = v['delta'] > v['progress'];
                        kvala[kk] = v;
                    });
                    resolve(kvala);
                },
                error      : function (jqXHR, textStatus, error) {
                    consoleEcho(`FAIL (ajax) {textStatus=${textStatus} , error=${error}}`, true);
                },
            });
        });
    }
    
    const unit = await getUnitData(unitID);
    const kvala = await getUserKvala(unit['user_id']);

    $el = $el.find('span');
    const v = $el.text().trim();
    
    
    const kvalaUnit = kvala[unit['knowledge_area_kind']];
    if (kvalaUnit['step']) {
        $el.html(`${v} <sup class="text-success">+1 (${kvalaUnit['progress']}%)</sup>`);
    } else {
        $el.html(`${v} <sup class="text-muted">+0 (${kvalaUnit['progress']}%)</sup>`);
    }
    
}

if (window.top === window) {
    let script = document.createElement("script");
    script.textContent = '(' + run.toString() + ')();';
    document.documentElement.appendChild(script);
}