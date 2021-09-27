// ==UserScript==
// @name VIRTA::Extending innovation in villas
// @description Продление(пересоздание) инновации на виллах
// @namespace virtonomica
// @author SAQOT
// @version 1.1
// @include https://virtonomica.ru/vera/main/management_action/*/artefact/list
// @include https://virtonomica.ru/vera/main/management_action/*/artefact/list#
// @run-at document-idle
// ==/UserScript==

/* global $, unsafeWindow, arts */

let run = async function () {
    let win = (typeof (unsafeWindow) != 'undefined' ? unsafeWindow : top.window);
    $ = win.$;
    
    function consoleEcho(text, isRrror = false) {
        const bg = isRrror === true ? '#ee2805' : '#3897c7'
        console.log(`\n %c VIRTA::EIV %c ${text} \n\n`, 'color: #FFFFFF; background: #030307; padding:5px 0;', `color: #FFFFFF; background: ${bg}; padding:5px 0;`);
    }
    
    consoleEcho('Продление(пересоздание) инновации на виллах');
    
    const m = window.location.href.match(/\/(\w+)\/main\/management_action\/(\d+)\/artefact/);
    const userID = m[2];
    if (!userID) {
        consoleEcho('userID не определен', true);
        return;
    }
    
    const $td = $('table.unit-top td').first();
    if ($td.find('.i-villa').length < 1) {
        consoleEcho('Вилл нет, останавливаемся');
        return;
    }
    
    $td.append('' +
        '<a class="u-t u-s upd-vills" href="" style="width: 140px; float: right;padding: 2px 5px !important;height: 30px !important;">Обновить виллы</a>' +
        '');
    const $btnUpdate = $td.find('.upd-vills');
    
    $btnUpdate.on('click', function (e) {
        e.preventDefault();
        if ($btnUpdate.hasClass('disabled')) {
            return;
        }
        
        runUpdateVillls();
        
    });
    
    
    function deleteArt(unitID, artID) {
        return new Promise((resolve) => {
            $.ajax({
                async      : true,
                type       : 'GET',
                url        : `https://virtonomica.ru/api/vera/main/unit/artefact/remove?id=${unitID}&artefact_id=${artID}`,
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
    
    function attachArt(unitID, slotId, artID) {
        return new Promise((resolve) => {
            $.ajax({
                async      : true,
                type       : 'GET',
                url        : `https://virtonomica.ru/vera/ajax/unit/artefact/attach/`,
                crossDomain: true,
                data       : `unit_id=${unitID}&artefact_id=${artID}&slot_id=${slotId}`,
                cache      : false,
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
    
    function getListVills(userID) {
        return new Promise((resolve) => {
            $.ajax({
                async      : true,
                type       : 'GET',
                url        : `https://virtonomica.ru/api/vera/main/company/units?id=${userID}&unit_class_id=100&pagesize=2000`,
                crossDomain: true,
                xhrFields  : {
                    withCredentials: true,
                },
                global     : false,
                dataType   : "json",
                success    : function (res) {
                    const data = Object.keys(res['data']).map(function (k) {
                        return res['data'][k];
                    });
                    
                    resolve(data);
                },
                error      : function (a, b, c) {
                    console.error(a, b, c);
                },
            });
        });
    }
    
    function getListSlots(unitID) {
        return new Promise((resolve) => {
            $.ajax({
                async      : true,
                type       : 'GET',
                url        : `https://virtonomica.ru/api/vera/main/unit/artefact/slots?id=${unitID}`,
                crossDomain: true,
                xhrFields  : {
                    withCredentials: true,
                },
                global     : false,
                dataType   : "json",
                success    : function (res) {
                    const data = Object.keys(res).map(function (k) {
                        return res[k];
                    });
                    
                    resolve(data);
                },
                error      : function (a, b, c) {
                    console.error(a, b, c);
                },
            });
        });
    }
    
    function getListArtefacts(unitID, slotId) {
        return new Promise((resolve) => {
            $.ajax({
                async      : true,
                type       : 'GET',
                url        : `https://virtonomica.ru/api/vera/main/unit/artefact/browse?id=${unitID}&slot_id=${slotId}`,
                crossDomain: true,
                xhrFields  : {
                    withCredentials: true,
                },
                global     : false,
                dataType   : "json",
                success    : function (res) {
                    const data = Object.keys(res).map(function (k) {
                        return res[k];
                    });
                    resolve(data);
                },
                error      : function (a, b, c) {
                    console.error(a, b, c);
                },
            });
        });
    }
    
    function pareSlot(slot, unitID) {
        return new Promise(async (resolve) => {
            const slotId = slot.id;
            slot.art = {};
            
            let arts_ = await getListArtefacts(unitID, slotId);
            let arts = [];
            
            switch (slot.symbol) {
                case 'villa': // здесь выбираем или производство или лабы
                    arts = arts_.filter(function (el) {
                        const m = el.name.match(/.*Качество.*продукции.*/i);
                        return !!m;
                    });
                    break;
                case 'other':
                    // выбираем Региональный сервисный центр
                    arts = arts_.filter(function (el) {
                        const m = el.name.match(/.*сервисный центр.*/i);
                        return !!m;
                    });
                    break;
                case 'politics':
                    // выбираем Политическая агитация за фантики
                    arts = arts_.filter(function (el) {
                        const m = el.name.match(/.*Политическая агитация.*/i);
                        return !!m;
                    });
                    break;
                default:
                    console.error(`на нашли логику под ${slot.symbol}`);
            }
            
            if (arts.length === 0) {
                console.error(`НЕ смогли отфильтровать нужную инновацию для слота ${slot.name}`);
            }
            if (arts.length > 1) {
                console.error(`Инноваций получилось больше чем одна  для слота ${slot.name}`);
            }
            slot.art = arts[0];
            resolve(slot);
        });
    }
    
    function runUpdateVillls() {
        $btnUpdate.addClass('disabled');
        
        return new Promise(async (resolve) => {
            const vills = await getListVills(userID);
            
            let all = vills.length;
            let i = 0;
            
            $btnUpdate.html(`Обновляем вилл: ${all}`)
            
            vills.map(async function (vill) {
                const unitID = vill.id;
                let slots = await getListSlots(unitID);
                
                slots = await Promise.all(slots.map(async (slot) => {
                    return await pareSlot(slot, unitID);
                }));
                
                // провверяем арты на expired и удаляем просрочку для установки новых
                vill['arts'].map(async function (art, ax) {
                    if (art['ttl'] === '10') {
                        await deleteArt(art['unit_id'], art['id'])
                        delete (vill['arts'][ax]);
                    } else {
                        if (parseInt(art['expires']) <= 30) {
                            await deleteArt(unitID, art['id'])
                            delete (vill['arts'][ax]);
                        }
                    }
                });
                
                // назнаем инновации
                slots.map(async function (slot) {
                    const artefactId = slot['art']['id'];
                    
                    const art = vill['arts'].find(function (el) {
                        return el['id'] === artefactId;
                    });
                    
                    if (art === undefined) {
                        const res = await attachArt(unitID, slot['id'], slot['art']['id'])
                    }
                    
                });
                
                
                i++;
                $btnUpdate.html(`Обновляем ${i}/${all}`)
                
                if (i >= all) {
                    consoleEcho(`Обновили вилл: ${i}`);
                    
                    setTimeout(function () {
                        $btnUpdate.html(`Обновили вилл: ${i}`)
    
                        setTimeout(function () {
                            $btnUpdate.html(`Обновить виллы еще разок`)
                            $btnUpdate.removeClass('disabled');
        
                        }, 1000);
                        
                    }, 1000);
                    
                }
                
            });
            
            
            resolve(true);
        });
        
    }
    
}

if (window.top === window) {
    let script = document.createElement("script");
    script.textContent = '(' + run.toString() + ')();';
    document.documentElement.appendChild(script);
}