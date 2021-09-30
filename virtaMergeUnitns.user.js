// ==UserScript==
// @name VIRTA::Merge Unitns Help
// @description Помощь при объединении юнитов
// @namespace virtonomica
// @author SAQOT
// @version 1.1
// @include https://virtonomica.ru/vera/main/unit/view/*
// @run-at document-idle
// ==/UserScript==

/* global $, unsafeWindow, ajaxTools */


let run = function () {
    let win = (typeof (unsafeWindow) != 'undefined' ? unsafeWindow : top.window);
    $ = win.$;
    
    let ver = '1.1';
    
    function consoleEcho(text, isRrror = false) {
        const bg = isRrror === true ? '#af1a00' : '#3897c7'
        console.log(`\n %c VIRTA::MU / ${ver} %c ${text} \n\n`, 'color: #FFFFFF; background: #030307; padding:5px 0;', `color: #FFFFFF; background: ${bg}; padding:5px 0;`);
    }
    
    consoleEcho('Помощь при объединении юнитов');
    
    let $btns = $('button[data-target="tools-modal"]');
    
    $btns.on('click', function () {
        waitUnitMergeTab(initMergeUnitns);
    });
    
    function waitUnitMergeTab(callback) {
        let time = 0;
        let timer = setInterval(function () {
            let el = document.getElementById('unit-merge-tab');
            if (el) {
                if ($(el).is(':visible') === true) {
                    let els = document.getElementsByName('unit-merge');
                    if (els.length) {
                        clearInterval(timer);
                        callback(els[0]);
                    }
                }
            }
            time += 100;
        }, 100);
    }
    
    
    function initMergeUnitns(form) {
        const $body = $(form).find('.modal-body');
        const $footer = $(form).find('.modal-footer');
        
        // заменяем стандартную кнопку
        let $btnCur = $footer.find('button[type="submit"]');
        if ($btnCur.length) {
            $btnCur.hide();
        }
        
        let $btnSubmit = $footer.find('.btn-merge');
        if (!$btnSubmit.length) {
            $footer.prepend('<button type="button" class="btn btn-circle2 btn-success btn-merge">Слияние предприятий</button>');
            $btnSubmit = $footer.find('.btn-merge');
        }
        
        let $btnSelect = $footer.find('.btn-select-all');
        if (!$btnSelect.length) {
            $footer.prepend('<button type="button" class="btn btn-circle2 btn-success btn-select-all">Выделить все</button>');
            $btnSelect = $footer.find('.btn-select-all');
        }
        
        $btnSelect.on('click', function (e) {
            e.preventDefault();
            const $trs = $body.find('table tbody tr');
            $trs.trigger("click");
        });
        
        
        $btnSubmit.on('click', function (e) {
            e.preventDefault();
            $('form[name=unit-merge]').submit();
            
        });
        
        ajaxTools.ajaxForm('form[name=unit-merge]',
            function () {
                return true;
            },
            function () {
                $('#unit-info').removeAttr('data-loaded');
                ajaxTools.loadContentStart("//virtonomica.ru/api/vera/main/unit/view?id=10185890&format=html&app=adapter_vrt", 'unit-info', 0, false);
                
                setTimeout(function () {
                    $('.modal-backdrop').remove();
                    waitUnitMergeTab(initMergeUnitns);
                }, 3000);
            }, true);
    }
    
}

if (window.top === window) {
    let script = document.createElement("script");
    script.textContent = '(' + run.toString() + ')();';
    document.documentElement.appendChild(script);
}