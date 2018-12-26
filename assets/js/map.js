var currentMarker
var DEFAULT_HOME = [16.1024476, 106.0078059]
var DEFAULT_ZOOM = 6
var DEFAULT_TITLE = 'VNMap - Bản đồ số Việt Nam'
var MAP_MOVE_TIMEOUT = 500
var MAP_MOVE_SETTIMEOUT
var MOUSE_EVENT
var AUDIO
var PLACE_DETAIL
var NO_PLACE_IMAGE = 'https://vantayden.github.io/assets/images/no_street.png'
var NO_DETAIL_IMAGE = 'https://vantayden.github.io/assets/images/hoa-sen.jpg'

function removeCurrentMarker() {
    if (currentMarker) {
        map.removeLayer(currentMarker)
        currentMarker = null
        var place = L.DomUtil.get('place')
        L.DomUtil.addClass(place, 'd-none')
    }
}

function getJSON(url, params, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState !== 4) {
            return;
        }
        if (xmlHttp.status !== 200 && xmlHttp.status !== 304) {
            callback('');
            return;
        }
        callback(JSON.parse(xmlHttp.response));
    };
    xmlHttp.open('GET', url + L.Util.getParamString(params), true);
    xmlHttp.setRequestHeader('Accept', 'application/json');
    xmlHttp.send(null);
}

function reversePlace(lat, lng, cb) {
    getJSON('/geocode/reverse.php', {
        lat: lat,
        lon: lng,
        format: 'json',
        addressdetails: 1,
        namedetails: 1
    }, (place) => {
        cb(place)
    })
}

function geocodePlace(name, cb) {
    getJSON('/geocode/search', {
        q: name,
        format: 'json',
        limit: 1,
        addressdetails: 1,
        namedetails: 1
    }, (place) => {
        cb(place)
    })
}

function getPlacebyClick(lat, lng, cb) {
    reversePlace(lat, lng, (place) => {
        if (!place.error) {
            console.log(1)
            previewImages(place.osm_id)
            addCurrentMarker(lat, lng, place.display_name, place)
            playMarker(place.display_name)
        }
    })
}

function addCurrentMarker(lat, lng, title, placeDetail) {
    PLACE_DETAIL = placeDetail
    currentMarker = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: '/assets/images/place-marker.png',
            opacity: 0.8,
            iconAnchor: L.point(12, 24)
        })
    }).addTo(map);
    var split = title.split(', ')
    split = split.filter(function (v) { return (v == 'Việt Nam') ? false : true })
    var name = split.join(', ')
    var place = L.DomUtil.get('place')
    L.DomUtil.removeClass(place, 'd-none')
    placename.innerHTML = name
    placelocation.innerHTML = lat.toFixed(7) + ', ' + lng.toFixed(7)
    
}

function clickPlaceDetail() {
    removeCurrentMarker()
    if ($('#icon_routing').hasClass('opened')) {
        geoCoding._direction()
    }
    if (PLACE_DETAIL) {
        jumpPlace(PLACE_DETAIL.display_name, PLACE_DETAIL.lat, PLACE_DETAIL.lon)
        detailAddress(PLACE_DETAIL)
        toggleDetailmenu(true)
    }
}

function clickMap(e) {
    geoCoding._clearResults()
    if (!currentMarker)
        getPlacebyClick(e.latlng.lat, e.latlng.lng)
    else
        removeCurrentMarker()
}

function toggleLeftmenu() {
    var leftMenu = L.DomUtil.get('leftMenu')
    if (L.DomUtil.hasClass(leftMenu, 'slide-left')) {
        L.DomUtil.removeClass(leftMenu, 'slide-left')
    } else {
        L.DomUtil.addClass(leftMenu, 'slide-left')
    }
}

function toggleDetailmenu(open = true) {
    var leftMenu = L.DomUtil.get('detail')
    if (L.DomUtil.hasClass(leftMenu, 'detail-left') && !open) {
        L.DomUtil.removeClass(leftMenu, 'detail-left')
    } else if (!L.DomUtil.hasClass(leftMenu, 'detail-left') && open) {
        L.DomUtil.addClass(leftMenu, 'detail-left')
    }
}

function toggleExpand() {
    var subMenu = L.DomUtil.get('submenu')
    if (L.DomUtil.hasClass(subMenu, 'active')) {
        L.DomUtil.removeClass(subMenu, 'active')
    } else {
        L.DomUtil.addClass(subMenu, 'active')
    }
}

function getViewbox() {
    var viewboxPosition = findViewbox()

    checkValidPlace()

    if (!viewboxPosition) {
        return;
    } else {
        var viewbox = location.pathname.split('/')[viewboxPosition]
        if (!checkValidViewbox(viewbox)) {
            return;
        } else {
            viewbox = viewbox.replace('@', '').replace('z', '').split(',')
            return {
                lat: parseFloat(viewbox[0]) || 0,
                lon: parseFloat(viewbox[1]) || 0,
                z: parseInt(viewbox[2]) || 0,
            }
        }
    }
}

function creatViewbox(lat, lon, z) {
    return `@${lat},${lon},${z}z`
}

function findViewbox() {
    var viewbox = location.pathname.split('/')
    var viewboxPosition
    viewbox.forEach((item, index) => {
        if (item.indexOf('@') === 0 && item.indexOf('z') === item.length - 1 && !viewboxPosition) {
            viewboxPosition = index
        }
    })
    return viewboxPosition;
}

function checkValidViewbox(viewbox = '') {
    viewbox = viewbox.replace('@', '').replace('z', '').split(',')
    if (viewbox.length !== 3) {
        return false;
    } else {
        viewbox = {
            lat: parseFloat(viewbox[0]) || 0,
            lon: parseFloat(viewbox[1]) || 0,
            z: parseInt(viewbox[2]) || 0,
        }
        if (viewbox.lon > 180 || viewbox.lon < -180 || viewbox.lat > 90 || viewbox.lat < -90 || viewbox.z < 0 || viewbox.z > 20) {
            return false;
        } else {
            return true;
        }
    }
}

function moveMap() {
    if (MAP_MOVE_SETTIMEOUT)
        clearTimeout(MAP_MOVE_SETTIMEOUT)
    MAP_MOVE_SETTIMEOUT = setTimeout(() => {
        removeCurrentMarker()
        var paths = location.pathname.split('/')
        var viewboxPosition = findViewbox()
        if (!viewboxPosition)
            viewboxPosition = paths.length - 1
        paths[viewboxPosition] = creatViewbox(map.getCenter().lat.toFixed(7), map.getCenter().lng.toFixed(7), map.getZoom())
        changeUrl(paths.join('/'))
    }, MAP_MOVE_TIMEOUT)
}

function changeUrl(newHREF, title) {
    if (!title) {
        title = document.title
    } else {
        title += ' - Bản đồ số Việt Nam'
    }
    document.title = title
    window.history.pushState({ urlPath: newHREF }, '', newHREF || location.href)
}

function getVoice(txt, cb) {
    getJSON('/voice', {
        address: txt,
    }, (result) => {
        cb(result)
    })
}

function playText(txt) {
    var leftMenu = L.DomUtil.get('voiceButton')
    if (L.DomUtil.hasClass(leftMenu, 'voice-active')) {
        getVoice(txt, (result) => {
            if (result.error) {
                console.log(result.msg)
            } else {
                if (AUDIO) {
                    AUDIO.pause()
                }
                AUDIO = new Audio(result.audio_url)
                AUDIO.play()
            }
        })
    }
}

function playMarker(name) {
    var split = name.split(', ')
    split = split.filter(function (v) { return (v == 'Việt Nam' || (parseInt(v) && split.indexOf(v) > 2)) ? false : true })
    name = split.join(', ')
    playText(name)
}

function creatPlace(name) {
    return name.split(' ').join('+')
}

function findPlace() {
    var path = location.pathname.split('/')
    var placePosition
    path.forEach((item, index) => {
        if (item == 'place' && path[index + 1] && findViewbox() != index + 1) {
            placePosition = index
        }
    })
    return placePosition;
}

function getPlace() {
    var path = location.pathname.split('/')
    var placePosition = findPlace()
    if (placePosition) {
        return path[placePosition + 1].split('+').join(' ')
    } else {
        return;
    }
}

function getPlaceName(firstname = false) {
    var place = getPlace()
    if (place) {
        if (firstname)
            return decodeURIComponent(place.split(',')[0])
        else
            return decodeURIComponent(place)
    } else {
        return;
    }
}

function newPlace(name) {
    name.split('/').join(' ')
    var path = location.pathname.split('/')
    path.shift()
    var placePosition = findPlace()
    if (!placePosition) {
        path.unshift(creatPlace(name))
        path.unshift('place')
    } else {
        path[placePosition] = creatPlace(name)
    }
    path.unshift('')
    changeUrl(path.join('/'), name.split(',')[0])
}

function clearPlace() {
    var path = location.pathname.split('/')
    var placePosition = findPlace()
    if (placePosition) {
        path.splice(placePosition, 2)
        changeUrl(path.join('/'))
    }
}

function checkValidPlace() {
    var placeName = getPlaceName()
    if (placeName) {
        geocodePlace(placeName, places => {
            if (places.length > 0) {
                jumpPlace(placeName, places[0].lat, places[0].lon)
                detailAddress(places[0])
                toggleDetailmenu(true)
            } else {
                clearPlace()
            }
        })
    }
}

function jumpPlace(name, lat, lon) {
    map.setView([lat, lon], 16)
    var split = name.split(', ')
    split = split.filter(function (v) { return (parseInt(v) || v == 'Việt Nam') ? false : true })
    newPlace(name)
    geoCoding._input.value = split[0]
    geoCoding._clearMarker()
    geoCoding._geocodeMarker = new L.Marker([lat, lon])
        .bindPopup(split.join(', '))
        .addTo(map)
    // .openPopup();
    geoCoding._changeRouteIcon(false)
}

function detailAddress(result) {
    if (result.properties)
        result = result.properties
    detailImages(result.osm_id || '')
    const name = result.display_name ? result.display_name.split(', ')[0] : result.name.split(', ')[0]
    $('.detail-address-title').html(name)
    const county = result.address.county || result.address.neighbourhood || ''
    const state = result.address.state || result.address.suburb || ''
    const country = result.address.country || ''
    MOUSE_EVENT = {
        latlng: {
            lat: result.lat,
            lng: result.lon,

        }
    }
    $('#county').html(county)
    $('#state').html(state)
    $('#country').html(country)
    $('#display-name').html(result.display_name)
    $('#display-location').html(`${result.lat}, ${result.lon}`)
    randomRating()

}

function randomRating() {
    let rand = Math.floor(Math.random() * 3) + 1
    $(`#r${rand}`).prop('checked', true)
}

function detailImages(id) {
    if (!id) {
        pushImage()
    } else {
        $.getJSON(`/images/${id}`, (result) => {
            if (result.success) {
                pushImage('data:image/png;base64,' + result.images[0])
            } else {
                pushImage()
            }
            delete result
        }).fail(function () {
            pushImage()
        })
    }
}

function previewImages(id) {
    document.getElementById("preview-image").src = NO_PLACE_IMAGE
    if (!id) {
        document.getElementById("preview-image").src = NO_PLACE_IMAGE
    } else {
        $.getJSON(`/images/${id}`, (result) => {
            if (result.success) {
                document.getElementById("preview-image").src = 'data:image/png;base64,' + result.images[0]
            } else {
                document.getElementById("preview-image").src = NO_PLACE_IMAGE
            }
            delete result
        }).fail(function () {
            document.getElementById("preview-image").src = NO_PLACE_IMAGE
        })
    }
}

function pushImage(imageUrl = NO_DETAIL_IMAGE) {
    document.getElementById("detail-image").src = imageUrl
}

function toggleVoice() {
    var leftMenu = L.DomUtil.get('voiceButton')
    if (L.DomUtil.hasClass(leftMenu, 'voice-active')) {
        L.DomUtil.removeClass(leftMenu, 'voice-active')
    } else {
        L.DomUtil.addClass(leftMenu, 'voice-active')
    }
}