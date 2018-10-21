var redis = require('redis');
var client = redis.createClient();

function set(key, value, callback){
	client.set(key, value, (err,res) => {
		if(err){
			console.log(err);
			return;
		}
		callback(res);
		
	});
}
function get(key,callback){
	client.get(key, (err,res) =>{
		if(err){
			console.log(err);
			return;
		}
		callback(res); //chuan_jin_lai_de callback function 
		               //zai editorSocketService li_de (data) na_ge callback li
	});
}
function expire(key, timeInSeconds){
	client.expire(key, timeInSeconds);
}

function quit(){
	client.quit();
}

module.exports = {
	get:get,
	set:set,
	expire:expire,
	quit:quit,
	redisPrint: redis.print
}