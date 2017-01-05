function qsa(selectors, element) {
	//add: if not present, add "." before every word.
	if (!element) 
		element = document;
	return element.querySelectorAll(selectors);
}

function walkToNearest(walkerType, sourceElement, selector = "") {
	//NOTE: also present in Photos module
	//get nearest element to sourceEl that is a [walkerType] with [selectorClass].
	//returns Null if element not found.
	selector = (selector.startsWith(".")) ? selector : "." + selector;
	let node = sourceElement;
	while (node && node !== document.body) {
		if (node.matches(selector))
			return node;
		else
			node = node[walkerType];
	}	
	return null; //since node == null
}

function removeChildren(parentNode) {
	//childNodes is a LIVE list, so it re-indexes on each call
	while (parentNode.firstChild) {
		parentNode.removeChild(parentNode.firstChild);
	}
}


function wait(ms){
	var start = new Date().getTime();
	var end = start;
	while(end < start + ms) {
		end = new Date().getTime();
	}
}


function insertArrayAt(array, index, arrayToInsert) {
	Array.prototype.splice.apply(array, [index, 0].concat(arrayToInsert));
	//.apply calls a function with a given this value 
	//	and arguments provided as an array
	//example: .apply(thisArg, [argsArray])
	//array.splice(start, deleteCount, item1, item2, ...)
}






//useful, but ultimately I found changing rules this way didnt affect the drawn doc.
//instead, I get styles using window.getComputedStyle on an element.
function getCssRule(selector) {
	//returns {null, -1, -1} if rule not found
	let sheets = document.styleSheets;
	let rules = null;
	let foundRule = null;
	let foundSheetIndex = -1;
	let foundRulesIndex = -1;
	//work backwards through stylesheets
	//for (let s=0, slen=sheets.length; s<slen; s++) {
	for (let s=sheets.length-1; s>=0; s--) {
		//IE: sheets[i].rules, everything else: sheets[i].cssRules
		rules = (sheets[s].cssRules) ? sheets[s].cssRules : sheets[s].rules;
		for (let r=0, rlen=rules.length; r<rlen; r++) {
			if(rules[r].selectorText == selector) {
				foundRule = rules[r];
				foundRulesIndex = r;
				foundSheetIndex = s;
				break;
			}				
		}
		if (foundRule) break;
	}
	return { rule: foundRule, 
		sheetIndex: foundSheetIndex, 
		rulesIndex: foundRulesIndex };
}
