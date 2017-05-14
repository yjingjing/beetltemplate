String.prototype.toCharArray=function(){
	return this.split("");
}
//解析html标签（初始化对象属性）
function HTMLTagParser(cs,index,bindingAttr,isStart){
	//要解析的字符串数组
	this.cs=cs;
	//起始下标
	this.index=index;
	//绑定属性
	this.bindingAttr=bindingAttr;
	//解析的是否是开始标签
	this.isStart=isStart;
	//开始下标和结束下标
	this.ts=this.te=index;
	
	this.crKey=[];
	this.expMap=new Map();
	this.quatMap=new Map();
	//是否有var属性
	this.hasVarBinding=false;
	this.varBindingStr=null;
	//当前状态
	this.status=0;
	//是否是空标签
	this.isEmptyTag=false;
	this.tagName=null;
	
	this.lastKey=null;
	//标签结束标记
	this.END_TAG='>';
	this.END_TAGS=['/','>'];
}
HTMLTagParser.prototype={
	//解析标签
	parser:function(){
		if(this.isStart){
			//解析开始标签
			this.parserStart();
		}else{
			//解析结束标签
			this.parserEnd();
		}
	},
	parserStart:function(){
		//1.找到标签名
		this.findTagName();
		//2.找到属性
		this.findAttrs();
		this.findBindingFlag();
		if(this.status!=-1){
			this.findVars();
		}
		//5.标签闭合
		this.endTag();
	},
	parserEnd:function(){
		this.findTagName();
		if(this.matchStr('>')){
			this.move(1);
		}else{
			console.log(this.tagName+'结束标签格式错误');
		}
	},
	//找到标签名
	findTagName:function(){
		this.idToken();
		if(this.status==-1){
			console.log('非法标签名');
		}
		var tagSb=this.subString();
		//下标后移同时重置status状态
		this.t_consume();
		while(this.matchStr(':')){
			//未完待续
			console.log('a');
		}
		//得到标签名
		this.tagName=tagSb.toString();
	},
	//找到属性
	findAttrs:function(){
		this.findAttr();
		while(this.status!=-1){
			if(this.matchStr(' ')||this.matchCR()){
				this.findAttr();
			}else{
				return;
			}
		}
		this.t_recover();
	},
	findBindingFlag:function(){
		this.stripSpace();
		if(!this.matchStr(';')){
			this.status=-1;
			return;
		}
		this.move(1);
		this.hasVarBinding=true;
	},
	findVars:function(){
		this.stripSpace();
		this.idToken();
		var sb = "";
		while (this.status != -1){
			sb+=this.subString();
			this.t_consume();
			this.stripSpace();
			if (this.matchStr(',')){
				this.move(1);
				this.stripSpace();
				this.idToken();
				sb+=",";
			}else{
				break;
			}
		}
		this.t_consume();
		if (sb.length!= 0){
			this.varBindingStr = sb.toString();
		}
	},
	endTag:function(){
		this.stripSpace();
		if(this.matchStr(this.END_TAG)){
			this.move(1);
			this.isEmptyTag=false;
		}else if(this.matchArr(this.END_TAGS)){
			this.isEmptyTag=true;
			this.move(2);
		}else{
			var illegal=this.cs[this.index];
			if(illegal=='\r' || illegal=='\n'){
				console.log('标签未正确结束：'+this.tagName+',碰到换行符号');
			}else{
				console.log("标签未正确结束："+this.tagName+",碰到非法符号'"+this.cs[this.index]+"'");
			}
		}
	},
	idToken:function(){
		if(this.ts>this.cs.length){
			console.log('解析错误');
		}
		var c=this.cs[this.ts];
		if(this.isID(c)){
			//标签名首位必须字母
			var i=1;
			while(this.ts<this.cs.length){
				c=this.cs[this.ts+i];
				if(this.isID(c) || this.isDigit(c)){
					i++;
					continue;
				}else{
					break;
				}
			}
			this.t_forward(i);
		}else{
			this.status=-1;
		}
	},
	isID:function(c){
		if((c>='a' && c<='z') || (c>='A' && c<='Z')){
			return true;
		}else{
			return false;
		}
	},
	isDigit:function(c){
		return c>'0' && c<'9';
	},
	//迁移token指针
	t_forward:function(forward){
		this.te=this.ts+forward;
	},
	//token指针生效
	t_consume:function(){
		this.index=this.te;
		this.ts=this.te;
		this.status=0;
	},
	t_recover:function(){
		this.ts=this.te=this.index;
	},
	//当前下标对应的字符是否匹配c
	matchStr:function(c){
		if(this.cs[this.index]==c){
			return true;
		}else{
			return false;
		}
	},
	findAttr:function(){
		var findCR=this.stripSpaceAndCR();
		this.idToken();
		if(this.status==-1){
			return;
		}
		this.lastKey=this.subString();
		this.t_consume();
		this.stripSpace();
		if(this.matchStr('=')){
			this.move(1);
			var isSingleQuat=this.strToken();
			var value=this.subString();
			this.t_consume();
			this.move(1);
			if(this.lastKey == this.bindingAttr){
				this.hasVarBinding=true;
				this.varBindingStr=value;
				return;
			}
			var lastKey=this.lastKey;
			this.quatMap.put(lastKey,isSingleQuat?'\'':'\"');
			this.expMap.put(lastKey,value);
			if(findCR)
				this.crKey.push(lastKey);
		}else{
			console.log("没有找到属性");
		}
	},
	//去除空格和回车换行符
	stripSpaceAndCR:function(){
		this.ts=this.index;
		var i=0;
		var findCR=false;
		while(this.ts<this.cs.length){
			var c=this.cs[this.ts+i];
			if(c==' ' || c=='\t'){
				i++;
				continue;
			}else if(c=='\n' || c=='\r'){
				i++;
				findCR=true;
			}else{
				break;
			}
		}
		this.ts=this.ts+i;
		this.te=this.ts;
		this.index=this.te;
		return findCR;
	},
	//去除空格
	stripSpace:function(){
		this.ts=this.index;
		var i=0;
		while(this.ts<this.cs.length){
			var c=this.cs[this.ts+i];
			if(c==' ' || c=='\t' || c=='\n' || c=='\r'){
				i++;
				continue;
			}else{
				break;
			}
		}
		this.ts=this.ts+i;
		this.te=this.ts;
		this.index=this.te;
	},
	//截取字符串
	subString:function(){
		return this.cs.join("").substring(this.ts,this.te);
	},
	move:function(i){
		this.index=this.index+i;
		this.ts=this.te=this.index;
		this.status=0;
	},
	strToken:function(){
		this.stripSpace();
		if(this.matchStr('\'')){
			this.move(1);
			this.findOneChar('\'');
			if(this.status==-1){
				console.log("错误的属性，缺少'");
			}
			return true;
		}else if(this.matchStr('\"')){
			this.move(1);
			this.findOneChar('\"');
			if(this.status==-1){
				console.log("错误的属性，缺少\"");
			}
			return false;
		}else{
			console.log("属性必须使用双引号或者单引号");
		}
	},
	findOneChar:function(c){
		var i=0;
		while((this.ts+i)<this.cs.length){
			var ch=this.cs[this.ts+i];
			if(ch!=c){
				i++;
				if(ch=='\n' || ch=='\r'){
					this.status=-1;
					this.t_recover();
					return;
				}
			}else{
				this.t_forward(i);
				return;
			}
		}
		this.status=-1;
		this.t_recover();
		return;
	},
	
	matchCR:function(){
		if(this.index<this.cs.length){
			if(this.cs[this.index]=='\r' || this.cs[this.index]=='\n')
				return true;
		}
		return false;
	},
	matchArr:function(expectedarr){
		var i=0;
		while(this.index+i<this.cs.length && i<expectedarr.length){
			if(this.cs[this.index+i]!=expectedarr[i])
				return false;
			i++;
		}
		if(i==expectedarr.length)
			return true;
		else
			return false;
	},
	//获取标签名
	getTagName:function(){
		return this.tagName;
	},
	//获取属性键值对
	getExpMap:function(){
		return this.expMap;
	},
	//获取当前下标
	getIndex:function(){
		return this.index;
	},
	emptyTag:function(){
		return this.isEmptyTag;
	},
	getQuatMap:function(){
		return this.quatMap;
	}
}
//var input="<#bbsListTag a='1' \nc='${ kk }' var='page,dd' >hello ${a}</#bbsListTag>";
//var htmltag=new HTMLTagParser(input.toCharArray(),2,"var",true);
//htmltag.parser();
//console.log(htmltag.getTagName());
//console.log(htmltag.getExpMap());
//console.log(htmltag.emptyTag());
//console.log(htmltag.hasVarBinding);
//console.log(htmltag.varBindingStr);