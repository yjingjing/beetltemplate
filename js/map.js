//使用js模拟Map
function Map(){
	this.entrySet={};
	this.count=0;
}
var proto=Map.prototype={
	put:function(key,value){
		var oldValue=this.entrySet[key];
		if(oldValue==undefined){
			this.count++;
		}
		this.entrySet[key]=value;
	},
	get:function(key){
		return this.entrySet[key];
	},
	remove:function(key){
		var oldValue=this.entrySet[key];
		if(oldValue!=undefined){
			this.count--;
			delete(this.entrySet[key]);
		}
	},
	size:function(){
		return this.count;
	},
	isEmpty:function(){
		return this.count===0;
	},
	containsKey:function(key){
		if(this.isEmpty()){
			return false;
		}
		for(var proto in this.entrySet){
			if(prop===key){
				return true;
			}
		}
		return false;
	},
	containsValue:function(value){
		if(this.isEmpty()){
			return false;
		}
		for(var key in this.entrySet){
			if(this.entrySet[key]===value){
				return true;
			}
		}
		return false;
	},
	keySet:function(){
		var result=[];
		for(var key in this.entrySet){
			result.push(key);
		}
		return result;
	}
}