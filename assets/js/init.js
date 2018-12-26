
L.Control.Attribution.prototype.options.position = "bottomleft";
var geoCoding = L.Control.geocoder({
    geocoder: L.Control.Geocoder.nominatim({
        serviceUrl: `/geocode`,
        suggest: true,
    }),
});
var setView = getViewbox()
if (setView) {
    DEFAULT_HOME = [setView.lat, setView.lon]
    DEFAULT_ZOOM = setView.z
}
/**
 * set geographical bounds visible: VietNam
 */
var bounds = new L.LatLngBounds(new L.LatLng(0, 85), new L.LatLng(30, 130));
var map = L.map('map', { zoomControl: false, attributionControl: true, maxBounds: bounds })
    .setView(DEFAULT_HOME, DEFAULT_ZOOM);
// end set bounds
map.on('click', clickMap);
map.on('contextmenu', (e) => {
    MOUSE_EVENT = e
});
map.on('move', moveMap);
map.on('load', moveMap);

// define map layers
var layers = {
    Streets: L.tileLayer(' https://map.itrithuc.vn/tiles/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://map.itrithuc.vn/">VNMap</a> - Bản đồ số Việt Nam',
        maxZoom: 20,
    }),
    //- Outdoors: L.mapbox.tileLayer('mapbox.outdoors'),
    //- Satellite: L.mapbox.tileLayer('mapbox.satellite')
};

layers.Streets.addTo(map);

geoCoding.addTo(map)

var materialOptions = {
    fab: true,
    miniFab: true,
    rippleEffect: true,
    toolTips: false,
    color: 'primary'
}
var routingControl = L.Routing.control({
    geocoder: L.Control.Geocoder.nominatim({
        serviceUrl: `/`,
    }),
    router: L.Routing.graphHopper(''),
    position: 'topleft',
    routeWhileDragging: false,
    language: 'vi'
}).addTo(map);

var LOGO = L.DomUtil.create('div', 'typo-styles__demo mdl-typography--display-2')

L.Control.zoomHome = L.Control.extend({
    options: {
        position: 'bottomright',
        zoomInText: '<i class="mdi mdi-plus zoom-font"></i>',
        zoomInTitle: '',
        zoomOutText: '<i class="mdi mdi-minus zoom-font"></i>',
        zoomOutTitle: '',
        zoomHomeText: '<i class="mdi mdi-crosshairs-gps"></i>',
        zoomHomeTitle: '',
        voiceText: '<i class="mdi mdi-voice"></i>',
        voiceTitle: ''
    },
    onAdd: function (map) {
        var controlName = 'gin-control-zoom',
            container = L.DomUtil.create('div', ''),
            homeContainer = L.DomUtil.create('div', controlName + ' leaflet-bar', container),
            zoomContainer = L.DomUtil.create('div', controlName + ' leaflet-bar', container),
            voiceContainer = L.DomUtil.create('div', controlName + ' leaflet-bar', container),
            options = this.options;

        this._zoomHomeButton = this._createButton(options.zoomHomeText, options.zoomHomeTitle,
            controlName + '-home', homeContainer, this._zoomHome);
        this._zoomHomeButton.id = "zoomHomeButton";

        var zoomHomeTooltip = L.DomUtil.create('div', 'mdl-tooltip mdl-tooltip--left', homeContainer);
        zoomHomeTooltip.innerHTML = 'Hiển thị vị trí của bạn';
        zoomHomeTooltip.setAttribute("data-mdl-for", 'zoomHomeButton');

        this._zoomInButton = this._createButton(options.zoomInText, options.zoomInTitle,
            controlName + '-in', zoomContainer, this._zoomIn);
        this._zoomInButton.id = "zoomInButton";
        this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
            controlName + '-out', zoomContainer, this._zoomOut);
        this._zoomOutButton.id = "zoomOutButton";

        var zoomInTooltip = L.DomUtil.create('div', 'mdl-tooltip mdl-tooltip--left', homeContainer);
        zoomInTooltip.innerHTML = 'Thu phóng';
        zoomInTooltip.setAttribute("data-mdl-for", 'zoomInButton');

        var zoomOutTooltip = L.DomUtil.create('div', 'mdl-tooltip mdl-tooltip--left', homeContainer);
        zoomOutTooltip.innerHTML = 'Thu phóng';
        zoomOutTooltip.setAttribute("data-mdl-for", 'zoomOutButton');

        this._voiceButton = this._createButton(options.voiceText, options.voiceTitle, 'voice-active', voiceContainer, toggleVoice);
        this._voiceButton.id = "voiceButton";

        var voiceTooltip = L.DomUtil.create('div', 'mdl-tooltip mdl-tooltip--left', voiceContainer);
        voiceTooltip.innerHTML = 'Hỗ trợ đọc';
        voiceTooltip.setAttribute("data-mdl-for", 'voiceButton');

        this._updateDisabled();
        map.on('zoomend zoomlevelschange', this._updateDisabled, this);
        return container;
    },
    onRemove: function (map) {
        map.off('zoomend zoomlevelschange', this._updateDisabled, this);
    },
    _zoomIn: function (e) {
        this._map.zoomIn(e.shiftKey ? 3 : 1);
    },
    _zoomOut: function (e) {
        this._map.zoomOut(e.shiftKey ? 3 : 1);
    },
    _zoomHome: function (e) {
        //this._map.setView(latlng, maxZoom);
        map.locate({ setView: true, maxZoom: 18 })
        map.on('locationfound', function (location) {
            removeCurrentMarker()
            getPlacebyClick(location.latlng.lat, location.latlng.lng)
        });
        map.on('locationerror', console.log);
    },

    _createButton: function (html, title, className, container, fn) {
        var link = L.DomUtil.create('a', className, container);
        link.innerHTML = html;
        link.href = '#';
        link.title = title;
        L.DomEvent.on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', fn, this)
            .on(link, 'click', this._refocusOnMap, this);
        return link;
    },
    _updateDisabled: function () {
        var map = this._map,
            className = 'leaflet-disabled';
        L.DomUtil.removeClass(this._zoomInButton, className);
        L.DomUtil.removeClass(this._zoomOutButton, className);
        if (map._zoom === map.getMinZoom())
            L.DomUtil.addClass(this._zoomOutButton, className);
        if (map._zoom === map.getMaxZoom())
            L.DomUtil.addClass(this._zoomInButton, className);
    }
});
var zoomHome = new L.Control.zoomHome();
zoomHome.addTo(map);

var lc = L.control.logo({
    position: 'topright',
    link: '#',
    image: '/assets/images/logo.png',
    height: '56px',
    width: '200px'
}).addTo(map);

map.locate({ setView: (setView == undefined), maxZoom: 18, timeout: 10000 });
map.on('locationfound', function (location) {
    console.log(`Đã xác định được vị trí của người dùng`)
});
map.on('locationerror', function () {
    console.log(`Không xác định được vị trí của người dùng`)
});

L.DomEvent.addListener(L.DomUtil.get('obfuscator'), 'click', toggleLeftmenu)
L.DomEvent.addListener(L.DomUtil.get('closeLeftMenu'), 'click', toggleLeftmenu)
L.DomEvent.addListener(L.DomUtil.get('expand'), 'click', toggleExpand)
L.DomEvent.addListener(L.DomUtil.get('placeclose'), 'click', removeCurrentMarker)

var placename = L.DomUtil.get('placename')
var placelocation = L.DomUtil.get('placelocation')
L.DomEvent.addListener(placename, 'click', clickPlaceDetail)
L.DomEvent.addListener(placelocation, 'click', clickPlaceDetail)

$('#direction').on('click', () => {
    addWayPoint('start')
})
$('#detailclose').on('click', () => {
    $('#detail').removeClass('detail-left')
})