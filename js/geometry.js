var Geometry = {
    rad : function(x) {
        return x * Math.PI / 180;
    },
    getDistance : function(node1, node2) {
        var R = 6378137; // Earth’s mean radius in meter
        var dLat = this.rad(node2.lat - node1.lat);
        var dLong = this.rad(node2.lng - node1.lng);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.rad(node1.lat)) * Math.cos(this.rad(node2.lat)) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meter
    }
};