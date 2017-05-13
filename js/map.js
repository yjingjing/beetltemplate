//使用js模拟Map
function Map(){
	this.obj={};
	this.count=0;
}
Map.prototype={
	put:function(key,value){
		var oldValue=this.obj[key];
		if(oldValue==undefined){
			this.count++;
		}
		this.obj[key]=value;
	},
	get:function(key){
		return this.obj[key];
	},
	remove:function(key){
		var oldValue=this.obj[key];
		if(oldValue!=undefined){
			this.count--;
			delete(this.obj[key]);
		}
	},
	size:function(){
		return this.count;
	}
}