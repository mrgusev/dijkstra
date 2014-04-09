var dijkstra;
var parents = [];
(function(){
    var matrix;
    var distance = [];
    var execute = function (startNodeId, endNodeId){
        var result = {
            nodeSequence: [],
            totalDistance: 0,
            calculationTime: 0
        };

        //-------
        Dijkstra(matrix, startNodeId);
        return {
            path: getShortestPath(endNodeId),
            totalDistance: distance[endNodeId]
        }
    };

    function Dijkstra(GR, st)
    {
        parents = [];
        distance = [];
        var count, index, i, u, m = st+1;
        var visited = [];
        var V = GR.length;
        for (i=0; i<V; i++)
        {
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


    var getShortestPath = function(endNodeId){
        var path = [];
        path.push(endNodeId);
        getPrevNodes(endNodeId, path);
        return path;
    };

    function getPrevNodes(nodeId, path){
        if(parents[nodeId]!=-1){
            path.push(parents[nodeId]);
            getPrevNodes(parents[nodeId], path);
        }
    }

    function checkNode(currentNode){
        if(!currentNode.checked){
            _.each(currentNode.neighbours, function(neighbour){
                var pathDistance = currentNode.value + neighbour.distance;
                if(!neighbour.node.checked && neighbour.node.value > pathDistance){
                    neighbour.node.value = pathDistance;
                    neighbour.node.prevNode = currentNode;
                }
            });

            currentNode.checked = true;
            var sortedNeighbours = _.sortBy(currentNode.neighbours, function(neighbour){
               return neighbour.node.value;
            });

            _.each(sortedNeighbours, function(neighbour){
                checkNode(neighbour.node);
            });
        }
    }
    var setMatrix = function(input){
        matrix = input;
    };

    dijkstra = {
        execute: execute,
        setMatrix: setMatrix
    };
})();