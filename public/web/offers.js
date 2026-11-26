(function () {
  'use strict';
  /*
   * Marketing content owned by a web team and updated without an app release.
   * The app embeds it; the page can only ask the app to open allowlisted routes.
   */
  var bridge = window.FalconBridge;
  var list = document.getElementById('offers');

  var OFFERS = {
    en: [
      { title: 'London from AED 2,195', text: 'Return Economy fares on 787 Dreamliner. Book by Sunday.', cta: 'Book now', route: '/tabs/book' },
      { title: 'Business Class to Paris', text: 'Lie-flat seats and lounge access from AED 8,950.', cta: 'Explore', route: '/tabs/book' },
      { title: 'Ask our AI assistant', text: 'Baggage, check-in and travel questions, answered instantly.', cta: 'Open assistant', route: '/assistant' },
    ],
    ar: [
      { title: 'لندن ابتداءً من 2,195 درهم', text: 'أسعار ذهاب وعودة على الدرجة السياحية. احجز قبل الأحد.', cta: 'احجز الآن', route: '/tabs/book' },
      { title: 'درجة رجال الأعمال إلى باريس', text: 'مقاعد مسطحة ودخول الصالة ابتداءً من 8,950 درهم.', cta: 'استكشف', route: '/tabs/book' },
      { title: 'اسأل مساعدنا الذكي', text: 'أسئلة الأمتعة وتسجيل الوصول والسفر بإجابات فورية.', cta: 'افتح المساعد', route: '/assistant' },
    ],
  };

  document.getElementById('transport').textContent = 'transport: ' + bridge.transport;

  function render(locale) {
    list.textContent = '';
    (OFFERS[locale] || OFFERS.en).forEach(function (offer) {
      var card = document.createElement('div');
      card.className = 'card';
      var h = document.createElement('h1');
      h.textContent = offer.title;
      var p = document.createElement('p');
      p.className = 'muted';
      p.textContent = offer.text;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = offer.cta;
      btn.addEventListener('click', function () {
        bridge.send('web.navigate', { route: offer.route });
      });
      card.append(h, p, btn);
      list.appendChild(card);
    });
  }

  render('en');
  bridge.on('host.init', function (ctx) {
    render(ctx.locale);
  });
  bridge.ready();
})();
