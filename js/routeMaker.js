(function () {

    var startMarker;            // маркер начальной позиции
    var endMarker;              // маркер конечно позиции
    var walkingGraph;           // граф пешего маршрута
    var walkingMatrix;          // матрица пешего маршрута
    var trainGraph;             // граф маршурта трамвая
    var trainMatrix;            // матрица маршрута трамвая
    var trainSegments = [];     // Графические сегменты маршрута трамвая
    var walkingSegments = [];   // графические сегменты пешего маршрута
    var graphSegments = [];     // графические сегменты общего графа

    // опции отображения элементов
    var options = {
        trainVisibility: true,
        walkingVisibility: true,
        graphVisibility: false
    };

    /*
     * INIT SECTION
     */

    // Инициализация карты
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
            if (!endMarker) {
                setPoint(event.latLng);
            } else {
                resetRoute();
                setPoint(event.latLng)
            }
        });
    }

    // Подгрузка графов из файлов и подготовка матриц
    function loadGraph() {
        $.get('data/graph.json', function (data) {
            walkingGraph = data;
            walkingMatrix = prepareMatrix(data);
        });
        $.get('data/trainGraph.json', function (data) {
            trainGraph = data;
            trainMatrix = prepareMatrix(data);
        });

    }

    // Инициализация модуля
    function initRouteMaker() {
        loadGraph();
        initMap();
    }

    // Создание матрицы из объекта графа
    function prepareMatrix(graph) {
        var nodes = graph.nodes;
        var nodeLinks = graph.nodeLinks;
        _.each(nodes, function (item) {
            var links = _.where(nodeLinks, {node1Id: item.id}).concat(_.where(nodeLinks, {node2Id: item.id}));
            item.neighbours = _.map(links, function (link) {
                return {
                    distance: link.distance,
                    vertices: link.vertices,
                    node: link.node1Id == item.id ? _.findWhere(nodes, {id: link.node2Id}) : _.findWhere(nodes, {id: link.node1Id})
                }
            });

            return item;
        });

        for (var i = 0; i < graph.nodes.length; i++) {
            nodes[i].id = i;
        }
        _.each(nodes, function (item) {

            item.row = [];
            _.each(item.neighbours, function (neighbour) {
                item.row[neighbour.node.id] = neighbour.distance;
            });

            return item;
        });

        var matrix = [];
        var length = nodes.length;

        for (i = 0; i < length; i++) {
            matrix[i] = nodes[i].row;
            matrix[i][i] = 0;
        }
        return matrix;
    }


    /*
     * DRAWING SECTION
     */

    // Отрисовка маршрута со сложными ребрами
    function drawComplexRoute(pathNodes, graph, color) {
        var path = [];
        var prevNode;
        for (var i = pathNodes.length - 1; i >= 0; i--) {
            var node = _.findWhere(graph.nodes, {id: pathNodes[i]});
            if (prevNode) {
                var neighbour = _.findWhere(node.neighbours, {node: prevNode});
                _.each(neighbour.vertices, function (vertex) {
                    path.push(new google.maps.LatLng(vertex.lat, vertex.lng));
                });
            }
            prevNode = node;
//            path.push(new google.maps.LatLng(node.lat, node.lng));

        }
        routePath = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 1.0,
            strokeWeight: 2,
            zIndex: 100
        });
        routePath.setMap(map);
        trainSegments.push(routePath);
    }

    // Отрисовка маршрута
    function drawRoute(pathNodes, graph, color) {
        var path = [];
        _.each(pathNodes, function (nodeId) {
            var node = _.findWhere(graph.nodes, {id: nodeId});
            path.push(new google.maps.LatLng(node.lat, node.lng));
        });
        var routePath = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 1.0,
            strokeWeight: 2,
            zIndex: 100
        });
        routePath.setMap(map);
        walkingSegments.push(routePath);
    }

    // Отрисовка простой линии между двумя точками
    function addPathSegment(point1, point2, color, collection) {
        var segment = new google.maps.Polyline({
            path: [new google.maps.LatLng(point1.lat, point1.lng),
                new google.maps.LatLng(point2.lat, point2.lng)],
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 1.0,
            strokeWeight: 2,
            zIndex: 100
        });
        segment.setMap(map);
        if(collection){
            collection.push(segment);
        }
//        segments.push(segment);
    }

    // Отрисовка графа
    function drawGraph() {
        _.each(walkingGraph.nodes, function (node) {
            _.each(node.neighbours, function(neighbour){
                addPathSegment(node, neighbour.node, '#ff0000', graphSegments);
            });
        });
    }

    // Удаление графа
    function hideGraph(){
        _.each(graphSegments, function(item){
            item.setMap(null);
        });
        graphSegments = [];

    }

    // Отрисовка пешего маршрута
    function drawWalking() {
        _.each(walkingGraph.nodes, function (node) {
            _.each(node.neighbours, function(neighbour){
                addPathSegment(node, neighbour.node, '#ff0000', graphSegments);
            });
        });
    }

    // Удаление пешего маршрута
    function hideWalking(){
        _.each(graphSegments, function(item){
            item.setMap(null);
        });
        graphSegments = [];

    }
    /*
     * LOGIC SECTION
     */

    // Получение ближайшего узла графа к заданным координатам
    function getClosestNode(latLng, graph) {
        var minDistance = Number.MAX_VALUE, minDistanceNode = {};
        _.each(graph.nodes, function (node) {
            var currentDistance = Geometry.getDistance(node, {lat: latLng.lat(), lng: latLng.lng()});
            if (currentDistance < minDistance) {
                minDistance = currentDistance;
                minDistanceNode = node;
            }
        });
        return minDistanceNode;
    }

    // Построение всех маршурутов
    function findShortestRoute() {
        findWalkingRoute();
        findTrainRoute();
    }

    // Построение пешего маршрута
    function findWalkingRoute() {
        var startNode = getClosestNode(startMarker.position, walkingGraph);
        var endNode = getClosestNode(endMarker.position, walkingGraph);
        dijkstra.setMatrix(walkingMatrix);
        var result = dijkstra.execute(startNode.id, endNode.id);
        var pathNodeIds = result.path;
        drawRoute(pathNodeIds, walkingGraph, '#00FF00');
        setWalkingInfo(result.totalDistance);
    }

    // Построение маршрута трамвая
    function findTrainRoute() {
        var startStation = getClosestNode(startMarker.position, trainGraph);
        var endStation = getClosestNode(endMarker.position, trainGraph);
        if (startStation == endStation) {
            // TODO:
        } else {

            var startPoint = getClosestNode(startMarker.position, walkingGraph);
            var startStationPoint = getClosestNode(new google.maps.LatLng(startStation.lat, startStation.lng), walkingGraph);

            var endPoint = getClosestNode(endMarker.position, walkingGraph);
            var endStationPoint = getClosestNode(new google.maps.LatLng(endStation.lat, endStation.lng), walkingGraph);

            dijkstra.setMatrix(walkingMatrix);
            var startWalkingResult = dijkstra.execute(startPoint.id, startStationPoint.id);
            var endWalkingResult = dijkstra.execute(endPoint.id, endStationPoint.id);

            dijkstra.setMatrix(trainMatrix);
            var trainResult = dijkstra.execute(startStation.id, endStation.id);
            var trainPathNodes = trainResult.path;

            drawRoute(startWalkingResult.path, walkingGraph, '#ff00ff');
            addPathSegment(_.findWhere(walkingGraph.nodes, {id: startWalkingResult.path.first()}), startStation, '#ff00ff');

            drawComplexRoute(trainPathNodes, trainGraph, '#0000FF');

            drawRoute(endWalkingResult.path, walkingGraph, '#ff00ff');
            addPathSegment(_.findWhere(walkingGraph.nodes, {id: endWalkingResult.path.first()}), endStation, '#ff00ff');

            setTrainInfo(trainResult.totalDistance, startWalkingResult.totalDistance, endWalkingResult.totalDistance);

        }

    }

    // Сброс маршрутов
    function resetRoute() {
        startMarker.setMap(null);
        endMarker.setMap(null);
        startMarker = false;
        endMarker = false;
        if (routePath) {
            routePath.setMap(null);
        }
    }


    /*
     * USER INTERFACE SECTION
     */

    // Установка маркера по клику мыши
    function setPoint(latLng) {
        if (!startMarker) {
            startMarker = new google.maps.Marker({
                position: latLng,
                map: map
            });
        } else {
            endMarker = new google.maps.Marker({
                position: latLng,
                map: map
            });
            findShortestRoute();
        }
    }

    // Обновление информации по пешему маршруту
    function setWalkingInfo(distance) {
        $('#walking-time').text(Math.round(distance / 80) + ' мин.');
        $('#walking-length').text(Math.round(distance) + ' метров');
    }

    // Обновление информации по маршруту трамвая
    function setTrainInfo(trainDistance, startStationDistance, endStationDistance) {
        var distance = trainDistance + startStationDistance + endStationDistance;
        $('#train-time').text(Math.round((startStationDistance + endStationDistance) / 83 + trainDistance / 416) + ' мин.');
        $('#train-length').text(Math.round(distance) + ' метров');
    }

    // Установка обрабочиков событий на изменение состояний чекбоксов
    $(document).ready(function () {
        var trainCheckbox = $('#show-train');
        var walkingCheckbox = $('#show-walking');
        var graphCheckbox = $('#show-graph');
        trainCheckbox.change(function () {
            options.trainVisibility = trainCheckbox.prop('checked');

        });

        walkingCheckbox.change(function () {
            options.walkingVisibility = walkingCheckbox.prop('checked');
        });

        graphCheckbox.change(function () {
            options.graphVisibility = graphCheckbox.prop('checked');
            if(options.graphVisibility){
                drawGraph();
            } else{
                hideGraph();
            }
        });
    });


    google.maps.event.addDomListener(window, 'load', initRouteMaker);
})();