// ==UserScript==
// @name VIRTA::Unit Page More Info
// @description Дополнительные данные на странице юнита
// @namespace virtonomica
// @author SAQOT
// @version 1.5
// @include https://virtonomica.ru/vera/main/unit/view/*
// @run-at document-idle
// ==/UserScript==

/* global $, unsafeWindow */

let run = async function () {
    let win = (typeof (unsafeWindow) != 'undefined' ? unsafeWindow : top.window);
    $ = win.$;
    
    // проверка на точность соответсвия страницы
    const t = window.location.href.match(/\/(\w+)\/main\/unit\/view\/(\d+)($|\/$|\?)/)
    if (!t) {
        return;
    }
    
    // ==================================================
    let ver = '1.5';
    
    function consoleEcho(text, isRrror = false) {
        const bg = isRrror === true ? '#af1a00' : '#3897c7'
        console.log(`\n %c VIRTA::UPMI / ${ver} %c ${text} \n\n`, 'color: #FFFFFF; background: #030307; padding:5px 0;', `color: #FFFFFF; background: ${bg}; padding:5px 0;`);
    }
    
    consoleEcho('Дополнительные данные на странице юнита NEW');
    // ==================================================
    
    
    const m = window.location.href.match(/\/(\w+)\/main\/unit\/view\/(\d+)/);
    const unitID = m[2];
    if (!unitID) {
        consoleEcho('unitID не определен', true);
        return;
    }
    
    function procVal(num, val) {
        return Math.round(val / (num / 100) * 100) / 100;
    }
    
    // возвращает аргумент округлённым до 2-го знака
    function floor2(val) {
        return (Math.floor(100 * val) / 100).toFixed(2);
    }
    
    // вычисляет максимальное качество оборудования/животных для заданной квалификации персонала
    function calcEqQualMax(laborLevel) {
        return Math.floor(100 * Math.pow(laborLevel, 1.5)) / 100;
    }
    
    function getUnitForecast(unitID) {
        return new Promise((resolve) => {
            $.ajax({
                async      : true,
                type       : 'GET',
                url        : `https://virtonomica.ru/api/vera/main/unit/forecast?id=${unitID}&app=adapter_vrt&format=json`,
                crossDomain: true,
                xhrFields  : {
                    withCredentials: true,
                },
                global     : false,
                dataType   : "json",
                success    : function (res) {
                    //console.log('forecast', res);
                    resolve(res);
                },
                error      : function (jqXHR, textStatus, error) {
                    consoleEcho(`FAIL (ajax) {textStatus=${textStatus} , error=${error}}`, true);
                },
            });
        });
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
                    //console.log('unit', res);
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
                    //console.log('competences', data);
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
    
    function getKoffTop1(unitType) {
        const coff = {
            'shop'         : 5,
            'restaurant'   : 5,
            'lab'          : 5,
            'workshop'     : 50,
            'mill'         : 5,
            'sawmill'      : 12.5,
            'animalfarm'   : 7.5,
            'medicine'     : 12.5,
            'fishingbase'  : 12.5,
            'farm'         : 20,
            'orchard'      : 15,
            'mine'         : 100,
            'office'       : 1,
            'service_light': 1.5,
            'power'        : 75.0,
            'repair'       : 2.5,
            'fuel'         : 2.5,
            'educational'  : 1.5,
            'it'           : 1,
            'villa'        : 0,
            'warehouse'    : 0,
            'unknown'      : 0,
        };
        
        return coff[unitType];
    }
    
    //---------------------------------------------------------
    // q - квалификация игрока
    // qp -  квалификация персонала
    // вычисляет максимальное кол-во работающих с заданной квалификацией на предприятии для заданной квалификации игрока (топ-1)
    //---------------------------------------------------------
    function calcPersonalTop1(q, qp, unitType) {
        if ((unitType === 'office')) {
            return Math.floor(14 * q * q / Math.pow(1.4, qp) / 4.15);
        }
        return Math.floor(0.2 * getKoffTop1(unitType) * 14 * q * q / Math.pow(1.4, qp));
    }
    
    //---------------------------------------------------------
    // q - квалификация игрока
    // p -  численность персонала
    // вычисляет максимальное квалификацию работающих при заданных их численности и квалификации игрока (обратна calcPersonalTop1())
    //---------------------------------------------------------
    function calcQualTop1(q, p, type) {
        if (p === 0) {
            return 0.00;
        }
        if (type === 'office') {
            return Math.log(14 / 4.15 * q * q / p) / Math.log(1.4);
        }
        return Math.log(0.2 * 14 * getKoffTop1(type) * q * q / p) / Math.log(1.4);
    }
    
    
    async function initProcess() {
        
        
        const unit = await getUnitData(unitID);
        const unitType = unit['unit_class_kind'];
        const forecast = await getUnitForecast(unitID);
        
        //---------------------------------------------------------
        // проставляем признак изменения квалы в блоке ТОП МЕНЕДЖЕР
        //---------------------------------------------------------
        let $elKvala = $('li:contains("Квалификация игрока")')
        if ($elKvala.length) {
            $elKvala = $elKvala.find('span.mono');
            const kvala = await getUserKvala(unit['user_id']);
            const v = $elKvala.text().trim();
            
            const kvalaUnit = kvala[unit['knowledge_area_kind']];
            if (kvalaUnit['step']) {
                $elKvala.html(`${v} <sup class="text-success">+1 (${kvalaUnit['progress']}%)</sup>`);
            } else {
                $elKvala.html(`${v} <sup class="text-muted">+0 (${kvalaUnit['progress']}%)</sup>`);
            }
        }
        
        //---------------------------------------------------------
        // проставляем занчение нагрузки ТОП3 рабов в блоке ТОП МЕНЕДЖЕР
        //---------------------------------------------------------
        let $elLaborSummary = $('li:contains("Суммарное количество подчинённых")');
        if ($elLaborSummary.length) {
            $elLaborSummary = $($elLaborSummary[0]);
            
            const laborSummary = forecast['labor_summary'] * 1;
            const laborSummaryMax = forecast['labor_summary_max'] * 1;
            const laborProc = procVal(laborSummaryMax, laborSummary);
            const badgeColor = laborProc > 100 ? 'badge-danger' : 'badge-success';
            
            let laborDop = '';
            if (laborProc > 100) {
                laborDop = (laborSummary - laborSummaryMax).toLocaleString('ru');
                laborDop = `<sup class="text-danger">Лишних рабов ${laborDop}</sup>`;
            } else if (laborProc < 100) {
                laborDop = (laborSummaryMax - laborSummary).toLocaleString('ru');
                laborDop = `<sup class="">Свободно рабов ${laborDop}</sup>`;
            }
            
            $elLaborSummary.after(`<li class="list-group-item">Эффективность, ТОП-3<br>
        <span class="text-muted small">(Предельное значение: ${(laborSummaryMax).toLocaleString('ru')}) ${laborDop}</span>
        <span class="badge ${badgeColor} badge-roundless pull-right mono">${laborProc}%</span>
        </li>`);
        }
        
        //---------------------------------------------------------
        // Квалификация персонала
        //---------------------------------------------------------
        let $elEmployee = $('li:contains("Квалификация сотр")');
        if ($elEmployee.length) {
            const kv = forecast['competence_value'] * 1;    // квалификация игрока
            const kvp = floor2(forecast['labor_level']);    // квалификация персонала
            
            const empCntMax = calcPersonalTop1(kv, kvp, unitType);
            const empCntCur = unit['employee_count'] * 1;
            let weightProc = procVal(empCntMax, empCntCur);
            const kvalaMax = floor2(calcQualTop1(kv, empCntCur, unitType));
            
            
            let nameEmp = 'рабов';
            let maxEmp = `<div class="text-muted small clearfix">
                <span >Максимальное количество рабов (при квале ${kvp}):</span>
                <span class="pull-right ">${(empCntMax).toLocaleString('ru')}</span>
            </div>`;
            
            if (['workshop', 'mill', 'mine', 'fishingbase', 'sawmill', 'animalfarm', 'orchard', 'farm', 'power'].includes(unitType)) {
                const load = procVal(forecast['max_tech'], forecast['tech']);
                weightProc = floor2(Math.pow(load / 100, 3) * 100);
                maxEmp = '';
                nameEmp = 'ед.';
            }
            
            const textColorProc = weightProc > 100 ? 'text-danger' : '';
            
            $elEmployee.hide();
            
            $elEmployee.after(`<li class="list-group-item">
            <div class="clearfix">
                <div class="pull-left">Эффективность, ТОП-1</div>
            </div>
            ${maxEmp}
            <div class="text-muted small">
                <span >Нагрузка для ${(empCntCur).toLocaleString('ru')} ${nameEmp} (при квале ${kvp}):</span>
                <span class="pull-right ${textColorProc}">${weightProc}%</span>
            </div>
            </li>`);
            
            $elEmployee.after(`<li class="list-group-item">
                <div class="clearfix">
                    <div class="pull-left">Квалификация сотр. <span class="text-muted">(требуется ${unit['employee_level_required']})</span></div>
                    <div class="pull-right mono">${kvp}</div>
                </div>
                <div class="text-muted small clearfix">
                    <span >Максимальная квала:</span>
                    <span class="pull-right ">${kvalaMax}</span>
                </div>
            </li>`);
            
            
        }
        
        //---------------------------------------------------------
        // Макс. качество по персоналу
        //---------------------------------------------------------
        let $elQuality = $('li:contains("Качество")');
        if ($elQuality.length) {
            const maxQty = calcEqQualMax(forecast['labor_level'] * 1);
            const curQty = floor2(unit['equipment_quality']);
            // const curQtyReq = floor2(unit['equipment_quality_required']);
            
            const textColorQty = curQty > maxQty ? 'text-danger' : '';
            
            $elQuality.append(`<div class="text-muted small">
                <span >Макс. качество по персоналу:</span>
                <span class="pull-right ${textColorQty}">${maxQty}</span>
            </div>`);
            
        }
        
        //---------------------------------------------------------
        // Макс. количество поситетилей по персоналу
        //---------------------------------------------------------
        let $elCntPos = $('li:contains("Количество посетителей")');
        if ($elCntPos.length) {
            if (['restaurant', 'service_light', 'mine', 'medicine', 'repair', 'educational'].includes(unitType)) {
                const spec = {
                    '348214': 5,    // Фитнес
                    '348215': 5,    // Йога
                    '348216': 5,    // Бодибилдинг
                    '348217': 5,    // Группы здоровья
                    '348218': 5,    // Профессиональный спорт
                    '348220': 5,    // Скалолазание
                    '348219': 5,    // Танцы
                    '373262': 10,   // Прачечная
                    '373263': 10,   // Химчистка
                    '373264': 10,   // Прачечная самообслуживания
                };
                let koff = spec[unit['unit_type_produce_id']];
                koff = koff === undefined ? 1 : koff
                const perMax = unit['equipment_max'] / koff;
                
                const persKol = unit['employee_count'];
                const maxPer = persKol * (unit['sales_max'] / perMax);
                const posProc = procVal(maxPer, unit['sales']);
                
                $elCntPos.append(`
                    <div class="text-muted small">
                        <span>Макс. по персоналу:</span><span class="pull-right">${(maxPer).toLocaleString('ru')}</span>
                    </div>
                    <div class="text-muted small">
                        <span>Посещаемость:</span><span class="pull-right">${posProc}%</span>
                    </div>
                `);
            }
        }
        
    }
    
    let isClassUpdating = true;
    let el = document.getElementById('unit-info');
    
    function waitBlock(callback) {
        let time = 0;
        setInterval(function () {
            if (el) {
                let check = $(el).hasClass("updating")
                
                if (!check && isClassUpdating) {
                    callback();
                }
                isClassUpdating = check;
                
            }
            time += 200;
        }, 200);
    }
    
    waitBlock(initProcess);
    
    
    let sheet = document.createElement('style')
    sheet.innerHTML = `
        .clearfix::after {
            display: block;
            clear: both;
            content: "";
        }
        input.form-mini {
            text-align: right;
            height: 20px;
            width: 80px !important;
            padding: 0 4px;
            margin: 0 10px;
        }
        `;
    document.body.appendChild(sheet);
    
}

if (window.top === window) {
    let script = document.createElement("script");
    script.textContent = '(' + run.toString() + ')();';
    document.documentElement.appendChild(script);
}