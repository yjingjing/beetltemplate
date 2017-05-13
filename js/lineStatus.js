//记录一行出现的控制语句，占位符号，以及用于格式化的空格，tab符号
function LineStatus(){
	//当前非空格符号个数
	this.textCount=0;
	//当前行控制语句个数
	this.statementCount=0;
	//当前行占位符号个数
	this.holderCount=0;
	//当前行用于格式化的空格所在sb的索引位置
	this.startTextIndexList=[];
	this.endTextIndexList=[];
	this.lineCount=0;
}
LineStatus.prototype={
	//是否只有控制语句
	onlyStatment:function(){
		return this.statementCount!=0 && this.holderCount==0;
	},
	//本行是否只有文本
	onlyText:function(){
		return this.holderCount==0 && this.statementCount==0;
	},
	//文本字符数增加
	addTextCount:function(){
		this.textCount++;
	},
	addHolderCount:function(){
		this.holderCount++;
	},
	//表示该行有statement
	setStatement:function(){
		this.statementCount=1;
	},
	addSpaceText:function(start,end){
		this.startTextIndexList.push(start);
		this.endTextIndexList.push(end);
	},
	getSpaceTextStart:function(i){
		return this.startTextIndexList[i];
	},
	getSpaceTextEnd:function(i){
		return this.endTextIndexList[i];
	},
	getSpaceCount:function(){
		return this.startTextIndexList.length;
	},
	getTextCount:function(){
		return this.textCount;
	},
	//把当前对象所有数据初始化
	reset:function(){
		this.textCount=0;
		this.statementCount=0;
		this.holderCount=0;
		this.startTextIndexList.splice(0,this.startTextIndexList.length);
		this.endTextIndexList.splice(0,this.endTextIndexList.length);
	}
}