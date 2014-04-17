var dijkstra;
(function(){
    var matrix;         // матрица взешенного графа
    var distance = [];  // массив расстояний от стартового до остальных узлов
    var parents = [];   // массив родительских элементов маршрута

    // алгоритм Дейкстры (GR - матричное представление графа со взвешенными ребрами, st - номер начальной точки)
    function Dijkstra(GR, st) {
        parents = [];
        distance = [];
        var count, index, i, u;
        var visited = [];
        var V = GR.length;
        for (i=0; i<V; i++) {
            distance[i] = Number.MAX_VALUE;
            visited[i] = false;
            parents[i] = -1;
        }
        distance[st]=0;
        for (count=0; count<V-1; count++)
        {
            var min = Number.MAX_VALUE;
            for (i=0; i<V; i++){
                if (!visited[i] && distance[i]<=min)
                {
                    min=distance[i];
                    index=i;
                }
            }
            u = index;
            visited[u] = true;
            for (i=0; i<V; i++){

                if (!visited[i] && typeof GR[u][i] != 'undefined' && distance[u]!= Number.MAX_VALUE &&
                    distance[u]+GR[u][i]<distance[i]){
                    distance[i]=distance[u]+GR[u][i];
                    parents[i] = u;
                }
            }

        }
    }

    // Получение кратчайшего маршрута по родительским узлам
    var getShortestPath = function(endNodeId){
        var path = [];
        path.push(endNodeId);
        getPrevNodes(endNodeId, path);
        return path;
    };

    // Рекурсивное получение родительских узлов
    function getPrevNodes(nodeId, path){
        if(parents[nodeId]!=-1){
            path.push(parents[nodeId]);
            getPrevNodes(parents[nodeId], path);
        }
    }

    // Публичный метод для установки матрицы-графа
    var setMatrix = function(input){
        matrix = input;
    };

    // Публичный метод выполнения алгоритма Дейкстры
    var execute = function (startNodeId, endNodeId){
        Dijkstra(matrix, startNodeId);
        return {
            path: getShortestPath(endNodeId),
            totalDistance: distance[endNodeId]
        }
    };

    //
    dijkstra = {
        execute: execute,
        setMatrix: setMatrix
    };
})();