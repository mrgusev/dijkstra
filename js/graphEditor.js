var resetCurrentNode;
var setGraphFromFile;
var showData;
(function(){
    var map;
    var markersArray = [];

    var currentNode;
    var nodes = [];
    var nodeLinks = [];
    var segments = [];
    var isNodeDeleting = false;

    function initMap(){
        var latlng = new google.maps.LatLng(47.207, 38.931);
        var myOptions = {
            zoom: 15,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

        // add a click event handler to the map object
        google.maps.event.addListener(map, "click", function(event)
        {
            // place a marker
            placeMarker(event.latLng);
        });
    }

    function placeMarker(location) {
        var node = addNode(location);

        var marker = new google.maps.Marker({
            position: location,
            map: map,
            node: node
        });

        // add marker in markers array
        markersArray.push(marker);

        map.setCenter(location);
        google.maps.event.addListener(marker, 'click', function() {
            if(isNodeDeleting){
                deleteNode(marker.node);
            } else{
                if(currentNode && currentNode != marker.node){
                    addNodeLink(currentNode, marker.node);
                }
                currentNode = marker.node;
            }
        });
    }

    function addPathSegment(point1, point2){
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

    function drawAllPaths(){
        _.each(segments, function(item){
            item.setMap(null);
        });
        _.each(nodeLinks, function(link){
            addPathSegment(_.findWhere(nodes, {id: link.node1Id}), _.findWhere(nodes, {id: link.node2Id}));
        })
    }

    resetCurrentNode = function (){
        currentNode = null;
    };

    function addNode(latLng){
        var count = nodes.length + 1;
        var node = {
            id: count,
            lat: latLng.lat(),
            lng: latLng.lng()
        };
        nodes.push(node);
        if(currentNode){
            addNodeLink(currentNode, node);
        }
        currentNode = node;
        return node;
    }

    function addNodeLink(node1, node2){
        if(!_.findWhere(nodeLinks, {node1Id: node1.id, node2Id: node2.id}) &&
            !_.findWhere(nodeLinks, {node1Id: node2.id, node2Id: node1.id})) {

            var nodeLink = {
                node1Id: node1.id,
                node2Id: node2.id,
                distance: getDistance(node1, node2)
            };
            nodeLinks.push(nodeLink);
            addPathSegment(node1, node2);
        }
    }

    showData = function(){
        $('#data').show();
        $('#data').text(JSON.stringify({
            nodeLinks: nodeLinks,
            nodes: nodes
        }));

    }

    function deleteNode(node){
        var links = _.where(nodeLinks, {node1Id: node.id}).concat(_.where(nodeLinks, {node2Id: node.id}));
        var marker = _.findWhere(markersArray, {node: node});
        nodes.remove(node);
        markersArray.remove(marker);
        marker.setMap(null);
        _.each(links, function(link){
            nodeLinks.remove(link);
        });
        currentNode = null;
        drawAllPaths();
        $('#delete-checkbox').prop('checked', '');
        isNodeDeleting = false;

    }

    setGraphFromFile = function(){
        $.ajax({
            url: 'data/graph.json',
            type: 'get',
            success: function(data) {
                setAllNodeLinks(data);
            }
        });
    }

    function setAllNodeLinks(data){
        nodes = data.nodes;
        _.each(nodes, function(node){
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(node.lat, node.lng),
                map: map,
                node: node
            });

            // add marker in markers array
            markersArray.push(marker);
            google.maps.event.addListener(marker, 'click', function() {
                if(isNodeDeleting){
                    deleteNode(marker.node);
                } else{
                    if(currentNode && currentNode != marker.node){
                        addNodeLink(currentNode, marker.node);
                    }
                    currentNode = marker.node;
                }
            });
        });

        nodeLinks = data.nodeLinks;
        drawAllPaths();
    }
    $(document).ready(function(){

        $('#delete-checkbox').change(function () {
            isNodeDeleting = $('#delete-checkbox').prop('checked');
        });
    });

    var rad = function(x) {
        return x * Math.PI / 180;
    };

    var getDistance = function(node1, node2) {
        var R = 6378137; // Earth’s mean radius in meter
        var dLat = rad(node2.lat - node1.lat);
        var dLong = rad(node2.lng - node1.lng);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad(node1.lat)) * Math.cos(rad(node2.lat)) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meter
    };

    google.maps.event.addDomListener(window, 'load', initMap);
})();