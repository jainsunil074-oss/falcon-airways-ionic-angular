(function () {
  'use strict';
  var bridge = window.FalconBridge;
  var map = document.getElementById('seatmap');
  var selectedEl = document.getElementById('selected');
  var confirmBtn = document.getElementById('confirm');
  var done = document.getElementById('done');
  var selected = null;

  var dict = {
    en: { title: 'Choose your seat', selected: 'Selected seat', confirm: 'Confirm check-in', done: 'Checked in — seat ' },
    ar: { title: 'اختر مقعدك', selected: 'المقعد المختار', confirm: 'تأكيد تسجيل الوصول', done: 'تم تسجيل الوصول — المقعد ' },
  };
  var locale = 'en';

  document.getElementById('transport').textContent = 'transport: ' + bridge.transport;

  bridge.on('host.init', function (ctx) {
    locale = ctx.locale;
    window.applyI18n(dict, locale);
    document.getElementById('passenger').textContent = ctx.data.passenger || '';
    document.getElementById('flight').firstElementChild.textContent =
      (ctx.data.flightNumber || '') + ' · ' + (ctx.data.route || '');
  });

  // Build a 12-row 3-3 economy seat map with some seats already taken.
  var letters = ['A', 'B', 'C', '', 'D', 'E', 'F'];
  for (var row = 20; row < 32; row++) {
    letters.forEach(function (letter) {
      if (!letter) {
        var aisle = document.createElement('span');
        aisle.className = 'aisle';
        aisle.textContent = row;
        map.appendChild(aisle);
        return;
      }
      var seat = row + letter;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'seat';
      btn.textContent = letter;
      btn.setAttribute('aria-label', 'Seat ' + seat);
      var taken = (row * 7 + letter.charCodeAt(0)) % 3 === 0;
      if (taken) {
        btn.classList.add('taken');
        btn.disabled = true;
      }
      btn.addEventListener('click', function () {
        map.querySelectorAll('.selected').forEach(function (b) {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');
        selected = seat;
        selectedEl.textContent = seat;
        confirmBtn.disabled = false;
      });
      map.appendChild(btn);
    });
  }

  confirmBtn.addEventListener('click', function () {
    if (!selected) return;
    confirmBtn.disabled = true;
    done.hidden = false;
    done.textContent = dict[locale].done + selected;
    bridge.send('checkin.completed', { seat: selected });
  });

  bridge.ready();
})();
