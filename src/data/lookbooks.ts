import type { LookbookPlate } from '../types/commerce';

export const LOOKBOOKS: LookbookPlate[] = [
  {
    id: 'look-01',
    plateCode: 'PLATE 01 / 03',
    seasonStamp: 'AUTUMN · WINTER 2026',
    title: {
      en: 'Look 01: Autumn Architecture',
      vi: 'Look 01: Kiến Trúc Mùa Thu',
    },
    editorialNote: {
      en: 'Cantilevered Italian gabardine paired with CNC-milled Sabae titanium and self-standing French box calfskin.',
      vi: 'Vải gabardine Ý phom hẫng kết hợp cùng gọng titan phay CNC từ Sabae và túi da bê hộp đứng phom của Pháp.',
    },
    architectureRef: {
      en: 'Study in Limestone & Brutalist Light · Palais de Tokyo',
      vi: 'Nghiên cứu Ánh Sáng & Đá Vôi · Palais de Tokyo',
    },
    bundleDiscountRate: 0.1,
    artKey: 'autumn-architecture',
    hotspots: [
      {
        index: '01',
        productId: 'mv-eye-01',
        xPercent: 48,
        yPercent: 20,
        note: {
          en: 'VÉRA-01 Monolith Titanium Frame · 18.4g',
          vi: 'Kính Titan Nguyên Khối VÉRA-01 · 18.4g',
        },
      },
      {
        index: '02',
        productId: 'mv-out-01',
        xPercent: 44,
        yPercent: 47,
        note: {
          en: 'Atelier Architectural Trench · 340 GSM',
          vi: 'Áo Khoác Trench Kiến Trúc Atelier · 340 GSM',
        },
      },
      {
        index: '03',
        productId: 'mv-lth-01',
        xPercent: 69,
        yPercent: 72,
        note: {
          en: 'Monolith Box-Calf Tote · French Calfskin',
          vi: 'Túi Tote Da Bê Box-Calf · Da Bê Pháp',
        },
      },
    ],
  },
  {
    id: 'look-02',
    plateCode: 'PLATE 02 / 03',
    seasonStamp: 'TRANSIT ARCHIVE · 2026',
    title: {
      en: 'Look 02: Brutalist Travel',
      vi: 'Look 02: Du Hành Brutalist',
    },
    editorialNote: {
      en: 'Engineered for intercontinental transit: double-faced 620 GSM merino-cashmere, Zeiss titanium shield, and 48H Tuscan bridle leather.',
      vi: 'Thiết kế cho những chuyến bay xuyên lục địa: măng-tô len cashmere 620 GSM, kính chắn sáng Zeiss titan và túi da 48H Tuscany.',
    },
    architectureRef: {
      en: 'Study in Cast Concrete & Transit · Charles de Gaulle T1',
      vi: 'Nghiên cứu Bê Tông Đúc & Chuyển Động · Terminal 1',
    },
    bundleDiscountRate: 0.1,
    artKey: 'brutalist-travel',
    hotspots: [
      {
        index: '01',
        productId: 'mv-eye-02',
        xPercent: 52,
        yPercent: 21,
        note: {
          en: 'Solaire Sculpted Bridge Shield · Zeiss Lens',
          vi: 'Kính Mát Cầu Nổi Solaire · Tròng Zeiss',
        },
      },
      {
        index: '02',
        productId: 'mv-out-02',
        xPercent: 40,
        yPercent: 48,
        note: {
          en: 'Brutalist Wool-Cashmere Overcoat · 620 GSM',
          vi: 'Áo Măng-tô Len Cashmere Brutalist · 620 GSM',
        },
      },
      {
        index: '03',
        productId: 'mv-lth-02',
        xPercent: 66,
        yPercent: 76,
        note: {
          en: 'Nomad Full-Grain Weekender 48H · Tuscan Bridle',
          vi: 'Túi Du Hành 48H Da Nguyên Hạt Nomad · Tuscany',
        },
      },
    ],
  },
  {
    id: 'look-03',
    plateCode: 'PLATE 03 / 03',
    seasonStamp: 'NOCTURNE SALON · 2026',
    title: {
      en: 'Look 03: Nocturne Salon',
      vi: 'Look 03: Phòng Trưng Bày Đêm',
    },
    editorialNote: {
      en: 'Evening tailoring meets acoustic home ritual: raw bourette silk blazer, sand-cast Kyoto bronze vessel, and Grasse extrait de parfum.',
      vi: 'Nghệ thuật may đo buổi tối hòa quyện cùng nghi thức không gian: blazer lụa thô bourette, lư trầm đồng đúc Kyoto và tinh dầu nước hoa Grasse.',
    },
    architectureRef: {
      en: 'Study in Travertine & Shadow · Villa Necchi',
      vi: 'Nghiên cứu Đá Travertine & Bóng Tối · Villa Necchi',
    },
    bundleDiscountRate: 0.1,
    artKey: 'nocturne-salon',
    hotspots: [
      {
        index: '01',
        productId: 'mv-out-03',
        xPercent: 42,
        yPercent: 40,
        note: {
          en: 'Nocturne Raw-Silk Tailored Blazer · Como Silk',
          vi: 'Áo Blazer Lụa Thô Nocturne · Lụa Como',
        },
      },
      {
        index: '02',
        productId: 'mv-obj-01',
        xPercent: 68,
        yPercent: 66,
        note: {
          en: 'Cast Travertine & Bronze Incense Vessel · 1.85 kg',
          vi: 'Lư Trầm Travertine & Đồng Đúc · 1.85 kg',
        },
      },
      {
        index: '03',
        productId: 'mv-frg-01',
        xPercent: 29,
        yPercent: 74,
        note: {
          en: 'N°01 Hinoki & Wet Concrete Extrait · 32%',
          vi: 'N°01 Gỗ Hinoki & Bê Tông Ẩm Extrait · 32%',
        },
      },
    ],
  },
];
