// ==UserScript==
// @name VIRTA::Unit Dop Operations
// @description Очистка кеша юнита + Удаление юнита + Завоз все ассортимента товара с указанного склада + Вывоз остатков с магазина на склад
// @namespace virtonomica
// @author SAQOT
// @version 2.5
// @include https://virtonomica.ru/vera/main/unit/view/*
// @run-at document-idle
// ==/UserScript==

/* global $, unsafeWindow, ajaxTools */

let run = async function () {
    let win = (typeof (unsafeWindow) != 'undefined' ? unsafeWindow : top.window);
    $ = win.$;
    
    // ==================================================
    let ver = '2.5';
    
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
    
    const userInfo = await getUserInfo();
    
    let cityId = null;
    
    async function getCityId() {
        if (cityId === null) {
            cityId = await getCityIdAjax()
        }
        return cityId;
    }
    
    // получить в запросе city_id
    function getCityIdAjax() {
        return new Promise((resolve) => {
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
                    resolve(res['city_id']);
                },
                error      : function (a, b, c) {
                    console.error(a, b, c);
                },
            });
        });
        
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
        $iconClearCache = $(`<li><a href="">Очистить кеш</a></li>`);
        $blockNew.append($iconClearCache);
        
        if (userInfo['company_id'] === '10090070') {
            $iconDelete = $(`<li><a href="" >Удалить юнит</a></li>`);
            $blockNew.append($iconDelete);
        }
        
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
    
    // проверка на точность соответсвия страницы
    const t2 = window.location.href.match(/\/(\w+)\/main\/unit\/view\/(\d+)\/supply/);
    if (t2) {
        function waitBlock(callback) {
            let time = 0;
            let timer = setInterval(function () {
                let el = document.getElementById('materials-main');
                if (el) {
                    if (el.hasAttribute("data-loaded")) {
                        clearInterval(timer);
                        callback($(el));
                    }
                }
                time += 100;
            }, 100);
        }
        
        // получить в запросе local_market_size (объем рынка)
        async function getMarketSize(productID) {
            cityId = await getCityId();
            return new Promise((resolve) => {
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
                        resolve(res['local_market_size']);
                    },
                    error      : function (a, b, c) {
                        console.error(a, b, c);
                    },
                });
            });
        }
        
        function getStores() {
            return new Promise((resolve) => {
                $.ajax({
                    async      : true,
                    type       : 'GET',
                    url        : `https://virtonomica.ru/api/vera/main/company/units?id=${userInfo['company_id']}&unit_type_id=2011&format=json&wrap=0`,
                    crossDomain: true,
                    xhrFields  : {
                        withCredentials: true,
                    },
                    global     : false,
                    dataType   : "json",
                    success    : function (res) {
                        resolve(res.data);
                    },
                    error      : function (jqXHR, textStatus, error) {
                        consoleEcho(`FAIL (ajax) {textStatus=${textStatus} , error=${error}}`, true);
                    },
                });
            });
        }
        
        function getTovarsUnit(storeId) {
            return new Promise((resolve) => {
                $.ajax({
                    async      : true,
                    type       : 'GET',
                    url        : `https://virtonomica.ru/api/vera/main/unit/storage/stocks?id=${storeId}`,
                    crossDomain: true,
                    xhrFields  : {
                        withCredentials: true,
                    },
                    global     : false,
                    dataType   : "json",
                    success    : function (res) {
                        resolve(Object.values(res));
                    },
                    error      : function (jqXHR, textStatus, error) {
                        consoleEcho(`FAIL (ajax) {textStatus=${textStatus} , error=${error}}`, true);
                    },
                });
            });
        }
        
        function getOffer(storeId, productId) {
            return new Promise((resolve) => {
                $.ajax({
                    async      : true,
                    type       : 'GET',
                    url        : `https://virtonomica.ru/api/vera/main/unit/supply/offers?id=${unitID}&product_id=${productId}&required=0&free_for_buy=0&supplier_type=self&format=json`,
                    crossDomain: true,
                    xhrFields  : {
                        withCredentials: true,
                    },
                    global     : false,
                    dataType   : "json",
                    success    : function (res) {
                        if (res.info.count) {
                            // фильтруем по ID выбранного склада
                            const r = Object.values(res.data).find(function (el) {
                                return el['unit_id'] === storeId;
                            });
                            if (r === undefined) {
                                resolve(null);
                            } else {
                                resolve(r);
                            }
                        } else {
                            resolve(null);
                        }
                    },
                    error      : function (jqXHR, textStatus, error) {
                        consoleEcho(`FAIL (ajax) {textStatus=${textStatus} , error=${error}}`, true);
                    },
                });
            });
        }
        
        function exportProductToStore(token, storeId, productId, qty) {
            return new Promise((resolve) => {
                $.ajax({
                    async      : true,
                    type       : 'POST',
                    url        : `https://virtonomica.ru/api/?action=unit/storage/delivery/set&app=virtonomica`,
                    crossDomain: true,
                    xhrFields  : {
                        withCredentials: true,
                    },
                    data       : {
                        id        : unitID,
                        token     : token,
                        unit_id   : storeId,
                        product_id: productId,
                        qty       : qty,
                        base_url  : '/api/',
                    },
                    global     : false,
                    dataType   : "json",
                    success    : function (res) {
                        resolve(res)
                    },
                    error      : function (jqXHR, textStatus, error) {
                        consoleEcho(`FAIL (ajax) {textStatus=${textStatus} , error=${error}}`, true);
                    },
                });
            });
        }
        
        function buyProductOffer(token, offerId, qty, isDuration) {
            return new Promise((resolve) => {
                $.ajax({
                    async      : true,
                    type       : 'POST',
                    url        : `https://virtonomica.ru/api/vera/main/unit/supply/set?app=adapter_vrt`,
                    crossDomain: true,
                    xhrFields  : {
                        withCredentials: true,
                    },
                    data       : {
                        id      : unitID,
                        token   : token,
                        offer_id: offerId,
                        qty     : qty,
                        duration: isDuration ? 1 : 0,
                    },
                    global     : false,
                    dataType   : "json",
                    success    : function (res) {
                        resolve(res)
                    },
                    error      : function (jqXHR, textStatus, error) {
                        consoleEcho(`FAIL (ajax) {textStatus=${textStatus} , error=${error}}`, true);
                    },
                });
            });
        }
        
        async function exportTovars($modal, storeId, $divBlock) {
            
            const $prBlock = $modal.find('.process-block');
            const $prSpin = $prBlock.find('.fa-spin');
            const $prInfo = $prBlock.find('.info');
            
            const $items = $divBlock.find(".tab-content div.active div.item");
            await $prBlock.show();
            await $prSpin.show();
            $prInfo.html('. . .');
            
            const token = await getToken();
            
            async function exportTovarsEnd(isClose, isModifed, msg) {
                await $prBlock.hide();
                await $prSpin.hide();
                $modal.find("button.btn-store-tablerow").attr('disabled', false);
                confirm(msg);
                if (isClose) {
                    $modal.modal("hide");
                }
                if (isModifed) {
                    await clearCache(unitID, token);
                    setTimeout(function () {
                        ajaxTools.reload('materials-main');
                    }, 100);
                    
                    setTimeout(function () {
                        waitBlock(initBuyTovars);
                    }, 200);
                    
                }
            }
            
            const tovars = await getTovarsUnit(storeId);
            
            const prodsAll = [];
            const prods = [];
            $items.each(function () {
                const $row = $(this);
                const prodId = $row.attr('data-material');
                let cnt = ($row.find('td:contains("Количество")').next().text());
                cnt = cnt.replace(/\s+/gi, '');
                cnt = parseInt(cnt, 10);
                
                if (cnt > 0) {
                    const res = tovars.filter(x => x['product_id'] === prodId).length;
                    if (res) {
                        prods.push({prodId: prodId, cnt: cnt});
                    }
                    prodsAll.push({prodId: prodId, cnt: cnt});
                }
            });
            
            if (!prods.length) {
                if (prodsAll.length) {
                    await exportTovarsEnd(false, false, 'Вывозить на этот склад нечего, стоит выбрать другой склад.');
                } else {
                    await exportTovarsEnd(false, false, 'Нет товаров, которые нужно вывезти.');
                }
                return;
            }
            
            
            let cntExprtAll = prods.length;
            let cntCur = 0;
            
            for (const r of prods) {
                cntCur++;
                $prInfo.html(`Вывозим ${cntCur} из ${cntExprtAll}`);
                
                await exportProductToStore(token, storeId, r.prodId, r.cnt)
                
                if (cntCur >= cntExprtAll) {
                    let msg = `Вывезли ${cntCur} из ${cntExprtAll} .`;
                    if (cntExprtAll < prodsAll.length) {
                        msg = `${msg} Но это не все, остались еще товары`;
                    }
                    await exportTovarsEnd(true, true, msg);
                }
            }
            
        }
        
        let isBuyReplaceItem = false;
        let isBuyDurationItem = false;
        let isBuyOneItem = true;
        let buyProcItem = 100;
        
        async function buyTovars($modal, storeId, tovarIds) {
            let buyProc = 0
            if (!isBuyOneItem && buyProcItem > 0) {
                buyProc = buyProcItem;
            }
            
            const $prBlock = $modal.find('.process-block');
            const $prSpin = $prBlock.find('.fa-spin');
            const $prInfo = $prBlock.find('.info');
            
            $([document.documentElement, document.body]).animate({
                scrollTop: $prBlock.offset().top
            }, 1000);
            
            $modal.find("button.btn-store-tablerow").attr('disabled', true);
            await $prBlock.show();
            await $prSpin.show();
            $prInfo.html('. . .');
            
            const token = await getToken();
            const tovars = await getTovarsUnit(storeId);
            const res = tovars.filter(x => tovarIds.includes(x['product_id']) && x.qty > 0);
            
            
            let cntAll = res.length;
            let cntCur = 0;
            
            
            async function buyTovarsEnd() {
                await $prBlock.hide();
                await $prSpin.hide();
                $modal.find("button.btn-store-tablerow").attr('disabled', false);
                
                confirm(`Закупка товаров (${cntCur}) закончена`);
                $modal.modal("hide");
                
                await clearCache(unitID, token);
                setTimeout(function () {
                    ajaxTools.reload('materials-main');
                }, 100);
                
                setTimeout(function () {
                    waitBlock(initBuyTovars);
                }, 200);
            }
            
            for (const r of res) {
                cntCur++;
                $prInfo.html(`Закупаем ${cntCur} из ${cntAll}`);
                const offer = await getOffer(storeId, r['product_id']);
                
                if (!offer) {
                    if (cntCur >= cntAll) {
                        await buyTovarsEnd();
                    }
                    continue;
                }
                
                if (!isBuyReplaceItem) {
                    if (offer['contract'] !== undefined) {
                        if (cntCur >= cntAll) {
                            await buyTovarsEnd();
                        }
                        continue;
                    }
                }
                
                let marketSize = 1;
                if (buyProc) {
                    marketSize = await getMarketSize(r['product_id']);
                    marketSize = ((marketSize * 1) * (buyProc / 100)).toFixed();
                    marketSize = marketSize < 1 ? 1 : marketSize;
                }
                
                await buyProductOffer(token, offer.id, marketSize, isBuyDurationItem)
                
                if (cntCur >= cntAll) {
                    await buyTovarsEnd();
                }
                
            }
        }
        
        async function showTable($div, $modal, $modalBody, type) {
            const tovarIds = [];
            const $iconsListing = $div.find(".icons_listing:visible input");
            $iconsListing.each(function () {
                tovarIds.push(this.value);
            });
            
            const stores = await getStores();
            $modalBody.html('');
            $modalBody
                .append($('<div class="table-responsive unit_list_table_mobile unit_list_table ">')
                    .append($('<table class="table table-compact"></table>')
                        .append($('<thead class=""></th><th>Страна/Город</th><th>Подразделение</th><th>Специализация</th><th></th></tr></thead><tbody></tbody>')
                        )
                    )
                )
            ;
            const $tbody = $modalBody.find('tbody')
            
            
            Object.entries(stores).forEach(([k, v]) => {
                const res = v['products']
                    .filter(x => tovarIds.includes(x.id))
                    .map(x => x.id);
                if (!res.length) {
                    return;
                }
                
                
                const $tdIco = $(`<td class="products text-middle vista-products"></td>`);
                Object.entries(v['products']).forEach(([kk, vv]) => {
                    const ico = `/pub/app/virtonomica/product/${vv['symbol']}.gif`;
                    $tdIco.append(`<i class="ico brand vista-ico-brand" style="background-image:url(${ico})" title="${vv.name}"></i>`);
                });
                
                let $btnExport = null;
                let $btnImport = null;
                
                switch (type) {
                    case "import":
                        $btnImport = $(`<button class="btn btn-xs btn-success btn-store-tablerow" data-storeId="${v.id}" ><i class="fa fa-truck fa-flip-horizontal"></i></button>`);
                        break;
                    case "export":
                        $btnExport = $(`<button class="btn btn-xs btn-warning btn-store-tablerow" data-storeId="${v.id}" ><i class="fa fa-truck"></i></button>`);
                        break;
                }
                
                $tbody.append($(`<tr data-id="${v.id}">`)
                    .append($(`<td class="text-middle geo_info" style="color: gray;"><i class="ico pull-left flag-${v['country_symbol']}-small" title="${v['country_name']}"></i><div class="cityPlusID">${v['country_name']} / ${v['city_name']}<br><span>${v.id}</span></div></td>`))
                    .append($(`<td class="unit_info"><a href="//virtonomica.ru/vera/main/unit/view/${v.id}">${v.name}</a><br/><span class="font-blue-oleo">${v.size} / ${v['square'] / 1000000} млн кв. м</span></td>`))
                    .append($tdIco)
                    .append($(`<td class="text-right text-middle trans-buttons"></td>`)
                        .append($btnExport)
                        .append($btnImport)
                    )
                );
                
                if ($btnImport) {
                    $btnImport.on('click', function (e) {
                        e.preventDefault();
                        buyTovars($modal, $(this).attr('data-storeId'), tovarIds)
                    });
                }
                
                if ($btnExport) {
                    $btnExport.on('click', function (e) {
                        e.preventDefault();
                        exportTovars($modal, $(this).attr('data-storeId'), $div)
                    });
                }
                
            });
            $modal.modal("show");
        }
        
        function initBuyTovars($div) {
            const $modal = $('' +
                '<div class="modal fade bs-modal-lg in" id="store-modal" role="dialog"><div class="modal-dialog modal-lg">' +
                '<div class="modal-content">' +
                '   <div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true"></button><h2 style="display: inline;">--</h2>' +
                '       <div class="col-sm-3 process-block" style="display: none">' +
                '           <div class="alert alert-info">' +
                '               <span class="fa fa-circle-o-notch fa-spin" style="display: none"></span> <span class="info">. . .</span>' +
                '           </div>' +
                '       </div>' +
                '    </div>' +
                '   <div class="modal-body">' +
                '   <div class="row buy-param">' +
                '       <div class="col-sm-5 ">' +
                '           <label class="mt-checkbox mt-checkbox-outline">Зказаз по одной единице товара' +
                '               <input value="1" class="chall one-item" name="one-item" type="checkbox"><span></span>' +
                '           </label>' +
                '           <label class="mt-checkbox mt-checkbox-outline">Обновить заказы при совпадении' +
                '               <input value="2" class="chall replace-item" name="replace-item" type="checkbox"><span></span>' +
                '           </label>' +
                '       </div>' +
                '       <div class="col-sm-4 "> Количество товара в % от объема рынка:' +
                '           <div class="edit_field edit_field_compact margin-5-top">' +
                `               <input type="text" name="proc-item" value="${buyProcItem}" class="form-control text-right virQuantMask proc-item" inputmode="numeric" style="text-align: right;">` +
                '           </div>' +
                '       </div>' +
                '       <div class="col-sm-3 ">' +
                '           <label class="mt-checkbox mt-checkbox-outline">Разовая закупка' +
                '               <input value="1" class="chall duration-item" name="duration-item" type="checkbox"><span></span>' +
                '           </label>' +
                '       </div>' +
                '   </div>' +
                '   <div class="table-body"></div>' +
                '   </div>' +
                '</div>' +
                '</div></div>')
            $('#materials-modal').after($modal);
            
            const $modalTitle = $modal.find('h2');
            const $modalBuyParam = $modal.find('.buy-param');
            const $modalBody = $modal.find('.table-body')
            const $select = $div.find("select[name=select_category]");
            $select.after($(`<div class="col-sm-12" style="padding-left: 0 !important;">
<fieldset class=\"margin-5-top\">
<legend>Дополнительно:</legend>
<button type="button"  class="btn-link btn-select-store-import" style="text-align: left;" data-bind="yes"><i class="fa fa-truck fa-flip-horizontal margin-5-right"></i>Заказ группы товаров со своего склада</button>
<button type="button"  class="btn-link btn-selectt-store-export" style="text-align: left;" data-bind="yes"><i class="fa fa-truck margin-5-right"></i>Вывоз всех товаров на склад</button>
</fieldset>
</div>`));
            
            const $checkboxOneItem = $modal.find('.one-item');
            const $inputProcItem = $modal.find('.proc-item');
            const $checkboxReplaceItem = $modal.find('.replace-item');
            const $checkboxDurationItem = $modal.find('.duration-item');
            
            $checkboxOneItem.attr('checked', isBuyOneItem);
            $inputProcItem.attr('disabled', isBuyOneItem);
            $checkboxReplaceItem.attr('checked', isBuyReplaceItem);
            $checkboxDurationItem.attr('checked', isBuyDurationItem);
            
            const $btnSelectStoreImport = $div.find("button.btn-select-store-import");
            const $btnSelectStoreExport = $div.find("button.btn-selectt-store-export");
            
            $btnSelectStoreImport.on('click', function (e) {
                e.preventDefault();
                $modalTitle.html('Выбор склада для заполнения товаром в текущий магазин');
                $modalBuyParam.show();
                showTable($div, $modal, $modalBody, 'import');
            });
            
            $btnSelectStoreExport.on('click', function (e) {
                e.preventDefault();
                $modalBuyParam.hide();
                $modalTitle.html('Вывоз ВСЕЙ продукции на склад');
                showTable($div, $modal, $modalBody, 'export');
            });
            
            
            $checkboxOneItem.on('change', function (e) {
                e.preventDefault();
                $inputProcItem.attr('disabled', this.checked);
                isBuyOneItem = this.checked;
            });
            
            $checkboxReplaceItem.on('change', function (e) {
                e.preventDefault();
                isBuyReplaceItem = this.checked;
            });
            
            $checkboxDurationItem.on('change', function (e) {
                e.preventDefault();
                isBuyDurationItem = this.checked;
            });
            
            $inputProcItem.on('change paste keyup', function () {
                let v = parseInt(this.value, 10);
                v = v < v * -1 ? 0 : v;
                v = v > 100 ? 100 : v;
                v = isNaN(v) ? 0 : v;
                
                buyProcItem = v;
                $(this).val(v);
            });
            
        }
        
        waitBlock(initBuyTovars);
        
    }
    
    let sheet = document.createElement('style')
    sheet.innerHTML = `
        .vista-products {
            width: 50% !important;
            max-width: 50% !important;
        }
        .vista-ico-brand {
            border: 1px solid #eee;
            margin: 1px;
            width: 20px !important;
            height: 20px !important;
        }
        .process-block {
            float: right;
        }
        .process-block > .alert {
            margin: 0 !important;
            padding: 0px 5px !important;
        }
        .process-block > .alert {
            margin: 0 !important;
            padding: 0px 5px !important;
        }
        `;
    document.body.appendChild(sheet);
    
}

if (window.top === window) {
    let script = document.createElement("script");
    script.textContent = '(' + run.toString() + ')();';
    document.documentElement.appendChild(script);
}