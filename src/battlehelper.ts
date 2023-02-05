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
// @version      1.2.0
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  let currentClickedBattleOptions: HTMLElement;

  function triggerBattleHelp() {
    console.log('BattleHelper triggered');

    $("[name='close']").trigger('click');
    $(currentClickedBattleOptions)
      .closest('.battle-log')
      .children('.inner.message-log')
      .append(
        $(
          '<div class="chat battleHelperScouter" style="white-space: pre-line">Loading ReplayScouter ...</div>'
        )
      );
    $(currentClickedBattleOptions)
      .closest('.battle-log')
      .children('.inner.message-log')
      .append(
        $(
          '<div class="chat battleHelperDump" style="white-space: pre-line">Loading SmogonDump ...</div>'
        )
      );

    const psRoom = $(currentClickedBattleOptions).closest('.ps-room');

    const id = psRoom.attr('id') as string;

    const oppName = $(psRoom.find('.battle div > div.rightbar > div > strong')[0]).html();

    let tier = id.substring(0, id.lastIndexOf('-'));
    tier = tier.substring(tier.lastIndexOf('-') + 1);

    const teamIcons = $(psRoom.find('.battle > div > div.rightbar > div > .teamicons'));
    let teamPokemon = [] as string[];
    teamIcons.each(function () {
      $(this)
        .find('span')
        .each(function () {
          let label = $(this).attr('aria-label');
          if (label !== undefined) {
            label = label.replace('(active)', '');
            label = label.replace('(fainted)', '');

            if (label.indexOf('(') !== -1) {
              let tempLabel = label.substring(label.lastIndexOf('(') + 1);
              tempLabel = tempLabel.substring(0, tempLabel.indexOf(')'));

              if (isNaN(parseInt(tempLabel, 10))) {
                label = tempLabel;
              } else {
                label = label.substring(0, label.indexOf('('));
              }
            }

            teamPokemon.push(label.trim());
          }
        });
    });

    teamPokemon = teamPokemon.filter((entry) => entry !== 'Not revealed');
    const team = teamPokemon.join(';');

    $.ajax({
      url: 'https://fulllifegames.com/Tools/ReplayScouterApi/',
      data: {
        name: oppName,
        tier: tier,
        mode: 'showdown',
        team: team,
      },
    }).done(function (data) {
      $('.battleHelperScouter').html(data);
    });

    $.ajax({
      url: 'https://fulllifegames.com/Tools/SmogonDumpApi/',
      data: {
        list: tier + '.txt',
        team: team,
      },
    }).done(function (data) {
      $('.battleHelperDump').html(data);
    });
  }

  function addOption() {
    const battleHelperButton = $('<button/>', {
      text: 'Battle Helper',
      click: triggerBattleHelp,
      style: 'margin-left: 5px;',
    });
    $('.ps-popup p:last-child').append(battleHelperButton);
  }

  function triggerOptionAddition(this: HTMLElement) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    currentClickedBattleOptions = this;
    setTimeout(addOption, 1);
  }

  function bootstrap() {
    $("[name='openBattleOptions']").off('click').on('click', triggerOptionAddition);
    setTimeout(bootstrap, 100);
  }

  bootstrap();
})();
