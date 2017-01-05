"use strict";
	

	//MODULE FORMAT:
	//global declarations
	//initializers
	//helper functions
	//worker functions
	//main ui event handlers
	//toolbar functions
	//exposure of public properties & methods




//module var APP	
var APP = (function() {

	//GLOBAL DECLARATIONS
	//=====================================================================
	var panes = null;	//reset in init(). Allows only 1 true panes[] per module.
	function Pane(obj) {
		this.node = obj;
	}	
	

	//INITIALIZERS
	//=====================================================================
	(init());	//Self-executing entry point for module.

	function init() {
		//instantiate global objects and panes[] var
		initGlobalObjects();
		//bind ui events
		document.addEventListener("click", function(e) { clickHandler(e); });
		//make 2 panes open by default
		panes.create();//.loadModule("photos");
	};	//init()

function initGlobalObjects() {
	Pane.prototype = {
		get moduleTitle() {
			return this.node.querySelector(".pane_hdr_btn-drop").firstChild.textContent.slice(0, -2);
		},
		set moduleTitle(txt) {
			this.node.querySelector(".pane_hdr_btn-drop").firstChild.textContent = txt + " " + String.fromCharCode(0x25be);
		},
		showDropdown: function() {
			//show modal blanket to shield out ckeditor ghosts/editor behaviour
			document.querySelector(".modal-blanket").classList.remove("--iv");		
			//show dropdown  menu
			this.node.querySelector(".pane_hdr_drop-items").classList.remove("--iv");
		},
		dismissDropdown: function() {
			//hide modal
			document.querySelector(".modal-blanket").classList.add("--iv");
			//hide dropdown menus
			this.node.querySelector(".pane_hdr_drop-items").classList.add("--iv");		
		},
		toggleDropdownItem(txt, state, global = false) {
			//debugger;
			let newState = "";
			if (state === "enable")
				newState = "remove";
			else if (state === "disable")
				newState = "add";
			else
				return;
			let source = (global) ? document : this.node;
			let items = Array.from(source.querySelectorAll(".pane_hdr_drop_drop-item"));
			items.filter(function(el) { 
				return el.textContent === txt; 
			}).forEach(function(el) {
				el.classList[newState]("pane_hdr_btn--disabled");
			});
		},
		loadModule: function(title) {
			//debugger;
			this.moduleTitle = title;
			//disable item from ALL dropdowns in ALL panes
			this.toggleDropdownItem(title, "disable", true);
			//remove children from module wrapper (eg PHT text)
			let wrapper = this.node.querySelector(".pane_module");
			removeChildren(wrapper);
			//depending on title, load ckEditor/Photos/Forms/Preview...
			switch (title) {
			case "summary":
				break;
			case "transcript":
				startCKEditor(wrapper);
				break;
			case "photos":
				startPhotos(wrapper);
				break;
			case "preview":
				break;
			default:
			}
		},
		unloadModule: function() {
			//enable ALL dropdown items relating to unloading module
			this.toggleDropdownItem(this.moduleTitle, "enable", true);
			
			let wrapper = this.node.querySelector(".pane_module");
			//HARSH WAY: destroy whatever is in module wrapper			
		//removeChildren(wrapper);
			//GRACEFUL WAY:
			//	switch (moduleTitle)
			//	case [transcript/photos/summary/preview] - something unique for each one
			switch (this.moduleTitle) {
			case "summary":
				break;
			case "transcript":
				stopCKEditor();
				break;
			case "photos":
				stopPhotos();
				break;
			case "preview":
				break;
			default:
			}
			//reset dropdown picker / module title
			this.moduleTitle = "select module";
			//add PHT to blank module wrapper
			let pht = document.createElement("p");
			pht.appendChild(document.createTextNode("module"));
			pht.classList.add("pane_module_pht");
			wrapper.appendChild(pht);
		}
	};	//Pane.prototype



	//constructor which inherits from Array
	function PanesProto() {
		this.max = 3;
		this.protoNode = null;
	}
	PanesProto.prototype = Array.prototype;

	//constructor which inherits from [PanesProto[Array]]
	function Panes() {	}
	Panes.prototype = new PanesProto();
	Panes.prototype.setWidths = function() {
		let w = (100 / this.length).toString();
		this.forEach(function(el, i) {
			el.node.style.flexBasis = w + "%";
		});
	};
	Panes.prototype.setButtons = function() {		
		//only show ADD buttons if panes < max
		let buttons = this.map(function(el) {
			return el.node.querySelector(".pane_hdr_btn-new"); });
		if (this.length < this.max) 
			buttons.forEach(function(el) {	el.classList.remove("--iv"); });
		else
			buttons.forEach(function(el) {el.classList.add("--iv")} );
		//only show CLOSE buttons if panes > 1
		buttons = this.map(function(el) {
			return el.node.querySelector(".pane_hdr_btn-close"); });
		if (this.length > 1)
			buttons.forEach(function(el) { el.classList.remove("--iv"); });
		else
			buttons.forEach(function(el) { el.classList.add("--iv"); });
	};
	Panes.prototype.create = function() {
		//debugger;
		//create new pane
		let newPane = new Pane(this.protoNode.cloneNode(true));
		//disable open modules from the new dropdown module picker
		this.map(function(el) { return el.moduleTitle; }).forEach(function(el) {
			newPane.toggleDropdownItem(el, "disable");
		});
		//add to panes[]
		this.push(newPane);
		//set pane widths = 100/panes.count %, show/hide the ADD/CLOSE buttons
		this.setButtons();
		this.setWidths();
		//add to DOM
		document.querySelector(".main").appendChild(newPane.node);
		//make pane draggable:
			//debugger;
		if (this.indexOf(newPane) === 1)
			FLEXRESIZE.makeFBDraggable(newPane.node, 
				{firstEdge: true, lastEdge: false, margin: 10, modalClass: "modal-blanket"});

		//fire a window.resize event to ckEditor maxHeight/autoGrow plugins
		fireWindowResizeEvent();
		return newPane;
	};
	Panes.prototype.destroy = function(obj) {
		//remove from panes[], remove from DOM
		let oldPane =  this.splice(this.indexOf(obj), 1)[0];		
		oldPane.node.parentNode.removeChild(oldPane.node);
		//set pane widths = 100/panes.count %, show/hide ADD/CLOSE buttons
		this.setWidths();
		this.setButtons();
		//fire a window.resize event to ckEditor maxHeight/autoGrow plugins
		fireWindowResizeEvent();
		//return destroyed pane		
		return oldPane;
	};
	Panes.prototype.find = function(queryNode) {
		let i = this.map(function(el) { return el.node }).indexOf(queryNode);
		return (i < 0) ? {item: null, index: i} : {item: this[i], index: i};
	};
	Panes.prototype.dismissAllDropdowns = function() {
		this.forEach(function(el) {	el.dismissDropdown(); });
	};

	//instantiate global var panes[]
	//	clone only pane already in document, store as template for later use
	panes = new Panes();
	panes.push(new Pane(document.querySelector(".pane")));
	panes.protoNode = panes[0].node.cloneNode(true);

}; 	//initGlobalObjects()













	//HELPER FUNCTIONS
	//=====================================================================
	function fireWindowResizeEvent() {
		window.dispatchEvent(new Event('resize'));
		//used by panes.create & panes.destroy (CKeditor maxHeight bug)
	}












	//WORKER FUNCTIONS
	//=====================================================================
	function startCKEditor(container) {
		//add ckEditor - passing textarea as an OBJECT (rather than as an ID tag)
		//container should ideally be a textarea or div
		let node = document.createElement("textarea");
		container.appendChild(node);
		//replace textarea with ckEditor + startup config
		CKEDITOR.replace(node, {
			//width: 500, //height: 400,
			//extraPlugins: "autogrow",
			//autoGrow_maxHeight: moduleWrapper.clientHeight - 100,
			//autoGrow_minHeight: moduleWrapper.clientHeight - 150,
			autoGrow_onStartup: false,
			extraPlugins: "maxheight"
		}); 
		//debugger;
	}
	function stopCKEditor() {
		//destroy ALL instances
		for (let i in CKEDITOR.instances) {
			//console.log("CK instances: " + i);
			CKEDITOR.instances[i].destroy();
		}
		//CKEDITOR.instances.editor1.destroy();
	}

	function startPhotos(container) {
		let node = document.createElement("textarea");
		//node.style.display = "inline-block";
		container.appendChild(node);
		PHOTOS.replace(node);
	}
	function stopPhotos() {
		//assumes only 1 instance allowed at any time
		PHOTOS.destroy();
		//do something with data left in text area
		//destroy text area
	}















	//MAIN UI EVENT HANDLERS
	//=====================================================================

	

	function clickHandler(e) {
		//debugger;
		dropdownListeners(e.target);
		buttonListeners(e.target);
	}
	
	function dropdownListeners(clicked) {
		//dropdown functionality for module viewer panes...
		let pane = panes.find(walkToNearest("parentNode", clicked, ".pane")).item;
		if (!pane) {
			panes.dismissAllDropdowns();
			return;
		}
		switch (true) {
		case clicked.matches(".pane_hdr_btn-drop"):
			pane.showDropdown();
			break;
		case clicked.matches(".pane_hdr_drop_drop-item") &&
			!clicked.classList.contains("pane_hdr_btn--disabled"):
			//an enabled member of the dropdown menu was clicked, so...
			panes.dismissAllDropdowns();
			//run related module loader...
			let chosenModule = clicked.firstChild.textContent;
			pane.unloadModule();
			pane.loadModule(chosenModule);
			break;
		default:
			//dropdown starter not clicked...
			//panes.dismissAllDropdowns();
		}
	}


	function buttonListeners(clicked) {
		let pane = panes.find(walkToNearest("parentNode", clicked, ".pane")).item;
		if (!pane)
			return;
		//Add/Close pane functionality...		
		if (clicked.matches(".pane_hdr_btn-new")) {
			//only proceed if button is activated/visible.
			//if (clicked.classList.contains("--iv")) 
			//	return;
			panes.create();
		}		
		if (clicked.matches(".pane_hdr_btn-close")) {
			//only proceed if button is activated/visible.
			//if (clicked.classList.contains("--iv")) 
			//	return;
			//SAVE DATA WITHIN PANE...
			//unload module gracefully, and destroy pane
			pane.unloadModule();			
			panes.destroy(pane);
		}
	}






	//TOOLBAR FUNTIONS
	//=====================================================================

	//PUBLIC RETURN
	//=====================================================================

	



	


	


})();	//module var APP