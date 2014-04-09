var resetCurrentNode;
var setGraphFromFile;
var showData;
var loadGraph;
//(function(){
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

    function addNode(latLng){
        var count = 1;
        if(nodes.length > 0 ){
            count = _.sortBy(nodes, function(n){return n.id;}).reverse()[0].id + 1;
        }
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

function makePath(){
    dijkstra.setGraph({
        nodes:nodes,
        nodeLinks: nodeLinks
    });
    dijkstra.execute(_.findWhere(nodes, {id: 41}));
    drawShortestPath();
}

function drawShortestPath(){
    var pathNodes = getShortestPath(133);
    var path = [];
    alert(_.pluck(pathNodes, 'id'))
    var segment = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#00FF00',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        zIndex: 100
    });
    segment.setMap(map);

}
    function deleteNode(node){
        var links = _.where(nodeLinks, {node1Id: node.id}).concat(_.where(nodeLinks, {node2Id: node.id}));
        var marker = _.findWhere(markersArray, {node: node});
        nodes.remove(node);
        if(marker){
            markersArray.remove(marker);
            marker.setMap(null);
        }
        _.each(links, function(link){
            nodeLinks.remove(link);
        });
        currentNode = null;
        drawAllPaths();
        $('#delete-checkbox').prop('checked', '');
        isNodeDeleting = false;
    }

    function addNodeLink(node1, node2){
        if(!_.findWhere(nodeLinks, {node1Id: node1.id, node2Id: node2.id}) &&
            !_.findWhere(nodeLinks, {node1Id: node2.id, node2Id: node1.id})) {

            var nodeLink = {
                node1Id: node1.id,
                node2Id: node2.id,
                distance: Geometry.getDistance(node1, node2)
            };
            nodeLinks.push(nodeLink);
            addPathSegment(node1, node2);
        }
    }

    function fixIds(){
        var newNodesId = [];
        _.each(nodes, function(node){
           if(_.contains(newNodesId, node.id)){
              deleteNode(node);
               deleteNode(_.findWhere(nodes, {id: node.id}));
           } else{
               newNodesId.push(node.id);
           }
        });
    }
    function setAllNodeLinks(data){
        clearAll();
        nodes = data.nodes;
        _.each(nodes, function(node){

            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(node.lat, node.lng),
                map: map,
                node: node,
                title: node.id.toString()
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

    function clearAll(){
        _.each(segments, function(item){
            item.setMap(null);
        });
        _.each(markersArray, function(item){
            item.setMap(null);
        });
        nodes = [];
        markersArray = [];
        nodeLinks = [];
        segments = [];
    }

    resetCurrentNode = function (){
        currentNode = null;
    };

    showData = function(){
        $('#data').show();
        $('#data').val(JSON.stringify({
            nodeLinks: nodeLinks,
            nodes: nodes
        }));

    }

    setGraphFromFile = function(){
        $.ajax({
            url: 'data/graph.json',
            type: 'get',
            success: function(data) {
                setAllNodeLinks(data);
                dijkstra.setGraph(data);
                dijkstra.execute(_.findWhere(data.nodes, {id: 139}));
            }
        });
    }

    loadGraph  = function(){
//        console.log($('#data').text());text
        setAllNodeLinks(JSON.parse($('#data').val()));
    };

    google.maps.event.addDomListener(window, 'load', initMap);

    $(document).ready(function(){

        $('#delete-checkbox').change(function () {
            isNodeDeleting = $('#delete-checkbox').prop('checked');
        });
    });
//})();