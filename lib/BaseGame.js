/*global Detector, THREE, Class, Stats, Input, Twist */
var BaseGame = Class(function(update, render) {

    Twist(this, update, render);

    // Public
    this.width = 0;
    this.height = 0;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.input = new Input();

}, Twist, {

    init: function(element, width, height, settings) {

        this.width = width;
        this.height = height;
        this.input.bind(element);

        this._element = element;
        this.initRender(settings);

    },

    initRender: function(settings) {

        // Rendering
        if (Detector.webgl) {
            this.renderer = new THREE.WebGLRenderer(settings || {
                antialias: true,
                clearColor: 0x0000ff,
                clearAlpha: true
            });

        } else {
            Detector.addGetWebGLMessage();
            return true;
        }

        this.renderer.setSize(this.width, this.height);

        this.renderer.domElement.style.width = this.width + 'px';
        this.renderer.domElement.style.height = this.height + 'px';
        this._element.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, 1, 1000);

        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.bottom	= '0px';
        this._element.appendChild(this.stats.domElement);

    },

    update: function(t) {

    },

    render: function(t, dt, u) {
        this.renderer.render(this.scene, this.camera);
        this.stats.update();
    }

});

