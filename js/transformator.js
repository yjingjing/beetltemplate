String.prototype.toCharArray=function(){
	return this.split("");
}
//构造函数初始化
function Transformator(placeholderStart,placeholderEnd,startStatement,endStatement){
	//占位符开始标记 ${
	this.placeholderStart=placeholderStart;
	//占位符结束标记 }
	this.placeholderEnd=placeholderEnd;
	//语句开始标记 @
	this.startStatement=startStatement;
	//语句结束标记 null
	this.endStatement=endStatement;

	this.htmlTagStack = [];
	//是否追加回车符
	this.appendCR = false;
	this.vname = "";
	this.vnamesuffix = 0;
	this.textMap = new Map();
	//记录当前状态
	this.status = 1;
	// 最后转化的结果(输出)
	this.sb = "";
	// 输入
	this.cs = [];
	this.index = 0;
	this.lineStatus = new LineStatus();
	// 合并行的行数
	this.lineCount = 0;
	// 总共有多少行
	this.totalLineCount = 0;
	this.VCR = "<$__VCR>>";
	this.lineSeparator = "\n";
	this.MAX_LINE = 78;
	// 转义符号
	this.ESCAPE = '\\';
}
Transformator.prototype={
	enableHtmlTagSupport:function(tagStart,tagEnd,htmlTagBindingAttribute){
		//html开始标签<
		this.htmlTagStart=tagStart;
		//html结束标签</
		this.htmlTagEnd=tagEnd;
		//html属性名 var
		this.htmlTagBindingAttribute=htmlTagBindingAttribute;
		this.isSupportHtmlTag=true;
	},
	transform:function(str){
		//将str转换为字符数组
		this.cs=str.toCharArray();
		this.findCR();
		this.checkAppendCR();
		//解析str
		this.parser();
		console.log(this.sb);
		return this.sb.toString();
	},
	findCR:function(){
		var cr="";
		for(var i=0;i<this.cs.length;i++){
			if(this.cs[i]=='\n' || this.cs[i]=='\r'){
				cr+=this.cs[i];
				if(this.cs.length!=(i+1)){
					//判断是否有\r\n换行符
					var next=this.cs[i]=='\r'?'\n':'\r';
					if(this.cs[i+1]==next){
						cr+=next;
					}
				}
				this.lineSeparator=cr.toString();
				return;
			}
		}
	},
	checkAppendCR:function(){
		if(this.endStatement==null){
			this.appendCR=true;
		}else if(this.endStatement.indexOf("\n")!=-1){
			this.appendCR=true;
		}else if(this.endStatement.indexOf("\r")!=-1){
			this.appendCR=true;
		}else{
			this.appendCR=false;
		}
	},
	parser:function(){
		while(true){
			switch(this.status){
				case 1:
					// 1 解析在文本处
					this.readCommonString();
					break;
				case 2:
					//2 解析在控制语句处
					this.readStatement();
					break;
				case 3:
					//3 解析在占位符号里 
					this.readPlaceholder();
					break;
				case 5:
					//5,html tag begin 
					this.readHTMLTagBegin();
					break;
				case 6:
					//6 html tag end
					this.readHTMLTagEnd();
					break;
				case 4:
					//4文件结束
					return;
			}
		}
	},
	// 1 解析在文本处
	readCommonString:function(){
		var temp="";
		var hasLetter=false;
		var hasCheck=false;
		while(this.index<=this.cs.length){
			//匹配占位符开始标记
			if(this.matchStr(this.placeholderStart)){
//				console.log('placeholderstart');
				if(this.isEscape(temp,this.index)){
					temp+=this.cs[this.index++];
					continue;
				}
				if(temp.length!=0){
					if(this.lineCount>=1){
						this.createMutipleTextNode(temp);
						this.lineCount=0;
					}else{
						this.createTextNode(temp);
					}
				}
				this.status=3;
				return;
			}else if(this.matchStr(this.startStatement)){
				//匹配控制语句开始标记
//				console.log('startStatement');
				if(this.isEscape(temp,this.index)){
					temp+=this.cs[this.index++];
					continue;
				}
				if(temp.length!=0){
					if(this.lineCount>=1){
						this.createMutipleLineTextNode(temp);
						this.lineCount=0;
					}else{
						this.createTextNode(temp);
					}
				}
				this.status=2;
				return;
			}else if(this.isSupportHtmlTag && this.matchStr(this.htmlTagEnd)){
				//匹配html结束标签
//				console.log('htmlTagEnd');
				if(temp.length!=0){
					if(this.lineCount>=1){
						this.createMutipleLineTextNode(temp);
						this.lineCount=0;
					}else{
						this.createTextNode(temp);
					}
				}
				this.index=this.index+this.htmlTagEnd.length;
				this.status=6;
				return;
			}else if(this.isSupportHtmlTag && this.matchStr(this.htmlTagStart)){
				//匹配html开始标签
//				console.log('htmlTagStart');
				if(temp.length!=0){
					if(this.lineCount>=1){
						this.createMutipleTextNode(temp);
						this.lineCount=0;
					}else{
						this.createTextNode(temp);
					}
				}
				//把状态置为5，开始读取html标签
				this.status=5;
				this.index=this.index+this.htmlTagStart.length;
				return;
			}else if(this.status!=4){
				var ch=this.cs[this.index++];
				if(ch=='\r' || ch=='\n'){
					this.totalLineCount++;
					this.skipCR(ch);
					if(!hasLetter && this.lineStatus.onlyText()){
						//多行，直到碰到占位符号才停止
						temp+=this.lineSeparator;
						this.lineCount++;
						this.lineStatus.reset();
						continue;
					}
					if(this.lineStatus.onlyStatment()){
						if(temp.length!=0)
							this.createTextNode(temp);
						this.reformatStatementLine();
						this.lineStatus.reset();
						this.sb+=this.lineSeparator;
						continue;
					}else{
						this.lineCount++;
						this.lineStatus.reset();
						temp+=this.lineSeparator;
						continue;
					}
				}else{
					if(!hasCheck && ch!=' ' && ch!='\t'){
						hasLetter=true;
						hasCheck=true;
					}
					temp+=ch;
				}
			}else{
				break;
			}
		}
		if(temp.length!=0)
			this.createTextNode(temp);
		this.status=4;
		return;
	},
	//2 解析在控制语句处
	readStatement:function(){
		this.index=this.index+this.startStatement.length;
		this.lineStatus.setStatement();
		while(this.index<this.cs.length){
			if(this.endStatement!=null && this.matchStr(this.endStatement)){
				//如果前面是一个转义字符
				if(this.isEscape(this.sb,this.index)){
					this.sb+=this.cs[this.index++];
					continue;
				}
				this.index=this.index+this.endStatement.length;
				this.status=1;
				if(this.appendCR){
					this.lineStatus.setStatement();
					if(this.lineStatus.onlyStatment()){
						//只有控制语句，则如果文本变量都是空格，
						//这些文本变量则认为是格式化的，非输出语句
						//需要更改输出
						this.reformatStatementLine();
						this.lineStatus.reset();
						this.sb+=this.endStatement;
					}
				}else{
					this.lineStatus.setStatement();
				}
				return;
			}else if(this.status!=4){
				var ch=this.cs[this.index++];
				if(ch=='\r' || ch=='\n'){
					this.totalLineCount++;
					this.sb+=this.lineSeparator;
					this.skipCR(ch);
					if(this.lineStatus.onlyStatment()){
						this.reformatStatementLine();
						this.lineStatus.reset();
					}
					if(this.endStatement==null){
						this.status=1;
						return;
					}
				}else{
					this.sb+=ch;
				}
			}else{
				break;
			}
		}
		this.status=4;
	},
	//3 解析在占位符号里 
	readPlaceholder:function(){
//		console.log('readPlaceholder');
		this.index=this.index+this.placeholderStart.length;
		this.lineStatus.addHolderCount();
		this.sb+="<<";
		while(this.index<=this.cs.length){
			if(this.matchStr(this.placeholderEnd)){
				//如果前面是一个转义字符
				if(this.isEscape(this.sb,this.index)){
					this.sb+=this.cs[this.index++];
					continue;
				}
				this.index=this.index+this.placeholderEnd.length;
				this.sb+=">>";
				this.status=1;
				return;
			}else if(this.status!=4){
				this.sb+=this.cs[this.index];
				this.index++;
			}else{
				break;
			}
		}
		this.status=4;
	},
	//5,html tag begin 
	readHTMLTagBegin:function(){
		//读开始标签
		var tagName=null;
		try{
			var script="";
			var html=new HTMLTagParser(this.cs,this.index,this.htmlTagBindingAttribute,true);
			html.parser();
			if(html.hasVarBinding){
				script+="htmltagvar";
			}else{
				script+="htmltag";
			}
			tagName=html.getTagName();
			script+="('"+tagName+"',";
			var map=html.getExpMap();
			var quat=html.getQuatMap();
			if(map.size()!=0){
				script+="{";
			}
			for(var i in map.entrySet){
				var key=i;
				var value=map.get(key);
//				if(html.crKey.contains(key)){
//					script+=this.lineSeparator;
//				}
				script+=key+":";
				var attrValue=this.parseAttr(quat.get(key),value);
				script+=attrValue;
				script+=",";
			}
			script=script.substring(0,script.length-1);
			if(map.size()!=0){
				script+="}";
			}
			if(html.hasVarBinding){
				if(map.size()==0){
					script+=",{}";
				}
				if(html.varBindingStr.trim().length==0){
					var defaultVarName=null;
					var index=tagName.lastIndexOf(":");
				}else{
					script+=",'"+html.varBindingStr+"'";
				}
			}
			script+="){";
			if(html.emptyTag()){
				script+"}";
			}else{
				this.htmlTagStack.push(tagName);
			}
			this.sb+=script;
			this.index=html.getIndex();
			this.status=1;
			this.lineStatus.setStatement();
		}catch(e){
			if(tagName==null){
				tagName="未知标签";
			}
		}
	},
	//6 html tag end
	readHTMLTagEnd:function(){
		var tagName=null;
		try{
			var html=new HTMLTagParser(this.cs,this.index,this.htmlTagBindingAttribute,false);
			html.parser();
			tagName=html.getTagName();
			if(this.htmlTagStack.length==0){
				console.log("解析html tag出错");
			}
			var lastTag=this.htmlTagStack[this.htmlTagStack.length-1];
			if(tagName==lastTag){
				this.htmlTagStack.pop();
				this.sb+="}";
			}else{
				console.log("解析html tag出错，期望匹配标签"+lastTag);
			}
			this.index=html.getIndex();
			this.status=1;
			this.lineStatus.setStatement();
		}catch(e){
			if(tagName==null){
				tagName="未知标签";
			}
		}
	},
	//匹配字符串
	matchStr:function(expectedStr){
		var i=0;
		while(i<expectedStr.length){
			if(this.cs.length==(this.index+i)){
				this.status=4;
				return false;
			}
			if(this.cs[this.index+i]!=expectedStr[i]){
				return false;
			}
			i++;
		}
		return true;
	},
	createTextNode:function(str){
		if(str.length==0){
			return;
		}
		var name=this.getNewVarName();
		this.textMap.put(parseInt(name),str.toString());
		var textVarName="<$"+name+">>";
		if(this.isSpace(str)){
			this.lineStatus.addSpaceText(this.sb.length,this.sb.length+textVarName.length);
		}else{
			this.lineStatus.addTextCount();
		}
		this.sb+=textVarName;
		str="";
	},
	//是否包含空格
	isSpace:function(str){
		for(var c in str.toString().toCharArray()){
			if(c!=' ' && c!='\t'){
				return false;
			}
		}
		return true;
	},
	getNewVarName:function(){
		return this.vname+this.vnamesuffix++;
	},
	isEscape:function(temp,index){
		if(index!=0 && this.cs[index-1]==this.ESCAPE){
			if(index>=2 && this.cs[index-2]==this.ESCAPE){
				//两个转义符号，删除一个
				if(temp.length!=0){
					temp=temp.subString(0,temp.length-1);
				}
				return false;
			}else{
				if(temp.length!=0)
					temp=temp.subString(0,temp.length-1);
				return true;
			}
		}else{
			return false;
		}
	},
	skipCR:function(c){
		if(this.index<this.cs.length){
			var o=this.cs[this.index];
			if(c=='\r' && o=='\n'){
				this.index++;
			}else if(c=='\n' && o=='\r'){
				this.index++;
			}
		}
	},
	reformatStatementLine:function(){
		var count=this.lineStatus.getSpaceCount();
		for(var i=count-1;i>=0;i--){
			var start=this.lineStatus.getSpaceTextStart(i);
			var end=this.lineStatus.getSpaceTextEnd(i);
			var varName=this.sb.substring(start+2,end-2);
			var orgText=this.textMap.get(parseInt(varName));
			this.sb.replace(start,end,orgText);
		}
		this.lineStatus.reset();
	},
	createMutipleLineTextNode:function(str){
		var index=str.lastIndexOf(this.lineSeparator);
		var firstPart=str.substring(0,index);
		var secondPart=str.substring(index+this.lineSeparator.length);
		if(this.isSpace(secondPart)){
			this.createTextNode(firstPart+this.lineSeparator);
			for(var i=0;i<this.lineCount;i++){
				this.sb+=this.lineSeparator;
			}
			this.createTextNode(secondPart);
		}else{
			this.createTextNode(str);
			for(var i=0;i<this.lineCount;i++){
				this.sb+=this.lineSeparator;
			}
		}
		str="";
	},
	parseAttr:function(q,attr){
		var sb="";
		var start=0,end=0,index=-1;
		while((index=attr.indexOf(this.placeholderStart,start))!=-1){
			var holdStart = index;
			while( (end = attr.indexOf(this.placeholderEnd,holdStart))!=-1){
				if(attr.charAt(end-1)=='\\'){
					//非占位结束符号
					holdStart = end+1;
					continue;
				}else{
					break;
				}
			}
			if (end == -1)
				console.log(attr + "标签属性错误，有站位符号，但找不到到结束符号");
			if (index != 0){
				// 字符串
				sb+=q+attr.substring(start,index)+q+"+";
			}
			// 占位符号
			var value = attr.substring(index + this.placeholderStart.length(), end);
			value = value.replace("\\}","}");
			sb+="("+value+")"+"+";
			start = end + 1;
		}
		if (start == 0){
			//全字符串
			return sb+=q+attr+q;
		}
		if (start != attr.length){
			// 最后一个是字符串
			sb+=q+attr.substring(start,attr.length)+q;
		}else{
			//删除“＋”
			sb.substring(0,sb.length-1);
		}
		return sb;
	}
}
//函数执行体
var c='\\';
var p=new Transformator("${","}","<!--:","-->");
p.enableHtmlTagSupport("<","</","var");
try{
	var str="@var a=1;\n@var b=1;";
	var str2="<html>\n\t<head>\n\t</head></html>";
//	var str3='<meta charset="UTF-8"></meta>';
//	<#bbsListTag a='1' \nc='${ kk }' var='page,dd' >hello ${a}</#bbsListTag>
//	var str4="<bbsListTag a='1' c='2' var='page,dd' >hello${a}</bbsListTag>";
	var str1='<html>\n\t<head>\n\t\t<meta charset="UTF-8"/>\n\t\t<title>列表页</title>\n\t</head>\n\t<body>\n\t\t<div class="container-fluid">\n\t\t\t<table class="table table-bordered text-center">\n\t\t\t\t<tr class="thead">\n\t\t\t\t\t<!--:for(var item in table){-->\n\t\t\t\t\t<td>${item.name}</td>\n\t\t\t\t\t<!--:}-->\n\t\t\t\t</tr>\n\t\t\t</table>\n\t\t</div>\n\t</body>\n</html>';
	var str5='<tr class="thead">\n\t<!--:for(var item in table){-->\n\t<td>${item.name}</td>\n\t<!--:}-->\n</tr>';

	p.transform(str1);
	
}catch(e){
	
}
