// ==UserScript==
// @name VIRTA::Materials Select Help
// @description Доп. стата при заказе товара
// @namespace virtonomica
// @author SAQOT
// @version 1.4
// @include https://virtonomica.ru/vera/main/unit/view/*/supply
// @include https://virtonomica.ru/vera/main/unit/view/*/supply#confirm-modal
// @include https://virtonomica.ru/vera/main/unit/view/*/supply#materials-modal
// @include https://virtonomica.ru/vera/main/unit/view/*/trading_hall
// @include https://virtonomica.ru/vera/main/unit/view/*/trading_hall#confirm-modal
// @include https://virtonomica.ru/vera/main/unit/view/*/trading_hall#materials-modal
// @run-at document-idle
// ==/UserScript==

/* global $, unsafeWindow, UnitCreateWizard */

let run = function () {
    let win = (typeof (unsafeWindow) != 'undefined' ? unsafeWindow : top.window);
    $ = win.$;
    
    // ==================================================
    let ver = '1.4';
    
    function consoleEcho(text, isRrror = false) {
        const bg = isRrror === true ? '#af1a00' : '#3897c7'
        console.log(`\n %c VIRTA::MSH / ${ver} %c ${text} \n\n`, 'color: #FFFFFF; background: #030307; padding:5px 0;', `color: #FFFFFF; background: ${bg}; padding:5px 0;`);
    }
    
    consoleEcho('Доп. стата при заказе товара');
    // ==================================================
    
    const matches = window.location.href.match(/\/(\w+)\/main\/unit\/view\/(\d+)\/(supply|trading_hall)/);
    const unitID = matches[2];
    if (!unitID) {
        consoleEcho('unitID не определен', true);
        return;
    }
    
    let timer = null;
    
    function waitForTable(callback) {
        let time = 0;
        if (timer !== null) {
            return;
        }
        timer = setInterval(function () {
            let el = document.getElementById('materials-modal');
            if (el) {
                if ($(el).is(':visible') === true) {
                    clearInterval(timer);
                    timer = null;
                    callback(el);
                }
            }
            time += 100;
        }, 100);
    }
    
    
    function initRun(el) {
        const $modal = $(el);
        const urlDataLoaded = el.getAttribute('data-loaded')
        const m = urlDataLoaded.match(/product_id=(\d+)/);
        const productID = m[1];
        if (!productID) {
            consoleEcho('productID не определен', true);
            return;
        }
        
        // отслеживаем закрытие окна, что бы запустить мониторинг открытия
        $modal.on('click', function (e) {
            setTimeout(function () {
                if (!$modal.is(':visible')) {
                    waitForTable(initRun);
                }
            }, 1000);
        });
        
        // получить в запросе city_id
        function getCityId(unitID, callback) {
            $.ajax({
                async      : true,
                type       : 'GET',
                url        : `https://virtonomica.ru/api/vera/main/unit/view?format=json&id=${unitID}`,
                crossDomain: true,
                xhrFields  : {
                    withCredentials: true,
                },
                global     : false,
                dataType   : "json",
                success    : function (res) {
                    callback(res['city_id']);
                },
                error      : function (a, b, c) {
                    console.error(a, b, c);
                },
            });
        }
        
        // получить в запросе local_market_size (объем рынка)
        function getMarketSize(productID, cityId, callback) {
            $.ajax({
                async      : true,
                type       : 'GET',
                url        : `https://virtonomica.ru/api/vera/main/marketing/report/retail/metrics?format=json&product_id=${productID}&geo=0/0/${cityId}`,
                crossDomain: true,
                xhrFields  : {
                    withCredentials: true,
                },
                global     : false,
                dataType   : "json",
                success    : function (res) {
                    callback(res['local_market_size']);
                },
                error      : function (a, b, c) {
                    console.error(a, b, c);
                },
            });
        }
        
        const $tbody = $(el).find('table tbody');
        
        if (!$tbody.hasClass('modifed-my')) {
            $tbody.addClass('modifed-my');
            
            getCityId(unitID, function (cityId) {
                getMarketSize(productID, cityId, function (marketSize) {
                    $tbody.append(`<tr>
						<td><strong>Объем рынка</strong></td>
						<td colspan="3">${marketSize.toLocaleString('ru')}</td>
					</tr>`);
                });
            });
        }
        
        
    }
    
    
    waitForTable(initRun);
    
}

if (window.top === window) {
    let script = document.createElement("script");
    script.textContent = '(' + run.toString() + ')();';
    document.documentElement.appendChild(script);
}