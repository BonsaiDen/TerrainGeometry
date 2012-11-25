/*global Game */
window.onload = function() {

    // Setup basic game
    var game = new Game(30, 30);
    game.init(window.document.body, 640, 480);
    game.start();

    window.game = game;

    // Setup controls
    var pauseButton = document.getElementById('pauseButton'),
        stepButton = document.getElementById('stepButton'),
        stepButtonFive = document.getElementById('stepButtonFive');

    stepButton.onclick = function() {
        game.step();
    };

    stepButtonFive.onclick = function() {
        game.step(5);
    };

    pauseButton.onclick = function() {

        if (game.isPaused()) {
            pauseButton.value = 'Pause';
            game.resume();

        } else {
            pauseButton.value = 'Resume';
            game.pause();
        }

    };

};

