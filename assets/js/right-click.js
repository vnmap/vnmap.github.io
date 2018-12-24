initContextMenu(false)
function initContextMenu(isRouting) {
    $('#map').contextMenu('destroy')
    let items = {
        "start": { name: "Chỉ đường từ đây" },
        "end": { name: "Chỉ đường tới đây" },
        "reverse": { name: "Vị trí này là gì?" }
    }
    if (isRouting) {
        items.clear = { name: "Xóa chỉ đường" }
    }
    $.contextMenu({
        selector: '#map',
        callback: handleContext,
        items
    });
}


function handleContext(key, options) {
    if (key == 'start' || key == 'end' || key == 'clear') {
        addWayPoint(key)
    } else if (key == 'reverse') {
        clickMap(MOUSE_EVENT)
    }
}

function addWayPoint(key) {
    if (key == 'clear') {
        geoCoding._direction()
        initContextMenu(false)
    } else {
        initContextMenu(true)
        let waypoints = routingControl.getWaypoints()
        let { lat, lng } = MOUSE_EVENT.latlng
        reversePlace(lat, lng, (place) => {
            if (!$('#icon_routing').hasClass('opened')) {
                geoCoding._direction()
            }
            let i = (key == 'start') ? 0 : 1
            waypoints[i] = L.routing.waypoint([lat, lng], place.display_name)
            routingControl.setWaypoints(waypoints)
            var a = routingControl.route()
        })
    }
}