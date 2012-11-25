var Input = Class(function() {

    this.__state = [];
    this.__oldState = [];
    this.__downs = [];
    this.__ups = [];
    this.__hasFocus = false;

}, {

    /**
      *  Moves the current state to the old one.
      */
    update: function() {

        // Update internal key / button states
        var i, l;
        for(i = 0, l = this.__state.length; i < l; i++) {

            if (this.__state[i] !== undefined) {

                this.__oldState[i] = this.__state[i];

                if (this.__state[i] === 1) {
                    this.__state[i] = 2;
                }

            }

        }

        // We need to handle this via queues
        // otherwise random event order will screw everything up
        for(i = 0, l = this.__downs.length; i < l; i++) {
            this.__state[this.__downs[i]] = 1;
        }
        this.__downs.length = 0;

        for(i = 0, l = this.__ups.length; i < l; i++) {
            this.__state[this.__ups[i]] = 0;
        }
        this.__ups.length = 0;

    },

    /**
      *  Returns true in case the Input has user focus.
      *
      *  @returns {Boolean}
      */
    hasFocus: function() {
        return this.__hasFocus;
    },

    /**
      *  Bind the Input to the given element
      */
    bind: function(element) {

        if (this.__element) {
            return false;
        }

        var that = this;
        element.addEventListener('keydown', function(e) {

            // Drop key repeats!
            if (!that.__state[e.keyCode]) {
                that.__downs.push(e.keyCode);
            }

        }, false);

        element.addEventListener('keyup', function(e) {

            if (that.__state[e.keyCode]) {
                that.__ups.push(e.keyCode);
            }

        }, false);

        element.addEventListener('focus', function(e) {
            that.__hasFocus = true;
            that.__reset();

        }, false);

        element.addEventListener('blur', function(e) {
            that.__hasFocus = false;
            that.__reset();

        }, false);

        element.tabIndex = 1;
        element.focus();
        this.__element = element;

        return true;

    },

    unbind: function() {

        if (this.__element) {
            this.__element.blur();
            this.__element = null;
            return true;

        } else {
            return false;
        }

    },

    /**
      *  Return true in case the given key or mouse button is currently pressed
      *
      *  @param {Number} Key or mouse button ID.
      *
      *  @returns {Boolean}
      */
    isDown: function(id) {
        return this.__state[id] > 0;
    },

    /**
      *  Return true in case the given key / mouse button was not down and then hit / pressed
      *  This will be true once when the user initially holds down a key / button.
      *
      *  @param {Number} Key or mouse button ID.
      *
      *  @returns {Boolean}
      */
    wasPressed: function(id) {
        return this.__state[id] === 1;
    },

    /**
      *  Return true in case the given key / mouse button is currently hold.
      *
      *  @param {Number} Key or mouse button ID.
      *
      *  @returns {Boolean}
      */
    wasReleased: function(id) {
        return this.__state[id] === 0 && this.__oldState[id] > 0;
    },

    __reset: function() {

        this.__downs.length = 0;
        this.__ups.length = 0;

        for(var i = 0, l = this.__state.length; i < l; i++) {

            if (this.__state[i] !== undefined) {
                this.__ups.push(i);
            }

        }

    },

    $KEY: {

        CANCEL: 3,
        HELP: 6,
        BACK_SPACE: 8,
        TAB: 9,
        CLEAR: 12,
        RETURN: 13,
        ENTER: 14,
        SHIFT: 16,
        CONTROL: 17,
        ALT: 18,
        PAUSE: 19,
        CAPS_LOCK: 20,
        ESCAPE: 27,
        SPACE: 32,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        END: 35,
        HOME: 36,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        SELECT: 41,
        PRINT: 42,
        EXECUTE: 43,
        PRINTSCREEN: 44,
        INSERT: 45,
        DELETE: 46,
        N0: 48,
        N1: 49,
        N2: 50,
        N3: 51,
        N4: 52,
        N5: 53,
        N6: 54,
        N7: 55,
        N8: 56,
        N9: 57,
        SEMICOLON: 59,
        EQUALS: 61, // Windows: 107,
        A: 65,
        B: 66,
        C: 67,
        D: 68,
        E: 69,
        F: 70,
        G: 71,
        H: 72,
        I: 73,
        J: 74,
        K: 75,
        L: 76,
        M: 77,
        N: 78,
        O: 79,
        P: 80,
        Q: 81,
        R: 82,
        S: 83,
        T: 84,
        U: 85,
        V: 86,
        W: 87,
        X: 88,
        Y: 89,
        Z: 90,
        CONTEXT_MENU: 93,
        NUMPAD0: 96,
        NUMPAD1: 97,
        NUMPAD2: 98,
        NUMPAD3: 99,
        NUMPAD4: 100,
        NUMPAD5: 101,
        NUMPAD6: 102,
        NUMPAD7: 103,
        NUMPAD8: 104,
        NUMPAD9: 105,
        MULTIPLY: 106,
        ADD: 107,
        SEPARATOR: 108,
        SUBTRACT: 109,
        DECIMAL: 110,
        DIVIDE: 111,
        F1: 112,
        F2: 113,
        F3: 114,
        F4: 115,
        F5: 116,
        F6: 117,
        F7: 118,
        F8: 119,
        F9: 120,
        F10: 121,
        F11: 122,
        F12: 123,
        F13: 124,
        F14: 125,
        F15: 126,
        F16: 127,
        F17: 128,
        F18: 129,
        F19: 130,
        F20: 131,
        F21: 132,
        F22: 133,
        F23: 134,
        F24: 135,
        NUM_LOCK: 144 ,
        SCROLL_LOCK: 145,
        COMMA: 188,
        PERIOD: 190,
        SLASH: 191,
        BACK_QUOTE: 192,
        OPEN_BRACKET: 219,
        BACK_SLASH: 220, // Windows: 222: Back slash ("\") key.
        CLOSE_BRACKET: 221,
        QUOTE: 222, // Windows: 192: Quote ('"') key.
        META: 224,
        KANA: 21,
        HANGUL: 21,
        JUNJA: 23,
        FINAL: 24,
        HANJA: 25,
        KANJI: 25,
        CONVERT: 28,
        NONCONVERT: 29,
        ACCEPT: 30,
        MODECHANGE: 31,
        SLEEP: 95,

        MOUSE_LEFT: 256,
        MOUSE_RIGHT: 257

    }

});

