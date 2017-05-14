function Tag(){
	this.args=[];
	this.gt=new GroupTemplate;
	this.ctx=new Context();
	this.bs=new Statement();
}
Tag.prototype={
	doBodyRender:function(){
		this.bs.excute(ctx);
	},
	getBodyContent:function(){
		var writer=this.ctx.byteWrite;
		var tempWriter=this.ctx.byteWriter.getTempWriter(writer);
		this.ctx.byteWriter=tempWriter;
		this.doBodyRender();
		this.ctx.byteWriter=writer;
		return tempWriter.getTempConent();
	},
	init:function(ctx,args,st){
		this.ctx=ctx;
		this.bw=this.ctx.byteWriter;
		this.gt=this.ctx.gt;
		this.args=args;
		this.bs=st;
	},
	render:function(){
		
	}
}
function includeTag(){
	this.tag=Tag;
	this.tag();
}
includeTag.prototype={
	render:function(){
		
	},
	getRelResourceId:function(){
		
	}
}
function HTMLTagSupportWrapper(){
	this.tag=Tag;
	this.tag();
	this.tagRoot=null;
	this.tagSuffix=null;
}
HTMLTagSupportWrapper.prototype={
	render:function(){
		
	},
	getHtmlTagResourceId(child){
		
	},
	callHtmlTag:function(path){
		
	},
	callTag:function(tagFactory){
		
	},
	init:function(ctx,args,st){
		
	}
}
