/**
 * If equals helper
 * Useful for displaying different templates based on option
 * @example
 *  {{#if_eq option_name 'Size'}}Size!{{/if_eq}}
 *  {{#if_eq option_name 'Color'}}Color!{{/if_eq}}
 * @param {String} left The left to compare
 * @param {String} right The right to compare
 */
Handlebars.registerHelper('if_eq', function(left, right, opts) {
  return left == right ? opts.fn(this) : opts.inverse(this);
});

/**
 * If contains helper
 * Useful for displaying different templates based on option
 * @example
 *  {{#if_contains option_name 'Size'}}Size!{{/if_contains}}
 *  {{#if_contains option_name 'olor'}}Color!{{/if_contains}}
 * @param {String} left The left to compare
 * @param {String} right The right to compare
 */
Handlebars.registerHelper('if_contains', function(left, right, opts) {
  var regex = new RegExp(right, 'i');
  return left.match(regex) ? opts.fn(this) : opts.inverse(this);
});