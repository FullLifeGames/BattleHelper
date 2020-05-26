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
// @version      0.0.3
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {

    var lastOwnPokemon = null;
    var lastOppPokemon = null;

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

                    var calcs = '<iframe style="width: 100%; height: 30em;" sandbox="allow-same-origin allow-scripts allow-forms" src="https://fulllifegames.com/Tools/CalcApi/?ownPokemon=' + currentOwnPokemon + '&oppPokemon=' + currentOppPokemon + '&tier=' + currentTier + '" />';
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
                    teamPokemon.push(label.split(" ")[0]);
                }
            });
        });
        var team = teamPokemon.join(";");

        $.get( "https://fulllifegames.com/Tools/ReplayScouterApi/", { name: oppName, tier: tier, mode: "showdown", team: team } )
            .done(function( data ) {
                $('.battleHelperScouter').html(data);
            });

        $.get( "https://fulllifegames.com/Tools/SmogonDumpApi/", { list: tier + ".txt", team: team } )
            .done(function( data ) {
                $('.battleHelperDump').html(data);
            });

        setTimeout(handleDamageCalcs, 100);
    }

    function addOption() {
        var battleHelperButton = $('<button/>',
        {
            text: 'Battle Helper',
            click: triggerBattleHelp,
            style: 'margin-left: 5px;',
        });
        $('.ps-popup p:last-child').append(battleHelperButton);
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