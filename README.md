# Shopify Single Option Selector Custom

### The Problem

Shopify provides a Javascript [option selection library](https://docs.shopify.com/themes/customization/products/use-products-with-multiple-options) to build multiple dropdown boxes for a given product based on the options and variants. However, this product library only generates dropdown boxes and many clients wish to have a more styled dropdown or a totally different method (like a list of swatches).

### The Solution

This library allows you to pass in a Handlebars template to use for the selection generation. This enables you to style or format your markup just as you see fit and let the library handle returning the selected variant. It is written in pure Javascript.

## Installation & Usage

The following steps are simply guidelines. Your process may differ if you use Gulp, Grunt, or others in your standard workflow.

### Asset

Download `option_selection_custom.js` in this repository and upload it to your `assets` folder. As well, be sure to grab a copy of [Handlebars](handlebarsjs.com) and add it to your `assets`.

### theme.liquid

```html
{% if template == 'product' %}
  {{ 'handlebars.js' | asset_url | script_tag }}
  {{ 'option_selection.js' | shopify_asset_url | script_tag }}
  {{ 'option_selection_custom.js' | asset_url | script_tag }}
{% endif %}
```

### product.liquid

Ensure you have Liquid generating a dropdown box of all variants for you:

```html
<select id="product-select" name="id">
  {% for variant in product.variants %}
    <option value="{{ variant.id }}">
      {{ variant.title }} - {{ variant.price | money }}
    </option>
  {% endfor %}
</select>
```

At the bottom of the file:

```html
{% include 'option_selector_template' %}

<script>
  jQuery(document).ready(function($) {
    var variant_callback = function(variant, selector) {
      // The variant selected by customer, you can do what you wish with the object
      // Update the price, change the images, etc
      console.log(variant); 
    };

    new Shopify.OptionSelectorsCustom({
      // The select box ID to target
      element: 'product-select',

      // The product's JSON
      product: {{ product | json }},

      // Turn on history event (updates history with variant selected and updates URL)
      enableHistory: true,

      // The template's HTML
      template: $('#option_selector_template').html(),

      // The class to set active when a customer clicks an item
      selected_class: 'active',

      // The callback to fire when a selection is made
      // Values passed:
      //    {Object} variant The variant object
      //    {Object} selector The selector object (SingleOptionSelectorCustom)
      //    {Object} e The mouse event which fired the click
      callback: variant_callback
    });
  });
</script>
```

Please note, for the object you pass into `Shopify.OptionSelectorsCustom`, all parameters are required besides `enableHistory`.

### snippets/option_selector_template.liquid

This is the template which will be repeated for every option. You have full control of the markup with a small list of requirements:

1. Ensure you use `{% raw %}` around the template so the Handlebar variables will not be parsed by Liquid
2. `id="{{option_id}}"` is required on your parent container for the options
3. The direct children of the parent must have `data-value="{{this}}"`

```
{% raw %}
  <script id="option_selector_template" type="text/x-handlebars-template">
    <div class="selectbox">
      <h4 class="section-name">Choose a {{option_name}}</h4>
      <div class="list">
        <ul id="{{option_id}}">
          {{#each option_values}}
            <li data-value="{{this}}"><span>{{this}}</span></li> 
          {{/each}}
        </ul>
      </div>
    </div>
  </script>
{% endraw %}
```