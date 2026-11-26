import type { Product } from '../types/commerce';

export const HERO_FRAME_FINISHES = [
  {
    id: 'raw-titanium' as const,
    label: { en: 'Raw Titanium', vi: 'Titan Nguyên Bản' },
    metalHex: '#C7C5BF',
    metalness: 0.94,
    roughness: 0.25,
    colorwayId: 'eye01-titan',
  },
  {
    id: 'warm-gold' as const,
    label: { en: 'Warm Gold', vi: 'Vàng Champagne' },
    metalHex: '#D1AE6F',
    metalness: 0.96,
    roughness: 0.22,
    colorwayId: 'eye01-gold',
  },
  {
    id: 'matte-noir' as const,
    label: { en: 'Matte Noir', vi: 'Đen Nhám PVD' },
    metalHex: '#202226',
    metalness: 0.78,
    roughness: 0.38,
    colorwayId: 'eye01-noir',
  },
] as const;

export const HERO_LENS_TINTS = [
  {
    id: 'smoked-amber' as const,
    label: { en: 'Smoked Amber', vi: 'Hổ Phách Khói' },
    hex: '#B86B2B',
    attenuationHex: '#8E4B18',
    opacity: 0.78,
  },
  {
    id: 'obsidian-polarized' as const,
    label: { en: 'Obsidian Polarized', vi: 'Đen Phân Cực' },
    hex: '#1D2024',
    attenuationHex: '#101215',
    opacity: 0.88,
  },
  {
    id: 'olive-mineral' as const,
    label: { en: 'Olive Mineral', vi: 'Ô-liu Khoáng' },
    hex: '#465B48',
    attenuationHex: '#2B3B2D',
    opacity: 0.8,
  },
  {
    id: 'rose-quartz' as const,
    label: { en: 'Rose Quartz', vi: 'Thạch Anh Hồng' },
    hex: '#C67F79',
    attenuationHex: '#94534E',
    opacity: 0.74,
  },
] as const;

export const CATALOG: Product[] = [
  // ================= OUTERWEAR (3) =================
  {
    id: 'mv-out-01',
    sku: 'MV-OUT-01',
    category: 'Outerwear',
    name: {
      en: 'Atelier Architectural Trench',
      vi: 'Áo Khoác Trench Kiến Trúc Atelier',
    },
    subtitle: {
      en: 'Bonded Italian Cotton Gabardine',
      vi: 'Vải Gabardine Cotton Ý Ép Lớp',
    },
    description: {
      en: 'Sculpted raglan silhouette engineered with storm-flap cantilevered geometry, horn closures, and water-repellent double-faced Milanese gabardine.',
      vi: 'Phom dáng raglan điêu khắc với cấu trúc vạt chắn gió hẫng kiến trúc, khuy sừng tự nhiên và vải gabardine hai mặt chống thấm từ Milan.',
    },
    provenance: {
      en: 'Cut & finished in 3rd Arrondissement, Paris. Fabric milled in Biella, Italy.',
      vi: 'Cắt may hoàn thiện tại Quận 3, Paris. Vải dệt thủ công tại Biella, Ý.',
    },
    careGuide: {
      en: 'Specialist dry clean only. Steam vertically at low heat. Store on sculpted cedar hanger.',
      vi: 'Giặt khô chuyên dụng. Là hơi nước thẳng đứng nhiệt độ thấp. Treo trên móc gỗ tuyết tùng.',
    },
    materialSpec: {
      en: '100% Organic Double-Twill Cotton · 340 GSM · Horn Hardware',
      vi: '100% Cotton Chéo Hữu Cơ Hai Mặt · 340 GSM · Khuy Sừng Tự Nhiên',
    },
    priceUsd: 890,
    sizes: ['XS', 'S', 'M', 'L'],
    colorways: [
      {
        id: 'out01-sand',
        name: { en: 'Limestone Sand', vi: 'Cát Đá Vôi' },
        family: 'Sand',
        hex: '#C7B8A1',
        secondaryHex: '#A7967E',
        accentHex: '#6F614E',
      },
      {
        id: 'out01-olive',
        name: { en: 'Deep Moss Olive', vi: 'Ô-liu Rêu Sâu' },
        family: 'Olive',
        hex: '#3E4C40',
        secondaryHex: '#2B362D',
        accentHex: '#7A8C7C',
      },
      {
        id: 'out01-noir',
        name: { en: 'Obsidian Ink', vi: 'Đen Mực' },
        family: 'Obsidian',
        hex: '#1E1F22',
        secondaryHex: '#121316',
        accentHex: '#5A5C63',
      },
    ],
    stock: 7,
    isNew: true,
    featuredRank: 2,
    editionStamp: 'AW26 · PLATE 01',
    silhouetteKey: 'trench',
  },
  {
    id: 'mv-out-02',
    sku: 'MV-OUT-02',
    category: 'Outerwear',
    name: {
      en: 'Brutalist Wool-Cashmere Overcoat',
      vi: 'Áo Măng-tô Len Cashmere Brutalist',
    },
    subtitle: {
      en: 'Unlined Double-Faced 620 GSM Melange',
      vi: 'Len Hai Mặt Không Lót 620 GSM',
    },
    description: {
      en: 'Monolithic floor-grazing overcoat constructed with hand-felled invisible seams, sharp architectural peak lapels, and substantial drape.',
      vi: 'Áo măng-tô dáng dài nguyên khối với đường may giấu chỉ thủ công, ve áo nhọn sắc nét và độ rũ trọng lượng cao.',
    },
    provenance: {
      en: 'Hand-sewn seams in Antwerp Atelier. Mongolian cashmere & virgin merino blend.',
      vi: 'Khâu tay hoàn thiện tại Atelier Antwerp. Pha trộn cashmere Mông Cổ và len merino nguyên sinh.',
    },
    careGuide: {
      en: 'Brush lightly with horsehair brush after wear. Dry clean once per season.',
      vi: 'Chải nhẹ bằng bàn chải lông ngựa sau khi mặc. Giặt khô một lần mỗi mùa.',
    },
    materialSpec: {
      en: '85% Virgin Merino Wool · 15% Grade-A Cashmere · 620 GSM',
      vi: '85% Len Merino Nguyên Sinh · 15% Cashmere Hạng A · 620 GSM',
    },
    priceUsd: 1240,
    sizes: ['XS', 'S', 'M', 'L'],
    colorways: [
      {
        id: 'out02-sienna',
        name: { en: 'Terracotta Sienna', vi: 'Đất Nung Sienna' },
        family: 'Sienna',
        hex: '#9E462B',
        secondaryHex: '#7A331E',
        accentHex: '#D07C5D',
      },
      {
        id: 'out02-noir',
        name: { en: 'Charcoal Obsidian', vi: 'Than Đen' },
        family: 'Obsidian',
        hex: '#222225',
        secondaryHex: '#151518',
        accentHex: '#62626A',
      },
      {
        id: 'out02-sand',
        name: { en: 'Alabaster Chalk', vi: 'Thạch Cao Kem' },
        family: 'Sand',
        hex: '#DDD4C6',
        secondaryHex: '#C2B7A7',
        accentHex: '#887D6E',
      },
    ],
    stock: 4,
    featuredRank: 4,
    editionStamp: 'AW26 · ARCHIVE',
    silhouetteKey: 'overcoat',
  },
  {
    id: 'mv-out-03',
    sku: 'MV-OUT-03',
    category: 'Outerwear',
    name: {
      en: 'Nocturne Raw-Silk Tailored Blazer',
      vi: 'Áo Blazer Lụa Thô May Đo Nocturne',
    },
    subtitle: {
      en: 'Structured Half-Canvas Bourette Silk',
      vi: 'Lụa Bourette Dựng Canh Nửa Thân',
    },
    description: {
      en: 'Elongated architectural jacket with squared shoulders, single recessed horn button, and slubbed raw-silk texture catching low evening light.',
      vi: 'Áo khoác dáng dài với cầu vai vuông kiến trúc, một khuy sừng âm và kết cấu lụa thô bắt sáng tinh tế dưới ánh đèn đêm.',
    },
    provenance: {
      en: 'Tailored in Como & Paris. Cupro Bemberg half-lining.',
      vi: 'May đo tại Como & Paris. Lớp lót lụa Cupro Bemberg thoáng khí.',
    },
    careGuide: {
      en: 'Dry clean only using hydrocarbon process. Avoid direct iron contact.',
      vi: 'Chỉ giặt khô dung môi nhẹ. Tránh tiếp xúc mặt bàn là trực tiếp.',
    },
    materialSpec: {
      en: '100% Raw Bourette Silk · Cupro Lining · Canvas Chest Piece',
      vi: '100% Lụa Thô Bourette · Lót Cupro · Dựng Canh Ngực Thủ Công',
    },
    priceUsd: 760,
    sizes: ['XS', 'S', 'M', 'L'],
    colorways: [
      {
        id: 'out03-noir',
        name: { en: 'Nocturne Black', vi: 'Đen Đêm' },
        family: 'Obsidian',
        hex: '#191A1E',
        secondaryHex: '#0F1013',
        accentHex: '#B89B6C',
      },
      {
        id: 'out03-olive',
        name: { en: 'Cypress Slate', vi: 'Xanh Bách Đá' },
        family: 'Olive',
        hex: '#36453A',
        secondaryHex: '#253128',
        accentHex: '#8A9A8E',
      },
    ],
    stock: 9,
    isNew: true,
    featuredRank: 5,
    editionStamp: 'SALON · 03',
    silhouetteKey: 'blazer',
  },

  // ================= EYEWEAR (3) =================
  {
    id: 'mv-eye-01',
    sku: 'MV-EYE-01',
    category: 'Eyewear',
    name: {
      en: 'VÉRA-01 Monolith Titanium Frame',
      vi: 'Kính Titan Nguyên Khối VÉRA-01',
    },
    subtitle: {
      en: 'CNC-Milled Grade-5 Japanese Titanium',
      vi: 'Titan Nhật Bản Cấp 5 Phay CNC',
    },
    description: {
      en: 'Our flagship architectural optical frame. Milled from a solid 4mm beta-titanium billet in Sabae with zero-solder bridge geometry and CR-39 anti-reflective mineral lenses.',
      vi: 'Mẫu kính kiến trúc biểu tượng của Maison. Phay nguyên khối từ phôi beta-titanium 4mm tại Sabae với cầu kính không mối hàn và tròng quang học CR-39 chống chói.',
    },
    provenance: {
      en: 'Precision CNC milled & hand-brushed in Sabae, Fukui Prefecture, Japan.',
      vi: 'Phay CNC chính xác và đánh xước thủ công tại Sabae, tỉnh Fukui, Nhật Bản.',
    },
    careGuide: {
      en: 'Rinse with lukewarm water, buff dry with included Belgian linen cloth.',
      vi: 'Rửa nhẹ bằng nước ấm, lau khô bằng khăn vải lanh Bỉ đi kèm.',
    },
    materialSpec: {
      en: '100% Grade-5 Japanese Titanium · 18.4g Chassis · UV400 CR-39 Lens',
      vi: '100% Titan Nhật Cấp 5 · Trọng Lượng 18.4g · Tròng CR-39 UV400',
    },
    priceUsd: 480,
    sizes: ['OS'],
    colorways: [
      {
        id: 'eye01-titan',
        name: { en: 'Raw Titanium / Smoked Amber', vi: 'Titan Nguyên Bản / Hổ Phách' },
        family: 'Titanium',
        hex: '#C4C2BC',
        secondaryHex: '#9A9891',
        accentHex: '#B86B2B',
      },
      {
        id: 'eye01-gold',
        name: { en: 'Warm Gold / Olive Mineral', vi: 'Vàng Champagne / Ô-liu' },
        family: 'Gold',
        hex: '#D1AE6F',
        secondaryHex: '#A68649',
        accentHex: '#465B48',
      },
      {
        id: 'eye01-noir',
        name: { en: 'Matte Noir / Obsidian Polarized', vi: 'Đen Nhám / Đen Phân Cực' },
        family: 'Obsidian',
        hex: '#1E2024',
        secondaryHex: '#101114',
        accentHex: '#4A4D56',
      },
    ],
    stock: 11,
    isNew: true,
    featuredRank: 1,
    editionStamp: 'HERO · SABAE 01',
    silhouetteKey: 'monolith-frame',
  },
  {
    id: 'mv-eye-02',
    sku: 'MV-EYE-02',
    category: 'Eyewear',
    name: {
      en: 'Solaire Sculpted Bridge Shield',
      vi: 'Kính Mát Cầu Nổi Solaire',
    },
    subtitle: {
      en: 'Architectural Double-Bar Titanium & Zeiss Lens',
      vi: 'Gọng Kép Titan & Tròng Zeiss Nguyên Tấm',
    },
    description: {
      en: 'Aerodynamic travel eyewear pairing an architectural brushed titanium brow-bar with curved gradient nylon sun lenses for high-glare transit.',
      vi: 'Thiết kế kính du hành khí động học kết hợp thanh cầu titan đánh xước và tròng kính cong chuyển sắc cho môi trường ánh sáng gắt.',
    },
    provenance: {
      en: 'Engineered in Paris, forged in Sabae, fitted with German Zeiss optics.',
      vi: 'Thiết kế tại Paris, chế tác tại Sabae, lắp tròng quang học Zeiss Đức.',
    },
    careGuide: {
      en: 'Store inside molded saddle-leather vault case between wears.',
      vi: 'Bảo quản trong hộp da yên ngựa đúc khuôn khi không sử dụng.',
    },
    materialSpec: {
      en: 'Beta-Titanium Bar · Zeiss Nylon Base-4 Shield · 21g',
      vi: 'Thanh Beta-Titanium · Tròng Zeiss Nylon Base-4 · 21g',
    },
    priceUsd: 420,
    sizes: ['OS'],
    colorways: [
      {
        id: 'eye02-gold',
        name: { en: 'Brushed Champagne / Espresso', vi: 'Vàng Xước / Espresso' },
        family: 'Gold',
        hex: '#CDB07A',
        secondaryHex: '#9C814E',
        accentHex: '#4A3425',
      },
      {
        id: 'eye02-titan',
        name: { en: 'Raw Steel / Smoked Grey', vi: 'Thép Mờ / Xám Khói' },
        family: 'Titanium',
        hex: '#AEB0B4',
        secondaryHex: '#7B7E84',
        accentHex: '#2B2F36',
      },
    ],
    stock: 6,
    featuredRank: 6,
    editionStamp: 'TRANSIT · 02',
    silhouetteKey: 'solaire-shield',
  },
  {
    id: 'mv-eye-03',
    sku: 'MV-EYE-03',
    category: 'Eyewear',
    name: {
      en: 'Archival Acetate Optical 04',
      vi: 'Kính Gọng Acetate Lưu Trữ 04',
    },
    subtitle: {
      en: '8mm Cured Takiron Cellulose Acetate',
      vi: 'Acetate Cellulose Takiron 8mm Ủ Lão Hóa',
    },
    description: {
      en: 'Hand-beveled geometric optical frame carved from 8mm Japanese cellulose acetate with custom exposed titanium core-wire.',
      vi: 'Gọng kính hình học vát cạnh thủ công từ tấm acetate Nhật Bản dày 8mm cùng lõi titan chạm khắc lộ thiên.',
    },
    provenance: {
      en: 'Hand-tumbled in bamboo chips for 72 hours in Fukui, Japan.',
      vi: 'Đánh bóng 72 giờ trong vụn tre tự nhiên tại Fukui, Nhật Bản.',
    },
    careGuide: {
      en: 'Prescription ready. Avoid prolonged dashboard heat above 55C.',
      vi: 'Sẵn sàng lắp tròng cận/loạn. Tránh nhiệt độ cao trên 55°C.',
    },
    materialSpec: {
      en: '8mm Takiron Acetate · 5-Barrel Titanium Hinge · Blue-Light AR Lens',
      vi: 'Acetate Takiron 8mm · Bản Lề Titan 5 Chấu · Tròng Lọc Ánh Sáng Xanh',
    },
    priceUsd: 360,
    sizes: ['OS'],
    colorways: [
      {
        id: 'eye03-sienna',
        name: { en: 'Smoked Tortoise Sienna', vi: 'Đồi Mồi Khói Sienna' },
        family: 'Sienna',
        hex: '#8C4327',
        secondaryHex: '#592815',
        accentHex: '#D1A064',
      },
      {
        id: 'eye03-noir',
        name: { en: 'Piano Obsidian', vi: 'Đen Piano' },
        family: 'Obsidian',
        hex: '#191A1D',
        secondaryHex: '#0C0D0F',
        accentHex: '#C5C3BC',
      },
    ],
    stock: 8,
    featuredRank: 9,
    editionStamp: 'OPTICAL · 04',
    silhouetteKey: 'archival-optical',
  },

  // ================= LEATHER GOODS (2) =================
  {
    id: 'mv-lth-01',
    sku: 'MV-LTH-01',
    category: 'Leather Goods',
    name: {
      en: 'Monolith Box-Calf Architectural Tote',
      vi: 'Túi Tote Kiến Trúc Da Bê Box-Calf',
    },
    subtitle: {
      en: 'Full-Grain French Box Calfskin · Hand Edge-Painted',
      vi: 'Da Bê Pháp Nguyên Tấm · Sơn Cạnh Thủ Công',
    },
    description: {
      en: 'Self-standing architectural carryall engineered with folded origami gussets, raw suede interior pocket, and accommodates up to a 16-inch studio workstation.',
      vi: 'Túi xách đứng phom kiến trúc với nếp gấp origami tinh xảo, ngăn da lộn bên trong, vừa vặn máy trạm 16 inch.',
    },
    provenance: {
      en: 'Saddle-stitched in Ubrique, Spain using French Tanneries du Puy calfskin.',
      vi: 'Khâu yên ngựa tại Ubrique, Tây Ban Nha bằng da bê Tanneries du Puy của Pháp.',
    },
    careGuide: {
      en: 'Condition biannually with neutral beeswax balm. Store stuffed in cotton dustbag.',
      vi: 'Dưỡng da 6 tháng/lần bằng sáp ong trung tính. Cất trong túi vải cotton đi kèm.',
    },
    materialSpec: {
      en: 'French Box-Calf Leather · Brushed Palladium Feet · 41 × 32 × 14 cm',
      vi: 'Da Bê Box-Calf Pháp · Đế Palladium Xước · 41 × 32 × 14 cm',
    },
    priceUsd: 1180,
    sizes: ['OS'],
    colorways: [
      {
        id: 'lth01-noir',
        name: { en: 'Matte Obsidian Calf', vi: 'Da Bê Đen Mờ' },
        family: 'Obsidian',
        hex: '#1C1C1F',
        secondaryHex: '#111113',
        accentHex: '#B6A281',
      },
      {
        id: 'lth01-sienna',
        name: { en: 'Saddle Terracotta', vi: 'Nâu Yên Ngựa' },
        family: 'Sienna',
        hex: '#9B4829',
        secondaryHex: '#71321B',
        accentHex: '#D8B78E',
      },
      {
        id: 'lth01-sand',
        name: { en: 'Warm Greige', vi: 'Xám Cát Ấm' },
        family: 'Sand',
        hex: '#B8AEA0',
        secondaryHex: '#93897C',
        accentHex: '#4E473F',
      },
    ],
    stock: 5,
    isNew: true,
    featuredRank: 3,
    editionStamp: 'LEATHER · 01',
    silhouetteKey: 'architectural-tote',
  },
  {
    id: 'mv-lth-02',
    sku: 'MV-LTH-02',
    category: 'Leather Goods',
    name: {
      en: 'Nomad Full-Grain Weekender 48H',
      vi: 'Túi Du Hành 48H Da Nguyên Hạt Nomad',
    },
    subtitle: {
      en: 'Vegetable-Tanned Tuscan Bridle Leather',
      vi: 'Da Thuộc Thảo Mộc Tuscany Cao Cấp',
    },
    description: {
      en: 'Cabin-compliant 48-hour transit vessel with architectural bridge handles, custom solid brass Riri zipper, and detachable padded shoulder harness.',
      vi: 'Túi hành lý xách tay cabin 48 giờ với quai cầu kiến trúc, khóa kéo Riri đồng nguyên khối và dây đeo vai đệm tháo rời.',
    },
    provenance: {
      en: 'Crafted in Florence, Italy. Patinates deeply with flight mileage.',
      vi: 'Chế tác thủ công tại Florence, Ý. Lên nước màu patina sâu sắc theo thời gian.',
    },
    careGuide: {
      en: 'Wipe with dry chamois after rain. Patina marks buff gently with fingertips.',
      vi: 'Lau khô bằng khăn da cừu khi gặp mưa. Xoa nhẹ bề mặt để làm đều nước da.',
    },
    materialSpec: {
      en: 'Tuscan Vegetable-Tanned Leather · Riri Brass Zip · 52 × 28 × 24 cm',
      vi: 'Da Thuộc Thảo Mộc Tuscany · Khóa Đồng Riri · 52 × 28 × 24 cm',
    },
    priceUsd: 1450,
    sizes: ['OS'],
    colorways: [
      {
        id: 'lth02-olive',
        name: { en: 'Forest Moss', vi: 'Rêu Rừng Sâu' },
        family: 'Olive',
        hex: '#364538',
        secondaryHex: '#232E25',
        accentHex: '#C8A972',
      },
      {
        id: 'lth02-noir',
        name: { en: 'Carbon Black', vi: 'Đen Carbon' },
        family: 'Obsidian',
        hex: '#1E1F22',
        secondaryHex: '#121316',
        accentHex: '#9C968A',
      },
      {
        id: 'lth02-sienna',
        name: { en: 'Cognac Brick', vi: 'Nâu Gạch Cognac' },
        family: 'Sienna',
        hex: '#9A4B2B',
        secondaryHex: '#6F331B',
        accentHex: '#D8B888',
      },
    ],
    stock: 3,
    featuredRank: 7,
    editionStamp: 'TRANSIT · 48H',
    silhouetteKey: 'weekender-48h',
  },

  // ================= OBJECTS (2) =================
  {
    id: 'mv-obj-01',
    sku: 'MV-OBJ-01',
    category: 'Objects',
    name: {
      en: 'Cast Travertine & Bronze Incense Vessel',
      vi: 'Lư Trầm Đá Travertine & Đồng Đúc',
    },
    subtitle: {
      en: 'Honed Roman Travertine · Sand-Cast Bronze Dome',
      vi: 'Đá Travertine La Mã Mài Mờ · Nắp Đồng Đúc Cát',
    },
    description: {
      en: 'Sculptural acoustic chamber milled from porous Roman travertine and crowned with a heavy perforated bronze dome that diffuses temple smoke into silent vertical ribbons.',
      vi: 'Tác phẩm nội thất điêu khắc từ đá travertine La Mã nguyên khối kết hợp nắp đồng đúc cát đục lỗ, tán hương khói thành dải dọc tĩnh lặng.',
    },
    provenance: {
      en: 'Quarried in Tivoli, Italy. Bronze sand-cast in Kyoto foundry.',
      vi: 'Khai thác đá tại Tivoli, Ý. Đúc đồng thủ công tại xưởng đúc Kyoto.',
    },
    careGuide: {
      en: 'Empty cooled ash cleanly; never use acidic cleansers on honed travertine.',
      vi: 'Đổ tro sau khi nguội; không dùng chất tẩy rửa có tính axit lên đá travertine.',
    },
    materialSpec: {
      en: 'Solid Roman Travertine · Sand-Cast Bronze · 1.85 kg',
      vi: 'Đá Travertine La Mã Nguyên Khối · Đồng Đúc Cát · 1.85 kg',
    },
    priceUsd: 290,
    sizes: ['OS'],
    colorways: [
      {
        id: 'obj01-sand',
        name: { en: 'Honed Travertine / Aged Bronze', vi: 'Đá Travertine / Đồng Cổ' },
        family: 'Sand',
        hex: '#D4C8B4',
        secondaryHex: '#B3A48D',
        accentHex: '#8C6A3E',
      },
      {
        id: 'obj01-noir',
        name: { en: 'Basalt Black / Smoked Brass', vi: 'Đá Bazan Đen / Đồng Khói' },
        family: 'Obsidian',
        hex: '#2B2B2E',
        secondaryHex: '#1A1A1D',
        accentHex: '#B79764',
      },
    ],
    stock: 14,
    featuredRank: 8,
    editionStamp: 'OBJECT · 01',
    silhouetteKey: 'bronze-vessel',
  },
  {
    id: 'mv-obj-02',
    sku: 'MV-OBJ-02',
    category: 'Objects',
    name: {
      en: 'Brushed Steel Desk Monolith Tray',
      vi: 'Khay Bàn Nguyên Khối Thép Xước',
    },
    subtitle: {
      en: 'Machined 316L Architectural Stainless Billet',
      vi: 'Phay Nguyên Khối Thép Không Gỉ 316L',
    },
    description: {
      en: 'Heavyweight valet tray CNC-milled from a single billet of marine-grade 316L steel with cork acoustic underside for watches, keys, and eyewear.',
      vi: 'Khay để đồ trọng lượng nặng phay CNC từ một khối thép 316L duy nhất cùng đế bần giảm chấn cho đồng hồ, chìa khóa và kính mắt.',
    },
    provenance: {
      en: 'Machined in Zurich, numbered edition of 250 pieces.',
      vi: 'Gia công chính xác tại Zurich, phiên bản đánh số giới hạn 250 chiếc.',
    },
    careGuide: {
      en: 'Wipe with microfiber along the linear brush grain.',
      vi: 'Lau bằng khăn sợi mịn dọc theo thớ xước tuyến tính.',
    },
    materialSpec: {
      en: '316L Solid Stainless Steel · Natural Cork Footing · 1.4 kg',
      vi: 'Thép 316L Nguyên Khối · Đế Bần Tự Nhiên · 1.4 kg',
    },
    priceUsd: 220,
    sizes: ['OS'],
    colorways: [
      {
        id: 'obj02-titan',
        name: { en: 'Linear Brushed Steel', vi: 'Thép Xước Tuyến Tính' },
        family: 'Titanium',
        hex: '#BFC2C7',
        secondaryHex: '#8E9299',
        accentHex: '#4E5158',
      },
      {
        id: 'obj02-gold',
        name: { en: 'Champagne PVD Brass', vi: 'Đồng Champagne PVD' },
        family: 'Gold',
        hex: '#CBB17D',
        secondaryHex: '#9C8352',
        accentHex: '#594A2E',
      },
    ],
    stock: 0,
    featuredRank: 12,
    editionStamp: 'ARCHIVE · SOLD OUT',
    silhouetteKey: 'steel-tray',
  },

  // ================= FRAGRANCE (2) =================
  {
    id: 'mv-frg-01',
    sku: 'MV-FRG-01',
    category: 'Fragrance',
    name: {
      en: 'N°01 Hinoki & Wet Concrete Extrait',
      vi: 'Nước Hoa N°01 Gỗ Hinoki & Bê Tông Ẩm',
    },
    subtitle: {
      en: '32% Extrait de Parfum · 100ml Apothecary Flacon',
      vi: 'Tinh Dầu 32% Extrait · Chai Thủy Tinh 100ml',
    },
    description: {
      en: 'Architectural woody-mineral composition opening with Japanese hinoki cypress, cold rain on limestone, Haitian vetiver, and dry frankincense smoke.',
      vi: 'Bản phối hương gỗ-khoáng kiến trúc mở đầu bằng bách Hinoki Nhật, mùi mưa lạnh trên đá vôi, cỏ hương bài Haiti và khói trầm khô.',
    },
    provenance: {
      en: 'Compounded & macerated for 12 weeks in Grasse, France.',
      vi: 'Điều chế và ủ chín hương 12 tuần tại Grasse, Pháp.',
    },
    careGuide: {
      en: 'Store upright away from direct UV light. Heavy magnetic travertine cap.',
      vi: 'Bảo quản thẳng đứng tránh ánh nắng trực tiếp. Nắp nam châm đá travertine.',
    },
    materialSpec: {
      en: '100ml / 3.4 fl.oz · 32% Concentration · Magnetic Stone Cap',
      vi: '100ml / 3.4 fl.oz · Nồng Độ 32% · Nắp Đá Nam Châm',
    },
    priceUsd: 310,
    sizes: ['OS'],
    colorways: [
      {
        id: 'frg01-olive',
        name: { en: 'Clear Mineral Flacon', vi: 'Chai Khoáng Trong' },
        family: 'Olive',
        hex: '#607160',
        secondaryHex: '#3E4B3E',
        accentHex: '#D8CEBE',
      },
      {
        id: 'frg01-sand',
        name: { en: 'Frosted Alabaster Edition', vi: 'Phiên Bản Thạch Cao Mờ' },
        family: 'Sand',
        hex: '#D5CBB9',
        secondaryHex: '#B2A690',
        accentHex: '#3E4B3E',
      },
    ],
    stock: 18,
    isNew: true,
    featuredRank: 10,
    editionStamp: 'GRASSE · N°01',
    silhouetteKey: 'hinoki-extrait',
  },
  {
    id: 'mv-frg-02',
    sku: 'MV-FRG-02',
    category: 'Fragrance',
    name: {
      en: 'N°04 Smoked Fig & Saddle Leather',
      vi: 'Nước Hoa N°04 Sung Khói & Da Yên Ngựa',
    },
    subtitle: {
      en: '30% Extrait de Parfum · 100ml Smoked Glass',
      vi: 'Tinh Dầu 30% Extrait · Chai Thủy Tinh Khói 100ml',
    },
    description: {
      en: 'Velvety nocturnal study balancing black fig leaf, roasted cardamom, supple Tuscan saddle leather, and warm labdanum resin.',
      vi: 'Tổ hợp hương đêm sâu lắng cân bằng giữa lá sung đen, bạch đậu khấu rang, da yên ngựa Tuscany và nhựa thơm labdanum ấm áp.',
    },
    provenance: {
      en: 'Hand-poured & batch-stamped in Grasse, France.',
      vi: 'Chiết rót thủ công và đóng dấu số lô tại Grasse, Pháp.',
    },
    careGuide: {
      en: 'Apply to pulse points. Refillable atomizer collar.',
      vi: 'Xịt lên các điểm mạch đập. Cổ chai cho phép nạp lại tinh dầu.',
    },
    materialSpec: {
      en: '100ml / 3.4 fl.oz · 30% Concentration · Smoked Obsidian Glass',
      vi: '100ml / 3.4 fl.oz · Nồng Độ 30% · Thủy Tinh Khói Obsidian',
    },
    priceUsd: 340,
    sizes: ['OS'],
    colorways: [
      {
        id: 'frg02-sienna',
        name: { en: 'Amber Smoked Flacon', vi: 'Chai Hổ Phách Khói' },
        family: 'Sienna',
        hex: '#9A4B2B',
        secondaryHex: '#692E17',
        accentHex: '#D8B889',
      },
      {
        id: 'frg02-noir',
        name: { en: 'Nocturne Black Flacon', vi: 'Chai Đen Nocturne' },
        family: 'Obsidian',
        hex: '#222226',
        secondaryHex: '#111114',
        accentHex: '#C7A670',
      },
    ],
    stock: 12,
    featuredRank: 11,
    editionStamp: 'GRASSE · N°04',
    silhouetteKey: 'fig-extrait',
  },
];

export const PRODUCT_BY_ID: Record<string, Product> = Object.fromEntries(
  CATALOG.map((item) => [item.id, item])
);
