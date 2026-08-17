/* =============================================================================
 * MarketMesh · data.js
 * Catalog for the live traditional-market network: regions → markets → stalls →
 * products. Everything the UI renders comes from here, so the site runs with no
 * backend at all (the optional Python server only adds the xAI proxy).
 *
 * Photo freshness is stored as `photoAgeMin` (minutes before "now") rather than
 * a fixed timestamp, so the "사진 업데이트" stamp required by the spec is always
 * truthful no matter when the demo is opened.
 * ========================================================================== */
(function (global) {
  'use strict';

  var MM = global.MM || (global.MM = {});

  /* --------------------------------------------------------------- taxonomy */
  var CATEGORIES = [
    { id: 'fruit',   ko: '과일',      en: 'Fruit',      emoji: '🍎', color: '#e05252' },
    { id: 'veg',     ko: '채소',      en: 'Vegetables', emoji: '🥬', color: '#3f9a56' },
    { id: 'meat',    ko: '정육',      en: 'Butcher',    emoji: '🥩', color: '#c2415f' },
    { id: 'fish',    ko: '수산',      en: 'Seafood',    emoji: '🐟', color: '#2f7fb5' },
    { id: 'banchan', ko: '반찬·김치', en: 'Side dishes', emoji: '🥘', color: '#d97b28' },
    { id: 'grain',   ko: '곡물·견과', en: 'Grain & nuts', emoji: '🌾', color: '#a4802f' },
    { id: 'snack',   ko: '먹거리',    en: 'Street food', emoji: '🍢', color: '#b45f9c' },
    { id: 'health',  ko: '건강식품',  en: 'Health foods', emoji: '🫚', color: '#5a7d4a' },
    { id: 'flower',  ko: '화훼',      en: 'Flowers',    emoji: '💐', color: '#c85a8e' }
  ];

  /* ---------------------------------------------------------------- regions */
  var REGIONS = {
    countries: [{ id: 'kr', ko: '대한민국', en: 'South Korea', flag: '🇰🇷' }],
    states: [
      { id: 'incheon', country: 'kr', ko: '인천광역시', en: 'Incheon' },
      { id: 'seoul',   country: 'kr', ko: '서울특별시', en: 'Seoul' }
    ],
    cities: [
      /* 인천 서구는 2026-07-01 행정체제 개편으로 '서해구'가 되었고 아라뱃길 이북은
         검단구로 분구되었습니다. 시장 위치는 그대로이고 구 명칭만 바뀐 것입니다. */
      { id: 'seohae-gu',   state: 'incheon', ko: '서해구',   en: 'Seohae-gu' },
      { id: 'ganghwa',     state: 'incheon', ko: '강화군',   en: 'Ganghwa-gun' },
      { id: 'namdong',     state: 'incheon', ko: '남동구',   en: 'Namdong-gu' },
      { id: 'bupyeong',    state: 'incheon', ko: '부평구',   en: 'Bupyeong-gu' },
      { id: 'jung-gu',     state: 'seoul',   ko: '중구',     en: 'Jung-gu' },
      { id: 'jongno',      state: 'seoul',   ko: '종로구',   en: 'Jongno-gu' },
      { id: 'yeongdeungpo', state: 'seoul',  ko: '영등포구', en: 'Yeongdeungpo-gu' },
      { id: 'mapo',        state: 'seoul',   ko: '마포구',   en: 'Mapo-gu' }
    ]
  };

  /* ---------------------------------------------------------------- markets */
  var MARKETS = [
    {
      id: 'gajwa', ko: '가좌시장', en: 'Gajwa Market',
      country: 'kr', state: 'incheon', city: 'seohae-gu',
      addr: { ko: '인천 서해구 원적로96번길 5 (가좌동)', en: '5, Wonjeok-ro 96beon-gil, Seohae-gu, Incheon' },
      lat: 37.49411, lng: 126.68394,
      coordSource: 'OpenStreetMap way 471492031 · 한국관광공사 열린관광',
      phone: '032-584-5006',
      since: null,
      stalls: 140, cameras: 18,
      hours: { ko: '09:00 – 21:00 (점포별 상이)', en: '09:00 – 21:00 (varies by stall)' },
      closed: { ko: '점포별 상이', en: 'Varies by stall' },
      parking: { ko: '공영주차장 2시간 무료', en: '2h free at the public lot' },
      transit: { ko: '인천 2호선 서부여성회관역 도보 15분 · 버스 “가좌시장” 정류장', en: 'Seobu Women’s Center Stn. (Line 2), 15 min walk · bus stop “Gajwa Market”' },
      hero: 'produce-hall',
      blurb: {
        ko: '청과·채소 점포가 밀집한 서해구 대표 골목시장. 18대의 점포 카메라가 매대를 실시간으로 비춥니다.',
        en: "Seohae-gu's flagship alley market for fruit and vegetables, with 18 stall cameras streaming the counters live."
      },
      tags: ['청과', '채소', '반찬', '야시장']
    },
    {
      id: 'ganghwa', ko: '강화풍물시장', en: 'Ganghwa Pungmul Market',
      country: 'kr', state: 'incheon', city: 'ganghwa',
      addr: { ko: '인천 강화군 강화읍 중앙로 17-9', en: '17-9, Jungang-ro, Ganghwa-eup, Ganghwa-gun, Incheon' },
      lat: 37.74141, lng: 126.49283,
      coordSource: 'OpenStreetMap node 4396735090 · 한국관광공사',
      phone: '032-934-1318',
      since: null,
      stalls: 171, cameras: 11,
      hours: { ko: '08:00 – 21:00', en: '08:00 – 21:00' },
      closed: { ko: '매월 첫째·셋째 월요일 (장날이면 익일)', en: '1st & 3rd Monday (next day if a fair day)' },
      parking: { ko: '전용 주차장 300면', en: '300 dedicated parking bays' },
      transit: { ko: '강화terminal 도보 3분 · 3000번 광역버스', en: '3 min from Ganghwa Terminal · Bus 3000' },
      hero: 'pear-apple',
      blurb: {
        ko: '강화 순무·인삼·속노랑 고구마 등 지역 특산물이 모이는 5일장. 2층 먹거리 골목이 유명합니다.',
        en: 'The five-day fair for Ganghwa turnip, ginseng and yellow sweet potato, with a famous food alley upstairs.'
      },
      tags: ['특산물', '5일장', '인삼', '순무']
    },
    {
      id: 'namdaemun', ko: '남대문시장', en: 'Namdaemun Market',
      country: 'kr', state: 'seoul', city: 'jung-gu',
      addr: { ko: '서울 중구 남대문시장4길 21 (남창동)', en: '21, Namdaemunsijang 4-gil, Jung-gu, Seoul' },
      lat: 37.55920, lng: 126.97737,
      coordSource: 'OpenStreetMap way 78503350 · 도로명주소 지오코딩',
      phone: '02-753-2805',
      since: 1414,
      stalls: 5200, cameras: 24,
      hours: { ko: '점포별 상이 · 대체로 06:00 – 23:00', en: 'Varies by stall · roughly 06:00 – 23:00' },
      closed: { ko: '일요일 (노점·일부 점포는 자율)', en: 'Sunday (street stalls vary)' },
      parking: { ko: '주변 민영주차장 이용', en: 'Private lots nearby' },
      transit: { ko: '4호선 회현역 5번 출구 도보 2분', en: 'Hoehyeon Stn. (Line 4) exit 5, 2 min walk' },
      hero: 'fruit-hall',
      blurb: {
        ko: '600년 역사의 종합 도매시장. 청과 도매 골목은 새벽 3시가 가장 붐빕니다.',
        en: 'A 600-year-old wholesale market; the produce alley peaks at 3 a.m.'
      },
      tags: ['도매', '심야', '수입식품', '관광']
    },
    {
      id: 'gwangjang', ko: '광장시장', en: 'Gwangjang Market',
      country: 'kr', state: 'seoul', city: 'jongno',
      addr: { ko: '서울 종로구 창경궁로 88 (예지동)', en: '88, Changgyeonggung-ro, Jongno-gu, Seoul' },
      lat: 37.57019, lng: 126.99950,
      coordSource: 'OpenStreetMap way 607083156 · Wikidata Q12585067',
      phone: '02-2267-0291',
      since: 1905,
      stalls: 5000, cameras: 16,
      hours: { ko: '상가 09:00 – 18:00 · 먹자골목 09:00 – 23:00', en: 'Shops 09:00 – 18:00 · food alley 09:00 – 23:00' },
      closed: { ko: '일요일 (먹자골목은 연중무휴)', en: 'Sunday (food alley open daily)' },
      parking: { ko: '공영주차장 1시간 3,000원', en: '₩3,000/h public lot' },
      transit: { ko: '1호선 종로5가역 8번 출구 도보 2분 · 2·5호선 을지로4가역 도보 5분', en: 'Jongno 5-ga Stn. exit 8, 2 min · Euljiro 4-ga Stn., 5 min' },
      hero: 'night-fruit',
      blurb: {
        ko: '빈대떡·마약김밥으로 유명한 먹거리 성지이자 100년 넘은 상설시장.',
        en: 'A 100-year-old permanent market and the home of bindaetteok and mayak gimbap.'
      },
      tags: ['먹거리', '빈대떡', '한복', '야시장']
    },
    {
      id: 'yeongdeungpo', ko: '영등포전통시장', en: 'Yeongdeungpo Traditional Market',
      country: 'kr', state: 'seoul', city: 'yeongdeungpo',
      addr: { ko: '서울 영등포구 영등포로 225 (영등포동5가)', en: '225, Yeongdeungpo-ro, Yeongdeungpo-gu, Seoul' },
      lat: 37.52022, lng: 126.90715,
      coordSource: 'OpenStreetMap way 344446760 · 도로명주소 지오코딩',
      phone: '02-2634-1308',
      since: 1956,
      stalls: 311, cameras: 9,
      hours: { ko: '점포별 상이 · 야시장 18:00 – 22:00 (동절기 17:00~)', en: 'Varies · night market 18:00 – 22:00' },
      closed: { ko: '야시장 매월 셋째 일요일', en: 'Night market: 3rd Sunday' },
      parking: { ko: '시장 전용 주차타워', en: 'Market parking tower' },
      transit: { ko: '5호선 영등포시장역 1·3번 출구 도보 5분 · 1호선 영등포역 도보 8분', en: 'Yeongdeungpo Market Stn. (Line 5), 5 min · Yeongdeungpo Stn. (Line 1), 8 min' },
      hero: 'melon-gift',
      blurb: {
        ko: '순대·족발 골목과 청과 상가가 나란히 붙어 있는 도심형 시장.',
        en: 'A downtown market where the sundae alley runs straight into the produce arcade.'
      },
      tags: ['순대골목', '청과', '반찬']
    },
    {
      id: 'mapo', ko: '마포농수산물시장', en: 'Mapo Agri-Fisheries Market',
      country: 'kr', state: 'seoul', city: 'mapo',
      addr: { ko: '서울 마포구 월드컵로 235 (성산동)', en: '235, World Cup-ro, Mapo-gu, Seoul' },
      lat: 37.56503, lng: 126.89849,
      coordSource: 'OpenStreetMap way 38170384 · 한국관광공사',
      phone: '02-309-0419',
      since: 1998,
      stalls: 146, cameras: 12,
      hours: { ko: '채소·과일 07:00 – 20:00 · 활어 08:00 – 22:00', en: 'Produce 07:00 – 20:00 · live fish 08:00 – 22:00' },
      closed: { ko: '연중무휴 (점포별 상이)', en: 'Open daily (varies by stall)' },
      parking: { ko: '지하 주차장 400면', en: '400 underground bays' },
      transit: { ko: '6호선 월드컵경기장역 1번 출구 도보 4분 · 마포구청역 도보 5분', en: 'World Cup Stadium Stn. (Line 6) exit 1, 4 min walk' },
      hero: 'berry-stall',
      blurb: {
        ko: '수산 경매와 청과 도소매가 한 건물에서 이뤄지는 새벽 시장.',
        en: 'A dawn market where the fish auction and the produce floor share one building.'
      },
      tags: ['수산', '경매', '새벽', '도매']
    },
    {
      id: 'moraenae', ko: '모래내시장', en: 'Moraenae Market',
      country: 'kr', state: 'incheon', city: 'namdong',
      addr: { ko: '인천 남동구 호구포로810번길 42-8 (구월동)', en: '42-8, Hogupo-ro 810beon-gil, Namdong-gu, Incheon' },
      lat: 37.45413, lng: 126.72146,
      coordSource: '한국관광공사 TourAPI · OpenStreetMap',
      phone: '032-471-1427',
      since: null,
      stalls: 205, cameras: 7,
      hours: { ko: '10:00 – 22:00 (점포별 상이)', en: '10:00 – 22:00 (varies by stall)' },
      closed: { ko: '설날·추석 당일', en: 'Seollal & Chuseok day only' },
      parking: { ko: '고객 주차장 1시간 무료', en: '1h free customer parking' },
      transit: { ko: '인천 2호선 모래내시장역 3번 출구 도보 2분', en: 'Moraenae Market Stn. (Line 2) exit 3, 2 min walk' },
      hero: 'citrus-street',
      blurb: {
        ko: '닭강정과 과일 노점이 길게 이어지는 남동구 최대 골목시장.',
        en: "Namdong-gu's longest alley market, lined with dakgangjeong and fruit stands."
      },
      tags: ['닭강정', '과일', '노점']
    },
    {
      id: 'bupyeong', ko: '부평깡시장', en: 'Bupyeong Kkang Market',
      country: 'kr', state: 'incheon', city: 'bupyeong',
      addr: { ko: '인천 부평구 주부토로32번길 25 (부평동)', en: '25, Jubuto-ro 32beon-gil, Bupyeong-gu, Incheon' },
      lat: 37.49795, lng: 126.72728,
      coordSource: '부평구 공공데이터(지역정보) · OpenStreetMap 도로 지오메트리',
      phone: '032-502-7175',
      since: null,
      stalls: 170, cameras: 14,
      hours: { ko: '05:00 – 21:00', en: '05:00 – 21:00' },
      closed: { ko: '연중무휴', en: 'Open daily' },
      parking: { ko: '공영주차장 인접', en: 'Adjacent public lot' },
      transit: { ko: '인천 1호선 부평시장역 2번 출구 도보 5분 · 부평역 도보 10분', en: 'Bupyeong Market Stn. (Incheon Line 1) exit 2, 5 min walk' },
      hero: 'fruit-corner',
      blurb: {
        ko: '농산물 도매("깡")에서 출발한 시장으로 새벽 상차 물량이 많습니다.',
        en: 'Born as a produce wholesale ("kkang") yard; heaviest loading happens before dawn.'
      },
      tags: ['도매', '청과', '건어물']
    }
  ];

  /* ------------------------------------------------------------------ helper
   * p() fills the boring defaults so each product literal below stays readable.
   * box = [x, y, w, h] in 0–1 coordinates over the stall photo; it drives the
   * detection overlay in the live viewer.
   * -------------------------------------------------------------------- */
  function p(o) {
    return {
      id: o.id,
      ko: o.ko, en: o.en,
      price: o.price,
      unit: o.unit || { ko: '1개', en: '1 ea' },
      origin: o.origin || { ko: '국내산', en: 'Domestic' },
      cat: o.cat,
      img: o.img || null,
      conf: o.conf == null ? 0.93 : o.conf,
      box: o.box || null,
      tags: o.tags || [],
      stock: o.stock || 'high',
      priceSource: o.priceSource || 'merchant',
      note: o.note || null
    };
  }

  /* ----------------------------------------------------------------- stalls */
  var STORES = [
    /* ======================= 가좌시장 ======================= */
    {
      id: 'gajwa-sinseon', marketId: 'gajwa', ko: '신선청과', en: 'Sinseon Fresh Produce',
      stall: 'A-12', cat: 'fruit', owner: { ko: '김순자', en: 'Kim Sun-ja' }, since: 1994,
      phone: '032-575-1204',
      hours: { ko: '06:00 – 20:00', en: '06:00 – 20:00' },
      closedDays: { ko: '둘째·넷째 일요일', en: '2nd & 4th Sun' },
      pay: ['card', 'onnuri', 'zeropay', 'cash'],
      rating: 4.8, reviews: 213,
      photo: 'produce-hall', photoAgeMin: 42,
      camera: { id: 'CAM-GJ-A12', src: 'cam-ganghwa.mp4', ptz: true, res: '4K', fps: 24 },
      blurb: {
        ko: '가락시장 새벽 경매분을 매일 직접 실어 옵니다. 선물용 박스 포장 무료.',
        en: 'Trucked in from the Garak dawn auction every morning. Free gift boxing.'
      },
      delivery: { ko: '시장 반경 3km 당일 배송 (2만원 이상 무료)', en: 'Same-day within 3km (free over ₩20,000)' },
      products: [
        p({ id: 'gj-apple', ko: '부사 사과', en: 'Fuji Apple', price: 12000, unit: { ko: '5개', en: '5 ea' },
            origin: { ko: '경북 청송', en: 'Cheongsong' }, cat: 'fruit', img: 'fuji-apple.jpg', conf: 0.984,
            box: [0.615, 0.405, 0.105, 0.095], tags: ['apple', 'gift', 'juice', 'ancestral-rite'] }),
        p({ id: 'gj-pear', ko: '신고 배', en: 'Singo Pear', price: 15000, unit: { ko: '3개', en: '3 ea' },
            origin: { ko: '전남 나주', en: 'Naju' }, cat: 'fruit', img: 'pear.jpg', conf: 0.961,
            box: [0.470, 0.545, 0.090, 0.090], tags: ['pear', 'gift', 'ancestral-rite'] }),
        p({ id: 'gj-muscat', ko: '샤인머스켓', en: 'Shine Muscat', price: 15000, unit: { ko: '1송이', en: '1 bunch' },
            origin: { ko: '경북 상주', en: 'Sangju' }, cat: 'fruit', img: 'shine-muscat.jpg', conf: 0.990,
            box: [0.160, 0.615, 0.155, 0.140], tags: ['grape', 'dessert', 'gift'] }),
        p({ id: 'gj-campbell', ko: '캠벨 포도', en: 'Campbell Grapes', price: 12000, unit: { ko: '2kg 한 상자', en: '2kg box' },
            origin: { ko: '충북 영동', en: 'Yeongdong' }, cat: 'fruit', img: 'grapes.jpg', conf: 0.948,
            box: [0.185, 0.500, 0.120, 0.100], tags: ['grape', 'juice', 'kids'] }),
        p({ id: 'gj-banana', ko: '바나나', en: 'Banana', price: 3500, unit: { ko: '1송이', en: '1 bunch' },
            origin: { ko: '필리핀', en: 'Philippines' }, cat: 'fruit', conf: 0.972,
            box: [0.130, 0.375, 0.130, 0.115], tags: ['banana', 'kids', 'breakfast'] }),
        p({ id: 'gj-tomato', ko: '완숙 토마토', en: 'Vine Tomato', price: 8000, unit: { ko: '1.5kg', en: '1.5kg' },
            origin: { ko: '충남 부여', en: 'Buyeo' }, cat: 'fruit', conf: 0.935,
            box: [0.515, 0.360, 0.120, 0.100], tags: ['tomato', 'salad', 'diet'], priceSource: 'ai' })
      ]
    },
    {
      id: 'gajwa-omoni', marketId: 'gajwa', ko: '어머니 채소가게', en: "Mother's Greens",
      stall: 'A-15', cat: 'veg', owner: { ko: '박말순', en: 'Park Mal-sun' }, since: 1987,
      phone: '032-575-3391',
      hours: { ko: '05:30 – 19:30', en: '05:30 – 19:30' },
      closedDays: { ko: '둘째·넷째 일요일', en: '2nd & 4th Sun' },
      pay: ['onnuri', 'zeropay', 'cash'],
      rating: 4.9, reviews: 168,
      photo: 'vegetable-stall', photoAgeMin: 18,
      camera: null,
      blurb: {
        ko: '카메라 없이 매일 아침 매대 사진만 올리는 점포입니다. 사진 촬영 시각을 꼭 확인하세요.',
        en: 'A photo-only stall: the counter picture is re-shot every morning, so check the capture time.'
      },
      delivery: { ko: '직접 수령만 가능', en: 'Pick-up only' },
      products: [
        p({ id: 'gj-spinach', ko: '시금치', en: 'Spinach', price: 3000, unit: { ko: '한 단', en: '1 bundle' },
            origin: { ko: '경기 포천', en: 'Pocheon' }, cat: 'veg', conf: 0.958,
            box: [0.355, 0.500, 0.245, 0.240], tags: ['greens', 'namul', 'soup'] }),
        p({ id: 'gj-potato', ko: '수미 감자', en: 'Sumi Potato', price: 2000, unit: { ko: '1kg', en: '1kg' },
            origin: { ko: '강원 평창', en: 'Pyeongchang' }, cat: 'veg', conf: 0.941,
            box: [0.300, 0.245, 0.115, 0.115], tags: ['potato', 'stew', 'staple'] }),
        p({ id: 'gj-buchu', ko: '부추', en: 'Chives', price: 2500, unit: { ko: '한 단', en: '1 bundle' },
            origin: { ko: '경남 김해', en: 'Gimhae' }, cat: 'veg', conf: 0.917,
            box: [0.505, 0.470, 0.130, 0.150], tags: ['chives', 'pancake', 'namul'] }),
        p({ id: 'gj-broccoli', ko: '브로콜리', en: 'Broccoli', price: 2000, unit: { ko: '1개', en: '1 ea' },
            origin: { ko: '제주', en: 'Jeju' }, cat: 'veg', conf: 0.973,
            box: [0.665, 0.815, 0.165, 0.160], tags: ['broccoli', 'diet', 'salad'] }),
        p({ id: 'gj-cabbage', ko: '알배기 배추', en: 'Baby Napa Cabbage', price: 3500, unit: { ko: '2통', en: '2 heads' },
            origin: { ko: '강원 태백', en: 'Taebaek' }, cat: 'veg', conf: 0.966,
            box: [0.040, 0.545, 0.210, 0.300], tags: ['cabbage', 'kimchi', 'ssam'] }),
        p({ id: 'gj-tomato-b', ko: '찰토마토', en: 'Chal Tomato', price: 6000, unit: { ko: '1kg', en: '1kg' },
            origin: { ko: '충남 논산', en: 'Nonsan' }, cat: 'veg', conf: 0.902,
            box: [0.845, 0.420, 0.145, 0.165], tags: ['tomato', 'salad'], stock: 'low' })
      ]
    },
    {
      id: 'gajwa-jeju', marketId: 'gajwa', ko: '제주감귤 직송', en: 'Jeju Citrus Direct',
      stall: 'B-03', cat: 'fruit', owner: { ko: '고영호', en: 'Ko Yeong-ho' }, since: 2003,
      phone: '032-576-7788',
      hours: { ko: '07:00 – 20:00', en: '07:00 – 20:00' },
      closedDays: { ko: '연중무휴', en: 'Open daily' },
      pay: ['card', 'onnuri', 'cash'],
      rating: 4.7, reviews: 402,
      photo: 'citrus-street', photoAgeMin: 130,
      camera: { id: 'CAM-GJ-B03', src: 'cam-zoom-demo.mp4', ptz: true, res: '1080p', fps: 30 },
      blurb: {
        ko: '서귀포 농가와 직거래. 박스 단위는 산지에서 곧바로 택배 발송합니다.',
        en: 'Direct from Seogwipo growers; whole boxes ship straight from the orchard.'
      },
      delivery: { ko: '전국 택배 (박스 단위)', en: 'Nationwide courier (by the box)' },
      products: [
        p({ id: 'gj-hallabong', ko: '한라봉', en: 'Hallabong', price: 15000, unit: { ko: '5개', en: '5 ea' },
            origin: { ko: '제주 서귀포', en: 'Seogwipo' }, cat: 'fruit', img: 'tangerine.jpg', conf: 0.993,
            box: [0.600, 0.280, 0.280, 0.220], tags: ['citrus', 'gift', 'vitamin'] }),
        p({ id: 'gj-gyul', ko: '노지 감귤', en: 'Field Tangerine', price: 7000, unit: { ko: '2kg', en: '2kg' },
            origin: { ko: '제주', en: 'Jeju' }, cat: 'fruit', conf: 0.981,
            box: [0.050, 0.420, 0.300, 0.280], tags: ['citrus', 'kids', 'snack'] }),
        p({ id: 'gj-bam', ko: '공주 햇밤', en: 'Gongju Chestnut', price: 7000, unit: { ko: '1kg', en: '1kg' },
            origin: { ko: '충남 공주', en: 'Gongju' }, cat: 'grain', conf: 0.889,
            box: [0.715, 0.720, 0.220, 0.200], tags: ['chestnut', 'autumn', 'ancestral-rite'], priceSource: 'ai' }),
        p({ id: 'gj-gam', ko: '단감', en: 'Sweet Persimmon', price: 8000, unit: { ko: '5개', en: '5 ea' },
            origin: { ko: '경남 창원', en: 'Changwon' }, cat: 'fruit', conf: 0.944,
            box: [0.200, 0.150, 0.200, 0.160], tags: ['persimmon', 'autumn', 'gift'] })
      ]
    },
    {
      id: 'gajwa-samdae', marketId: 'gajwa', ko: '삼대과일', en: 'Samdae Fruit (3 Generations)',
      stall: 'B-07', cat: 'fruit', owner: { ko: '이정훈', en: 'Lee Jeong-hun' }, since: 1969,
      phone: '032-573-2020',
      hours: { ko: '06:00 – 21:00', en: '06:00 – 21:00' },
      closedDays: { ko: '설·추석 당일', en: 'Seollal & Chuseok day' },
      pay: ['card', 'onnuri', 'zeropay', 'cash'],
      rating: 4.6, reviews: 91,
      photo: 'fruit-hall', photoAgeMin: 9,
      camera: { id: 'CAM-GJ-B07', src: 'cam-ganghwa.mp4', ptz: true, res: '4K', fps: 24 },
      blurb: {
        ko: '3대째 이어온 청과상. 제철 과일 구성은 매일 아침 다시 짭니다.',
        en: 'Third-generation greengrocer; the seasonal line-up is rebuilt every morning.'
      },
      delivery: { ko: '당일 배송 · 오후 3시 마감', en: 'Same-day, cut-off 15:00' },
      products: [
        p({ id: 'gj-watermelon', ko: '수박', en: 'Watermelon', price: 22000, unit: { ko: '1통 (8kg)', en: '1 whole (8kg)' },
            origin: { ko: '충북 음성', en: 'Eumseong' }, cat: 'fruit', img: 'watermelon.jpg', conf: 0.976,
            box: [0.420, 0.055, 0.140, 0.160], tags: ['watermelon', 'summer', 'family'] }),
        p({ id: 'gj-orange', ko: '수입 오렌지', en: 'Navel Orange', price: 10000, unit: { ko: '6개', en: '6 ea' },
            origin: { ko: '미국 캘리포니아', en: 'California, USA' }, cat: 'fruit', conf: 0.968,
            box: [0.440, 0.400, 0.160, 0.180], tags: ['citrus', 'juice', 'kids'] }),
        p({ id: 'gj-strawberry', ko: '설향 딸기', en: 'Seolhyang Strawberry', price: 13000, unit: { ko: '500g', en: '500g' },
            origin: { ko: '경남 산청', en: 'Sancheong' }, cat: 'fruit', conf: 0.955,
            box: [0.300, 0.260, 0.140, 0.120], tags: ['berry', 'dessert', 'kids'], stock: 'low' }),
        p({ id: 'gj-chamoe', ko: '성주 참외', en: 'Seongju Korean Melon', price: 10000, unit: { ko: '5개', en: '5 ea' },
            origin: { ko: '경북 성주', en: 'Seongju' }, cat: 'fruit', conf: 0.938,
            box: [0.615, 0.280, 0.120, 0.100], tags: ['melon', 'summer', 'snack'] }),
        p({ id: 'gj-apple-b', ko: '홍로 사과', en: 'Hongro Apple', price: 14000, unit: { ko: '6개', en: '6 ea' },
            origin: { ko: '경북 영주', en: 'Yeongju' }, cat: 'fruit', img: 'fuji-apple.jpg', conf: 0.949,
            box: [0.855, 0.115, 0.130, 0.140], tags: ['apple', 'gift', 'ancestral-rite'] })
      ]
    },
    {
      id: 'gajwa-chorok', marketId: 'gajwa', ko: '초록나물터', en: 'Chorok Namul House',
      stall: 'C-02', cat: 'banchan', owner: { ko: '정미영', en: 'Jeong Mi-yeong' }, since: 2011,
      phone: '032-578-4412',
      hours: { ko: '07:00 – 19:00', en: '07:00 – 19:00' },
      closedDays: { ko: '월요일', en: 'Monday' },
      pay: ['onnuri', 'zeropay', 'cash'],
      rating: 4.9, reviews: 322,
      photo: 'greens-banchan', photoAgeMin: 205,
      camera: null,
      blurb: {
        ko: '나물·밑반찬을 매일 아침 소량씩 무칩니다. 사진은 개점 직후 한 번만 갱신됩니다.',
        en: 'Namul and side dishes seasoned in small daily batches; the photo is refreshed once, right after opening.'
      },
      delivery: { ko: '직접 수령 · 보냉백 제공', en: 'Pick-up · cooler bag provided' },
      products: [
        p({ id: 'gj-cucumber', ko: '가시오이', en: 'Korean Cucumber', price: 2000, unit: { ko: '3개', en: '3 ea' },
            origin: { ko: '경기 여주', en: 'Yeoju' }, cat: 'veg', conf: 0.962,
            box: [0.420, 0.545, 0.160, 0.120], tags: ['cucumber', 'salad', 'kimchi'] }),
        p({ id: 'gj-chili', ko: '청양고추', en: 'Cheongyang Chili', price: 3000, unit: { ko: '200g', en: '200g' },
            origin: { ko: '충남 청양', en: 'Cheongyang' }, cat: 'veg', conf: 0.924,
            box: [0.220, 0.400, 0.140, 0.140], tags: ['chili', 'spicy', 'stew'] }),
        p({ id: 'gj-sweetpotato', ko: '꿀고구마', en: 'Honey Sweet Potato', price: 6000, unit: { ko: '1.5kg', en: '1.5kg' },
            origin: { ko: '전남 해남', en: 'Haenam' }, cat: 'veg', conf: 0.935,
            box: [0.120, 0.620, 0.160, 0.140], tags: ['sweet-potato', 'snack', 'kids'] }),
        p({ id: 'gj-onion', ko: '햇양파', en: 'New-crop Onion', price: 4000, unit: { ko: '2kg 망', en: '2kg net' },
            origin: { ko: '전남 무안', en: 'Muan' }, cat: 'veg', conf: 0.947,
            box: [0.600, 0.720, 0.140, 0.140], tags: ['onion', 'stew', 'staple'] }),
        p({ id: 'gj-kongnamul', ko: '콩나물', en: 'Soybean Sprouts', price: 1500, unit: { ko: '400g', en: '400g' },
            origin: { ko: '국내산', en: 'Domestic' }, cat: 'banchan', conf: 0.911,
            box: [0.280, 0.800, 0.160, 0.140], tags: ['sprouts', 'soup', 'namul'] })
      ]
    },
    {
      id: 'gajwa-berry', marketId: 'gajwa', ko: '달콤베리', en: 'Dalkom Berry',
      stall: 'C-08', cat: 'fruit', owner: { ko: '한지수', en: 'Han Ji-su' }, since: 2018,
      phone: '032-579-9001',
      hours: { ko: '09:00 – 22:00', en: '09:00 – 22:00' },
      closedDays: { ko: '화요일', en: 'Tuesday' },
      pay: ['card', 'onnuri', 'zeropay'],
      rating: 4.5, reviews: 77,
      photo: 'berry-stall', photoAgeMin: 3,
      camera: { id: 'CAM-GJ-C08', src: 'cam-ganghwa.mp4', ptz: true, res: '1080p', fps: 30 },
      blurb: {
        ko: '야시장 시간대에 가장 붐비는 딸기·베리 전문 매대.',
        en: 'A berry specialist that gets busiest during the night-market hours.'
      },
      delivery: { ko: '반경 5km 퀵 (30분)', en: '5km quick delivery (30 min)' },
      products: [
        p({ id: 'gj-berry-straw', ko: '스테비아 딸기', en: 'Stevia Strawberry', price: 14000, unit: { ko: '750g', en: '750g' },
            origin: { ko: '충남 논산', en: 'Nonsan' }, cat: 'fruit', conf: 0.971,
            box: [0.300, 0.550, 0.160, 0.140], tags: ['berry', 'dessert', 'gift'] }),
        p({ id: 'gj-berry-tomato', ko: '스테비아 방울토마토', en: 'Stevia Cherry Tomato', price: 8000, unit: { ko: '1kg', en: '1kg' },
            origin: { ko: '전북 익산', en: 'Iksan' }, cat: 'fruit', conf: 0.958,
            box: [0.520, 0.520, 0.100, 0.100], tags: ['tomato', 'diet', 'snack'] }),
        p({ id: 'gj-berry-blue', ko: '블루베리', en: 'Blueberry', price: 9000, unit: { ko: '500g', en: '500g' },
            origin: { ko: '전남 담양', en: 'Damyang' }, cat: 'fruit', conf: 0.933,
            box: [0.720, 0.600, 0.140, 0.140], tags: ['berry', 'dessert', 'health'], priceSource: 'ai' }),
        p({ id: 'gj-berry-muscat', ko: '샤인머스켓 (소포장)', en: 'Shine Muscat (small pack)', price: 9000,
            unit: { ko: '500g', en: '500g' }, origin: { ko: '경북 김천', en: 'Gimcheon' }, cat: 'fruit',
            img: 'shine-muscat.jpg', conf: 0.986, box: [0.420, 0.620, 0.160, 0.140], tags: ['grape', 'dessert'] })
      ]
    },
    {
      id: 'gajwa-chuksan', marketId: 'gajwa', ko: '가좌축산', en: 'Gajwa Butcher',
      stall: 'D-01', cat: 'meat', owner: { ko: '오상철', en: 'Oh Sang-cheol' }, since: 1999,
      phone: '032-572-8110',
      hours: { ko: '08:00 – 20:00', en: '08:00 – 20:00' },
      closedDays: { ko: '둘째 일요일', en: '2nd Sunday' },
      pay: ['card', 'onnuri', 'cash'],
      rating: 4.7, reviews: 145,
      photo: null, photoAgeMin: null,
      camera: null,
      blurb: {
        ko: '아직 카메라와 사진을 등록하지 않은 점포입니다. 재고는 전화로 확인해 주세요.',
        en: 'This stall has not registered a camera or photo yet, so please call to check stock.'
      },
      delivery: { ko: '전화 주문 후 수령', en: 'Call ahead, pick up' },
      products: [
        p({ id: 'gj-samgyeop', ko: '삼겹살', en: 'Pork Belly', price: 16800, unit: { ko: '600g', en: '600g' },
            origin: { ko: '국내산 돼지', en: 'Korean pork' }, cat: 'meat', conf: 0.0,
            tags: ['pork', 'bbq', 'ssam'] }),
        p({ id: 'gj-hanwoo', ko: '한우 등심 1++', en: 'Hanwoo Sirloin 1++', price: 48000, unit: { ko: '300g', en: '300g' },
            origin: { ko: '강원 횡성', en: 'Hoengseong' }, cat: 'meat', conf: 0.0,
            tags: ['beef', 'gift', 'bbq'] }),
        p({ id: 'gj-dakgalbi', ko: '닭볶음탕용 닭', en: 'Chicken for Dakbokkeumtang', price: 7900,
            unit: { ko: '1마리', en: '1 whole' }, origin: { ko: '충북 음성', en: 'Eumseong' }, cat: 'meat',
            conf: 0.0, tags: ['chicken', 'stew'] })
      ]
    },
    {
      id: 'gajwa-bunsik', marketId: 'gajwa', ko: '왕만두분식', en: 'Wang Mandu Bunsik',
      stall: 'D-05', cat: 'snack', owner: { ko: '최현주', en: 'Choi Hyun-ju' }, since: 2007,
      phone: '032-577-6060',
      hours: { ko: '10:00 – 21:00', en: '10:00 – 21:00' },
      closedDays: { ko: '수요일', en: 'Wednesday' },
      pay: ['onnuri', 'zeropay', 'cash'],
      rating: 4.8, reviews: 508,
      photo: null, photoAgeMin: null,
      camera: null,
      blurb: {
        ko: '즉석 조리 품목이라 실시간 재고가 표시되지 않습니다. 포장 주문은 전화로.',
        en: 'Cooked to order, so live stock is not shown. Call for takeaway orders.'
      },
      delivery: { ko: '포장만 가능', en: 'Takeaway only' },
      products: [
        p({ id: 'gj-mandu', ko: '손왕만두', en: 'Hand-made Wang Mandu', price: 5000, unit: { ko: '6개', en: '6 pcs' },
            cat: 'snack', conf: 0.0, tags: ['dumpling', 'hot', 'snack'] }),
        p({ id: 'gj-tteok', ko: '기름떡볶이', en: 'Oil Tteokbokki', price: 4000, unit: { ko: '1인분', en: '1 serving' },
            cat: 'snack', conf: 0.0, tags: ['tteokbokki', 'spicy', 'snack'] }),
        p({ id: 'gj-gimbap', ko: '꼬마김밥', en: 'Mini Gimbap', price: 4500, unit: { ko: '10줄', en: '10 rolls' },
            cat: 'snack', conf: 0.0, tags: ['gimbap', 'snack', 'kids'] })
      ]
    },

    /* ===================== 강화풍물시장 ===================== */
    {
      id: 'ganghwa-pungmul', marketId: 'ganghwa', ko: '풍물청과', en: 'Pungmul Fruit',
      stall: '1층 27호', cat: 'fruit', owner: { ko: '유재만', en: 'Yoo Jae-man' }, since: 1988,
      phone: '032-934-2201',
      hours: { ko: '08:00 – 19:00', en: '08:00 – 19:00' },
      closedDays: { ko: '연중무휴', en: 'Open daily' },
      pay: ['card', 'onnuri', 'cash'],
      rating: 4.6, reviews: 133,
      photo: 'pear-apple', photoAgeMin: 26,
      camera: { id: 'CAM-GH-127', src: 'cam-ganghwa.mp4', ptz: true, res: '4K', fps: 24 },
      blurb: { ko: '강화 사자발쑥과 지역 과일을 함께 취급합니다.', en: 'Local fruit alongside Ganghwa mugwort.' },
      delivery: { ko: '강화 전역 배송', en: 'Delivery across Ganghwa' },
      products: [
        p({ id: 'gh-pear', ko: '강화 배', en: 'Ganghwa Pear', price: 18000, unit: { ko: '5개', en: '5 ea' },
            origin: { ko: '인천 강화', en: 'Ganghwa' }, cat: 'fruit', img: 'pear.jpg', conf: 0.977,
            box: [0.050, 0.620, 0.350, 0.300], tags: ['pear', 'gift', 'ancestral-rite'] }),
        p({ id: 'gh-apple', ko: '홍옥 사과', en: 'Hongok Apple', price: 13000, unit: { ko: '6개', en: '6 ea' },
            origin: { ko: '경북 문경', en: 'Mungyeong' }, cat: 'fruit', img: 'fuji-apple.jpg', conf: 0.964,
            box: [0.550, 0.550, 0.250, 0.250], tags: ['apple', 'juice', 'baking'] }),
        p({ id: 'gh-banana', ko: '바나나', en: 'Banana', price: 2500, unit: { ko: '1송이', en: '1 bunch' },
            origin: { ko: '에콰도르', en: 'Ecuador' }, cat: 'fruit', conf: 0.958,
            box: [0.300, 0.180, 0.220, 0.180], tags: ['banana', 'kids'] }),
        p({ id: 'gh-cherrytomato', ko: '방울토마토', en: 'Cherry Tomato', price: 5000, unit: { ko: '1kg', en: '1kg' },
            origin: { ko: '인천 강화', en: 'Ganghwa' }, cat: 'fruit', conf: 0.921,
            box: [0.030, 0.350, 0.200, 0.180], tags: ['tomato', 'diet', 'snack'], priceSource: 'ai' })
      ]
    },
    {
      id: 'ganghwa-sunmu', marketId: 'ganghwa', ko: '강화 순무김치', en: 'Ganghwa Turnip Kimchi',
      stall: '1층 44호', cat: 'banchan', owner: { ko: '신복래', en: 'Shin Bok-rae' }, since: 1979,
      phone: '032-933-7745',
      hours: { ko: '08:00 – 18:30', en: '08:00 – 18:30' },
      closedDays: { ko: '연중무휴', en: 'Open daily' },
      pay: ['card', 'onnuri', 'cash'],
      rating: 4.9, reviews: 611,
      photo: 'greens-banchan', photoAgeMin: 340,
      camera: null,
      blurb: { ko: '강화 순무로만 담그는 김치. 택배 주문이 매출의 절반입니다.', en: 'Kimchi made only with Ganghwa turnip; half of sales ship by courier.' },
      delivery: { ko: '전국 택배 (냉장)', en: 'Nationwide chilled courier' },
      products: [
        p({ id: 'gh-sunmu', ko: '순무김치', en: 'Turnip Kimchi', price: 15000, unit: { ko: '2kg', en: '2kg' },
            origin: { ko: '인천 강화', en: 'Ganghwa' }, cat: 'banchan', conf: 0.905,
            box: [0.600, 0.720, 0.160, 0.150], tags: ['kimchi', 'local-specialty', 'gift'] }),
        p({ id: 'gh-ssuk', ko: '사자발쑥 분말', en: 'Ganghwa Mugwort Powder', price: 22000, unit: { ko: '300g', en: '300g' },
            origin: { ko: '인천 강화', en: 'Ganghwa' }, cat: 'health', conf: 0.0,
            tags: ['mugwort', 'health', 'tea'] }),
        p({ id: 'gh-godeungeo', ko: '속노랑 고구마', en: 'Yellow Sweet Potato', price: 12000, unit: { ko: '3kg', en: '3kg' },
            origin: { ko: '인천 강화', en: 'Ganghwa' }, cat: 'veg', conf: 0.918,
            box: [0.120, 0.620, 0.160, 0.140], tags: ['sweet-potato', 'local-specialty', 'snack'] })
      ]
    },
    {
      id: 'ganghwa-insam', marketId: 'ganghwa', ko: '강화인삼 도매', en: 'Ganghwa Ginseng Wholesale',
      stall: '2층 12호', cat: 'health', owner: { ko: '황인식', en: 'Hwang In-sik' }, since: 1972,
      phone: '032-932-4004',
      hours: { ko: '09:00 – 18:00', en: '09:00 – 18:00' },
      closedDays: { ko: '일요일', en: 'Sunday' },
      pay: ['card', 'onnuri', 'cash'],
      rating: 4.4, reviews: 58,
      photo: null, photoAgeMin: null,
      camera: null,
      blurb: { ko: '6년근 인삼 위주. 사진·카메라 미등록 점포입니다.', en: 'Six-year ginseng specialist; no photo or camera registered.' },
      delivery: { ko: '전국 택배', en: 'Nationwide courier' },
      products: [
        p({ id: 'gh-insam6', ko: '6년근 수삼', en: '6-Year Fresh Ginseng', price: 55000, unit: { ko: '750g', en: '750g' },
            origin: { ko: '인천 강화', en: 'Ganghwa' }, cat: 'health', conf: 0.0, tags: ['ginseng', 'gift', 'health'] }),
        p({ id: 'gh-hongsam', ko: '홍삼 절편', en: 'Red Ginseng Slices', price: 38000, unit: { ko: '200g', en: '200g' },
            origin: { ko: '인천 강화', en: 'Ganghwa' }, cat: 'health', conf: 0.0, tags: ['ginseng', 'gift'] }),
        p({ id: 'gh-daechu', ko: '건대추', en: 'Dried Jujube', price: 9000, unit: { ko: '500g', en: '500g' },
            origin: { ko: '경북 경산', en: 'Gyeongsan' }, cat: 'grain', conf: 0.0, tags: ['jujube', 'tea', 'ancestral-rite'] })
      ]
    },

    /* ======================= 남대문시장 ======================= */
    {
      id: 'namdaemun-domae', marketId: 'namdaemun', ko: '남대문 청과도매', en: 'Namdaemun Produce Wholesale',
      stall: 'C동 8호', cat: 'fruit', owner: { ko: '서동현', en: 'Seo Dong-hyun' }, since: 1981,
      phone: '02-753-1188',
      hours: { ko: '23:00 – 15:00', en: '23:00 – 15:00' },
      closedDays: { ko: '일요일', en: 'Sunday' },
      pay: ['card', 'onnuri', 'cash'],
      rating: 4.3, reviews: 96,
      photo: 'fruit-hall', photoAgeMin: 55,
      camera: { id: 'CAM-ND-C08', src: 'cam-ganghwa.mp4', ptz: true, res: '4K', fps: 24 },
      blurb: { ko: '박스 단위 도매가 기본. 소매도 가능하지만 수량 제한이 있습니다.', en: 'Wholesale by the box; retail possible with quantity limits.' },
      delivery: { ko: '새벽 상차 · 수도권 당일', en: 'Dawn loading · same-day in the capital area' },
      products: [
        p({ id: 'nd-melon', ko: '머스크 멜론', en: 'Musk Melon', price: 19000, unit: { ko: '1통', en: '1 whole' },
            origin: { ko: '전북 고창', en: 'Gochang' }, cat: 'fruit', conf: 0.966,
            box: [0.420, 0.055, 0.140, 0.160], tags: ['melon', 'gift', 'dessert'] }),
        p({ id: 'nd-orange', ko: '오렌지 (박스)', en: 'Orange (case)', price: 42000, unit: { ko: '10kg', en: '10kg' },
            origin: { ko: '미국', en: 'USA' }, cat: 'fruit', conf: 0.973,
            box: [0.440, 0.400, 0.160, 0.180], tags: ['citrus', 'wholesale', 'juice'] }),
        p({ id: 'nd-banana', ko: '바나나 (박스)', en: 'Banana (case)', price: 28000, unit: { ko: '13kg', en: '13kg' },
            origin: { ko: '필리핀', en: 'Philippines' }, cat: 'fruit', conf: 0.951,
            box: [0.720, 0.220, 0.140, 0.120], tags: ['banana', 'wholesale'] })
      ]
    },
    {
      id: 'namdaemun-import', marketId: 'namdaemun', ko: '수입식품 상회', en: 'Import Grocer',
      stall: 'D동 2호', cat: 'grain', owner: { ko: '문경아', en: 'Moon Kyung-ah' }, since: 1996,
      phone: '02-752-9922',
      hours: { ko: '09:00 – 18:00', en: '09:00 – 18:00' },
      closedDays: { ko: '일요일', en: 'Sunday' },
      pay: ['card', 'cash'],
      rating: 4.2, reviews: 61,
      photo: 'fruit-corner', photoAgeMin: 1450,
      camera: null,
      blurb: { ko: '사진이 하루 넘게 갱신되지 않았습니다. 방문 전 전화 확인을 권합니다.', en: 'Photo has not been refreshed in over a day, so call before visiting.' },
      delivery: { ko: '택배 가능', en: 'Courier available' },
      products: [
        p({ id: 'nd-kiwi', ko: '골드키위', en: 'Gold Kiwi', price: 12000, unit: { ko: '6개', en: '6 ea' },
            origin: { ko: '뉴질랜드', en: 'New Zealand' }, cat: 'fruit', conf: 0.942,
            box: [0.600, 0.520, 0.140, 0.120], tags: ['kiwi', 'vitamin', 'diet'] }),
        p({ id: 'nd-nuts', ko: '구운 아몬드', en: 'Roasted Almond', price: 15000, unit: { ko: '1kg', en: '1kg' },
            origin: { ko: '미국', en: 'USA' }, cat: 'grain', conf: 0.0, tags: ['nuts', 'snack', 'health'] }),
        p({ id: 'nd-olive', ko: '올리브유', en: 'Olive Oil', price: 21000, unit: { ko: '1L', en: '1L' },
            origin: { ko: '스페인', en: 'Spain' }, cat: 'grain', conf: 0.0, tags: ['oil', 'cooking'] })
      ]
    },
    {
      id: 'namdaemun-galchi', marketId: 'namdaemun', ko: '갈치골목 식당', en: 'Galchi Alley Kitchen',
      stall: '갈치골목 3호', cat: 'snack', owner: { ko: '임순덕', en: 'Im Sun-deok' }, since: 1984,
      phone: '02-755-3311',
      hours: { ko: '07:00 – 21:00', en: '07:00 – 21:00' },
      closedDays: { ko: '연중무휴', en: 'Open daily' },
      pay: ['card', 'onnuri', 'cash'],
      rating: 4.7, reviews: 1204,
      photo: null, photoAgeMin: null,
      camera: null,
      blurb: { ko: '조리 식당이라 상품 인식 대상이 아닙니다. 대기 현황은 전화로 확인하세요.', en: 'A cooked-food restaurant, so it is outside the detection scope, so call for the queue.' },
      delivery: { ko: '매장 식사 · 포장', en: 'Dine-in · takeaway' },
      products: [
        p({ id: 'nd-galchi', ko: '갈치조림 정식', en: 'Braised Hairtail Set', price: 13000, unit: { ko: '1인분', en: '1 serving' },
            cat: 'snack', conf: 0.0, tags: ['fish', 'meal', 'spicy'] }),
        p({ id: 'nd-godeungeo', ko: '고등어구이', en: 'Grilled Mackerel', price: 11000, unit: { ko: '1인분', en: '1 serving' },
            cat: 'snack', conf: 0.0, tags: ['fish', 'meal'] })
      ]
    },

    /* ======================== 광장시장 ======================== */
    {
      id: 'gwangjang-cheonggwa', marketId: 'gwangjang', ko: '광장청과', en: 'Gwangjang Fruit',
      stall: '북1문 14호', cat: 'fruit', owner: { ko: '배기훈', en: 'Bae Ki-hun' }, since: 1992,
      phone: '02-2266-4477',
      hours: { ko: '09:00 – 23:00', en: '09:00 – 23:00' },
      closedDays: { ko: '연중무휴', en: 'Open daily' },
      pay: ['card', 'onnuri', 'zeropay', 'cash'],
      rating: 4.5, reviews: 189,
      photo: 'night-fruit', photoAgeMin: 12,
      camera: { id: 'CAM-GJG-14', src: 'cam-zoom-demo.mp4', ptz: true, res: '1080p', fps: 30 },
      blurb: { ko: '야시장 손님이 많아 밤 11시까지 매대를 채웁니다.', en: 'Restocked until 11 p.m. for the night-market crowd.' },
      delivery: { ko: '종로 일대 퀵', en: 'Quick delivery around Jongno' },
      products: [
        p({ id: 'gg-strawberry', ko: '딸기 (한 팩)', en: 'Strawberry (pack)', price: 12000, unit: { ko: '500g', en: '500g' },
            origin: { ko: '충남 논산', en: 'Nonsan' }, cat: 'fruit', conf: 0.969,
            box: [0.350, 0.680, 0.280, 0.240], tags: ['berry', 'dessert', 'night'] }),
        p({ id: 'gg-apple', ko: '아오리 사과', en: 'Aori Apple', price: 11000, unit: { ko: '6개', en: '6 ea' },
            origin: { ko: '경북 청송', en: 'Cheongsong' }, cat: 'fruit', img: 'fuji-apple.jpg', conf: 0.955,
            box: [0.720, 0.520, 0.200, 0.200], tags: ['apple', 'snack'] }),
        p({ id: 'gg-gyul', ko: '감귤', en: 'Tangerine', price: 8000, unit: { ko: '2kg', en: '2kg' },
            origin: { ko: '제주', en: 'Jeju' }, cat: 'fruit', img: 'tangerine.jpg', conf: 0.947,
            box: [0.480, 0.440, 0.120, 0.120], tags: ['citrus', 'kids'] }),
        p({ id: 'gg-grape', ko: '거봉 포도', en: 'Kyoho Grapes', price: 13000, unit: { ko: '2송이', en: '2 bunches' },
            origin: { ko: '충북 영동', en: 'Yeongdong' }, cat: 'fruit', img: 'grapes.jpg', conf: 0.938,
            box: [0.200, 0.420, 0.140, 0.120], tags: ['grape', 'dessert'], priceSource: 'ai' })
      ]
    },
    {
      id: 'gwangjang-bindae', marketId: 'gwangjang', ko: '순희네 빈대떡', en: "Sunhee's Bindaetteok",
      stall: '먹자골목 22호', cat: 'snack', owner: { ko: '박순희', en: 'Park Sun-hee' }, since: 1970,
      phone: '02-2264-0071',
      hours: { ko: '09:00 – 22:00', en: '09:00 – 22:00' },
      closedDays: { ko: '연중무휴', en: 'Open daily' },
      pay: ['card', 'onnuri', 'cash'],
      rating: 4.6, reviews: 3402,
      photo: null, photoAgeMin: null,
      camera: null,
      blurb: { ko: '즉석 조리 노점. 실시간 재고 대신 대기 시간을 안내합니다.', en: 'Cooked to order, so it shows wait time instead of live stock.' },
      delivery: { ko: '포장 가능', en: 'Takeaway available' },
      products: [
        p({ id: 'gg-bindae', ko: '녹두빈대떡', en: 'Mung Bean Pancake', price: 6000, unit: { ko: '1장', en: '1 pc' },
            cat: 'snack', conf: 0.0, tags: ['pancake', 'hot', 'makgeolli'] }),
        p({ id: 'gg-mayak', ko: '마약김밥', en: 'Mayak Gimbap', price: 5000, unit: { ko: '10줄', en: '10 rolls' },
            cat: 'snack', conf: 0.0, tags: ['gimbap', 'snack'] }),
        p({ id: 'gg-yukhoe', ko: '육회 한 접시', en: 'Yukhoe Plate', price: 22000, unit: { ko: '1접시', en: '1 plate' },
            cat: 'meat', conf: 0.0, tags: ['beef', 'raw', 'meal'] })
      ]
    },

    /* ==================== 영등포전통시장 ==================== */
    {
      id: 'ydp-cheonggwa', marketId: 'yeongdeungpo', ko: '영등포청과', en: 'Yeongdeungpo Fruit',
      stall: '가열 9호', cat: 'fruit', owner: { ko: '조민수', en: 'Cho Min-su' }, since: 1998,
      phone: '02-2632-1010',
      hours: { ko: '07:00 – 21:00', en: '07:00 – 21:00' },
      closedDays: { ko: '연중무휴', en: 'Open daily' },
      pay: ['card', 'onnuri', 'zeropay', 'cash'],
      rating: 4.4, reviews: 112,
      photo: 'melon-gift', photoAgeMin: 70,
      camera: { id: 'CAM-YDP-09', src: 'cam-ganghwa.mp4', ptz: false, res: '1080p', fps: 15 },
      blurb: { ko: '선물용 과일 박스를 상시 구성합니다.', en: 'Gift fruit boxes assembled on the spot.' },
      delivery: { ko: '영등포구 당일 배송', en: 'Same-day within Yeongdeungpo' },
      products: [
        p({ id: 'yd-melon', ko: '멜론 선물세트', en: 'Melon Gift Set', price: 45000, unit: { ko: '2통', en: '2 whole' },
            origin: { ko: '전남 나주', en: 'Naju' }, cat: 'fruit', conf: 0.958,
            box: [0.100, 0.200, 0.350, 0.150], tags: ['melon', 'gift', 'premium'] }),
        p({ id: 'yd-hallabong', ko: '한라봉 선물박스', en: 'Hallabong Gift Box', price: 38000, unit: { ko: '10개', en: '10 ea' },
            origin: { ko: '제주', en: 'Jeju' }, cat: 'fruit', img: 'tangerine.jpg', conf: 0.981,
            box: [0.550, 0.720, 0.400, 0.220], tags: ['citrus', 'gift', 'premium'] }),
        p({ id: 'yd-cheonggyul', ko: '청귤', en: 'Green Tangerine', price: 9000, unit: { ko: '1.5kg', en: '1.5kg' },
            origin: { ko: '제주', en: 'Jeju' }, cat: 'fruit', conf: 0.912,
            box: [0.300, 0.500, 0.300, 0.140], tags: ['citrus', 'tea', 'health'], priceSource: 'ai' })
      ]
    },
    {
      id: 'ydp-yachae', marketId: 'yeongdeungpo', ko: '야채마을', en: 'Vegetable Village',
      stall: '나열 3호', cat: 'veg', owner: { ko: '강태수', en: 'Kang Tae-su' }, since: 2005,
      phone: '02-2634-5566',
      hours: { ko: '06:00 – 20:00', en: '06:00 – 20:00' },
      closedDays: { ko: '연중무휴', en: 'Open daily' },
      pay: ['onnuri', 'zeropay', 'cash'],
      rating: 4.5, reviews: 87,
      photo: 'vegetable-stall', photoAgeMin: 240,
      camera: null,
      blurb: { ko: '식당 납품 물량이 많아 대량 구매 시 단가가 내려갑니다.', en: 'Supplies restaurants, with bulk pricing available.' },
      delivery: { ko: '식당 납품 배송', en: 'Restaurant delivery' },
      products: [
        p({ id: 'yd-spinach', ko: '시금치', en: 'Spinach', price: 2800, unit: { ko: '한 단', en: '1 bundle' },
            origin: { ko: '경기 남양주', en: 'Namyangju' }, cat: 'veg', conf: 0.951,
            box: [0.355, 0.500, 0.245, 0.240], tags: ['greens', 'namul'] }),
        p({ id: 'yd-onion', ko: '양파', en: 'Onion', price: 3800, unit: { ko: '2kg 망', en: '2kg net' },
            origin: { ko: '전남 무안', en: 'Muan' }, cat: 'veg', conf: 0.944,
            box: [0.300, 0.245, 0.115, 0.115], tags: ['onion', 'staple'] }),
        p({ id: 'yd-broccoli', ko: '브로콜리', en: 'Broccoli', price: 1800, unit: { ko: '1개', en: '1 ea' },
            origin: { ko: '제주', en: 'Jeju' }, cat: 'veg', conf: 0.962,
            box: [0.665, 0.815, 0.165, 0.160], tags: ['broccoli', 'diet'] })
      ]
    },

    /* ================== 마포농수산물시장 ================== */
    {
      id: 'mapo-cheonggwa', marketId: 'mapo', ko: '마포청과', en: 'Mapo Fruit Floor',
      stall: '청과동 11호', cat: 'fruit', owner: { ko: '윤성재', en: 'Yoon Seong-jae' }, since: 1995,
      phone: '02-306-2211',
      hours: { ko: '04:00 – 17:00', en: '04:00 – 17:00' },
      closedDays: { ko: '일요일', en: 'Sunday' },
      pay: ['card', 'onnuri', 'cash'],
      rating: 4.6, reviews: 74,
      photo: 'berry-stall', photoAgeMin: 33,
      camera: { id: 'CAM-MP-11', src: 'cam-zoom-demo.mp4', ptz: true, res: '4K', fps: 24 },
      blurb: { ko: '새벽 경매 직후가 가장 물건이 좋습니다.', en: 'Best selection right after the dawn auction.' },
      delivery: { ko: '수도권 새벽 배송', en: 'Dawn delivery in the capital area' },
      products: [
        p({ id: 'mp-strawberry', ko: '설향 딸기', en: 'Seolhyang Strawberry', price: 11000, unit: { ko: '500g', en: '500g' },
            origin: { ko: '충남 논산', en: 'Nonsan' }, cat: 'fruit', conf: 0.974,
            box: [0.300, 0.550, 0.160, 0.140], tags: ['berry', 'dessert'] }),
        p({ id: 'mp-muscat', ko: '샤인머스켓', en: 'Shine Muscat', price: 13000, unit: { ko: '1송이', en: '1 bunch' },
            origin: { ko: '경북 상주', en: 'Sangju' }, cat: 'fruit', img: 'shine-muscat.jpg', conf: 0.988,
            box: [0.420, 0.620, 0.160, 0.140], tags: ['grape', 'gift'] }),
        p({ id: 'mp-chamoe', ko: '참외', en: 'Korean Melon', price: 9000, unit: { ko: '5개', en: '5 ea' },
            origin: { ko: '경북 성주', en: 'Seongju' }, cat: 'fruit', conf: 0.932,
            box: [0.720, 0.600, 0.140, 0.140], tags: ['melon', 'summer'] })
      ]
    },
    {
      id: 'mapo-susan', marketId: 'mapo', ko: '마포수산 직판', en: 'Mapo Seafood Direct',
      stall: '수산동 4호', cat: 'fish', owner: { ko: '남기훈', en: 'Nam Ki-hun' }, since: 1993,
      phone: '02-306-8899',
      hours: { ko: '04:00 – 16:00', en: '04:00 – 16:00' },
      closedDays: { ko: '일요일', en: 'Sunday' },
      pay: ['card', 'onnuri', 'cash'],
      rating: 4.7, reviews: 205,
      photo: null, photoAgeMin: null,
      camera: null,
      blurb: { ko: '수조 카메라 설치 예정 (2026년 9월). 현재는 전화 문의만 가능합니다.', en: 'Tank camera scheduled for Sept 2026; phone enquiries only for now.' },
      delivery: { ko: '아이스박스 포장 · 당일 발송', en: 'Ice-box packed, same-day dispatch' },
      products: [
        p({ id: 'mp-godeungeo', ko: '손질 고등어', en: 'Prepared Mackerel', price: 9000, unit: { ko: '2마리', en: '2 ea' },
            origin: { ko: '부산 위판', en: 'Busan landing' }, cat: 'fish', conf: 0.0, tags: ['fish', 'grill'] }),
        p({ id: 'mp-ojingeo', ko: '생물 오징어', en: 'Fresh Squid', price: 12000, unit: { ko: '3마리', en: '3 ea' },
            origin: { ko: '동해', en: 'East Sea' }, cat: 'fish', conf: 0.0, tags: ['squid', 'stir-fry'] }),
        p({ id: 'mp-jeonbok', ko: '완도 전복', en: 'Wando Abalone', price: 32000, unit: { ko: '10미', en: '10 pcs' },
            origin: { ko: '전남 완도', en: 'Wando' }, cat: 'fish', conf: 0.0, tags: ['abalone', 'gift', 'porridge'] })
      ]
    },

    /* ====================== 모래내시장 ====================== */
    {
      id: 'moraenae-fruit', marketId: 'moraenae', ko: '모래내 과일노점', en: 'Moraenae Fruit Stand',
      stall: '중앙로 7', cat: 'fruit', owner: { ko: '천경자', en: 'Cheon Kyung-ja' }, since: 2001,
      phone: '032-434-1177',
      hours: { ko: '09:00 – 21:00', en: '09:00 – 21:00' },
      closedDays: { ko: '첫째 화요일', en: '1st Tuesday' },
      pay: ['onnuri', 'zeropay', 'cash'],
      rating: 4.3, reviews: 64,
      photo: 'citrus-street', photoAgeMin: 480,
      camera: null,
      blurb: { ko: '노점 특성상 사진 갱신 주기가 깁니다.', en: 'An open-air stand, so the photo refreshes less often.' },
      delivery: { ko: '직접 수령', en: 'Pick-up only' },
      products: [
        p({ id: 'mn-gyul', ko: '감귤', en: 'Tangerine', price: 6000, unit: { ko: '2kg', en: '2kg' },
            origin: { ko: '제주', en: 'Jeju' }, cat: 'fruit', img: 'tangerine.jpg', conf: 0.976,
            box: [0.050, 0.420, 0.300, 0.280], tags: ['citrus', 'kids'] }),
        p({ id: 'mn-bam', ko: '햇밤', en: 'New Chestnut', price: 6500, unit: { ko: '1kg', en: '1kg' },
            origin: { ko: '충남 공주', en: 'Gongju' }, cat: 'grain', conf: 0.884,
            box: [0.715, 0.720, 0.220, 0.200], tags: ['chestnut', 'autumn'], priceSource: 'ai' }),
        p({ id: 'mn-apple', ko: '사과', en: 'Apple', price: 9000, unit: { ko: '5개', en: '5 ea' },
            origin: { ko: '경북 의성', en: 'Uiseong' }, cat: 'fruit', img: 'fuji-apple.jpg', conf: 0.953,
            box: [0.200, 0.150, 0.200, 0.160], tags: ['apple', 'snack'] })
      ]
    },
    {
      id: 'moraenae-dak', marketId: 'moraenae', ko: '모래내 닭강정', en: 'Moraenae Dakgangjeong',
      stall: '중앙로 12', cat: 'snack', owner: { ko: '허진우', en: 'Heo Jin-woo' }, since: 2013,
      phone: '032-435-2323',
      hours: { ko: '11:00 – 22:00', en: '11:00 – 22:00' },
      closedDays: { ko: '연중무휴', en: 'Open daily' },
      pay: ['card', 'onnuri', 'zeropay', 'cash'],
      rating: 4.8, reviews: 921,
      photo: null, photoAgeMin: null,
      camera: null,
      blurb: { ko: '주문 즉시 튀깁니다. 주말 대기 20분 이상.', en: 'Fried to order; 20+ min wait on weekends.' },
      delivery: { ko: '포장 · 배달앱 연동', en: 'Takeaway · delivery apps' },
      products: [
        p({ id: 'mn-dak', ko: '순살 닭강정', en: 'Boneless Dakgangjeong', price: 18000, unit: { ko: '중(中)', en: 'Medium' },
            cat: 'snack', conf: 0.0, tags: ['chicken', 'sweet', 'snack'] }),
        p({ id: 'mn-tteok', ko: '떡볶이', en: 'Tteokbokki', price: 5000, unit: { ko: '1인분', en: '1 serving' },
            cat: 'snack', conf: 0.0, tags: ['tteokbokki', 'spicy'] })
      ]
    },

    /* ===================== 부평깡시장 ===================== */
    {
      id: 'bupyeong-kkang', marketId: 'bupyeong', ko: '깡시장 청과', en: 'Kkang Market Produce',
      stall: 'A동 3호', cat: 'fruit', owner: { ko: '노철민', en: 'Noh Cheol-min' }, since: 1986,
      phone: '032-505-1212',
      hours: { ko: '05:00 – 19:00', en: '05:00 – 19:00' },
      closedDays: { ko: '둘째 일요일', en: '2nd Sunday' },
      pay: ['card', 'onnuri', 'cash'],
      rating: 4.5, reviews: 118,
      photo: 'produce-hall', photoAgeMin: 21,
      camera: { id: 'CAM-BP-A03', src: 'cam-ganghwa.mp4', ptz: true, res: '4K', fps: 24 },
      blurb: { ko: '도매 물량을 소매가로 나눠 파는 상회.', en: 'Wholesale volume broken down to retail portions.' },
      delivery: { ko: '부평구 당일 배송', en: 'Same-day within Bupyeong' },
      products: [
        p({ id: 'bp-apple', ko: '부사 사과 (박스)', en: 'Fuji Apple (case)', price: 34000, unit: { ko: '5kg', en: '5kg' },
            origin: { ko: '경북 청송', en: 'Cheongsong' }, cat: 'fruit', img: 'fuji-apple.jpg', conf: 0.979,
            box: [0.615, 0.405, 0.105, 0.095], tags: ['apple', 'wholesale', 'gift'] }),
        p({ id: 'bp-grape', ko: '캠벨 포도 (박스)', en: 'Campbell Grapes (case)', price: 26000, unit: { ko: '5kg', en: '5kg' },
            origin: { ko: '충북 영동', en: 'Yeongdong' }, cat: 'fruit', img: 'grapes.jpg', conf: 0.941,
            box: [0.185, 0.500, 0.120, 0.100], tags: ['grape', 'wholesale', 'juice'] }),
        p({ id: 'bp-banana', ko: '바나나', en: 'Banana', price: 3000, unit: { ko: '1송이', en: '1 bunch' },
            origin: { ko: '필리핀', en: 'Philippines' }, cat: 'fruit', conf: 0.964,
            box: [0.130, 0.375, 0.130, 0.115], tags: ['banana', 'kids'] })
      ]
    },
    {
      id: 'bupyeong-namul', marketId: 'bupyeong', ko: '부평 나물가게', en: 'Bupyeong Namul Shop',
      stall: 'B동 9호', cat: 'veg', owner: { ko: '구현숙', en: 'Koo Hyun-sook' }, since: 2009,
      phone: '032-506-7070',
      hours: { ko: '06:00 – 19:00', en: '06:00 – 19:00' },
      closedDays: { ko: '둘째 일요일', en: '2nd Sunday' },
      pay: ['onnuri', 'zeropay', 'cash'],
      rating: 4.6, reviews: 53,
      photo: 'greens-banchan', photoAgeMin: 95,
      camera: null,
      blurb: { ko: '제철 나물 위주로 소량 구성.', en: 'Small seasonal namul batches.' },
      delivery: { ko: '직접 수령', en: 'Pick-up only' },
      products: [
        p({ id: 'bp-kongnamul', ko: '콩나물', en: 'Soybean Sprouts', price: 1500, unit: { ko: '400g', en: '400g' },
            cat: 'banchan', conf: 0.908, box: [0.280, 0.800, 0.160, 0.140], tags: ['sprouts', 'soup'] }),
        p({ id: 'bp-cucumber', ko: '오이', en: 'Cucumber', price: 2200, unit: { ko: '3개', en: '3 ea' },
            origin: { ko: '경기 여주', en: 'Yeoju' }, cat: 'veg', conf: 0.955,
            box: [0.420, 0.545, 0.160, 0.120], tags: ['cucumber', 'salad'] }),
        p({ id: 'bp-goguma', ko: '꿀고구마', en: 'Honey Sweet Potato', price: 5500, unit: { ko: '1.5kg', en: '1.5kg' },
            origin: { ko: '전남 해남', en: 'Haenam' }, cat: 'veg', conf: 0.929,
            box: [0.120, 0.620, 0.160, 0.140], tags: ['sweet-potato', 'snack'] })
      ]
    }
  ];

  /* ------------------------------------------------------------- footprints
   * Real market outlines traced in OpenStreetMap, fetched from the OSM API and
   * frozen here. A single pin is only a representative point for a market that
   * runs 300–400 m down an arcade, so the map draws the actual footprint once
   * you are zoomed in far enough to see it. 부평깡시장 has no polygon in OSM
   * (it is an alley, not an enclosure), so it stays pin-only.
   * -------------------------------------------------------------------- */
  var FOOTPRINTS = {
    /* OSM way 471492031 */
    gajwa: [[37.494806,126.682367], [37.494980,126.682554], [37.495251,126.682844], [37.494444,126.683995], [37.493781,126.684941], [37.493346,126.684938], [37.493098,126.684936], [37.494589,126.682693]],
    /* OSM way 775032527 */
    ganghwa: [[37.741782,126.492483], [37.741680,126.493299], [37.741010,126.493151], [37.741054,126.492902], [37.741120,126.492911], [37.741154,126.492621], [37.741254,126.492640], [37.741310,126.492461], [37.741208,126.492415], [37.741244,126.492316], [37.741271,126.492344], [37.741271,126.492286]],
    /* OSM way 78503350 */
    namdaemun: [[37.559969,126.976045], [37.559046,126.976043], [37.558723,126.976115], [37.558472,126.976176], [37.557634,126.976526], [37.557892,126.977171], [37.558064,126.977464], [37.558242,126.977718], [37.558886,126.978327], [37.559165,126.978720], [37.559391,126.978587], [37.560454,126.978655], [37.560503,126.978842], [37.561067,126.978679], [37.560888,126.977526], [37.560393,126.976261]],
    /* OSM way 607083156 */
    gwangjang: [[37.570353,127.000807], [37.570089,127.001065], [37.570026,127.001037], [37.569962,127.000503], [37.569943,127.000330], [37.569907,126.999386], [37.569890,126.998935], [37.569879,126.998828], [37.569845,126.998559], [37.569807,126.998265], [37.569791,126.998073], [37.569781,126.997976], [37.570106,126.997948], [37.570309,126.998154], [37.570326,126.998874], [37.570362,126.999048], [37.570349,126.999241], [37.570656,126.999218], [37.570657,126.999241], [37.570659,126.999293], [37.570515,126.999309], [37.570333,126.999314], [37.570312,126.999317], [37.570271,126.999366], [37.570292,126.999585], [37.570305,126.999824], [37.570297,127.000005], [37.570462,127.000012], [37.570488,127.000512], [37.570538,127.000507], [37.570565,127.000549], [37.570572,127.000585], [37.570564,127.000604]],
    /* OSM way 344446760 */
    yeongdeungpo: [[37.519566,126.908073], [37.519631,126.907765], [37.520076,126.905274], [37.520216,126.905314], [37.520287,126.905334], [37.520916,126.908466]],
    /* OSM way 38170384 */
    mapo: [[37.565979,126.898060], [37.565357,126.898054], [37.564694,126.898047], [37.564405,126.898044], [37.564399,126.898929], [37.565973,126.898946], [37.565975,126.898687]],
    /* OSM way 468616663 */
    moraenae: [[37.453609,126.720552], [37.453588,126.720953], [37.452739,126.720869], [37.452842,126.719270], [37.452719,126.719258], [37.452640,126.720859], [37.452214,126.720807], [37.452201,126.720991], [37.453591,126.721117], [37.453568,126.721471], [37.453709,126.721489], [37.453722,126.721143], [37.455639,126.721315], [37.455652,126.721142], [37.453732,126.720977], [37.453812,126.719369], [37.453677,126.719351], [37.453651,126.719803], [37.452815,126.719755], [37.452801,126.719978], [37.453642,126.720026], [37.453621,126.720391], [37.452779,126.720343], [37.452768,126.720510]]
  };

  /* ---------------------------------------------------------------- layouts
   * How each market is actually laid out inside. Zone names are used ONLY where
   * the market, its 구청 or a published guide names them; `sourced: false` means
   * no public section names exist and the plan groups stalls by trade instead,
   * which the UI says out loud. Stall-level positions are nowhere published, so
   * the plan places stalls along the market's real footprint rather than
   * pretending to survey them.
   * -------------------------------------------------------------------- */
  var LAYOUTS = {
    gajwa: {
      kind: 'arcade', sourced: false,
      note: { ko: '가좌시장은 구역 이름이 따로 공표되어 있지 않아, 아케이드 한 줄을 업종별로 나눠 표시합니다.',
              en: 'Gajwa publishes no section names, so the single arcade is grouped by trade.' },
      entrances: [
        { ko: '북측 입구 · 원적로', en: 'North gate · Wonjeok-ro', at: 'start' },
        { ko: '남측 입구 · 장고개로337번길', en: 'South gate · Janggogae-ro 337', at: 'end' }
      ],
      zones: [
        { ko: '청과·채소', en: 'Fruit & veg', trades: ['fruit', 'veg'] },
        { ko: '반찬·먹거리', en: 'Sides & street food', trades: ['banchan', 'snack'] },
        { ko: '정육·기타', en: 'Butcher & other', trades: ['meat', 'fish', 'health', 'grain'] }
      ],
      facilities: [{ ko: '고객쉼터', at: 0.5 }, { ko: '화장실', at: 0.78 }]
    },
    ganghwa: {
      kind: 'hall', sourced: true, floors: ['1층 · 농수산물', '2층 · 먹거리'],
      note: { ko: '2007년 신축 건물로 1층 122개, 2층 49개 점포가 등록되어 있습니다.',
              en: 'A 2007 building: 122 stalls on level 1, 49 on level 2.' },
      entrances: [
        { ko: '정문 · 터미널 방면', en: 'Main gate · toward the terminal', at: 'start' },
        { ko: '중앙로 입구', en: 'Jungang-ro entrance', at: 'end' }
      ],
      zones: [
        { ko: '1층 농산물', en: 'Level 1 · produce', trades: ['fruit', 'veg'], count: 122 },
        { ko: '1층 특산·건어물', en: 'Level 1 · local goods', trades: ['health', 'grain', 'banchan'] },
        { ko: '2층 먹거리', en: 'Level 2 · food alley', trades: ['snack', 'meat', 'fish'], count: 49 }
      ],
      facilities: [{ ko: '주차장', at: 0.1 }, { ko: '화장실', at: 0.6 }]
    },
    namdaemun: {
      kind: 'blocks', sourced: true,
      note: { ko: '상가 건물과 골목이 섞인 대형 시장입니다. 갈치골목·칼국수골목·대도종합상가는 실제 공표된 구역 이름입니다.',
              en: 'Buildings and alleys mixed. Galchi alley, kalguksu alley and Daedo arcade are the market’s own names.' },
      entrances: [
        { ko: '5번 게이트 · 회현역 방면', en: 'Gate 5 · Hoehyeon Stn.', at: 'start' },
        { ko: '1번 게이트 · 숭례문 방면', en: 'Gate 1 · Sungnyemun', at: 'end' }
      ],
      zones: [
        { ko: '청과·식품 골목', en: 'Produce alley', trades: ['fruit', 'veg', 'grain'] },
        { ko: '갈치골목', en: 'Galchi alley', trades: ['snack', 'fish'] },
        { ko: '칼국수골목', en: 'Kalguksu alley', trades: ['meat', 'banchan'], count: 10 },
        { ko: '대도종합상가', en: 'Daedo arcade', trades: ['health'] }
      ],
      facilities: [{ ko: '고객지원센터', at: 0.42 }, { ko: '화장실', at: 0.7 }]
    },
    gwangjang: {
      kind: 'hall', sourced: true,
      note: { ko: '먹자골목은 동문·북2문·남1문이 만나는 중앙 통로에 형성되어 있고, 그 바깥으로 한복·포목·구제상가가 이어집니다.',
              en: 'The food alley sits where the East, North 2 and South 1 gates meet; hanbok, fabric and vintage shops ring it.' },
      entrances: [
        { ko: '동문 · 먹자골목 방면', en: 'East gate · food alley', at: 'start' },
        { ko: '북1문 · 종로 방면', en: 'North gate 1 · Jongno', at: 'side-a' },
        { ko: '남1문 · 청계천 방면', en: 'South gate 1 · Cheonggyecheon', at: 'end' }
      ],
      zones: [
        { ko: '먹자골목', en: 'Food alley', trades: ['snack', 'meat'] },
        { ko: '청과·건어물', en: 'Produce & dried goods', trades: ['fruit', 'veg', 'grain', 'fish'] },
        { ko: '한복·포목부', en: 'Hanbok & fabric', trades: ['banchan', 'health'] }
      ],
      facilities: [{ ko: '고객지원센터', at: 0.5 }, { ko: '화장실', at: 0.24 }, { ko: '2층 구제상가', at: 0.8 }]
    },
    yeongdeungpo: {
      kind: 'arcade', sourced: false,
      note: { ko: '점포 311개와 노점 388개가 함께 있는 시장으로, 구역 이름은 공표되어 있지 않습니다. 저녁에는 같은 통로에 야시장이 섭니다.',
              en: '311 stalls plus 388 street pitches, with no published section names. The night market runs down the same aisle.' },
      entrances: [
        { ko: '영등포로 입구', en: 'Yeongdeungpo-ro entrance', at: 'start' },
        { ko: '영등포시장역 방면', en: 'Toward Yeongdeungpo Market Stn.', at: 'end' }
      ],
      zones: [
        { ko: '청과 구역', en: 'Fruit', trades: ['fruit'] },
        { ko: '채소·반찬 구역', en: 'Veg & sides', trades: ['veg', 'banchan'] },
        { ko: '정육·먹거리 구역', en: 'Butcher & food', trades: ['meat', 'snack', 'fish', 'health', 'grain'] }
      ],
      facilities: [{ ko: '야시장 구간', at: 0.55 }, { ko: '주차타워', at: 0.9 }]
    },
    mapo: {
      /* The only market here with an official published plan: 마포구시설관리공단
       * posts 1층 매장배치도 and 2층 부대시설 배치도, so these zone names, gate
       * numbers and stall counts are the market's own, read off that drawing. */
      kind: 'hall', sourced: true, floors: ['1층 · 채소·과일·수산·마트', '2층 · 식당가·회센터·사무동'],
      planUrl: 'https://www.mfmc.or.kr/view/market/menu2_3.php',
      note: { ko: '마포구시설관리공단이 공개한 매장배치도 기준입니다. 구역 이름과 출입구 번호는 도면에 인쇄된 표기 그대로입니다.',
              en: "Taken from the operator's published floor plan; zone names and gate numbers are the drawing's own." },
      entrances: [
        { ko: '4번 출입구 · 주차장', en: 'Gate 4 · car park', at: 'start' },
        { ko: '9번 출입구 · 월드컵로', en: 'Gate 9 · World Cup-ro', at: 'side-a' },
        { ko: '7번 출입구 · 농수산시장로', en: 'Gate 7 · Nongsusan-sijang-ro', at: 'end' }
      ],
      zones: [
        { ko: '채소매장', en: 'Vegetable hall', floor: '1층', trades: ['veg', 'banchan', 'grain'], count: 51 },
        { ko: '과일매장', en: 'Fruit hall', floor: '1층', trades: ['fruit', 'meat', 'health'], count: 25 },
        { ko: '수산매장', en: 'Seafood hall', floor: '1층', trades: ['fish'], count: 51 },
        { ko: '2층 식당가·회센터', en: 'Level 2 · restaurants', floor: '2층', trades: ['snack'], count: 7 }
      ],
      facilities: [
        { ko: '다농마트', at: 0.34 }, { ko: '화장실', at: 0.6 }, { ko: '엘리베이터', at: 0.14 }, { ko: '주차 347면', at: 0.86 }
      ]
    },
    moraenae: {
      kind: 'arcade', sourced: false,
      note: { ko: '약 380m 아케이드 골목시장으로, 구역 이름은 공표되어 있지 않아 업종별로 묶어 표시합니다.',
              en: 'A ~380 m arcade with no published sections, so stalls are grouped by trade.' },
      entrances: [
        { ko: '모래내시장역 3번 출구 방면', en: 'Moraenae Market Stn. exit 3', at: 'start' },
        { ko: '호구포로 방면', en: 'Toward Hogupo-ro', at: 'end' }
      ],
      zones: [
        { ko: '청과·채소', en: 'Fruit & veg', trades: ['fruit', 'veg'] },
        { ko: '먹거리 골목', en: 'Street food', trades: ['snack'] },
        { ko: '정육·수산·반찬', en: 'Butcher, fish & sides', trades: ['meat', 'fish', 'banchan', 'grain', 'health'] }
      ],
      facilities: [{ ko: '고객주차장', at: 0.15 }, { ko: '화장실', at: 0.65 }]
    },
    bupyeong: {
      kind: 'street', sourced: false, lengthM: 430, widthM: 14,
      note: { ko: '건물 안이 아니라 약 430m 골목을 따라 이어지는 시장이라 외곽선이 지도에 없습니다. 길이만 실제 값이고 점포 배치는 예시입니다.',
              en: 'An open 430 m alley rather than an enclosure, so it has no mapped outline. The length is real; stall places are illustrative.' },
      entrances: [
        { ko: '주부토로 방면 입구', en: 'Jubuto-ro end', at: 'start' },
        { ko: '시장로79번길 방면', en: 'Sijang-ro 79 end', at: 'end' }
      ],
      zones: [
        { ko: '청과 구역', en: 'Fruit', trades: ['fruit'] },
        { ko: '채소·나물 구역', en: 'Veg & namul', trades: ['veg', 'banchan'] },
        { ko: '건어물·정육 구역', en: 'Dried goods & butcher', trades: ['grain', 'meat', 'fish', 'snack', 'health'] }
      ],
      facilities: [{ ko: '공영주차장', at: 0.12 }]
    }
  };

  /* --------------------------------------------------------- derived indexes */
  var MARKET_BY_ID = {};
  MARKETS.forEach(function (m) { MARKET_BY_ID[m.id] = m; });

  var STORE_BY_ID = {};
  var PRODUCTS = [];
  STORES.forEach(function (s) {
    STORE_BY_ID[s.id] = s;
    s.products.forEach(function (pr) {
      // Denormalise so search / cart / recommender can work off a flat list.
      pr.storeId = s.id;
      pr.marketId = s.marketId;
      pr.uid = s.id + ':' + pr.id;
      PRODUCTS.push(pr);
    });
  });

  MARKETS.forEach(function (m) {
    var mine = STORES.filter(function (s) { return s.marketId === m.id; });
    m.storeCount = mine.length;
    m.liveCount = mine.filter(function (s) { return !!s.camera; }).length;
  });

  var CATEGORY_BY_ID = {};
  CATEGORIES.forEach(function (c) { CATEGORY_BY_ID[c.id] = c; });

  /* ---------------------------------------------------------- co-purchase kb
   * Drives the offline recommender and gives the xAI prompt real domain hints
   * instead of asking the model to invent Korean market pairings from nothing.
   * -------------------------------------------------------------------- */
  var AFFINITY = {
    apple:        [{ tag: 'pear', w: 0.9, why: 'rite' }, { tag: 'chestnut', w: 0.7, why: 'rite' }, { tag: 'jujube', w: 0.6, why: 'rite' }],
    pear:         [{ tag: 'apple', w: 0.9, why: 'rite' }, { tag: 'pork', w: 0.5, why: 'marinade' }],
    berry:        [{ tag: 'grape', w: 0.5, why: 'dessert' }, { tag: 'tomato', w: 0.4, why: 'dessert' }],
    grape:        [{ tag: 'berry', w: 0.5, why: 'dessert' }, { tag: 'melon', w: 0.4, why: 'dessert' }],
    citrus:       [{ tag: 'persimmon', w: 0.5, why: 'season' }, { tag: 'nuts', w: 0.4, why: 'snack' }],
    melon:        [{ tag: 'watermelon', w: 0.6, why: 'season' }, { tag: 'grape', w: 0.4, why: 'dessert' }],
    watermelon:   [{ tag: 'melon', w: 0.6, why: 'season' }],
    tomato:       [{ tag: 'cucumber', w: 0.6, why: 'salad' }, { tag: 'onion', w: 0.5, why: 'salad' }],
    cucumber:     [{ tag: 'chili', w: 0.6, why: 'kimchi' }, { tag: 'onion', w: 0.5, why: 'salad' }],
    greens:       [{ tag: 'sprouts', w: 0.7, why: 'namul' }, { tag: 'chives', w: 0.5, why: 'namul' }],
    sprouts:      [{ tag: 'greens', w: 0.7, why: 'namul' }, { tag: 'chili', w: 0.4, why: 'soup' }],
    potato:       [{ tag: 'onion', w: 0.8, why: 'stew' }, { tag: 'chili', w: 0.5, why: 'stew' }],
    onion:        [{ tag: 'potato', w: 0.8, why: 'stew' }, { tag: 'pork', w: 0.6, why: 'bbq' }],
    pork:         [{ tag: 'cabbage', w: 0.8, why: 'ssam' }, { tag: 'chili', w: 0.6, why: 'ssam' }, { tag: 'kimchi', w: 0.5, why: 'ssam' }],
    beef:         [{ tag: 'onion', w: 0.6, why: 'bbq' }, { tag: 'sprouts', w: 0.4, why: 'soup' }],
    chicken:      [{ tag: 'potato', w: 0.7, why: 'stew' }, { tag: 'chili', w: 0.5, why: 'stew' }],
    fish:         [{ tag: 'chili', w: 0.5, why: 'stew' }, { tag: 'onion', w: 0.4, why: 'stew' }],
    kimchi:       [{ tag: 'pork', w: 0.7, why: 'ssam' }, { tag: 'sprouts', w: 0.4, why: 'soup' }],
    cabbage:      [{ tag: 'pork', w: 0.8, why: 'ssam' }, { tag: 'chili', w: 0.5, why: 'ssam' }],
    chili:        [{ tag: 'cucumber', w: 0.5, why: 'kimchi' }, { tag: 'pork', w: 0.5, why: 'ssam' }],
    chestnut:     [{ tag: 'jujube', w: 0.8, why: 'rite' }, { tag: 'apple', w: 0.6, why: 'rite' }],
    jujube:       [{ tag: 'chestnut', w: 0.8, why: 'rite' }, { tag: 'ginseng', w: 0.5, why: 'tea' }],
    ginseng:      [{ tag: 'jujube', w: 0.6, why: 'tea' }, { tag: 'chicken', w: 0.6, why: 'samgyetang' }],
    'sweet-potato': [{ tag: 'kimchi', w: 0.5, why: 'snack' }, { tag: 'nuts', w: 0.3, why: 'snack' }],
    dumpling:     [{ tag: 'kimchi', w: 0.6, why: 'snack' }],
    tteokbokki:   [{ tag: 'gimbap', w: 0.8, why: 'snack' }, { tag: 'dumpling', w: 0.6, why: 'snack' }],
    gimbap:       [{ tag: 'tteokbokki', w: 0.8, why: 'snack' }]
  };

  /* Reason templates used by the offline engine (the xAI path writes its own). */
  var REASONS = {
    rite:       { ko: '차례상·선물 세트를 함께 맞추는 조합이에요.', en: 'Commonly boxed together for holiday gifting and ancestral rites.' },
    marinade:   { ko: '고기 양념에 갈아 넣으면 잘 어울려요.', en: 'Grated into meat marinades, a classic pairing.' },
    dessert:    { ko: '같은 후식 코너에서 자주 함께 담기는 과일이에요.', en: 'Frequently added together as a dessert plate.' },
    season:     { ko: '지금이 제철이라 오늘 매대에서 상태가 가장 좋아요.', en: 'In season right now and at its best on today’s counter.' },
    salad:      { ko: '샐러드·냉채 재료로 함께 쓰입니다.', en: 'Used together for salads and chilled sides.' },
    kimchi:     { ko: '겉절이·오이소박이 담글 때 같이 들어가요.', en: 'Goes in together when making quick kimchi.' },
    namul:      { ko: '나물 무침 한 상 차릴 때 같이 사는 품목이에요.', en: 'Bought together for a namul spread.' },
    stew:       { ko: '찌개·조림 기본 재료 조합입니다.', en: 'The base combination for stews and braises.' },
    bbq:        { ko: '구이 상차림에 함께 오르는 재료예요.', en: 'Served together at the grill.' },
    ssam:       { ko: '쌈 싸 먹을 때 빠지지 않는 조합이에요.', en: 'The classic ssam wrap combination.' },
    soup:       { ko: '국물 낼 때 함께 넣는 재료입니다.', en: 'Added together when building a soup base.' },
    snack:      { ko: '간식으로 같이 담아가는 손님이 많아요.', en: 'Shoppers usually grab these together as snacks.' },
    tea:        { ko: '차로 우려 마시기 좋은 조합이에요.', en: 'A good pairing to brew as tea.' },
    samgyetang: { ko: '삼계탕 한 그릇 재료가 됩니다.', en: 'Together they make a pot of samgyetang.' },
    nearby:     { ko: '같은 시장 안, 몇 걸음 거리 점포입니다.', en: 'A few steps away inside the same market.' },
    popular:    { ko: '이 시장에서 오늘 가장 많이 담긴 상품이에요.', en: "Today's most-added item in this market." },
    fresh:      { ko: '방금 매대 사진이 갱신된 신선한 물건이에요.', en: 'The counter photo was just refreshed, so this is very fresh.' }
  };

  MM.data = {
    categories: CATEGORIES,
    categoryById: CATEGORY_BY_ID,
    regions: REGIONS,
    markets: MARKETS,
    marketById: MARKET_BY_ID,
    stores: STORES,
    storeById: STORE_BY_ID,
    products: PRODUCTS,
    footprints: FOOTPRINTS,
    layouts: LAYOUTS,
    affinity: AFFINITY,
    reasons: REASONS,
    storesOfMarket: function (marketId) {
      return STORES.filter(function (s) { return s.marketId === marketId; });
    },
    productByUid: function (uid) {
      for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].uid === uid) return PRODUCTS[i];
      return null;
    }
  };
})(window);
