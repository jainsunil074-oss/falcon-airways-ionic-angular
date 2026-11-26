(function () {
  'use strict';
  var bridge = window.FalconBridge;
  var amountEl = document.getElementById('amount');
  var form = document.getElementById('pay-form');
  var payBtn = document.getElementById('pay');
  var failBtn = document.getElementById('fail');
  var card = document.getElementById('card');

  var dict = {
    en: { title: 'Falcon Pay', amount: 'Amount due', card: 'Card number', exp: 'Expiry', pay: 'Pay now', simulateFail: 'Simulate declined card', demo: 'Demo only — use any 16-digit number. No real payment is made.' },
    ar: { title: 'فالكون باي', amount: 'المبلغ المستحق', card: 'رقم البطاقة', exp: 'تاريخ الانتهاء', pay: 'ادفع الآن', simulateFail: 'محاكاة رفض البطاقة', demo: 'عرض تجريبي فقط — لا يتم أي دفع حقيقي.' },
  };

  document.getElementById('transport').textContent = 'transport: ' + bridge.transport;

  bridge.on('host.init', function (ctx) {
    var amount = Number(ctx.data.amount || 0);
    amountEl.textContent = 'AED ' + amount.toLocaleString(ctx.locale === 'ar' ? 'ar-AE' : 'en-AE');
    loadI18n(ctx.locale);
  });

  function loadI18n(locale) {
    if (window.applyI18n) window.applyI18n(dict, locale);
  }

  card.addEventListener('input', function () {
    var digits = card.value.replace(/\D/g, '').slice(0, 16);
    card.value = digits.replace(/(.{4})/g, '$1 ').trim();
  });

  function finish(status) {
    payBtn.disabled = failBtn.disabled = true;
    payBtn.textContent = '…';
    // Simulate the PSP round-trip, then report only a status + reference to the app.
    setTimeout(function () {
      bridge.send('payment.result', {
        status: status,
        reference: 'PSP-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
      });
    }, 900);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (card.value.replace(/\D/g, '').length !== 16) {
      card.focus();
      card.style.borderColor = '#dc2626';
      return;
    }
    finish('paid');
  });
  failBtn.addEventListener('click', function () {
    finish('failed');
  });

  bridge.ready();
})();
