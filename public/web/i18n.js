/** Tiny translator for hosted modules: fills [data-i18n] elements from the host's locale. */
window.applyI18n = function (dict, locale) {
  var table = dict[locale] || dict.en;
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (table[key]) el.textContent = table[key];
  });
};
