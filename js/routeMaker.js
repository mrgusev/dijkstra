var routeMaker;
(function(){
    var startNode;
    var endNode;
    var startMarker;
    var endMarker;
    var graph;
    var routePath;

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
            if(!endNode){
                setPoint(event.latLng);
            } else{
                resetRoute();
                setPoint(event.latLng)
            }

        });
    }

    function prepareMatrix(){
        var nodes = graph.nodes;
        var nodeLinks = graph.nodeLinks;
        _.each(nodes,function(item){
            var links = _.where(nodeLinks, {node1Id: item.id}).concat(_.where(nodeLinks, {node2Id: item.id}));
            item.neighbours = _.map(links, function(link){
                return {
                    distance: link.distance,
                    node: link.node1Id == item.id ? _.findWhere(nodes, {id: link.node2Id}) : _.findWhere(nodes, {id: link.node1Id})
                }
            });

            return item;
        });

        for(var i=0; i< graph.nodes.length; i++){
            nodes[i].id = i;
        }
        _.each(nodes,function(item){

            item.row = [];
            _.each(item.neighbours, function(neighbour){
                item.row[neighbour.node.id] = neighbour.distance;
            });

            return item;
        });

        var matrix = [];
        var length = nodes.length;

        for( i =0; i< length; i++){
            matrix[i] = nodes[i].row;
            matrix[i][i] = 0;
        }
        return matrix;
    }

    function getClosestNode(latLng){
        var minDistance = Number.MAX_VALUE, minDistanceNode = {};
        _.each(graph.nodes, function(node){
            var currentDistance = Geometry.getDistance(node, {lat:latLng.lat(), lng: latLng.lng()});
            if(currentDistance < minDistance){
                minDistance = currentDistance;
                minDistanceNode = node;
            }
        });
        return minDistanceNode;
    }

    function drawMap(){
        _.each(graph.nodes, function(node){
            new google.maps.Marker({
                position: new google.maps.LatLng(node.lat, node.lng),
                map: map,
                title: node.id.toString()
            });
        })
    }

    function setPoint(latLng){
        if(!startNode){
            startNode = getClosestNode(latLng);
            startMarker = new google.maps.Marker({
                position: latLng,
                map: map
            });
        } else{
            endNode = getClosestNode(latLng);
            endMarker = new google.maps.Marker({
                position: latLng,
                map: map
            });
            findShortestRoute();
        }
    }

    function findShortestRoute(){
        var result = dijkstra.execute(startNode.id, endNode.id);

        var pathNodeIds = result.path;
        $('#time').text(Math.round(result.totalDistance/80) + ' мин.');
        $('#length').text(Math.round(result.totalDistance) + ' метров');
        drawRoute(pathNodeIds);
//        drawMap();
    }

    function resetRoute(){
        startNode = null;
        endNode = null;
        startMarker.setMap(null);
        endMarker.setMap(null);
        if(routePath){
            routePath.setMap(null);
        }
    }

    function drawRoute(pathNodes){
        var path = [];
        _.each(pathNodes, function(nodeId){
            var node = _.findWhere(graph.nodes, {id: nodeId});
            path.push(new google.maps.LatLng(node.lat, node.lng));
        });
        routePath = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#00FF00',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            zIndex: 100
        });
        routePath.setMap(map);
    }

    function loadGraph(){
        $.get('data/graph.json',function(data){

            graph = data;
            var matrix = prepareMatrix();
            dijkstra.setMatrix(matrix);

            console.log(graph.nodes);
        });
    }

    function initRouteMaker(){
        loadGraph();
        initMap();

    }


    google.maps.event.addDomListener(window, 'load', initRouteMaker);

    routeMaker = {
        resetRoute: resetRoute
    };
})();