function GrammarToken(text,line,col){
	this.text=text;
	this.line=line;
	this.col=col;
}
GrammarToken.prototype={
	createToken:function(tagName,line){
		return new GrammarToken(tagName,line,1);
	}
}
