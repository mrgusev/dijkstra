var resetCurrentNode;
var setGraphFromFile;
var showData;
var loadGraph;
var map;
var markersArray = [];

var currentNode;
var currentNodeLink;
var nodes = [];
var nodeLinks = [];
var segments = [];
var isNodeDeleting = false;



function initMap() {
    var latlng = new google.maps.LatLng(47.207, 38.931);
    var myOptions = {
        zoom: 15,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

    // add a click event handler to the map object
    google.maps.event.addListener(map, "click", function (event) {
        // place a marker
        placeVertex(event.latLng);
    });

    google.maps.event.addListener(map, "rightclick", function (event) {
        // place a marker

        placeStation(event.latLng);
    });
}

function placeStation(latLng){
    placeMarker(latLng);

    currentNodeLink = {
        node1Id: currentNode.id,
        vertices: [{lat: currentNode.lat, lng: currentNode.lng}],
        distance: 0
    }
}

function addLinkVertex(latLng){
    var newVertex = {
        lat: latLng.lat(),
        lng: latLng.lng()
    };
    var prevVertex = _.last(currentNodeLink.vertices);
    currentNodeLink.vertices.push(newVertex);
    currentNodeLink.distance += Geometry.getDistance(newVertex, prevVertex);
    addPathSegment(prevVertex, newVertex);

}

function placeVertex(latLng){
    if(currentNodeLink){
        addLinkVertex(latLng);
    }
}

function addNode(latLng) {
    var count = 1;
    if (nodes.length > 0) {
        count = _.sortBy(nodes, function (n) {
            return n.id;
        }).reverse()[0].id + 1;
    }
    var node = {
        id: count,
        lat: latLng.lat(),
        lng: latLng.lng()
    };
    nodes.push(node);
    if (currentNode) {
        addNodeLink(currentNode, node);
    }

    currentNode = node;
    return node;
}

function deleteNode(node) {
    var links = _.where(nodeLinks, {node1Id: node.id}).concat(_.where(nodeLinks, {node2Id: node.id}));
    var marker = _.findWhere(markersArray, {node: node});
    nodes.remove(node);
    if (marker) {
        markersArray.remove(marker);
        marker.setMap(null);
    }
    _.each(links, function (link) {
        nodeLinks.remove(link);
    });
    currentNode = null;
    drawAllPaths();
    $('#delete-checkbox').prop('checked', '');
    isNodeDeleting = false;
}

function addNodeLink(node1, node2) {
    if(currentNodeLink){
        addLinkVertex(new google.maps.LatLng(node2.lat, node2.lng));
        currentNodeLink.node2Id = node2.id;
        nodeLinks.push(currentNodeLink);
    }

}

function fixIds() {
    var newNodesId = [];
    _.each(nodes, function (node) {
        if (_.contains(newNodesId, node.id)) {
            deleteNode(node);
            deleteNode(_.findWhere(nodes, {id: node.id}));
        } else {
            newNodesId.push(node.id);
        }
    });
}

function setAllNodeLinks(data) {
    clearAll();
    nodes = data.nodes;
    _.each(nodes, function (node) {

        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(node.lat, node.lng),
            map: map,
            node: node,
            title: node.id.toString()
        });

        // add marker in markers array
        markersArray.push(marker);
        google.maps.event.addListener(marker, 'click', function () {
            if (isNodeDeleting) {
                deleteNode(marker.node);
            } else {
                if (currentNode && currentNode != marker.node) {
                    addNodeLink(currentNode, marker.node);
                }
                currentNode = marker.node;
            }
        });
    });
    nodeLinks = data.nodeLinks;
    currentNode = null;
    console.log(nodes.length);
    fixIds();
    console.log(nodes.length);
    drawAllPaths();
}

function placeMarker(location) {
    var node = addNode(location);

    var marker = new google.maps.Marker({
        position: location,
        map: map,
        node: node,
        title: node.id.toString()
    });

    // add marker in markers array
    markersArray.push(marker);

    map.setCenter(location);
    google.maps.event.addListener(marker, 'click', function () {
        if (isNodeDeleting) {
            deleteNode(marker.node);
        } else {
            if (currentNode && currentNode != marker.node) {
                addNodeLink(currentNode, marker.node);
            }
            currentNode = marker.node;
        }
    });
}

function addPathSegment(point1, point2) {
    var segment = new google.maps.Polyline({
        path: [new google.maps.LatLng(point1.lat, point1.lng),
            new google.maps.LatLng(point2.lat, point2.lng)],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    segment.setMap(map);
    segments.push(segment);
}

function drawAllPaths() {
    _.each(segments, function (item) {
        item.setMap(null);
    });
    _.each(nodeLinks, function (link) {
        var prevVertex;
        _.each(link.vertices, function(vertex){
            if(prevVertex){
                addPathSegment(vertex, prevVertex);
            }
            prevVertex = vertex;
        });
    })
}

function clearAll() {
    _.each(segments, function (item) {
        item.setMap(null);
    });
    _.each(markersArray, function (item) {
        item.setMap(null);
    });
    nodes = [];
    markersArray = [];
    nodeLinks = [];
    segments = [];
}

resetCurrentNode = function () {
    currentNode = null;
};

showData = function () {
    $('#data').show();
    $('#data').val(JSON.stringify({
        nodeLinks: nodeLinks,
        nodes: nodes
    }));

}

setGraphFromFile = function () {
    $.ajax({
        url: 'data/trainGraph.json',
        type: 'get',
        success: function (data) {
            setAllNodeLinks(data);
        }
    });
};

loadGraph = function () {
//        console.log($('#data').text());text
    setAllNodeLinks(JSON.parse($('#data').val()));
};

google.maps.event.addDomListener(window, 'load', initMap);

$(document).ready(function () {

    $('#delete-checkbox').change(function () {
        isNodeDeleting = $('#delete-checkbox').prop('checked');
    });
});
//})();