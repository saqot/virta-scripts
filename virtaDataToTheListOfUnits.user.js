// ==UserScript==
// @name VIRTA::Data to the list of units
// @description Дополнительные данные в список юнитов
// @namespace virtonomica
// @author SAQOT
// @version 1.3
// @include https://virtonomica.ru/vera/main/company/view/*/unit_list
// @run-at document-idle
// ==/UserScript==

/* global $, unsafeWindow, ajaxTools */


let run = async function () {
    let win = (typeof (unsafeWindow) != 'undefined' ? unsafeWindow : top.window);
    $ = win.$;
    
    // ==================================================
    let ver = '1.3';
    
    function consoleEcho(text, isRrror = false) {
        const bg = isRrror === true ? '#af1a00' : '#3897c7'
        console.log(`\n %c VIRTA::DLU / ${ver} %c ${text} \n\n`, 'color: #FFFFFF; background: #030307; padding:5px 0;', `color: #FFFFFF; background: ${bg}; padding:5px 0;`);
    }
    
    consoleEcho('Дополнительные данные в список юнитов');
    // ==================================================
    
    
    const m = window.location.href.match(/\/(\w+)\/main\/company\/view\/(\d+)/);
    const userID = m[2];
    if (!userID) {
        consoleEcho('userID не определен', true);
        return;
    }
    
    function getUserInfo() {
        return new Promise((resolve) => {
            $.ajax({
                async      : true,
                type       : 'GET',
                url        : `https://virtonomica.ru/api/vera/main/user/info`,
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
    
    let dataUnits = {};
    
    function getDataUnits() {
        return new Promise((resolve) => {
            if (Object.keys(dataUnits).length) {
                resolve(dataUnits);
            } else {
                $.ajax({
                    async      : true,
                    type       : 'GET',
                    url        : `https://virtonomica.ru/api/vera/main/company/report/units/all?id=${userID}&pagesize=5000&format=json`,
                    crossDomain: true,
                    xhrFields  : {
                        withCredentials: true,
                    },
                    global     : false,
                    dataType   : "json",
                    success    : function (res) {
                        dataUnits = res;
                        resolve(res);
                    },
                    error      : function (a, b, c) {
                        console.error(a, b, c);
                    },
                });
            }
        });
    }
    
    function abbreviateNumber(value) {
        let number = Math.abs(Number(value));
        
        if (Number(number) >= 1.0e+9) {
            return (number / 1.0e+9).toFixed(2) + ` B`;
        }
        if (Number(number) >= 1.0e+6) {
            return (number / 1.0e+6).toFixed(2) + ` M`;
        }
        if (Number(number) >= 1.0e+3) {
            return (number / 1.0e+3).toFixed(2) + ` K`;
        }
        
        return number;
    }
    
    function runSetupProfit(data) {
        let $TRs = $("table tbody tr[data-id]");
        
        $('table thead tr').append(`<th class="many text-right" style="">Прибыль</th>`);
        
        $TRs.each(function () {
            let $el = $(this);
            let $rowMany = $el.find('td.many');
            if (!$rowMany.length) {
                $el.append(`<td class="many many text-middle text-right" >--</td>`);
                $rowMany = $el.find('td.many');
            }
            
            let unitId = $el.attr('data-id');
            let elData = data[unitId];
            
            if (elData !== undefined) {
                let cash = elData['cashflow'];
                let classColor = 'text-success';
                if (cash[0] === '-') {
                    classColor = 'text-danger';
                    cash = cash.slice(1);
                    cash = '-$' + abbreviateNumber(cash);
                } else {
                    cash = '+$' + abbreviateNumber(cash);
                }
                
                $rowMany.html(`<span class="${classColor}"><span class="mnegative2">${cash}</span></span>`);
            }
        });
    }
    
    function waitForTable(callback) {
        let time = 0;
        let poops = setInterval(function () {
            let el = document.getElementById('unit-list');
            if (el) {
                clearInterval(poops);
                callback(el);
            }
            time += 100;
        }, 100);
    }
    
    
    async function initRun(el) {
        let $btnSorts = $(el).find('thead button');
        
        $btnSorts.on('click', function () {
            setTimeout(function () {
                waitForTable(initRun);
            }, 100);
        });
        
        const dataUnits = await getDataUnits();
        runSetupProfit(dataUnits);
    }
    
    
    let $btnFilters = $('#unit-class-filter button');
    $btnFilters.on('click', function () {
        setTimeout(function () {
            waitForTable(initRun);
        }, 1000);
    });
    
    
    const userInfo = await getUserInfo();
    
    if (userInfo['company_id'] !== userID) {
        consoleEcho('Прерываем работу, страница чужой компании');
        return;
    }
    
    
    waitForTable(initRun);
    
}

if (window.top === window) {
    let script = document.createElement("script");
    script.textContent = '(' + run.toString() + ')();';
    document.documentElement.appendChild(script);
}