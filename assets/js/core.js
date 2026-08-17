/* =============================================================================
 * MarketMesh · core.js
 * Shared runtime for every page: language, formatting, storage, cart, activity
 * tracking, search (incl. Korean 초성 search), geolocation, and the shell UI
 * (header / footer / cart drawer / toasts) that each page injects.
 * ========================================================================== */
(function (global) {
  'use strict';

  var MM = global.MM || (global.MM = {});
  var D = MM.data;

  /* ============================================================== storage == */
  var LS_PREFIX = 'mm.v1.';
  var storage = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(LS_PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)); } catch (e) {}
      return value;
    },
    remove: function (key) {
      try { localStorage.removeItem(LS_PREFIX + key); } catch (e) {}
    }
  };
  MM.storage = storage;

  /* ================================================================ i18n === */
  var STRINGS = {
    ko: {
      'brand.tagline': '실시간 매대 확인이 되는 전통시장 장보기',
      'nav.home': '홈', 'nav.markets': '시장 찾기', 'nav.live': '실시간 매대',
      'nav.map': '지도', 'nav.picks': 'AI 추천', 'nav.cart': '장바구니',
      'nav.search.placeholder': '상품·점포·시장 검색 (초성 검색 가능)',
      'nav.search.go': '검색',
      'lang.toggle': 'EN',
      'common.market': '시장', 'common.store': '점포', 'common.product': '상품',
      'common.stall': '점포번호', 'common.category': '업종', 'common.owner': '대표',
      'common.since': '개업', 'common.hours': '영업시간', 'common.closed': '휴무',
      'common.phone': '전화', 'common.pay': '결제', 'common.rating': '평점',
      'common.reviews': '후기', 'common.parking': '주차', 'common.transit': '교통',
      'common.address': '주소', 'common.delivery': '배송',
      'common.all': '전체', 'common.more': '더보기', 'common.back': '뒤로',
      'common.close': '닫기', 'common.won': '원', 'common.min': '분 전',
      'common.hour': '시간 전', 'common.day': '일 전', 'common.justNow': '방금 전',
      'common.km': 'km', 'common.m': 'm', 'common.loading': '불러오는 중…',
      'common.none': '해당 결과가 없습니다.',
      'filter.country': '국가', 'filter.state': '시·도', 'filter.city': '시·군·구',
      'filter.market': '시장', 'filter.category': '업종', 'filter.sort': '정렬',
      'sort.recommended': '추천순', 'sort.live': '실시간 우선', 'sort.fresh': '사진 최신순',
      'sort.rating': '평점순', 'sort.name': '이름순', 'sort.distance': '가까운 순',
      'live.badge': 'LIVE', 'live.photo': '사진', 'live.none': '미등록',
      'live.viewers': '명 시청 중', 'live.latency': '지연',
      'photo.updated': '사진 업데이트', 'photo.none': '등록된 사진 없음',
      'photo.fresh': '최신', 'photo.ok': '오늘 촬영', 'photo.stale': '갱신 필요',
      'photo.hint': '이 점포는 카메라 없이 사진만 등록합니다. 촬영 시각을 확인하세요.',
      'zoom.in': '확대', 'zoom.out': '축소', 'zoom.reset': '초기화',
      'zoom.full': '전체화면', 'zoom.snap': '스냅샷', 'zoom.hint': '드래그로 이동 · 휠로 확대',
      'detect.title': 'AI 상품 인식', 'detect.on': '박스 표시', 'detect.off': '박스 숨김',
      'detect.count': '개 품목 인식', 'detect.conf': '정확도',
      'detect.priceAi': 'AI 추정가', 'detect.priceAiHelp': '가격표 인식 결과로, 실제 가격과 다를 수 있습니다. 결제 전 점포에 확인하세요.',
      'detect.updated': '인식 갱신',
      'store.contact': '점포 연락', 'store.call': '전화 걸기', 'store.sms': '문자 보내기',
      'store.route': '길찾기', 'store.share': '공유', 'store.fav': '즐겨찾기',
      'store.faved': '즐겨찾기 해제', 'store.enter': '점포 페이지 열기',
      'store.products': '오늘 매대 상품', 'store.info': '점포 정보',
      'store.noCamera': '이 점포는 실시간 카메라가 없습니다.',
      'store.noPhoto': '사진과 카메라가 아직 등록되지 않았습니다.',
      'cart.title': '장바구니', 'cart.empty': '아직 담은 상품이 없습니다.',
      'cart.add': '담기', 'cart.added': '담았습니다', 'cart.remove': '삭제',
      'cart.subtotal': '상품 금액', 'cart.delivery': '배송비', 'cart.discount': '온누리 할인',
      'cart.total': '결제 예상 금액', 'cart.checkout': '주문하기', 'cart.clear': '비우기',
      'cart.count': '개', 'cart.free': '무료', 'cart.view': '장바구니 보기',
      'cart.pickup': '시장 직접 수령', 'cart.deliver': '당일 배송',
      'ai.title': 'AI 장보기 추천', 'ai.sub': '담은 상품과 둘러본 점포를 보고 다음에 살 것을 제안합니다.',
      'ai.refresh': '다시 추천', 'ai.grok': 'xAI Grok 실시간 추천',
      'ai.local': '오프라인 추천 엔진', 'ai.thinking': '추천을 만드는 중…',
      'ai.why': '추천 이유', 'ai.bundle': '오늘의 장바구니 묶음',
      'ai.empty': '상품을 담거나 점포를 둘러보면 추천이 정확해집니다.',
      'ai.pairWith': '함께 사면 좋아요',
      'map.title': '시장 지도', 'map.nearby': '가까운 시장', 'map.locate': '내 위치로 정렬',
      'map.locating': '위치 확인 중…', 'map.denied': '위치 권한이 없어 기본 순서로 표시합니다.',
      'map.floor': '시장 배치도', 'map.region': '지역 지도', 'map.legend': '범례',
      'map.selectStall': '배치도에서 점포를 선택하세요.',
      'search.title': '검색 결과', 'search.for': '검색어', 'search.results': '건',
      'search.recent': '최근 검색', 'search.suggest': '추천 검색어', 'search.clear': '지우기',
      'search.inMarkets': '시장', 'search.inStores': '점포', 'search.inProducts': '상품',
      'hero.1.kicker': '지금 켜져 있는 매대',
      'hero.1.title': '오늘 아침의 매대를\n집에서 그대로 봅니다.',
      'hero.1.body': '가좌시장 신선청과 A-12. 카메라는 켜져 있고, 사과는 조금 전에 새로 깔렸습니다.',
      'hero.2.kicker': '당겨서 고르기',
      'hero.2.title': '상처 하나까지\n당겨서 확인하세요.',
      'hero.2.body': '화면을 당기면 매대 끝까지 보입니다. 눈으로 고른 물건만 담으면 됩니다.',
      'hero.3.kicker': '가까운 시장부터',
      'hero.3.title': '8개 시장,\n24개 점포가 연결돼 있습니다.',
      'hero.3.body': '위치를 켜면 가까운 시장부터 보여드립니다. 사진만 올리는 점포는 찍은 시각까지 함께 표시합니다.',
      'hero.scroll': '스크롤',
      'hero.loading': '매대 불러오는 중',
      'skip': '본문 바로가기',
      'layout.title': '점포 배치',
      'layout.zones': '구역',
      'layout.unregistered': '미등록 점포',
      'home.hero.title': '시장 매대를,\n집에서 그대로 봅니다.',
      'home.hero.sub': '전국 전통시장 점포의 실시간 카메라와 매대 사진을 확인하고, AI가 인식한 오늘의 상품을 그대로 장바구니에 담으세요.',
      'home.hero.cta1': '실시간 매대 보기', 'home.hero.cta2': '시장 찾기',
      'home.stat.markets': '연결된 시장', 'home.stat.stores': '등록 점포',
      'home.stat.cams': '실시간 카메라', 'home.stat.items': '인식 품목',
      'home.find': '지역으로 시장 찾기', 'home.findSub': '국가 → 시·도 → 시·군·구 → 시장 순으로 좁혀 보세요.',
      'home.go': '이 시장 보기', 'home.live': '지금 켜져 있는 매대',
      'home.liveSub': '점포 카메라가 송출 중인 매대입니다. 눌러서 확대·이동해 보세요.',
      'home.fresh': '방금 갱신된 매대 사진', 'home.freshSub': '카메라가 없는 점포는 사진과 촬영 시각으로 신선도를 확인합니다.',
      'home.markets': '연결된 전통시장', 'home.how': '이용 방법',
      'how.1.t': '시장을 고릅니다', 'how.1.d': '지역 필터나 지도에서 가까운 시장을 찾습니다.',
      'how.2.t': '매대를 확인합니다', 'how.2.d': '실시간 카메라를 확대·이동하거나, 사진과 촬영 시각을 봅니다.',
      'how.3.t': '상품을 담습니다', 'how.3.d': 'AI가 인식한 품목을 그대로 담고 필요하면 점포에 전화합니다.',
      'how.4.t': 'AI가 제안합니다', 'how.4.d': '담은 상품에 맞춰 다음에 살 것을 추천받습니다.',
      'market.stores': '시장 속 점포', 'market.preview': '매대 미리보기',
      'market.selectStore': '점포를 선택하면 여기에서 미리 볼 수 있습니다.',
      'market.info': '시장 정보', 'market.filterHint': '업종과 정렬을 바꿔 보세요.',
      'market.liveOnly': '실시간 점포만',
      'foot.rights': '전통시장 디지털 장보기 데모', 'foot.note': '본 사이트는 KSEF 출품용 프로토타입입니다.',
      'toast.copied': '링크를 복사했습니다.', 'toast.fav': '즐겨찾기에 추가했습니다.',
      'toast.unfav': '즐겨찾기에서 뺐습니다.', 'toast.snap': '스냅샷을 저장했습니다.',
      'pay.card': '카드', 'pay.onnuri': '온누리상품권', 'pay.zeropay': '제로페이', 'pay.cash': '현금',
      'stock.high': '재고 충분', 'stock.low': '마감 임박', 'stock.soldout': '품절'
    },
    en: {
      'brand.tagline': 'Traditional-market shopping with a live look at the counter',
      'nav.home': 'Home', 'nav.markets': 'Find a market', 'nav.live': 'Live stalls',
      'nav.map': 'Map', 'nav.picks': 'AI picks', 'nav.cart': 'Cart',
      'nav.search.placeholder': 'Search products, stalls, markets',
      'nav.search.go': 'Search',
      'lang.toggle': '한국어',
      'common.market': 'Market', 'common.store': 'Stall', 'common.product': 'Product',
      'common.stall': 'Stall no.', 'common.category': 'Trade', 'common.owner': 'Owner',
      'common.since': 'Since', 'common.hours': 'Hours', 'common.closed': 'Closed',
      'common.phone': 'Phone', 'common.pay': 'Payment', 'common.rating': 'Rating',
      'common.reviews': 'reviews', 'common.parking': 'Parking', 'common.transit': 'Transit',
      'common.address': 'Address', 'common.delivery': 'Delivery',
      'common.all': 'All', 'common.more': 'See all', 'common.back': 'Back',
      'common.close': 'Close', 'common.won': 'KRW', 'common.min': 'min ago',
      'common.hour': 'h ago', 'common.day': 'd ago', 'common.justNow': 'just now',
      'common.km': 'km', 'common.m': 'm', 'common.loading': 'Loading…',
      'common.none': 'No results.',
      'filter.country': 'Country', 'filter.state': 'State', 'filter.city': 'City',
      'filter.market': 'Market', 'filter.category': 'Trade', 'filter.sort': 'Sort',
      'sort.recommended': 'Recommended', 'sort.live': 'Live first', 'sort.fresh': 'Freshest photo',
      'sort.rating': 'Rating', 'sort.name': 'Name', 'sort.distance': 'Nearest',
      'live.badge': 'LIVE', 'live.photo': 'PHOTO', 'live.none': 'NOT SET',
      'live.viewers': 'watching', 'live.latency': 'latency',
      'photo.updated': 'Photo updated', 'photo.none': 'No photo on file',
      'photo.fresh': 'fresh', 'photo.ok': 'shot today', 'photo.stale': 'needs refresh',
      'photo.hint': 'This stall has no camera and posts photos only, so check the capture time.',
      'zoom.in': 'Zoom in', 'zoom.out': 'Zoom out', 'zoom.reset': 'Reset',
      'zoom.full': 'Fullscreen', 'zoom.snap': 'Snapshot', 'zoom.hint': 'Drag to pan · scroll to zoom',
      'detect.title': 'AI product detection', 'detect.on': 'Show boxes', 'detect.off': 'Hide boxes',
      'detect.count': 'items detected', 'detect.conf': 'confidence',
      'detect.priceAi': 'AI-read price', 'detect.priceAiHelp': 'Read from the paper price tag; it may be wrong. Confirm with the stall before paying.',
      'detect.updated': 'Detection refreshed',
      'store.contact': 'Contact stall', 'store.call': 'Call', 'store.sms': 'Text',
      'store.route': 'Directions', 'store.share': 'Share', 'store.fav': 'Save',
      'store.faved': 'Saved', 'store.enter': 'Open stall page',
      'store.products': "Today's counter", 'store.info': 'Stall info',
      'store.noCamera': 'This stall has no live camera.',
      'store.noPhoto': 'No photo or camera registered yet.',
      'cart.title': 'Cart', 'cart.empty': 'Nothing in the cart yet.',
      'cart.add': 'Add', 'cart.added': 'Added', 'cart.remove': 'Remove',
      'cart.subtotal': 'Subtotal', 'cart.delivery': 'Delivery', 'cart.discount': 'Onnuri discount',
      'cart.total': 'Estimated total', 'cart.checkout': 'Place order', 'cart.clear': 'Clear',
      'cart.count': 'items', 'cart.free': 'Free', 'cart.view': 'View cart',
      'cart.pickup': 'Pick up at the market', 'cart.deliver': 'Same-day delivery',
      'ai.title': 'AI shopping picks', 'ai.sub': 'Suggested from what you added and the stalls you browsed.',
      'ai.refresh': 'Re-run', 'ai.grok': 'Live picks by xAI Grok',
      'ai.local': 'Offline recommender', 'ai.thinking': 'Building picks…',
      'ai.why': 'Why', 'ai.bundle': "Today's basket bundle",
      'ai.empty': 'Add something or browse a stall and the picks get sharper.',
      'ai.pairWith': 'Goes well with',
      'map.title': 'Market map', 'map.nearby': 'Markets near you', 'map.locate': 'Sort by my location',
      'map.locating': 'Locating…', 'map.denied': 'Location denied, so this is the default order.',
      'map.floor': 'Stall layout', 'map.region': 'Area map', 'map.legend': 'Legend',
      'map.selectStall': 'Pick a stall on the layout.',
      'search.title': 'Search results', 'search.for': 'Query', 'search.results': 'results',
      'search.recent': 'Recent', 'search.suggest': 'Try', 'search.clear': 'Clear',
      'search.inMarkets': 'Markets', 'search.inStores': 'Stalls', 'search.inProducts': 'Products',
      'hero.1.kicker': 'A counter that is on right now',
      'hero.1.title': "See this morning's counter\nfrom your own kitchen.",
      'hero.1.body': 'Gajwa Market, stall A-12. The camera is on, and the apples went out a few minutes ago.',
      'hero.2.kicker': 'Pull it closer',
      'hero.2.title': 'Zoom in until you can\nsee every bruise.',
      'hero.2.body': 'Drag across the counter, then add only what you like the look of.',
      'hero.3.kicker': 'Nearest market first',
      'hero.3.title': 'Eight markets,\ntwenty four stalls, connected.',
      'hero.3.body': 'Turn on location and the closest market comes first. Photo-only stalls show the minute the picture was taken.',
      'hero.scroll': 'SCROLL',
      'hero.loading': 'loading the counter',
      'skip': 'Skip to content',
      'layout.title': 'Stall layout',
      'layout.zones': 'Zones',
      'layout.unregistered': 'not on MarketMesh yet',
      'home.hero.title': 'See the counter\nbefore you leave home.',
      'home.hero.sub': 'Watch live stall cameras and freshly stamped counter photos from traditional markets, then add exactly what the AI sees on the table.',
      'home.hero.cta1': 'Watch live stalls', 'home.hero.cta2': 'Find a market',
      'home.stat.markets': 'Markets connected', 'home.stat.stores': 'Stalls listed',
      'home.stat.cams': 'Live cameras', 'home.stat.items': 'Items detected',
      'home.find': 'Find a market by area', 'home.findSub': 'Narrow it down: country → state → city → market.',
      'home.go': 'Open this market', 'home.live': 'Counters that are live now',
      'home.liveSub': 'Stall cameras streaming right now. Zoom and pan them.',
      'home.fresh': 'Just-refreshed counter photos', 'home.freshSub': 'Stalls without a camera show a photo and the exact time it was taken.',
      'home.markets': 'Connected markets', 'home.how': 'How it works',
      'how.1.t': 'Pick a market', 'how.1.d': 'Use the area filter or the map to find one near you.',
      'how.2.t': 'Check the counter', 'how.2.d': 'Zoom and pan the live camera, or read the photo timestamp.',
      'how.3.t': 'Add what you see', 'how.3.d': 'Add the AI-detected items, and call the stall if you need to ask.',
      'how.4.t': 'Let the AI suggest', 'how.4.d': 'Get the next thing to buy based on what is in your basket.',
      'market.stores': 'Stalls in this market', 'market.preview': 'Counter preview',
      'market.selectStore': 'Select a stall to preview it here.',
      'market.info': 'Market info', 'market.filterHint': 'Try another trade or sort order.',
      'market.liveOnly': 'Live stalls only',
      'foot.rights': 'Traditional-market digital shopping demo', 'foot.note': 'A prototype built for KSEF.',
      'toast.copied': 'Link copied.', 'toast.fav': 'Saved.',
      'toast.unfav': 'Removed from saved.', 'toast.snap': 'Snapshot saved.',
      'pay.card': 'Card', 'pay.onnuri': 'Onnuri voucher', 'pay.zeropay': 'ZeroPay', 'pay.cash': 'Cash',
      'stock.high': 'In stock', 'stock.low': 'Almost gone', 'stock.soldout': 'Sold out'
    }
  };

  var lang = storage.get('lang', 'ko');
  if (lang !== 'ko' && lang !== 'en') lang = 'ko';

  function t(key) {
    var table = STRINGS[lang] || STRINGS.ko;
    return table[key] != null ? table[key] : (STRINGS.ko[key] != null ? STRINGS.ko[key] : key);
  }
  function pick(obj) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] != null ? obj[lang] : (obj.ko || obj.en || '');
  }
  MM.i18n = {
    get lang() { return lang; },
    t: t,
    pick: pick,
    set: function (next) {
      lang = next === 'en' ? 'en' : 'ko';
      storage.set('lang', lang);
      location.reload();
    },
    toggle: function () { MM.i18n.set(lang === 'ko' ? 'en' : 'ko'); }
  };
  MM.t = t;
  MM.pick = pick;

  /* ============================================================ formatting = */
  function won(n) {
    var v = Math.round(Number(n) || 0);
    return '₩' + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function ago(minutes) {
    if (minutes == null) return '—';
    if (minutes < 1) return t('common.justNow');
    if (minutes < 60) return Math.round(minutes) + (lang === 'ko' ? '분 전' : ' min ago');
    if (minutes < 60 * 24) return Math.round(minutes / 60) + (lang === 'ko' ? '시간 전' : 'h ago');
    return Math.round(minutes / 1440) + (lang === 'ko' ? '일 전' : 'd ago');
  }
  function stamp(date) {
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
      ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }
  function dist(km) {
    if (km == null) return '';
    return km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km';
  }
  MM.fmt = { won: won, ago: ago, stamp: stamp, dist: dist };

  /* ============================================================ freshness == */
  /* Photo age drives the stamp the spec asks for: it must sit under the photo
   * and be impossible to miss, because a photo-only stall is only as
   * trustworthy as the moment it was taken. */
  function freshness(store) {
    if (!store || store.photoAgeMin == null) {
      return { tone: 'none', minutes: null, label: t('photo.none'), stampText: '—' };
    }
    var min = store.photoAgeMin;
    var tone = min <= 60 ? 'fresh' : (min <= 24 * 60 ? 'ok' : 'stale');
    var at = new Date(Date.now() - min * 60000);
    return {
      tone: tone,
      minutes: min,
      label: tone === 'fresh' ? t('photo.fresh') : tone === 'ok' ? t('photo.ok') : t('photo.stale'),
      relative: ago(min),
      stampText: stamp(at)
    };
  }
  MM.freshness = freshness;

  /* =============================================================== images == */
  var CAT_EMOJI = {};
  D.categories.forEach(function (c) { CAT_EMOJI[c.id] = c; });

  function svgTile(emoji, text, color) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.20"/>' +
      '<stop offset="100%" stop-color="' + color + '" stop-opacity="0.05"/></linearGradient></defs>' +
      '<rect width="640" height="480" fill="#f3f1ec"/><rect width="640" height="480" fill="url(#g)"/>' +
      '<text x="320" y="228" font-size="120" text-anchor="middle">' + emoji + '</text>' +
      '<text x="320" y="300" font-size="26" text-anchor="middle" font-family="sans-serif" fill="#8a8578">' +
      text + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* Products without a cut-out photo fall back to a generated tile — so the
   * icon should be the actual item, not just its trade category. */
  var TAG_EMOJI = {
    apple: '🍎', pear: '🍐', grape: '🍇', berry: '🍓', citrus: '🍊', melon: '🍈',
    watermelon: '🍉', banana: '🍌', kiwi: '🥝', persimmon: '🟠', tomato: '🍅',
    cucumber: '🥒', potato: '🥔', 'sweet-potato': '🍠', onion: '🧅', chili: '🌶',
    cabbage: '🥬', greens: '🥬', chives: '🌿', broccoli: '🥦', sprouts: '🌱',
    mushroom: '🍄', chestnut: '🌰', jujube: '🌰', nuts: '🥜', oil: '🫒',
    ginseng: '🫚', mugwort: '🌿', kimchi: '🥬', pork: '🥓', beef: '🥩',
    chicken: '🍗', fish: '🐟', squid: '🦑', abalone: '🐚', dumpling: '🥟',
    tteokbokki: '🍢', gimbap: '🍙', pancake: '🥞', tea: '🍵'
  };

  function productEmoji(product) {
    var tags = product.tags || [];
    for (var i = 0; i < tags.length; i++) if (TAG_EMOJI[tags[i]]) return TAG_EMOJI[tags[i]];
    var c = CAT_EMOJI[product.cat];
    return c ? c.emoji : '🧺';
  }

  MM.img = {
    stall: function (store, size) {
      if (!store.photo) {
        var c = CAT_EMOJI[store.cat] || { emoji: '🏪', color: '#8a8578' };
        return svgTile(c.emoji, MM.t('photo.none'), c.color);
      }
      return 'assets/img/stalls/' + (size === 'thumb' ? 'thumb/' : '') + store.photo + '.jpg';
    },
    product: function (product) {
      if (product.img) return 'assets/img/products/' + product.img;
      var c = CAT_EMOJI[product.cat] || { color: '#8a8578' };
      return svgTile(productEmoji(product), pick(product), c.color);
    },
    video: function (store) {
      return store.camera ? 'assets/video/' + store.camera.src : null;
    }
  };

  /* ================================================================= urls == */
  MM.url = {
    market: function (id) { return 'market.html?m=' + encodeURIComponent(id); },
    store: function (id) { return 'store.html?s=' + encodeURIComponent(id); },
    search: function (q) { return 'search.html?q=' + encodeURIComponent(q); },
    map: function (id) { return 'map.html' + (id ? '?m=' + encodeURIComponent(id) : ''); },
    param: function (name) {
      var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
      return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
    }
  };

  /* =============================================================== search == */
  var CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ',
                 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  function chosung(str) {
    var out = '';
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      if (code >= 0xac00 && code <= 0xd7a3) out += CHOSUNG[Math.floor((code - 0xac00) / 588)];
      else out += str[i];
    }
    return out;
  }
  function isChosungQuery(q) {
    return /^[ㄱ-ㅎ\s]+$/.test(q);
  }
  function norm(s) { return (s || '').toString().toLowerCase().replace(/\s+/g, ''); }

  function haystack(parts) {
    var joined = parts.filter(Boolean).join(' ');
    return { plain: norm(joined), cho: norm(chosung(joined)) };
  }

  // Pre-build the index once; the catalog is static.
  var INDEX = { markets: [], stores: [], products: [] };
  D.markets.forEach(function (m) {
    INDEX.markets.push({ ref: m, hay: haystack([m.ko, m.en, m.addr.ko, m.addr.en, (m.tags || []).join(' ')]) });
  });
  D.stores.forEach(function (s) {
    var mk = D.marketById[s.marketId];
    INDEX.stores.push({ ref: s, hay: haystack([s.ko, s.en, s.stall, mk.ko, mk.en, pick(s.blurb), s.cat]) });
  });
  D.products.forEach(function (p) {
    var st = D.storeById[p.storeId], mk = D.marketById[p.marketId];
    INDEX.products.push({
      ref: p,
      hay: haystack([p.ko, p.en, p.origin && p.origin.ko, p.origin && p.origin.en,
                     (p.tags || []).join(' '), st.ko, st.en, mk.ko, mk.en])
    });
  });

  function matches(entry, q, useCho) {
    return useCho ? entry.hay.cho.indexOf(q) !== -1 : entry.hay.plain.indexOf(q) !== -1;
  }

  MM.search = {
    chosung: chosung,
    query: function (raw, limit) {
      var q = norm(raw);
      var res = { markets: [], stores: [], products: [], q: raw };
      if (!q) return res;
      var useCho = isChosungQuery(raw.replace(/\s+/g, ''));
      var cap = limit || 60;
      INDEX.markets.forEach(function (e) { if (res.markets.length < cap && matches(e, q, useCho)) res.markets.push(e.ref); });
      INDEX.stores.forEach(function (e) { if (res.stores.length < cap && matches(e, q, useCho)) res.stores.push(e.ref); });
      INDEX.products.forEach(function (e) { if (res.products.length < cap && matches(e, q, useCho)) res.products.push(e.ref); });
      return res;
    },
    suggestions: function () {
      return lang === 'ko'
        ? ['샤인머스켓', '한라봉', '시금치', '삼겹살', '순무김치', 'ㅅㄱ', '가좌시장']
        : ['shine muscat', 'hallabong', 'spinach', 'pork belly', 'kimchi', 'gajwa'];
    },
    recent: {
      list: function () { return storage.get('recentSearch', []); },
      push: function (q) {
        if (!q) return;
        var list = storage.get('recentSearch', []).filter(function (x) { return x !== q; });
        list.unshift(q);
        storage.set('recentSearch', list.slice(0, 8));
      },
      clear: function () { storage.remove('recentSearch'); }
    }
  };

  /* ================================================================= cart == */
  var cartState = storage.get('cart', {});
  var cartSubs = [];

  function cartSave() {
    storage.set('cart', cartState);
    cartSubs.forEach(function (fn) { try { fn(MM.cart.items()); } catch (e) {} });
    paintCartCount();
  }

  MM.cart = {
    raw: function () { return cartState; },
    items: function () {
      var out = [];
      Object.keys(cartState).forEach(function (uid) {
        var pr = D.productByUid(uid);
        if (pr) out.push({ product: pr, qty: cartState[uid] });
      });
      return out;
    },
    count: function () {
      return Object.keys(cartState).reduce(function (n, k) { return n + cartState[k]; }, 0);
    },
    qty: function (uid) { return cartState[uid] || 0; },
    add: function (uid, qty) {
      var pr = D.productByUid(uid);
      if (!pr) return;
      cartState[uid] = (cartState[uid] || 0) + (qty || 1);
      cartSave();
      MM.activity.log('cart', uid);
      MM.ui.toast(pick(pr) + ' · ' + t('cart.added'), '🧺');
    },
    setQty: function (uid, qty) {
      if (qty <= 0) delete cartState[uid]; else cartState[uid] = qty;
      cartSave();
    },
    remove: function (uid) { delete cartState[uid]; cartSave(); },
    clear: function () { cartState = {}; cartSave(); },
    subtotal: function () {
      return MM.cart.items().reduce(function (sum, it) { return sum + it.product.price * it.qty; }, 0);
    },
    /* Onnuri gift vouchers are the standard traditional-market discount. */
    totals: function (mode) {
      var subtotal = MM.cart.subtotal();
      var discount = Math.floor(subtotal * 0.05);
      var deliveryFee = (mode === 'pickup' || subtotal === 0 || subtotal >= 20000) ? 0 : 3000;
      return {
        subtotal: subtotal,
        discount: discount,
        delivery: deliveryFee,
        total: Math.max(0, subtotal - discount + deliveryFee)
      };
    },
    onChange: function (fn) { cartSubs.push(fn); return fn; }
  };

  /* ============================================================= activity == */
  /* Everything the recommender is allowed to know about the shopper lives here
   * and never leaves the browser except as an anonymous profile in the xAI
   * request body. */
  MM.activity = {
    log: function (kind, id) {
      var key = kind === 'cart' ? 'actCart' : kind === 'store' ? 'actStores' :
                kind === 'product' ? 'actProducts' : kind === 'search' ? 'actSearch' : 'actMisc';
      var list = storage.get(key, []).filter(function (x) { return x !== id; });
      list.unshift(id);
      storage.set(key, list.slice(0, 25));
    },
    stores: function () { return storage.get('actStores', []); },
    products: function () { return storage.get('actProducts', []); },
    searches: function () { return storage.get('actSearch', []); },
    profile: function () {
      var now = new Date();
      return {
        lang: lang,
        hour: now.getHours(),
        weekday: now.getDay(),
        month: now.getMonth() + 1,
        cart: MM.cart.items().map(function (it) {
          return { id: it.product.uid, name: it.product.ko, nameEn: it.product.en,
                   qty: it.qty, cat: it.product.cat, tags: it.product.tags };
        }),
        viewedStores: MM.activity.stores().slice(0, 6),
        viewedProducts: MM.activity.products().slice(0, 10),
        searches: MM.activity.searches().slice(0, 6),
        favourites: MM.fav.list()
      };
    },
    clear: function () {
      ['actCart', 'actStores', 'actProducts', 'actSearch', 'actMisc'].forEach(storage.remove);
    }
  };

  MM.fav = {
    list: function () { return storage.get('fav', []); },
    has: function (id) { return MM.fav.list().indexOf(id) !== -1; },
    toggle: function (id) {
      var list = MM.fav.list();
      var i = list.indexOf(id);
      if (i === -1) { list.push(id); storage.set('fav', list); MM.ui.toast(t('toast.fav'), '⭐'); return true; }
      list.splice(i, 1); storage.set('fav', list); MM.ui.toast(t('toast.unfav'), '☆');
      return false;
    }
  };

  /* ================================================================== geo == */
  function haversine(a, b) {
    var R = 6371, toRad = function (d) { return d * Math.PI / 180; };
    var dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  MM.geo = {
    haversine: haversine,
    last: function () { return storage.get('geo', null); },
    locate: function (cb) {
      if (!navigator.geolocation) { cb(null, 'unsupported'); return; }
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          var here = { lat: pos.coords.latitude, lng: pos.coords.longitude, at: Date.now() };
          storage.set('geo', here);
          cb(here, null);
        },
        function (err) { cb(null, err && err.code === 1 ? 'denied' : 'error'); },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    },
    marketsByDistance: function (here) {
      var list = D.markets.map(function (m) {
        return { market: m, km: here ? haversine(here, m) : null };
      });
      if (here) list.sort(function (a, b) { return a.km - b.km; });
      return list;
    }
  };

  /* ================================================================== dom == */
  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    if (html != null) node.innerHTML = html;
    return node;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  MM.dom = { el: el, esc: esc,
    qs: function (sel, root) { return (root || document).querySelector(sel); },
    qsa: function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  };

  /* ============================================================== shell UI = */
  var NAV = [
    { key: 'nav.home', href: 'index.html', id: 'home' },
    { key: 'nav.markets', href: 'market.html', id: 'market' },
    { key: 'nav.live', href: 'index.html#live', id: 'live' },
    { key: 'nav.map', href: 'map.html', id: 'map' },
    { key: 'nav.picks', href: 'index.html#picks', id: 'picks' }
  ];

  function paintCartCount() {
    MM.dom.qsa('[data-cart-count]').forEach(function (n) {
      var c = MM.cart.count();
      n.textContent = c;
      n.classList.toggle('is-zero', c === 0);
    });
  }

  MM.ui = {
    /* Fills every [data-i18n="key"] node in the document with its translation,
     * so page markup can stay language-free. */
    applyI18n: function (root) {
      MM.dom.qsa('[data-i18n]', root).forEach(function (n) {
        n.textContent = t(n.getAttribute('data-i18n'));
      });
      MM.dom.qsa('[data-i18n-ph]', root).forEach(function (n) {
        n.setAttribute('placeholder', t(n.getAttribute('data-i18n-ph')));
      });
    },

    /* Header, footer, cart drawer and toast host are injected so the six pages
     * never drift out of sync. */
    shell: function (activeId) {
      document.documentElement.lang = lang;
      var host = document.getElementById('mm-header');
      if (host) {
        host.innerHTML =
          '<div class="ticker"><div class="ticker__track">' +
            '<span>' + esc(t('brand.tagline')) + '</span>' +
            '<span>· ' + D.markets.length + ' ' + esc(t('home.stat.markets')) + '</span>' +
            '<span>· ' + D.stores.filter(function (s) { return !!s.camera; }).length + ' ' + esc(t('home.stat.cams')) + '</span>' +
            '<span>· ' + D.products.length + ' ' + esc(t('home.stat.items')) + '</span>' +
            '<span>· ' + (lang === 'ko' ? '온누리상품권 5% 즉시 할인' : '5% instant Onnuri voucher discount') + '</span>' +
          '</div></div>' +
          '<header class="topbar">' +
            '<a class="brand" href="index.html" aria-label="MarketMesh">' +
              '<img src="assets/img/brand/marketmesh-wordmark.jpg" alt="MarketMesh">' +
            '</a>' +
            '<nav class="topnav">' +
              NAV.map(function (n) {
                return '<a href="' + n.href + '"' + (n.id === activeId ? ' class="is-active"' : '') + '>' + esc(t(n.key)) + '</a>';
              }).join('') +
            '</nav>' +
            '<form class="topsearch" role="search" id="mm-search-form">' +
              '<input type="search" id="mm-search-input" placeholder="' + esc(t('nav.search.placeholder')) + '" autocomplete="off">' +
              '<button type="submit" aria-label="' + esc(t('nav.search.go')) + '">🔍</button>' +
              '<div class="topsearch__pop" id="mm-search-pop" hidden></div>' +
            '</form>' +
            '<div class="topactions">' +
              '<button class="btn btn--ghost" id="mm-lang">' + esc(t('lang.toggle')) + '</button>' +
              '<button class="btn btn--cart" id="mm-cart-open">🧺 ' + esc(t('nav.cart')) +
                ' <span class="pill" data-cart-count>0</span></button>' +
            '</div>' +
            '<button class="topmenu" id="mm-menu" aria-label="menu">☰</button>' +
          '</header>' +
          '<div class="mobilenav" id="mm-mobilenav" hidden>' +
            NAV.map(function (n) { return '<a href="' + n.href + '">' + esc(t(n.key)) + '</a>'; }).join('') +
          '</div>';
      }

      var foot = document.getElementById('mm-footer');
      if (foot) {
        foot.innerHTML =
          '<footer class="foot">' +
            '<div class="foot__grid">' +
              '<div>' +
                '<img class="foot__logo" src="assets/img/brand/marketmesh-wordmark.jpg" alt="MarketMesh">' +
                '<p>' + esc(t('brand.tagline')) + '</p>' +
                '<p class="muted small">' + esc(t('foot.note')) + '</p>' +
              '</div>' +
              '<div><h4>' + esc(t('nav.markets')) + '</h4>' +
                D.markets.slice(0, 5).map(function (m) {
                  return '<a href="' + MM.url.market(m.id) + '">' + esc(pick(m)) + '</a>';
                }).join('') +
              '</div>' +
              '<div><h4>' + esc(t('common.category')) + '</h4>' +
                D.categories.slice(0, 6).map(function (c) {
                  return '<a href="' + MM.url.search(pick(c)) + '">' + c.emoji + ' ' + esc(pick(c)) + '</a>';
                }).join('') +
              '</div>' +
              '<div><h4>MarketMesh</h4>' +
                '<a href="map.html">' + esc(t('map.title')) + '</a>' +
                '<a href="cart.html">' + esc(t('cart.title')) + '</a>' +
                '<a href="index.html#picks">' + esc(t('ai.title')) + '</a>' +
                '<p class="muted small" style="margin-top:12px">' + esc(t('foot.rights')) + ' · 2026</p>' +
              '</div>' +
            '</div>' +
          '</footer>';
      }

      if (!document.getElementById('mm-toast-host')) {
        document.body.appendChild(el('div', { id: 'mm-toast-host', class: 'toasts' }));
      }
      if (!document.getElementById('mm-drawer')) {
        document.body.appendChild(el('div', { id: 'mm-drawer', class: 'drawer', hidden: 'hidden' }));
      }

      wireShell();
      paintCartCount();
      MM.ui.applyI18n(document);
    },

    toast: function (msg, icon) {
      var host = document.getElementById('mm-toast-host');
      if (!host) return;
      var node = el('div', { class: 'toast' }, '<span>' + (icon || '✅') + '</span><span>' + esc(msg) + '</span>');
      host.appendChild(node);
      setTimeout(function () { node.classList.add('is-out'); }, 2200);
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 2700);
    },

    openCart: function () { renderDrawer(true); },
    closeCart: function () { renderDrawer(false); },

    /* Small reusable chunks of markup used by several pages. */
    photoStamp: function (store, opts) {
      var f = freshness(store);
      var compact = opts && opts.compact;
      if (f.tone === 'none') {
        return '<div class="stamp stamp--none"><span class="stamp__dot"></span>' +
          '<span class="stamp__text">' + esc(t('photo.none')) + '</span></div>';
      }
      return '<div class="stamp stamp--' + f.tone + '" title="' + esc(t('photo.hint')) + '">' +
        '<span class="stamp__dot"></span>' +
        '<span class="stamp__text"><b>' + esc(t('photo.updated')) + '</b> ' + esc(f.stampText) + '</span>' +
        (compact ? '' : '<span class="stamp__rel">' + esc(f.relative) + '</span>') +
        '</div>';
    },

    liveBadge: function (store, opts) {
      // `inline: true` drops the absolute positioning so the badge can sit in
      // a normal text flow instead of over a photo.
      var extra = (opts && opts.inline) ? ' badge--inline' : '';
      if (store.camera) {
        return '<span class="badge badge--live' + extra + '"><i></i>' + esc(t('live.badge')) + '</span>';
      }
      if (store.photo) return '<span class="badge badge--photo' + extra + '">' + esc(t('live.photo')) + '</span>';
      return '<span class="badge badge--none' + extra + '">' + esc(t('live.none')) + '</span>';
    },

    catChip: function (catId) {
      var c = D.categoryById[catId];
      if (!c) return '';
      return '<span class="chip" style="--chip:' + c.color + '">' + c.emoji + ' ' + esc(pick(c)) + '</span>';
    },

    storeCard: function (store, opts) {
      var mk = D.marketById[store.marketId];
      var o = opts || {};
      return '' +
        '<article class="scard' + (o.compact ? ' scard--compact' : '') + '" data-store="' + esc(store.id) + '">' +
          '<a class="scard__media" href="' + MM.url.store(store.id) + '">' +
            '<img loading="lazy" src="' + MM.img.stall(store, 'thumb') + '" alt="' + esc(pick(store)) + '">' +
            MM.ui.liveBadge(store) +
          '</a>' +
          '<div class="scard__body">' +
            '<div class="scard__title"><a href="' + MM.url.store(store.id) + '">' + esc(pick(store)) + '</a>' +
              '<span class="muted small">' + esc(store.stall) + '</span></div>' +
            '<div class="scard__meta">' + MM.ui.catChip(store.cat) +
              '<span class="muted small">★ ' + store.rating.toFixed(1) + ' (' + store.reviews + ')</span></div>' +
            MM.ui.photoStamp(store, { compact: true }) +
            (o.hideMarket ? '' : '<a class="scard__market muted small" href="' + MM.url.market(mk.id) + '">' + esc(pick(mk)) + '</a>') +
            '<div class="scard__actions">' +
              '<a class="btn btn--sm" href="' + MM.url.store(store.id) + '">' + esc(t('store.enter')) + '</a>' +
              '<a class="btn btn--sm btn--ghost" href="tel:' + esc(store.phone) + '">📞 ' + esc(t('store.call')) + '</a>' +
            '</div>' +
          '</div>' +
        '</article>';
    },

    productRow: function (product, opts) {
      var o = opts || {};
      var store = D.storeById[product.storeId];
      var aiPrice = product.priceSource === 'ai';
      return '' +
        '<div class="prow" data-uid="' + esc(product.uid) + '">' +
          '<div class="prow__thumb">' +
            '<img loading="lazy" src="' + MM.img.product(product) + '" alt="' + esc(pick(product)) + '">' +
            (product.conf > 0 ? '<span class="prow__conf">' + (product.conf * 100).toFixed(1) + '%</span>' : '') +
          '</div>' +
          '<div class="prow__info">' +
            '<div class="prow__name">' + esc(pick(product)) +
              (product.stock === 'low' ? ' <span class="tag tag--warn">' + esc(t('stock.low')) + '</span>' : '') +
              (product.stock === 'soldout' ? ' <span class="tag tag--off">' + esc(t('stock.soldout')) + '</span>' : '') +
            '</div>' +
            '<div class="muted small">' + esc(pick(product.unit)) + ' · ' + esc(pick(product.origin)) +
              (o.showStore ? ' · <a href="' + MM.url.store(store.id) + '">' + esc(pick(store)) + '</a>' : '') + '</div>' +
            '<div class="prow__price"><span class="pricetag">' + esc(won(product.price)) + '</span>' +
              (aiPrice ? ' <span class="pricetag pricetag--sm pricetag--ai" title="' + esc(t('detect.priceAiHelp')) + '">' + esc(t('detect.priceAi')) + '</span>' : '') +
            '</div>' +
          '</div>' +
          '<button class="btn btn--add" data-add="' + esc(product.uid) + '">' + esc(t('cart.add')) + '</button>' +
        '</div>';
    }
  };

  /* Delegated handler so any [data-add="uid"] button works on every page. */
  document.addEventListener('click', function (e) {
    var addBtn = e.target.closest ? e.target.closest('[data-add]') : null;
    if (addBtn) {
      MM.cart.add(addBtn.getAttribute('data-add'), 1);
      addBtn.classList.add('is-added');
      setTimeout(function () { addBtn.classList.remove('is-added'); }, 900);
    }
  });

  function wireShell() {
    var langBtn = document.getElementById('mm-lang');
    if (langBtn) langBtn.addEventListener('click', function () { MM.i18n.toggle(); });

    var cartBtn = document.getElementById('mm-cart-open');
    if (cartBtn) cartBtn.addEventListener('click', function () { MM.ui.openCart(); });

    var menuBtn = document.getElementById('mm-menu');
    var mobile = document.getElementById('mm-mobilenav');
    if (menuBtn && mobile) menuBtn.addEventListener('click', function () { mobile.hidden = !mobile.hidden; });

    var form = document.getElementById('mm-search-form');
    var input = document.getElementById('mm-search-input');
    var pop = document.getElementById('mm-search-pop');
    if (form && input) {
      var preset = MM.url.param('q');
      if (preset) input.value = preset;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var q = input.value.trim();
        if (!q) return;
        MM.search.recent.push(q);
        MM.activity.log('search', q);
        location.href = MM.url.search(q);
      });

      var render = function () {
        var q = input.value.trim();
        if (!q) {
          var recent = MM.search.recent.list();
          var sugg = MM.search.suggestions();
          pop.innerHTML =
            (recent.length ? '<div class="pop__head">' + esc(t('search.recent')) + '</div>' +
              recent.map(function (r) { return '<a href="' + MM.url.search(r) + '">🕘 ' + esc(r) + '</a>'; }).join('') : '') +
            '<div class="pop__head">' + esc(t('search.suggest')) + '</div>' +
            sugg.map(function (r) { return '<a href="' + MM.url.search(r) + '">🔎 ' + esc(r) + '</a>'; }).join('');
          pop.hidden = false;
          return;
        }
        var res = MM.search.query(q, 5);
        var html = '';
        if (res.products.length) {
          html += '<div class="pop__head">' + esc(t('search.inProducts')) + '</div>' +
            res.products.slice(0, 5).map(function (p) {
              return '<a href="' + MM.url.store(p.storeId) + '#' + esc(p.id) + '">' +
                '<img src="' + MM.img.product(p) + '" alt="">' + esc(pick(p)) +
                '<span class="muted small">' + esc(won(p.price)) + '</span></a>';
            }).join('');
        }
        if (res.stores.length) {
          html += '<div class="pop__head">' + esc(t('search.inStores')) + '</div>' +
            res.stores.slice(0, 4).map(function (s) {
              return '<a href="' + MM.url.store(s.id) + '">🏪 ' + esc(pick(s)) +
                '<span class="muted small">' + esc(pick(D.marketById[s.marketId])) + '</span></a>';
            }).join('');
        }
        if (res.markets.length) {
          html += '<div class="pop__head">' + esc(t('search.inMarkets')) + '</div>' +
            res.markets.slice(0, 3).map(function (m) {
              return '<a href="' + MM.url.market(m.id) + '">📍 ' + esc(pick(m)) + '</a>';
            }).join('');
        }
        pop.innerHTML = html || '<div class="pop__empty">' + esc(t('common.none')) + '</div>';
        pop.hidden = false;
      };

      input.addEventListener('input', render);
      input.addEventListener('focus', render);
      document.addEventListener('click', function (e) {
        if (!form.contains(e.target)) pop.hidden = true;
      });
    }
  }

  function renderDrawer(open) {
    var host = document.getElementById('mm-drawer');
    if (!host) return;
    if (!open) { host.hidden = true; document.body.classList.remove('no-scroll'); return; }

    var items = MM.cart.items();
    var mode = storage.get('fulfilment', 'deliver');
    var tot = MM.cart.totals(mode);

    host.innerHTML =
      '<div class="drawer__scrim" data-close></div>' +
      '<aside class="drawer__panel" role="dialog" aria-label="' + esc(t('cart.title')) + '">' +
        '<div class="drawer__head"><h3>🧺 ' + esc(t('cart.title')) +
          ' <span class="muted small">' + MM.cart.count() + esc(t('cart.count')) + '</span></h3>' +
          '<button class="iconbtn" data-close aria-label="' + esc(t('common.close')) + '">✕</button></div>' +
        (items.length ? '<div class="drawer__list">' + items.map(function (it) {
          var p = it.product, s = D.storeById[p.storeId];
          return '<div class="citem">' +
            '<img src="' + MM.img.product(p) + '" alt="">' +
            '<div class="citem__info"><b>' + esc(pick(p)) + '</b>' +
              '<span class="muted small">' + esc(pick(s)) + ' · ' + esc(pick(p.unit)) + '</span>' +
              '<span class="citem__price"><span class="pricetag pricetag--sm">' + esc(won(p.price * it.qty)) + '</span></span></div>' +
            '<div class="qty"><button data-qty="' + esc(p.uid) + '" data-delta="-1">−</button>' +
              '<span>' + it.qty + '</span>' +
              '<button data-qty="' + esc(p.uid) + '" data-delta="1">+</button></div>' +
          '</div>';
        }).join('') + '</div>' : '<div class="drawer__empty">' + esc(t('cart.empty')) + '</div>') +
        '<div class="drawer__foot">' +
          '<div class="segmented">' +
            '<button data-mode="deliver"' + (mode === 'deliver' ? ' class="is-on"' : '') + '>' + esc(t('cart.deliver')) + '</button>' +
            '<button data-mode="pickup"' + (mode === 'pickup' ? ' class="is-on"' : '') + '>' + esc(t('cart.pickup')) + '</button>' +
          '</div>' +
          '<dl class="sums">' +
            '<div><dt>' + esc(t('cart.subtotal')) + '</dt><dd>' + esc(won(tot.subtotal)) + '</dd></div>' +
            '<div><dt>' + esc(t('cart.discount')) + '</dt><dd class="minus">−' + esc(won(tot.discount)) + '</dd></div>' +
            '<div><dt>' + esc(t('cart.delivery')) + '</dt><dd>' + (tot.delivery ? esc(won(tot.delivery)) : esc(t('cart.free'))) + '</dd></div>' +
            '<div class="sums__total"><dt>' + esc(t('cart.total')) + '</dt><dd>' + esc(won(tot.total)) + '</dd></div>' +
          '</dl>' +
          '<a class="btn btn--primary btn--block" href="cart.html">' + esc(t('cart.view')) + '</a>' +
        '</div>' +
      '</aside>';

    host.hidden = false;
    document.body.classList.add('no-scroll');

    MM.dom.qsa('[data-close]', host).forEach(function (n) {
      n.addEventListener('click', function () { renderDrawer(false); });
    });
    MM.dom.qsa('[data-qty]', host).forEach(function (n) {
      n.addEventListener('click', function () {
        var uid = n.getAttribute('data-qty');
        var delta = parseInt(n.getAttribute('data-delta'), 10);
        MM.cart.setQty(uid, MM.cart.qty(uid) + delta);
        renderDrawer(true);
      });
    });
    MM.dom.qsa('[data-mode]', host).forEach(function (n) {
      n.addEventListener('click', function () {
        storage.set('fulfilment', n.getAttribute('data-mode'));
        renderDrawer(true);
      });
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') renderDrawer(false);
    if (e.key === '/' && document.activeElement && document.activeElement.tagName !== 'INPUT') {
      var input = document.getElementById('mm-search-input');
      if (input) { e.preventDefault(); input.focus(); }
    }
  });

  MM.cart.onChange(function () {
    var host = document.getElementById('mm-drawer');
    if (host && !host.hidden) renderDrawer(true);
  });
})(window);
