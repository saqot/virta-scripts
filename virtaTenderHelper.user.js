// ==UserScript==
// @name VIRTA::Tender Helper
// @description Облегчение работы в тенедерах
// @description - Добавление названия корпы к логину юзера
// @namespace virtonomica
// @author SAQOT
// @version 1.1
// @include https://virtonomica.ru/vera/main/tender/*
// @include https://virtonomica.ru/vera/main/competitionlist/tender
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
        console.log(`\n %c VIRTA::TH / ${ver} %c ${text} \n\n`, 'color: #FFFFFF; background: #030307; padding:5px 0;', `color: #FFFFFF; background: ${bg}; padding:5px 0;`);
    }
    
    consoleEcho('Tender Helper');
    
    // ==================================================
    
    function getUserData(userID = null) {
        const userID_ = userID === null ? '' : `?id=${userID}`
        return new Promise((resolve) => {
            $.ajax({
                async      : true,
                type       : 'GET',
                url        : `https://virtonomica.ru/api/vera/main/user/info${userID_}`,
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
    
    // ==================================================
    // Добавление названия корпы к логину юзера
    // ==================================================
    if (window.location.href.match(/\/(\w+)\/main\/tender\/(\d+)/ui)) {
        function waitForTable(callback) {
            let time = 0;
            let poops = setInterval(function () {
                let els = document.getElementsByClassName('users-registred');
                if (els.length) {
                    clearInterval(poops);
                    callback(els[0]);
                }
                time += 100;
            }, 100);
        }
        
        
        async function runSetupData($el, curUserCorpId) {
            const login = $el.text();
            if (login === 'Профиль') {
                return;
            }
            
            const m = $el.attr('href').match(/\/(\w+)\/main\/user\/view\/(\d+)$/ui);
            
            const userID = m[2];
            if (!userID) {
                consoleEcho('userID не определен', true);
                return;
            }
            
            const user = await getUserData(userID);
            
            let corp = '';
            let textColor = 'text-muted';
            
            if (curUserCorpId) {
                if (user['corp'] !== null && user['corp']['id'] !== undefined) {
                    if (curUserCorpId === user['corp']['id']) {
                        textColor = 'text-success';
                        corp = `<span class="text-success">🗸</span></sup>`
                    } else {
                        textColor = 'text-danger';
                        corp = `<span class="text-danger">✘</span></sup>`
                    }
                }
            }
            
            
            $el.after(` <sup class="${textColor}"> [${user['company_name']}] ${corp}`)
        }
        
        async function initRun(row) {
            const curUser = await getUserData();
            const curUserCorpId = (curUser['corp'] !== undefined && curUser['corp']['id'] !== undefined) ? curUser['corp']['id'] : null;
            
            let $els = $(row).find("a[href*='/main/user/view/']")
            
            $els.each(function () {
                runSetupData($(this), curUserCorpId);
            });
        }
        
        waitForTable(initRun);
    }
    // ==================================================
    
    // ==================================================
    // Фильтрация списков тендеров
    // ==================================================
    if (window.location.href.match(/\/(\w+)\/main\/competitionlist\/tender/ui)) {
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
                        
                        const kvala = [];
                        Object.entries(data).forEach(([key, v]) => {
                            kvala.push({
                                'k': v['kind'],
                                'v': v['value'],
                            });
                        });
                        resolve(kvala);
                    },
                    error      : function (jqXHR, textStatus, error) {
                        consoleEcho(`FAIL (ajax) {textStatus=${textStatus} , error=${error}}`, true);
                    },
                });
            });
        }
        
        const $filtersTender = {};
        let $rowsTable = {};
        
        function onClickFilterTender(k) {
            if (k === 'clear') {
                $rowsTable.show();
            } else {
                $rowsTable.hide();
                
                $filtersTender[k]['trs'].show();
                $filtersTender[k]['trs'].parent().show();
            }
            
            $rowsTable.each(function () {
                const $tbody = $(this).parent();
                const $tr = $tbody.find('tr:visible');
                if (!$tr.length) {
                    $tbody.hide();
                    $tbody.prev().hide();
                } else {
                    $tbody.show();
                    $tbody.prev().show();
                }
            });
        }
        
        async function initPanel() {
            const user = await getUserData()
            const kvala = await getUserKvala(user['id']);
            $rowsTable = $('.table-responsive > table > tbody > tr[class]')
            
            const $filterRow = $('<div class="filters-tender"></div>')
            $('.tenders > .row').after($filterRow);
            
            kvala.forEach((kv, i) => {
                
                const cl = `qa-${kv.k}-med`;
                let $trs = $rowsTable.find(`.${cl}`);
                if (!$trs.length) {
                    delete kvala[i];
                    return;
                }
                
                
                // Object.assign($rowsTable, $trs);
                $filtersTender[kv.k] = {
                    'k'  : kv.k,
                    'v'  : kv.v,
                    'trs': $trs.parent().parent(),
                };
                
                const $filter = $(`<a href="" class="btn btn-sm">${$trs.length} <span class="ico ${cl}" ></span></a>`)
                
                $filterRow.append($filter);
                
                $filter.off('click').on('click', function (e) {
                    e.preventDefault();
                    onClickFilterTender(kv.k);
                });
                
            });
            
            const $filter = $(`<a href="" class="btn btn-sm">Сбросить <span class="ico" style="width: 1px;"></span></a>`)
            
            $filterRow.append($filter);
            
            $filter.off('click').on('click', function (e) {
                e.preventDefault();
                onClickFilterTender('clear');
            });
            
        }
        
        await initPanel();
        
        
        let sheet = document.createElement('style')
        sheet.innerHTML = `
        .filters-tender {
            padding: 5px 0px;
        }
        .filters-tender .btn {
            border: 1px solid #d7d6d6;
            padding: 0 0 0 3px;
            margin: 0 3px 0 0;
        }
        .filters-tender .btn .ico {
            width: 24px;
            height: 24px;
        }
        `;
        document.body.appendChild(sheet);
        
    }
    // ==================================================
    
}

if (window.top === window) {
    let script = document.createElement("script");
    script.textContent = '(' + run.toString() + ')();';
    document.documentElement.appendChild(script);
}