(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod);
    global.optionSelectorsCustom = mod.exports;
  }
})(this, function (module) {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var OptionSelectorsCustom = function () {
    /**
     * Creates an instance of OptionSelectorsCustom.
     * @constructor
     * @param {object} data The options for this class
     * @returns self
     */
    function OptionSelectorsCustom(data) {
      _classCallCheck(this, OptionSelectorsCustom);

      this.data = data;
      this.elem = document.querySelector(this.data.element);
      this.template = this.data.template;
      this.templateBuilder = this.data.templateBuilder;
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


    _createClass(OptionSelectorsCustom, [{
      key: 'hideOriginalSelector',
      value: function hideOriginalSelector() {
        this.elem.style.display = 'none';
      }
    }, {
      key: 'updateSelectors',
      value: function updateSelectors(selector, e) {
        // Get the variant by grabbing the selected values for all selectors and fire callback
        var variant = this.product.getVariant(this.selectedValues());
        this.callback.call(this, variant, selector, e);

        if (variant == null) {
          // No variant.. kill this
          return;
        }

        // Select the variant ID from the original dropdown
        this.elem.value = variant.id;

        var event = void 0;
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
    }, {
      key: 'createSelectorListener',
      value: function createSelectorListener(item) {
        var self = this;
        var selector = typeof item === 'string' ? this.selectors[item] : item;
        var children = selector.element().querySelector('.options').children;

        /**
         * Closure callback for click event
         * @param {object} e The mouse event from clicking
         * @returns void
         */
        var clickCallback = function clickCallback(e) {
          // Clear current selection for this selector and make new selection base on node
          selector.clearSelection();
          selector.makeSelection(this);
          self.updateSelectors(selector, e);
        };

        // Loop all children of selector and add click event to them
        for (var i = 0; i < children.length; i += 1) {
          children[i].addEventListener('click', clickCallback);
        }
      }
    }, {
      key: 'buildSelectors',
      value: function buildSelectors() {
        // Loop over all option names for the product
        var optionNames = this.product.optionNames();
        for (var i = 0; i < optionNames.length; i += 1) {
          // Create a new single option selector with data it needs
          var singleSelector = new SingleOptionSelectorCustom({
            option: {
              id: 'option' + (i + 1),
              name: optionNames[i],
              values: this.product.optionValues(i)
            },
            template: this.template,
            templateBuilder: this.templateBuilder,
            selectedClass: this.data.selectedClass,
            product: this.product
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
    }, {
      key: 'selectInitials',
      value: function selectInitials() {
        var _this = this;

        // Attempt to find the first available variant
        var availableVariant = null;
        var variants = this.product.variants;
        for (var i = 0; i < variants.length; i += 1) {
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
          Object.keys(this.selectors).forEach(function (optionId) {
            _this.selectors[optionId].clearSelection();
            _this.selectors[optionId].makeSelection(0);
          });

          this.updateSelectors();
        }
      }
    }, {
      key: 'selectedValues',
      value: function selectedValues() {
        var _this2 = this;

        var selected = [];
        Object.keys(this.selectors).forEach(function (optionId) {
          var selection = _this2.selectors[optionId].currentSelection();
          if (selection) {
            // We have a selection, get it's value
            selected.push(selection.getAttribute('data-value'));
          }
        });

        return selected;
      }
    }, {
      key: 'selectFromParams',
      value: function selectFromParams(variantId) {
        var id = variantId || window.Shopify.urlParam('variant');
        if (id) {
          // Get the variant by ID
          var variant = this.product.getVariantById(id);
          if (!variant) {
            return;
          }

          // Loop over the options to find matches
          for (var i = 0; i < variant.options.length; i += 1) {
            var selector = this.selectors['option' + (i + 1)];
            var children = selector.element().querySelector('.options').children;

            for (var x = 0; x < children.length; x += 1) {
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
    }]);

    return OptionSelectorsCustom;
  }();

  var SingleOptionSelectorCustom = function () {
    /**
     * Creates and instance of SingleOptionSelectorCustom.
     * @constructor
     * @param {object} data The options for this class
     * @returns self
     */
    function SingleOptionSelectorCustom(data) {
      _classCallCheck(this, SingleOptionSelectorCustom);

      this.name = data.option.name;
      this.values = data.option.values;
      this.id = data.option.id;
      this.template = data.template;
      this.templateBuilder = data.templateBuilder;
      this.selectedClass = data.selectedClass;
      this.product = data.product;
    }

    /**
     * Builds the selector by compiling the template.
     * @returns {string} HTML for the selector
     */


    _createClass(SingleOptionSelectorCustom, [{
      key: 'buildSelector',
      value: function buildSelector() {
        return this.templateBuilder.call(this);
      }
    }, {
      key: 'element',
      value: function element() {
        return document.getElementById('selector-' + this.product.id + '-' + this.id);
      }
    }, {
      key: 'currentSelection',
      value: function currentSelection() {
        return this.element().querySelector('.' + this.selectedClass);
      }
    }, {
      key: 'clearSelection',
      value: function clearSelection() {
        var currentlySelected = this.element().querySelector('.' + this.selectedClass);
        if (currentlySelected) {
          // Regex replace the selected class to remove spaces (looks cleaner)
          var regex = new RegExp('(^|\\s)' + this.selectedClass + '(\\s|$)', 'gi');
          var classes = currentlySelected.className.split(/\s+/g).length;

          for (var i = 0; i < classes; i += 1) {
            currentlySelected.className = currentlySelected.className.replace(regex, ' ');
          }

          currentlySelected.className = currentlySelected.className.trim();
        }
      }
    }, {
      key: 'makeSelection',
      value: function makeSelection(child) {
        if (typeof child === 'number') {
          child = this.element().querySelector('.options').children[child];
        }

        var classes = child.className.split(/\s+/g);
        classes.push(this.selectedClass);
        child.className = classes.join(' ').replace(/^[\s]+/gi, '');
      }
    }]);

    return SingleOptionSelectorCustom;
  }();

  var HistoryState = function () {
    /**
     * Handles setting new variant in history and URL.
     * @constructor
     * @param {object} klass The instance of OptionSelectorsCustom
     * @returns self
     */
    function HistoryState() {
      _classCallCheck(this, HistoryState);

      // Determins if history state is supported
      this.supported = window.history && window.history.replaceState;
    }

    /**
     * Fires on selection of an option to set the new state.
     * @param {object} variant The variant object
     */


    _createClass(HistoryState, [{
      key: 'onSelection',
      value: function onSelection(variant) {
        if (this.supported) {
          window.Shopify.setParam('variant', variant.id);
        }
      }
    }]);

    return HistoryState;
  }();

  module.exports = OptionSelectorsCustom;
});
