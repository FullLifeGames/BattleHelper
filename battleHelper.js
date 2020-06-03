// ==UserScript==
// @name         BattleHelper
// @namespace    https://fulllifegames.com/Tools/BattleHelper
// @description  This script aims to ease battling on Pokemon Showdown.
// @author       FullLifeGames
// @include      http://play.pokemonshowdown.com/
// @include      https://play.pokemonshowdown.com/
// @include      http://play.pokemonshowdown.com/*
// @include      https://play.pokemonshowdown.com/*
// @include      http://*.psim.us/
// @include      https://*.psim.us/
// @include      http://*.psim.us/*
// @include      https://*.psim.us/*
// @version      0.0.4
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {

    var lastOwnPokemon = null;
    var lastOppPokemon = null;

    var running = false;

    var runningHandlerId = null;

    var currentId = null;
    var currentClickedBattleOptions = null;

    var currentGen = null;
    var currentTier = null;

    function currentIdExists() {
        return $('#' + currentId).length > 0;
    }

    function getActivePokemon(littleImages) {
        var activePokemon = null;
        littleImages.each(function(i) {
            var label = $(this).attr("aria-label");
            if (label.indexOf("(active)") !== -1) {
                activePokemon = label.replace(" (active)", "");
                if (activePokemon.indexOf("(") !== -1) {
                    activePokemon = activePokemon.substr(activePokemon.indexOf("(") + 1);
                    activePokemon = activePokemon.substr(0, activePokemon.indexOf(")"));
                }
            }
        });
        return activePokemon;
    }

    function handleDamageCalcs() {
        // Cycle stop conditions
        if (!running) {
            return;
        }

        if (runningHandlerId !== null && runningHandlerId !== currentId) {
            runningHandlerId = currentId;
            return;
        }
        if (!currentIdExists()) {
            return;
        }
        runningHandlerId = currentId;

        var psRoom = $(currentClickedBattleOptions).closest('.ps-room');

        var currentOwnPokemon = getActivePokemon($(psRoom.find(".leftbar .picon.has-tooltip")));
        if (currentOwnPokemon !== null) {
            var currentOppPokemon = getActivePokemon($(psRoom.find(".rightbar .picon.has-tooltip")));
            if (currentOppPokemon !== null) {
                if (currentOwnPokemon !== lastOwnPokemon || currentOppPokemon !== lastOppPokemon) {
                    lastOwnPokemon = currentOwnPokemon;
                    lastOppPokemon = currentOppPokemon;

                    var calcs = '<iframe class="calcIframe" style="width: 100%; height: 30em;" sandbox="allow-same-origin allow-scripts allow-forms" src="https://fulllifegames.com/Tools/CalcApi/?ownPokemon=' + currentOwnPokemon + '&oppPokemon=' + currentOppPokemon + '&tier=' + currentTier + '" />';
                    $(currentClickedBattleOptions).closest(".battle-log").children(".inner.message-log").append($('<div class="chat calc" style="white-space: pre-line">' + calcs + '</div>'));
                }
            }
        }
        // check if new damagecalcs are needed
        setTimeout(handleDamageCalcs, 100);
    }

    function triggerBattleHelp() {
        console.log("BattleHelper triggered");

        $("[name='close']").click();
        $(currentClickedBattleOptions).closest(".battle-log").children(".inner.message-log").append($('<div class="chat battleHelperScouter" style="white-space: pre-line">Loading ReplayScouter ...</div>'));
        $(currentClickedBattleOptions).closest(".battle-log").children(".inner.message-log").append($('<div class="chat battleHelperDump" style="white-space: pre-line">Loading SmogonDump ...</div>'));

        var psRoom = $(currentClickedBattleOptions).closest('.ps-room');

        var id = psRoom.attr("id");
        currentId = id;

        var oppName = $(psRoom.find(".battle div > div.rightbar > div > strong")[0]).html();

        var tier = id.substr(0, id.lastIndexOf("-"));
        tier = tier.substr(tier.lastIndexOf("-") + 1);

        currentGen = tier[3];
        currentTier = tier;

        var teamIcons = $(psRoom.find(".battle > div > div.rightbar > div > .teamicons"));
        var teamPokemon = [];
        teamIcons.each(function(i) {
            $(this).find("span").each(function(j) {
                var label = $(this).attr("aria-label");
                if (label !== undefined) {
                    label = label.replace('(active)', '');
                    label = label.replace('(fainted)', '');

                    if (label.indexOf('(') !== -1) {
                        let tempLabel = label.substr(label.lastIndexOf('(') + 1);
                        tempLabel = tempLabel.substr(0, tempLabel.indexOf(')'));

                        if (isNaN(parseInt(tempLabel))) {
                            label = tempLabel;
                        } else {
                            label = label.substr(0, label.indexOf('('));
                        }
                    }
                
                    teamPokemon.push(label.trim());
                }
            });
        });

        teamPokemon = teamPokemon.filter((entry) => entry !== "Not revealed")
        var team = teamPokemon.join(";");

        $.ajax({
            url: "https://fulllifegames.com/Tools/ReplayScouterApi/",
            data: {
                name: oppName,
                tier: tier,
                mode: "showdown",
                team: team
            }
        })
        .done(function( data ) {
            $('.battleHelperScouter').html(data);
        });

        $.ajax({
            url: "https://fulllifegames.com/Tools/SmogonDumpApi/",
            data: {
                list: tier + ".txt",
                team: team
            }
        })
        .done(function (data) {
            $('.battleHelperDump').html(data);
        });

        running = true;

        setTimeout(handleDamageCalcs, 100);
    }

    function triggerBattleHelpOff() {
        running = false;
    }

    function addOption() {
        var battleHelperButton = $('<button/>',
        {
            text: 'Battle Helper',
            click: triggerBattleHelp,
            style: 'margin-left: 5px;',
        });
        var battleHelperButtonOff = $('<button/>', {
            text: 'Battle Helper Off',
            click: triggerBattleHelpOff,
            style: 'margin-left: 5px;',
        });
        $('.ps-popup p:last-child').append(battleHelperButton);
        $('.ps-popup p:last-child').append(battleHelperButtonOff);
    }

    function triggerOptionAddition() {
        currentClickedBattleOptions = this;
        setTimeout(addOption, 1);
    }

    function bootstrap() {
        $("[name='openBattleOptions']")
            .unbind('click')
            .click(triggerOptionAddition);
        setTimeout(bootstrap, 100);
    }

    bootstrap();
})();
