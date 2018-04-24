/**
 * Custom option selectors for window.Shopify.
 * @license MIT
 */

class OptionSelectorsCustom {
  /**
   * Creates an instance of OptionSelectorsCustom.
   * @constructor
   * @param {object} data The options for this class
   * @returns self
   */
  constructor(data) {
    this.data = data;
    this.elem = document.getElementById(this.data.element);
    this.template = window.Handlebars.compile(this.data.template);
    this.product = new window.Shopify.Product(this.data.product);
    this.callback = this.data.callback;
    this.history = this.data.enableHistory && new HistoryState();
    this.selectors = {};

    this.hideOriginalSelector();
    this.buildSelectors();

    if (window.Shopify.urlParam('variant')) {
      this.selectFromParams();
    } else {
      this.selectInitials();
    }
  }

  /**
   * Hides the original selector element.
   * @returns void
   */
  hideOriginalSelector() {
    this.elem.style.display = 'none';
  }

  /**
   * Handles updating the selectors.
   * Fires the callback, fires change event, update shistory.
   * @param {object} variant The variant object
   * @param {object} selector The selector object
   * @param {object} e The mouse event from clicking
   * @returns void
   */
  updateSelectors(selector, e) {
    // Get the variant by grabbing the selected values for all selectors and fire callback
    const variant = this.product.getVariant(this.selectedValues());
    this.callback(variant, selector, e);

    if (variant == null) {
      // No variant.. kill this
      return;
    }

    // Select the variant ID from the original dropdown
    this.elem.value = variant.id;

    let event;
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
  }

  /**
   * Creates a listener event for our custom selectors.
   * @param {object|string} item The selector item to target
   * @returns void
   */
  createSelectorListener(item) {
    const self = this;
    const selector = typeof item === 'string' ? this.selectors[item] : item;
    const children = selector.element().querySelector('.options').children;

    /**
     * Closure callback for click event
     * @param {object} e The mouse event from clicking
     * @returns void
     */
    const clickCallback = function (e) {
      // Clear current selection for this selector and make new selection base on node
      selector.clearSelection();
      selector.makeSelection(this);
      self.updateSelectors(selector, e);
    };

    // Loop all children of selector and add click event to them
    for (let i = 0; i < children.length; i += 1) {
      children[i].addEventListener('click', clickCallback);
    }
  }

  /**
   * Handles building the selectors.
   * @returns void
   */
  buildSelectors() {
    // Loop over all option names for the product
    const optionNames = this.product.optionNames();
    for (let i = 0; i < optionNames.length; i += 1) {
      // Create a new single option selector with data it needs
      const singleSelector = new SingleOptionSelectorCustom({
        option: {
          id: `option${i + 1}`,
          name: optionNames[i],
          values: this.product.optionValues(i),
        },
        template: this.template,
        selectedClass: this.data.selectedClass,
        product: this.product,
      });

      /*
      * Add the selector to our registry,
      * Inject it's markup into the document,
      * Create a listener for the selector.
      */
      this.selectors[singleSelector.id] = singleSelector;
      this.elem.insertAdjacentHTML('beforebegin', singleSelector.buildSelector());
      this.createSelectorListener(singleSelector.id);
    }
  }

  /**
   * Selects the first item in each selector.
   * @returns void
   */
  selectInitials() {
    // Attempt to find the first available variant
    let availableVariant = null;
    const variants = this.product.variants;
    for (let i = 0; i < variants.length; i += 1) {
      if (variants[i].available) {
        availableVariant = variants[i];
        break;
      }
    }

    if (availableVariant) {
      // Select based on variant ID
      this.selectFromParams(availableVariant.id);
    } else {
      // Select the first options in each selector
      Object.keys(this.selectors).forEach((optionId) => {
        this.selectors[optionId].clearSelection();
        this.selectors[optionId].makeSelection(0);
      });

      this.updateSelectors();
    }
  }

  /**
   * Grabs the selected values of all selectors.
   * @return {array} the selected values
   */
  selectedValues() {
    const selected = [];
    Object.keys(this.selectors).forEach((optionId) => {
      const selection = this.selectors[optionId].currentSelection();
      if (selection) {
        // We have a selection, get it's value
        selected.push(selection.getAttribute('data-value'));
      }
    });

    return selected;
  }

  /**
   * Selects options based on URL param.
   * @param {object|null} variantId The variant ID to select (optional)
   * @returns void
   */
  selectFromParams(variantId) {
    const id = variantId || window.Shopify.urlParam('variant');
    if (id) {
      // Get the variant by ID
      const variant = this.product.getVariantById(id);
      if (!variant) {
        return;
      }

      // Loop over the options to find matches
      for (let i = 0; i < variant.options.length; i += 1) {
        const selector = this.selectors[`option${i + 1}`];
        const children = selector.element().querySelector('.options').children;

        for (let x = 0; x < children.length; x += 1) {
          if (children[x].getAttribute('data-value') === variant.options[i]) {
            // Found, make the selection
            selector.makeSelection(children[x]);
          }
        }
      }

      // Update the selectors (callbacks, etc)
      this.updateSelectors();
    }
  }
}

class SingleOptionSelectorCustom {
  /**
   * Creates and instance of SingleOptionSelectorCustom.
   * @constructor
   * @param {object} data The options for this class
   * @returns self
   */
  constructor(data) {
    this.name = data.option.name;
    this.values = data.option.values;
    this.id = data.option.id;
    this.template = data.template;
    this.selectedClass = data.selectedClass;
    this.product = data.product;
  }

  /**
   * Builds the selector by compiling the Handlebar template.
   * @returns {string} HTML for the selector
   */
  buildSelector() {
    return this.template({
      option_id: this.id,
      option_name: this.name,
      option_values: this.values,
      product_id: this.product.id,
    });
  }

  /**
   * Returns the element object for this selector.
   * @return {object} The element's object
   */
  element() {
    return document.getElementById(`selector-${this.product.id}-${this.id}`);
  }

  /**
   * Grabs the current selection for this selector.
   * @return {object} The current selected object
   */
  currentSelection() {
    return this.element().querySelector(`.${this.selectedClass}`);
  }

  /**
   * Clears any selection.
   * @returns void
   */
  clearSelection() {
    const currentlySelected = this.element().querySelector(`.${this.selectedClass}`);
    if (currentlySelected) {
      // Regex replace the selected class to remove spaces (looks cleaner)
      const regex = new RegExp(`(^|\\s)${this.selectedClass}(\\s|$)`, 'gi');
      const classes = currentlySelected.className.split(/\s+/g).length;

      for (let i = 0; i < classes; i += 1) {
        currentlySelected.className = currentlySelected.className.replace(regex, ' ');
      }

      currentlySelected.className = currentlySelected.className.trim();
    }
  }

  /**
   * Make a selection.
   * @param {object|number} child The child to select
   * @returns void
  */
  makeSelection(child) {
    if (typeof child === 'number') {
      child = this.element().querySelector('.options').children[child];
    }

    const classes = child.className.split(/\s+/g);
    classes.push(this.selectedClass);
    child.className = classes.join(' ').replace(/^[\s]+/gi, '');
  }
}

class HistoryState {
  /**
   * Handles setting new variant in history and URL.
   * @constructor
   * @param {object} klass The instance of OptionSelectorsCustom
   * @returns self
   */
  constructor() {
    // Determins if history state is supported
    this.supported = window.history && window.history.replaceState;
  }

  /**
   * Fires on selection of an option to set the new state.
   * @param {object} variant The variant object
   */
  onSelection(variant) {
    if (this.supported) {
      window.Shopify.setParam('variant', variant.id);
    }
  }
}

// Reassigning namespace for ease
window.Shopify = window.Shopify || { };
window.Shopify.OptionSelectorsCustom = OptionSelectorsCustom;
