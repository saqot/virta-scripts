// ==UserScript==
// @name VIRTA:: Report Marketing
// @description Дополнительные данные в таблице отчетов по конурентам
// @namespace virtonomica
// @author SAQOT
// @version 1.2
// @include https://virtonomica.ru/*/main/unit/view/*
// @include https://virtonomica.ru/*/main/globalreport/marketing*
// ==/UserScript==
// 222@run-at document-idle

/* global $, unsafeWindow */

let run = async function () {
    let win = (typeof (unsafeWindow) != 'undefined' ? unsafeWindow : top.window);
    $ = win.$;
    
    // проверка на точность соответсвия страницы
    // const t2 = window.location.href.match(/\/(\w+)\/main\/unit\/view\/(\d+)($|\/virtasement|\/$|#|\?)/)
    const t = window.location.href.match(/\/(\w+)\/main\/(unit\/view\/|globalreport\/marketing)/)
    if (!t) {
        return;
    }
    
    // ==================================================
    let ver = '1.2';
    
    function consoleEcho(text, isRrror = false) {
        const bg = isRrror === true ? '#af1a00' : '#3897c7'
        console.log(`\n %c VIRTA::RM / ${ver} %c ${text} \n\n`, 'color: #FFFFFF; background: #030307; padding:5px 0;', `color: #FFFFFF; background: ${bg}; padding:5px 0;`);
    }
    
    consoleEcho('Дополнительные данные в таблице отчетов по конурентам');
    
    // ==================================================
    
    function floor2(val) {
        return (Math.floor(100 * val) / 100).toFixed(2) * 1;
    }
    
    function findUnitUserID($links) {
        let toReturn = null;
        $links.each(function () {
            const m = this.getAttribute('href').match(/\/(\w+)\/main\/unit\/view\/(\d+)/)
            if (m !== null) {
                toReturn = m[2];
                return false;
            }
        });
        return toReturn;
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
    
    // ------------------------------------------------------
    // дополнительные данные для списка конкурентов по услугам
    // ------------------------------------------------------
    async function initProcessSalers($div) {
        const $table = $div.find('table');
        
        const $thCollMat = $table.find('th:contains("Расходные материалы")');
        $thCollMat.css({'max-width': "110px"});
        
        const $ths = $table.find('thead th');
        
        
        const $thCollSize = $table.find('th:contains("Размер")');
        const idxCollSize = $ths.index($thCollSize);
        
        const $thCollDistrict = $table.find('th:contains("Район города")');
        const idxCollDistrict = $ths.index($thCollDistrict);
        
        const $thCollSales = $table.find('th:contains("Объем продаж")');
        const idxCollSales = $ths.index($thCollSales);
        
        const $thCollPrice = $table.find('th:contains("Цена")');
        const idxCollPrice = $ths.index($thCollPrice);
        
        const $thCollQl = $table.find('th:contains("Качество")');
        const idxCollQl = $ths.index($thCollQl);
        
        const $trs = $table.find('tbody tr');
        $trs.each(async function () {
            const $tr = $(this);
            const unitUserID = findUnitUserID($tr.find("td:eq(0) a"))
            const unit = await getUnitData(unitUserID);
            
            if (idxCollSize !== -1) {
                const $tdBlockSize = $tr.find(`td:eq(${idxCollSize})`);
                const txtSize = $tdBlockSize.html();
                $tdBlockSize.html(txtSize.replace(/рабочих мест/g, "мест"));
            }
            
            if (idxCollPrice !== -1) {
                const $tdBlockPrice = $tr.find(`td:eq(${idxCollPrice})`);
                const txtBlockPrice = $tdBlockPrice.html();
                $tdBlockPrice.html(txtBlockPrice.replace(/\.00$/g, ""));
            }
            
            if (idxCollDistrict !== -1) {
                const $tdBlockDistrict = $tr.find(`td:eq(${idxCollDistrict})`);
                let txtDistrict = $tdBlockDistrict.html();
                txtDistrict = txtDistrict.replace(/ район| города/g, "");
                txtDistrict = txtDistrict.replace(/Фешенебельный/g, "Фешка");
                $tdBlockDistrict.html(txtDistrict);
                $tdBlockDistrict.removeClass('text-center').addClass('text-right');
            }
            
            if (idxCollSales !== -1) {
                const $tdBlockSales = $tr.find(`td:eq(${idxCollSales})`);
                let txtSales = $tdBlockSales.html();
                txtSales = txtSales.replace(/nbsp/g, " ");
                let ed = txtSales.split(' ');
                ed = ed.pop();
                
                // txtSales = txtSales.replace(/около/g, "~");
                // txtSales = txtSales.replace(/более/g, ">");
                // txtSales = txtSales.replace(/менее/g, "<");
                $tdBlockSales.html(`${(unit['sales'] * 1).toLocaleString('ru')} ${ed}`);
            }
            
            
            const $tdBlock = $tr.find(`td:eq(${idxCollQl})`);
            
            let eqQuality = floor2(unit['equipment_quality']);
            let empQuality = floor2(unit['employee_level']);
            $tdBlock.html(`
            <div class="clearfix" style="min-width: 140px;">
                <div class="text-muted pull-left">оборуд.: </div>
                <div class="pull-right">${eqQuality} / ${unit['equipment_count']}</div>
            </div>
             <div class="clearfix">
                <div class="text-muted pull-left">рабы: </div>
                <div class="pull-right">${empQuality} / ${unit['employee_count']}</div>
            </div>

            `);
        });
    }
    
    
    const checkHashByService = window.location.href.match(/#by-service$/)
    console.log('checkHashByService', checkHashByService);
    
    function waitElementUpdate(el, callback) {
        new MutationObserver((mrs) => {
            mrs.forEach((mr) => {
                if (checkHashByService) {
                    if (mr.oldValue !== null && mr.attributeName === 'data-loaded') {
                        callback(mr.target);
                    }
                } else {
                    if (mr.oldValue !== null && (mr.oldValue.indexOf('updating') !== -1) && mr.attributeName === 'class') {
                        callback(mr.target);
                    }
                }
                
            });
            
        }).observe(el, {attributes: true, attributeOldValue: true});
    }
    
    function waitElementCreated(ilId, callback) {
        let time = 0;
        let timer = setInterval(function () {
            let el = document.getElementById(ilId);
            if (el) {
                clearInterval(timer);
                callback(el);
            }
            time += 200;
        }, 200);
    }
    
    
    // ------------------------------------------------------
    // следим за табличками на странице глобального репорта
    // ------------------------------------------------------
    const elByService = document.getElementById('by-service');
    if (elByService !== null) {
        waitElementUpdate(elByService, () => {
            waitElementCreated('service-units', (el) => {
                waitElementUpdate(el, (elTarget) => {
                    initProcessSalers($(elTarget));
                });
            });
        });
    }
    
    
    // ------------------------------------------------------
    // следим за табличкой на странице репорта у юнита
    // ------------------------------------------------------
    const elServiceUnits = document.getElementById('service-units');
    if (elServiceUnits !== null) {
        waitElementUpdate(elServiceUnits, (elTarget) => {
            initProcessSalers($(elTarget));
        });
    }
    
    // поиск таблицы на мобальном окне
    const elMarketingModal = document.getElementById('marketing2-modal');
    if (elMarketingModal !== null) {
        waitElementUpdate(elMarketingModal, () => {
            waitElementCreated('service-units', (el) => {
                waitElementUpdate(el, (elTarget) => {
                    initProcessSalers($(elTarget));
                });
            });
        });
    }
    
    
}

if (window.top === window) {
    let script = document.createElement("script");
    script.textContent = '(' + run.toString() + ')();';
    document.documentElement.appendChild(script);
}