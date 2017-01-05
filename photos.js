
"use strict";
//dependancies:
//	common.js	???

//MODULE FORMAT: 
//	global declarations
//	entry, exit & initializer functions
//	helper functions
//	worker functions
//	main event handler functions
//	toolbar event handler functions
//	toolbar functions
//	exposure of public properties & methods


var PHOTOS = (function() {

// =====  GLOBAL DECLARATIONS  =============================================
	var Photo = function(obj) {
		this.node = obj;
	};
	
	var photos = [];	//reassigned to new Photos after initPhotos();
	var config = {
		ifrm: null,
		doc: null,
		main: null, //document.querySelector(".pe_main")
		toolbar: null,
		entryPoint: {node: null, display: ""},
		cssUrl: "../app/photos.css"
	}




// =====  ENTRY & EXIT POINTS  ===========================================
// =======================================================================
	
	function replace(nodeToReplace) {
		//ENTRY POINT FOR A NEW INSTANCE
		config.entryPoint.node = nodeToReplace;
		config.entryPoint.display = nodeToReplace.style.display;
		nodeToReplace.style.display = "none";
		//append new iframe
		let ifrm = document.createElement("iframe");
		ifrm.style.width = "100%";
		ifrm.style.height = "100%";
		nodeToReplace.parentNode.appendChild(ifrm);	
		//let docContent = '<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="photos.css"></head><body><header class="pe_toolbar"></header><main class="pe_main"></main></body></html>';
		let docContent = '<!DOCTYPE html><html><head></head><body class="app"><header class="pe_toolbar"></header><main class="pe_main"></main></body></html>';
		//debugger;

		//onload event will fire after writing to document for the first time.
		ifrm.onload = function() { 	
			//debugger;
			//continue with module init only after loading css into iframe
			loadCSS(config.cssUrl, config.doc, init());
			//init(); 			
		};
		
		config.ifrm = ifrm;	
		config.doc = ifrm.contentDocument;
		if (!config.doc)
			config.doc = ifrm.contentWindow.document;
		config.doc.open();
		config.doc.write(docContent);
		config.doc.close(); // .close() fires .onload event		
	}

	function init() {
		//debugger;
		config.main = config.doc.querySelector(".pe_main");
		config.toolbar = config.doc.querySelector(".pe_toolbar");
		
		//set up global objects and event listeners
		initPhotoObject();
		initPhotosConstructor();
		//bind ui events
		config.main.addEventListener("click", function(e) { clickHandler(e); }, false );
		config.main.addEventListener("dblclick", function(e) { dblClickHandler(e); }, false);
		config.main.addEventListener("keydown", function(e) { keydownHandler(e); }, false);

		//initialize toolbar & bind toolbar events
		initToolbar();
		//config.toolbar.addEventListener("click", function(e) { toolbarClickHandler(e); }, false);

		demoStuff();
	}

	function destroy() {
		//debugger;
		//EXIT POINT FOR INSTANCE
		//destroy iframe
		config.ifrm.parentNode.removeChild(config.ifrm);
		//show hidden container with original display style
		config.entryPoint.node.style.display = config.entryPoint.display;
		//push data into hidden container (config.entryPoint)
		config.entryPoint.node.textContent = "data from [PHOTOS] module";		
	}



	function demoStuff() {
		//=   debugging & demo stuff =
		
		//debugger;
		let imgs = Array(3).fill("../app/no-img.jpg");
		let captions = Array(3).fill("caption #");	
		for (let i=0,len=captions.length; i<len; i++) { captions[i]+=i; }
		let newPhotos = createPhotos(imgs, captions);



		let section = addNewSection("my new section");
		insertPhotos(section, newPhotos);
	}












// =====  INIT ===============================================================
// ===========================================================================

	function loadCSS(url, doc, callback){
		//let link = document.createElement('link');
		let link = doc.createElement('link');
		link.type = 'text/css';
		link.rel = 'stylesheet';
		link.href = url;
		//document.getElementsByTagName('head')[0].appendChild(link);
		doc.getElementsByTagName('head')[0].appendChild(link);
		//let img = document.createElement('img');
		let img = doc.createElement('img');
		img.onerror = function(){
		    if(callback) callback();
		    else console.log("CSS LOADED into " + doc + " from " + url);
		}
		img.src = url;	//HACK: always creates an error, but only ONCE LOADED
	}

	function initPhotoObject() {
		//add properties and methods to Photo constructor
		Photo.prototype = {
			isSelected: function() {
				return this.node.classList.contains("pe_selected") ? true : false;
			},
			get caption() {
				return this.node.querySelector(".pe_caption").textContent;
			},
			set caption(txt) {
				this.node.querySelector(".pe_caption").textContent = txt;
			}
		};
	}

	function initPhotosConstructor() {
		//add properties and methods to Photos constructor
		
		var _Photos = function() {};
		_Photos.prototype = Array.prototype;

		var Photos = function() {
			this.selected = []; 
			//flat 2-point array: obj1, clickType, obj2, clickType,...
		};
		Photos.prototype = new _Photos();
		Photos.prototype.selectAll = function() {
			this.forEach(function(el, index, arr) {
				el.select();
			});
		};
		Photos.prototype.deselectAll = function() {
			//selected is a flat 2-point array
			//iterate backwards in steps of 2
			for (let i=this.selected.length-2; i>=0; i-=2) {
				this.deselect(this.selected[i]);
			}
		};
		Photos.prototype.select = function(obj, clickType) {
			//can pass an object or array index from caller
			//NOTE: doesnt retrieve item from photos[] - 
			//	works directly on passed object
			if (typeof(obj) === "number")
				obj = this[obj].node;
			obj.classList.add("pe_selected");
			this.selected.push(obj, clickType);
		};
		Photos.prototype.deselect = function(obj) {
			//can pass an object or array index from caller
			//NOTE: doesnt retrieve item from photos[] - 
			//	works directly on passed object
			if (typeof(obj) === "number")
				obj = this[obj].node;
			obj.classList.remove("pe_selected");
			//splice out 2 items from selected: obj + clickType
			this.selected.splice(this.selected.indexOf(obj), 2);
		};
		Photos.prototype.selectRange = function(objFrom, objTo, selectType) {
			let startPos = this.find(objFrom).index;
			let endPos = this.find(objTo).index;
			//loop through arr in required direction, selecting elements on the way	
			if (endPos >= startPos) 
				//FORWARD selection: 
				for (let i=startPos; i<=endPos; i++) {
					photos.select(i, selectType);					
				}
			else 
				//BACKWARD selection: 			
				for (var i=startPos; i>=endPos; i--) {					
						photos.select(i, selectType);					
				}			
		};
		Photos.prototype.find = function(domElement) {
			//override Array.find() method with custom method
			//returns {item: first photo object with .element = domElement, 
			//			index: position in photos where found }
			for (let i=0, len=this.length; i<len; i++) {
				if (this[i].node === domElement)
					return {item: this[i], index: i};
			}
			return {item: null, index: -1};
		};
		Photos.prototype.injectArray = function(start, arrayToInsert) {
			Array.prototype.splice.apply(this, [start, 0].concat(arrayToInsert));
			//.apply calls a function with a given this value 
			//	and arguments provided as an array
			//example: .apply(thisArg, [argsArray])
			//array.splice(start, deleteCount, item1, item2, ...)
			//NOTE: start is the index at which to start changing the array.
			// index can be arr.length (injects after the array ie: append)
		};

		//reassign global var photos to updated Photos() constructor & prototype
		photos = new Photos();
	}	
	














		
// =======  HELPER FUNCTIONS  ===============================================
// ==========================================================================
	/*
	function insertArrayAt(array, index, arrayToInsert) {
			Array.prototype.splice.apply(array, [index, 0].concat(arrayToInsert));
			//.apply calls a function with a given this value 
			//	and arguments provided as an array
			//example: .apply(thisArg, [argsArray])
			//array.splice(start, deleteCount, item1, item2, ...)
		}
	*/
	function walkToNearest(walkerType, sourceElement, selector = "") {
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

	function nearestInSiblings(refNode, findSelector, searchRefNode) {
			//returns the nearest node to refNode that matches findSelector, by looking
			//	in siblings of refNode. Also returns the relative position/direction of 
			// the sibling of refNode in which the found node is found.
			//first searches refNode for findSelector. 
			//searches outward, expanding from refNode, fwd & bwd, 
			//	looking at siblings until a node with findSelector is found. 
			//returns {node: foundNode, direction: x}
			//direction can be >0, <0, or 0 (found in refNode or not found at all)
			//node = null if not found 
			
		//make sure class selector has "." before
		findSelector = (findSelector.startsWith(".")) ? findSelector : "." + findSelector;

		let refNodeClass = refNode.className; 	//*** INSERT "." OR NOT??  ***
		let nextSibling = refNode;
		let prevSibling = refNode;
		let direction = 0;
		let node = null;
		if (!searchRefNode) {
			nextSibling = nextSibling.nextElementSibling;
			prevSibling = prevSibling.previousElementSibling;
		}
		//loop outward until no more nxt and prv siblings exist
		while (nextSibling || prevSibling) {
			//look forward, if next sibling exists, get first found node
			if (nextSibling) {
				node = nextSibling.querySelector(findSelector);
				if (node) 
					break;
				direction += 1;
			}
			//look backward, if prev sibling exists, get last found node 
			if (prevSibling) {
				node = prevSibling.querySelectorAll(findSelector);				
				if (node) {
					node = node[node.length-1];
					break;
				}
				direction -= 1;
			}
			//set next/prev to next outer nodes in DOM
			//	next/prev nodes can be of any class
			nextSibling = nextSibling.nextElementSibling;
			prevSibling = prevSibling.previousElementSibling;						
		}
		return {node: node, direction: direction};
	}

	function addItemsToDOM(arr, addMethod, refNode) {
		//arr must be of photo objects
		//CAUTION - no error checking
		switch (addMethod) {
			case "before":
				let parentNode = refNode.parentNode;
				arr.forEach(function(arrEl, index, arr) {
					parentNode.insertBefore(arrEl.node, refNode);
				});
				break;
			case "appendTo":
				arr.forEach(function(arrEl, index, arr) {
					refNode.appendChild(arrEl.node);
				});
				break;
			default: //no error checking yet!
		}
		//rewrite to minimize DOM calls, by creating a new docFragment
		//to contain all new images, then insert the docFragment (once)
		//at required position.
	}













// =======  WORKER FUNCTIONS  ===============================================
// ==========================================================================

	function addNewSection(title) {
		//section heading wrapper
		let shell = document.createElement("div");
		shell.classList.add("pe_section-heading-wrapper");
		let node = document.createElement("h1");
		node.appendChild(document.createTextNode(title));
		let btn = document.createElement("button");
		btn.innerHTML = "collapse";
		btn.classList.add("pe_heading_button");
		//<button class="pe_heading_button">collapse</button>
		shell.appendChild(node);
		shell.appendChild(btn);
		config.main.appendChild(shell);

		shell = document.createElement("div");
		shell.classList.add("pe_section-wrapper");
		config.main.appendChild(shell);

		return shell;	//only returns section-wrapper - not section-heading-wrapper
	}


	function movePhotos() {}
	

	function deletePhotos(arrPhotos) {
		//removes from photos[] and photos.selected[] and from DOM
		//if arrPhotos is not an array, it is converted into a single-el array
		//WARNING: no error checking!
		let arr = (Array.isArray(arrPhotos)) ? arrPhotos : [arrPhotos];	
		let indexInPhotos = 0;	
		arr.forEach(function(arrEl, index, arr) {			
			if (arrEl.isSelected) 
				photos.deselect(arrEl);
			photos.splice(photos.indexOf(arrEl), 1);
			arrEl.parentNode.removeChild(arrEl);
			//arrEl could be in any .section-wrapper, so call .parentNode every time
		});
	}


	function insertPhotos(refObject, newPhotos) {
		//	inserts array of photo objects into photos[] and adds photo nodes to DOM.
		//	if refObject = photo object, inserts before refObject.
		//	if refObject = section-wrapper node, appends to refObject. 
		//	if newPhotos not an array, a single-element array is created. 
		let newArr = (Array.isArray(newPhotos)) ? newPhotos : [newPhotos];		
		let startPos = 0;
		let nearestPhoto = {};
		//if refObject is a photo object, insert newArr before photo
		if (refObject instanceof Photo) {
			nearestPhoto = refObject.node;
			startPos = photos.indexOf(refObject);
			photos.injectArray(startPos, newArr);
			addItemsToDOM(newArr, "before", nearestPhoto);
			return;
		}
		//if refObject is a section, append newArr to section
		if (!refObject.matches(".pe_section-wrapper"))
			return; //throw error		

		//FOR APPENDING TO A SECTION: 
		//find startPos in photos[] for injection of newArr, by looking for 
		//	a) last photo in current section, OR
		//	b) nearest photo in neighbouring sections
		//startPos = 0;
		nearestPhoto = nearestInSiblings(refObject, ".pe_unit-wrapper", true);		
		if (!nearestPhoto.node) {
			//no photos found in any sections, including current
			startPos = 0;
		} else {			
			switch (true) {
				case nearestPhoto.direction > 0:				
				//nearest photo at start of some following section
					startPos = photos.find(nearestPhoto.node).index;
					startPos -= 1;
					break;
				case nearestPhoto.direction === 0:	
				//photo found in current section
				//get last photo in curret section
					nearestPhoto = refObject.querySelectorAll(".pe_unit-wrapper");
					nearestPhoto = nearestPhoto[nearestPhoto.length-1];
					startPos = photos.find(nearestPhoto).index + 1;
				case nearestPhoto.direction < 0:				
				//photo found at end of some preceding section
					startPos = photos.find(nearestPhoto.node).index;
					startPos += 1;
					break; 
			}
		}
		//add newArr to photos[] and append to section in DOM
		photos.injectArray(startPos, newArr);
		addItemsToDOM(newArr, "appendTo", refObject);
	}

	
	function createPhotos(arrSources, arrCaptions) {
		//returns an array of photo objects
		//returns null if arrSources = null/undefined
		//optional: arrCaptions (if not given, sets caption = "")
		//both given argument arrays must have equal length (no error checking!)
		if (!arrSources)
			return null;
		if (!arrCaptions) {
			arrCaptions = new Array(arrSources.length);
			arrCaptions.fill("");
		}
		let newArr = [];
		arrSources.forEach(function(element, index, arr) {
			newArr.push(createPhoto(element, arrCaptions[index]));
		});
		return newArr;
	}

	function createPhoto(imgSrc, caption = "") {
		let outerShell = null;
		let imgShell = null;
		let img = null;
		let capt = null;
		//create html elements
		outerShell = document.createElement("div");
		outerShell.classList.add("pe_unit-wrapper");
		imgShell = document.createElement("div");
		img = document.createElement("img");
		img.src = imgSrc;
		capt = document.createElement("p");		
		capt.appendChild(document.createTextNode(caption));		
		//append new elements into nested structure				
		imgShell.appendChild(img);
		outerShell.appendChild(imgShell).classList.add("pe_img-wrapper");
		outerShell.appendChild(capt).classList.add("pe_caption");
		//create new photo object, made from html shell
		return new Photo(outerShell);
	}
	
	











//=====  EVENT HANDLERS =====================================================
// ==========================================================================	


	function keydownHandler(e) {
		//editSectionHeading - finish
		if (e.target.matches(".pe_section-heading-wrapper h1"))
			if (e.key === "Enter" || e.key === "Escape")
				e.target.contentEditable = false;
	}

	function dblClickHandler(e) {
		//collapse/expand section
		if (e.target.matches(".pe_section-heading-wrapper")) {
			//let section = e.target.nextElementSibling;
			let section = walkToNearest("nextElementSibling", e.target, ".pe_section-wrapper");
			let toggleButton = e.target.querySelector(".pe_heading_button");
			toggleCollapseSection(section, toggleButton);
		}
	}
	
	function clickHandler(e) {
		if (e.target.matches(".pe_img-wrapper img") 
			|| e.target.matches(".pe_selected")) {
				selectionHandler(e.target, e.ctrlKey, e.shiftKey);					
		} 
		// else: deselect all images...?

		if (e.target.matches(".pe_section-heading-wrapper h1")) {
			editSectionHeading(e.target);					
		} else {
			//else disable contentEditable on all .section-heading-wrapper h1 elements.
			let headings = document.querySelectorAll(".pe_section-heading-wrapper h1");
			disableContentEditable(headings);				
		}	
		if (e.target.matches(".pe_heading_button")) {
			//let section = e.target.parentNode.nextElementSibling;
			let section = walkToNearest("parentNode", e.target, ".pe_section-heading-wrapper");
			section = walkToNearest("nextElementSibling", section, ".pe_section-wrapper");
			toggleCollapseSection(section, e.target);
		}
	}
	
	//ui behaviour
	function toggleCollapseSection(obj, btn) {
		obj.classList.toggle("pe--iv");
		btn.innerHTML = btn.innerHTML === "collapse" ? "expand" : "collapse";
		//consider a SHIFT+click to EXPAND/COLLAPSE ALL sections instantly.
	}
	function disableContentEditable(nodeList) {
		for (let i = 0, len = nodeList.length; i < len; i++) {
			nodeList[i].contentEditable = false; 
		}
	}
	function editSectionHeading(target) {
		//expecting a h1 or p element, with textNode at .childNodes[0]
		if (target.contentEditable === "true")
			return;
		//only enable if not already enabled
		target.contentEditable = true;
		//set up caret at start of p...
			//get the textNode child of the h1 element
		let el = target.childNodes[0];
		let rng = document.createRange();
		let sel = window.getSelection();
		rng.setStart(el, 0);
		//rng.setEnd(el, el.length);
		rng.collapse = true;
		sel.removeAllRanges();
		sel.addRange(rng);
	}
	function selectionHandler(obj, ctrlKey, shiftKey) {
		//NOTE: modelled after Windows Explorer behaviour
		//retrieve the img-wrapper object
		let clicked = walkToNearest("parentNode", obj, ".pe_unit-wrapper");
		let clickType = "";

		//NORMAL behaviour:
		if (!ctrlKey && !shiftKey) {
			clickType = "nrm";
			//if only this was already selected and re-clicked, deselect it
			if (photos.selected.length === 2 && 
				photos.find(clicked).item.isSelected() === true)  
					photos.deselect(clicked);
			else {
				//otherwise deselect all and select this
				photos.deselectAll();
				photos.select(clicked, clickType);
			}
		}
		//CTRL behaviour:
		if (ctrlKey && !shiftKey) {
			clickType = "ctrl";	
			//toggle selection state of clicked item
			if (photos.find(clicked).item.isSelected() === true)
				photos.deselect(clicked);
			else
				photos.select(clicked, clickType);
		}
		//SHIFT behaviour:
		if (shiftKey) {	
			clickType = "shift";
			let firstItem = undefined;		
			//if nothing already selected, select 1st item in DOM
			if (photos.selected.length === 0) 
				photos.select(0, clickType);	
			//get earliest contiguous SHIFT-type from selected items,
			//	starting from lastSelected
			for (let i=photos.selected.length-2; i>=0; i-=2) {
				if (photos.selected[i+1] !== clickType) {
					firstItem = photos.selected[i];
					break;
				}
			}
			//if firstItem undefined, all selected items are SHIFT type
			//	so start with firstSelected item
			firstItem = (!firstItem) ? photos.selected[0] : firstItem;			
			//deselect all & select: firstItem->clickedItem
			photos.deselectAll();
			photos.selectRange(firstItem, clicked, clickType);
			//selectImages(firstItem, obj, allItems, "shift");
		} 
	} //end: selectionHandler












// =====  TOOLBAR SETUP  ==================================================
// ========================================================================
//	buttons on the toolbar are associated with 'cmd' functions, which run 
//	when their respective buttons are clicked. Generally, they call an 
//	existing 'worker' function in the module, but with a little validation
//	and/or tweaking to parameters first. 
//	Buttons are created and inserted dynamically by fn: newToolbarButton().
//	newToolbarButton() also registers an onclick() listener for every button
//	which fires the appropriate 'cmd' callback function. 
//	CSS for the buttons and toolbar are separately stored, but the items 
//	created here are given class names to match the corresponding css. 
//	(see the css files loaded for this iframe - url in PHOTOS.replace() ).



	function initToolbar() {
		//debugger;
		newToolbarButton("new section", "add new section to document", 
			cmdAddNewSection, "NEW section");
		newToolbarButton("insert before selected", "insert photo before selected photo", 
			cmdInsertBeforeSelected);
		newToolbarButton("append to last section", "insert photo at end of last section", 
			cmdAppendToLastSection);
		newToolbarButton("-", "zoom out", cmdZoom, "out");
		newToolbarButton("+", "zoom in", cmdZoom, "in");
		newToolbarButton("add", "add photos", cmdAdd);
	}

	function newToolbarButton(btnText, btnTooltip="", callback, ...args) {
		//parameters:
		//btnText: what text to put in the button
		//btnTooltip: what to show on mouseover
		//callback: function to run when button is clicked
		//...args: any arguments needed by callback function
		let btn = createEl("button", "pe_toolbar-button", btnText);
		btn.title = btnTooltip;
		btn.onclick = function(e) { callback(...args); };
		return config.toolbar.appendChild(btn);		
	}

	function createEl(nodeType, classN, txtContent) {
		let i = document.createElement(nodeType);
		i.classList.add(classN);
		if (txtContent)
			i.appendChild(document.createTextNode(txtContent));
		//debugger;
		return i;
	}





	function cmdAddNewSection(title) {
		addNewSection(title);
	}
	function cmdInsertBeforeSelected() {
		if (photos.selected.length > 0)
					insertPhotos(photos.find(photos.selected[0]).item, 
						createPhoto("../app/no-img.jpg", "CAPTION"));
	}
	function cmdAppendToLastSection() {
		if (!config.main.querySelector(".pe_section-wrapper"))
					addNewSection("NEW section");
		let n = config.main.querySelectorAll(".pe_section-wrapper");
		n = n[n.length - 1];
		insertPhotos(n, createPhoto("../app/no-img.jpg", "CAPTION"));
	}
	function cmdZoom(direction) {
		let styles = window.getComputedStyle(config.main);
		//let val = Number(getStylePropValue(styles, "--imgMaxWidth").replace("px", ""));
		let val = parseInt(getStylePropValue(styles, "--imgMaxWidth"));
		let incr = 50;	
		//set rule depending on zoom direction
		switch (direction) {
			case "in": 
				val += incr;
				break;
			case "out": 
				//let min = Number(getStylePropValue(styles, "--imgMinWidth").replace("px", ""));
				let min = parseInt(getStylePropValue(styles, "--imgMinWidth"));
				if (val >= min+incr)	val -= incr;
				break;
			default:
		}
		val = val.toString() + "px";
		config.doc.documentElement.style.setProperty("--imgMaxWidth", val);
	}

	function getStylePropValue(styleList, property) {
		return String(styleList.getPropertyValue(property)).trim();
	}

	function cmdAdd() {
		//add multiple photos to page, 
		//dialog to select existing section or create new section
		//append to chosen section

		
	}










// =====  PUBLIC PROPERTIES & METHODS  ====================================
// ========================================================================

	return {
		//publicHandle: privateProperty/Method
		replace: replace,
		destroy: destroy
	};

})(); //module var PHOTOS









	/* 	TOOLS: 
		*	imgInsert
		* 	imgDelete - click + Delete btn
		* 	imgCut
		* 	imgMove = cut & paste // cut & insert
		*	imgCrop
		*	imgResize
		*	imgRotate
		* 	
		* 	assignHeading
		*	editHeading
		*	captionEdit - using click
		*	captions... - using dialog
		*	captionsShow - t/f
		* 	filter{brightness, contrast, sharpening}
		*	
		*/
		

/*
		//intended use samples:
		var photos = new PhotosCollection();
		x photos.add(obj, before:=);
		x photos[obj].caption = "xxx"
		x photos[obj].isSelected();
		x photos.select(obj);
		x photos.selectAll();
		x photos.deselectAll();
		photos.move(obj, to);
		photos[obj].filters.add("brightness", 25);
		photos[obj].filters("brightness").value = 26;

*/