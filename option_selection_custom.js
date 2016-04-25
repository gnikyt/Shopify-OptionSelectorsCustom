/**
 * Creates an instance of OptionSelectorsCustom
 * @constructor
 * @param {Object} data The options for this class
 */
Shopify.OptionSelectorsCustom = function(data) {  
  this.data      = data;
  this.elem      = document.getElementById(this.data.element);
  this.template  = Handlebars.compile(this.data.template);
  this.product   = new Shopify.Product(this.data.product);
  this.callback  = this.data.callback;
  this.history   = this.data.enableHistory && new Shopify.OptionSelectorsCustom.HistoryState(this);
  this.selectors = {};

  this.hideOriginalSelector();
  this.buildSelectors();
  
  if (Shopify.urlParam('variant')) {
    this.selectFromParams();
  } else {
    this.selectInitials();
  }
};

/**
 * Hides the original selector element
 */
Shopify.OptionSelectorsCustom.prototype.hideOriginalSelector = function() {
  this.elem.style.display = 'none';
};

/**
 * Handles updating the selectors
 * Fires the callback, fires change event, update shistory
 * @param {Object} variant The variant object
 * @params {Object} selector The selector object
 * @params {Object} e The mouse event from clicking
 */
Shopify.OptionSelectorsCustom.prototype.updateSelectors = function(e) {
  // Get the variant by grabbing the selected values for all selectors and fire callback
  var variant = this.product.getVariant(this.selectedValues());
  this.callback(variant, e);

  // Select the variant ID from the original dropdown
  this.elem.value = variant.id;
  
  var event;
  if (/Edge\/|Trident\/|MSIE /.test(window.navigator.userAgent)) {
    // IE
    event = document.createEvent('Event');
    event.initEvent('change', false, true); 
  } else {
    // Normal browsers
    event = new Event('change');
  }
  
  // Dispatch the change event
  this.elem.dispatchEvent(event);

  // Update history if enabled
  if (this.history) {
    this.history.onSelection(variant);
  }
};

/**
 * Creates a listener event for our custom selectors
 * @param {(object|string)} item The selector item to target
 */
Shopify.OptionSelectorsCustom.prototype.createSelectorListener = function(item) {
  var self     = this;
  var selector = typeof item == 'string' ? this.selectors[item] : item;
  var children = selector.element().children;
  
  /**
   * Closure callback for click event
   * @param {Object} e The mouse event from clicking
   */
  var clickCallback = function(e) {
    // Clear current selection for this selector and make new selection base on node
    selector.clearSelection();
    selector.makeSelection(this);
    self.updateSelectors(selector, e);
  };
  
  // Loop all children of selector and add click event to them
  for (var i = 0; i < children.length; i++) {
    children[i].addEventListener('click', clickCallback);
  }
};

/**
 * Handles building the selectors
 */
Shopify.OptionSelectorsCustom.prototype.buildSelectors = function() {
  // Loop over all option names for the product
  var optionNames = this.product.optionNames();
  for (var i = 0; i < optionNames.length; i++) {
    // Create a new single option selector with data it needs
    var singleSelector = new Shopify.SingleOptionSelectorCustom({
      option: {
        id: 'product_option'+(i + 1),
        name: optionNames[i],
        values: this.product.optionValues(i)
      },
      template: this.template,
      selectedClass: this.data.selectedClass,
      product: this.product
    });
    
    /*
    * Add the selector to our registry,
    * Inject it's markup into the document,
    * Create a listener for the selector
    */
    this.selectors[singleSelector.id] = singleSelector;
    this.elem.insertAdjacentHTML('beforebegin', singleSelector.buildSelector());
    this.createSelectorListener(singleSelector.id);
  }
};

/**
 * Selects the first item in each selector
 */
Shopify.OptionSelectorsCustom.prototype.selectInitials = function() {
  for (var optionID in this.selectors) {
    this.selectors[optionID].clearSelection();
    this.selectors[optionID].makeSelection(0);
  }
  
  this.updateSelectors();
};

/**
 * Grabs the selected values of all selectors
 * @returns {Array} the selected values
 */
Shopify.OptionSelectorsCustom.prototype.selectedValues = function() {
  var selected = [];
  for (var optionID in this.selectors) {
    var selection = this.selectors[optionID].currentSelection();
    if (selection) {
      // We have a selection, get it's value
      selected.push(selection.getAttribute('data-value'));
    }
  }
  
  return selected;
};

/**
 * Selects options based on URL param
 */
Shopify.OptionSelectorsCustom.prototype.selectFromParams = function() {
  var id = Shopify.urlParam('variant');
  if (id) {
    // Get the variant by ID
    var variant = this.product.getVariantById(id);
    
    // Loop over the options to find matches
    for (var i = 0; i < variant.options.length; i++) {
      var selector = this.selectors['product_option'+(i + 1)];
      var children = selector.element().children;
      
      for (var x = 0; x < children.length; x++) {
        if (children[x].getAttribute('data-value') == variant.options[i]) {
          // Found, make the selection
          selector.makeSelection(children[x]);
        }
      }
    }
    
    // Update the selectors (callbacks, etc)
    this.updateSelectors();
  }
};


/**
 * Creates and instance of SingleOptionSelectorCustom
 * @constructor
 * @param {Object} data The options for this class
 */
Shopify.SingleOptionSelectorCustom = function(data) {
  this.name           = data.option.name;
  this.values         = data.option.values;
  this.id             = data.option.id;
  this.template       = data.template;
  this.selectedClass = data.selectedClass;
  this.product        = data.product;
};

/**
 * Builds the selector by compiling the Handlebar template
 */
Shopify.SingleOptionSelectorCustom.prototype.buildSelector = function() {
  return this.template({ option_id: this.id, option_name: this.name, option_values: this.values });
};

/**
 * Returns the element object for this selector
 * @returns {Object} The element's object
 */
Shopify.SingleOptionSelectorCustom.prototype.element = function() {
  return document.getElementById(this.id);
};

/**
 * Grabs the current selection for this selector
 * @returns {Object} The current selected object
 */
Shopify.SingleOptionSelectorCustom.prototype.currentSelection = function() {
  return this.element().querySelector('.'+this.selectedClass);
};

/**
 * Clears any selection
 */
Shopify.SingleOptionSelectorCustom.prototype.clearSelection = function() {
  var currentlySelected = this.element().querySelector('.'+this.selectedClass);
  if (currentlySelected) {
    // Regex replace the selected class to remove spaces (looks cleaner)
    var regex = new RegExp('(?:^|\s)'+this.selectedClass+'(?!\S)', 'gi');
    currentlySelected.className = currentlySelected.className.replace(regex, '');
  }
};

/**
 * Make a selection
 * @param {(Object|Number)} The child to select
*/
Shopify.SingleOptionSelectorCustom.prototype.makeSelection = function(child) {
  if (typeof child == 'number') {
    child = this.element().children[child];
  }
  
  child.className += this.selectedClass;
};


/**
 * Handles setting new variant in history and URL
 * @constructor
 * @parma {Object} klass The instance of OptionSelectorsCustom
 */
Shopify.OptionSelectorsCustom.HistoryState = function(klass) {
  // Determins if history state is supported
  this.supported = window.history && window.history.replaceState;
};

/**
 * Fires on selection of an option to set the new state
 * @param {Object} variant The variant object
 */
Shopify.OptionSelectorsCustom.HistoryState.prototype.onSelection = function(variant) {
  if (this.supported) {
    Shopify.setParam('variant', variant.id);
  }
};
