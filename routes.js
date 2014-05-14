module.exports = function(app) {

	app.get("/", function(req, res) {
  		res.sendfile("index.html");
	});

	app.get("/location.html", function(req, res) {
  		res.sendfile("location.html");
	});

	app.get("/map.html", function(req, res) {
    	res.sendfile("map.html");
	});

	app.get("/inputs.html", function(req, res) {
    	res.sendfile("inputs.html");
	});

	app.get("/mapjs.js", function(req, res) {
    	res.sendfile("mapjs.js");
	});
}