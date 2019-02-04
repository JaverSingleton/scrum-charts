var Refresh = {

    start: function() {
        $.get("cache/invalidate")
            .done(function(data){
                location.reload();
            })
            .fail(function(data) {
                console.log(data);
            });
    },

    delayStart: function(interval = 10000) {
        setInterval(this.start, interval)
    }

}