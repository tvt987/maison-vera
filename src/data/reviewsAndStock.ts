import type { LocalizedText, ProductCategory } from '../types/commerce';

export interface CollectorReview {
  id: string;
  author: string;
  city: string;
  serialTag: string;
  rating: 5 | 4.9 | 4.8;
  date: string;
  fitRating: 'fitted' | 'true' | 'relaxed';
  headline: LocalizedText;
  body: LocalizedText;
}

export interface BoutiqueAvailability {
  city: LocalizedText;
  boutiqueName: LocalizedText;
  address: string;
  status: 'in-boutique' | 'last-piece' | 'by-appointment' | 'waitlist';
}

export interface ProductAuthenticityData {
  averageRating: number;
  reviewCount: number;
  fitConsensusPercent: number; // 0 = Fitted, 50 = True to Size, 100 = Relaxed
  reviews: CollectorReview[];
  boutiques: BoutiqueAvailability[];
}

const REVIEWS_BY_CATEGORY: Record<ProductCategory, CollectorReview[]> = {
  Eyewear: [
    {
      id: 'rev-eye-1',
      author: 'Alexandre D.',
      city: 'Paris',
      serialTag: 'VERIFIED · #042/250',
      rating: 5,
      date: '2026-10-18',
      fitRating: 'true',
      headline: {
        en: 'Featherweight titanium balance you forget is on your face.',
        vi: 'Độ cân bằng titan nhẹ đến mức gần như quên đang đeo kính.',
      },
      body: {
        en: 'The chamfered 4mm titanium rims catch afternoon light without glare. Zero bridge solder lines and the smoked amber CR-39 optics sharpen architectural contrast remarkably.',
        vi: 'Đường vát cạnh titan 4mm bắt sáng chiều vô cùng tinh tế. Cầu kính nguyên khối không mối hàn và tròng CR-39 hổ phách giúp tăng độ tương phản sắc nét.',
      },
    },
    {
      id: 'rev-eye-2',
      author: 'Minh Khoa N.',
      city: 'Ho Chi Minh City',
      serialTag: 'VERIFIED · #118/250',
      rating: 5,
      date: '2026-11-04',
      fitRating: 'true',
      headline: {
        en: 'Sabae CNC finish rivals bespoke Japanese optical houses.',
        vi: 'Hoàn thiện CNC Sabae ngang tầm các nhà quang học thủ công Nhật Bản.',
      },
      body: {
        en: 'Ordered with 24K gold foil monogram on the presentation vault. The 5-barrel hinge tension feels like a mechanical timepiece.',
        vi: 'Đặt kèm ép kim vàng 24K trên hộp đựng. Độ đầm của bản lề 5 chấu mang lại cảm giác cơ khí chuẩn xác như đồng hồ Thụy Sĩ.',
      },
    },
  ],
  Outerwear: [
    {
      id: 'rev-out-1',
      author: 'Claire M.',
      city: 'Lyon',
      serialTag: 'VERIFIED · #019/120',
      rating: 5,
      date: '2026-10-29',
      fitRating: 'relaxed',
      headline: {
        en: 'Architectural drape that holds its volume through rain.',
        vi: 'Độ rũ kiến trúc giữ nguyên phom dáng ngay cả trong thời tiết mưa.',
      },
      body: {
        en: 'The Biella weave has substantial hand-feel without stiffness. Shoulder geometry frames knitwear cleanly while maintaining a sculptural silhouette.',
        vi: 'Thớ vải Biella dày dặn, cầm chắc tay nhưng không hề cứng. Cầu vai tạo phom kiến trúc sắc nét ngay cả khi phối cùng áo len dày bên trong.',
      },
    },
    {
      id: 'rev-out-2',
      author: 'Kenji T.',
      city: 'Tokyo',
      serialTag: 'VERIFIED · #067/120',
      rating: 4.9,
      date: '2026-11-12',
      fitRating: 'true',
      headline: {
        en: 'Precision horn closures and invisible hand-felled seams.',
        vi: 'Khuy sừng tự nhiên tinh xảo và đường may giấu chỉ hoàn hảo.',
      },
      body: {
        en: 'Used the atelier height/weight estimator and received an exact architectural fit right out of the wax-sealed parcel.',
        vi: 'Sử dụng công cụ ước tính kích cỡ của xưởng và nhận được phom áo vừa vặn hoàn hảo ngay khi mở kiện hàng niêm phong sáp.',
      },
    },
  ],
  'Leather Goods': [
    {
      id: 'rev-lth-1',
      author: 'Sophie V.',
      city: 'Geneva',
      serialTag: 'VERIFIED · #031/100',
      rating: 5,
      date: '2026-10-22',
      fitRating: 'true',
      headline: {
        en: 'Self-standing box calfskin with zero sag under a 16-inch MacBook.',
        vi: 'Da bê hộp đứng phom hoàn hảo, không hề bị xệ khi đựng laptop 16 inch.',
      },
      body: {
        en: 'Edge painting is glass-smooth across the folded origami gussets. Fits studio essentials, eyewear vault, and boarding documents effortlessly.',
        vi: 'Lớp sơn cạnh mịn như gương dọc theo nếp gấp origami. Đựng trọn bộ đồ công việc, hộp kính và giấy tờ bay rất gọn gàng.',
      },
    },
    {
      id: 'rev-lth-2',
      author: 'Hoang Nam P.',
      city: 'Saigon',
      serialTag: 'VERIFIED · #054/100',
      rating: 4.9,
      date: '2026-11-09',
      fitRating: 'true',
      headline: {
        en: 'Vegetable-tanned sheen deepens beautifully after three flights.',
        vi: 'Nước da thuộc thảo mộc lên màu patina sâu đẹp sau ba chuyến công tác.',
      },
      body: {
        en: 'Solid brass Riri zipper glides silently. Blind deboss monogram looks subtle and heirloom-grade.',
        vi: 'Khóa đồng Riri trượt êm tuyệt đối. Khắc tên dập chìm không màu rất tinh tế và đậm chất sưu tầm.',
      },
    },
  ],
  Objects: [
    {
      id: 'rev-obj-1',
      author: 'Elena R.',
      city: 'Milan',
      serialTag: 'VERIFIED · #088/250',
      rating: 5,
      date: '2026-10-14',
      fitRating: 'true',
      headline: {
        en: 'Heavy sculptural presence on a travertine console.',
        vi: 'Trọng lượng đầm chắc và tạo hình điêu khắc nổi bật trên bàn đá.',
      },
      body: {
        en: 'The contrast between porous honed stone and Kyoto sand-cast bronze turns everyday desk ritual into gallery architecture.',
        vi: 'Sự tương phản giữa đá mài mờ tự nhiên và đồng đúc cát Kyoto biến góc làm việc thành một không gian triển lãm thu nhỏ.',
      },
    },
    {
      id: 'rev-obj-2',
      author: 'Duc Anh L.',
      city: 'Hanoi',
      serialTag: 'VERIFIED · #112/250',
      rating: 4.8,
      date: '2026-11-01',
      fitRating: 'true',
      headline: {
        en: 'Zero resonance on wood desks thanks to the cork acoustic footing.',
        vi: 'Đặt êm tuyệt đối trên bàn gỗ nhờ lớp đế bần giảm chấn tinh tế.',
      },
      body: {
        en: 'Arrived double-boxed inside custom cotton dustbag. Machining tolerances are crisp to the fingertip.',
        vi: 'Đóng gói hai lớp kèm túi vải cotton riêng. Đường phay sắc nét từng milimet khi chạm tay.',
      },
    },
  ],
  Fragrance: [
    {
      id: 'rev-frg-1',
      author: 'Julien B.',
      city: 'Paris',
      serialTag: 'VERIFIED · BATCH 26-04',
      rating: 5,
      date: '2026-10-25',
      fitRating: 'true',
      headline: {
        en: 'Ten-hour mineral hinoki drydown without synthetic sweetness.',
        vi: 'Lưu hương gỗ hinoki khoáng chất suốt 10 giờ, hoàn toàn không ngọt gắt.',
      },
      body: {
        en: 'The magnetic travertine cap clicks down with reassuring weight. Opens like cold rain on temple limestone and settles into dry smoked vetiver.',
        vi: 'Nắp nam châm đá travertine đóng lại cực kỳ đầm tay. Mở đầu như cơn mưa lạnh trên đá vôi đền cổ và lắng xuống lớp cỏ hương bài khói khô.',
      },
    },
    {
      id: 'rev-frg-2',
      author: 'Thao Vy T.',
      city: 'Ho Chi Minh City',
      serialTag: 'VERIFIED · BATCH 26-09',
      rating: 5,
      date: '2026-11-15',
      fitRating: 'true',
      headline: {
        en: 'True 32% Extrait concentration with gallery-quiet sillage.',
        vi: 'Chuẩn nồng độ 32% Extrait tỏa hương sâu lắng, tinh tế.',
      },
      body: {
        en: 'Two sprays last through evening salon events. The heavy apothecary glass catches golden light like an architectural object.',
        vi: 'Chỉ hai lần xịt đủ giữ hương trọn buổi tiệc tối. Chai thủy tinh dày bắt ánh sáng vàng như một tác phẩm trang trí nội thất.',
      },
    },
  ],
};

export function getProductAuthenticity(
  category: ProductCategory,
  stock: number
): ProductAuthenticityData {
  const isSoldOut = stock <= 0;
  const isLow = stock > 0 && stock <= 4;

  const boutiques: BoutiqueAvailability[] = [
    {
      city: { en: 'Paris', vi: 'Paris' },
      boutiqueName: { en: 'Paris · Le Marais Flagship', vi: 'Paris · Flagship Le Marais' },
      address: '14 Rue des Francs-Bourgeois, 75003',
      status: isSoldOut ? 'waitlist' : isLow ? 'last-piece' : 'in-boutique',
    },
    {
      city: { en: 'Tokyo', vi: 'Tokyo' },
      boutiqueName: { en: 'Tokyo · Aoyama Salon', vi: 'Tokyo · Salon Aoyama' },
      address: '5-7-21 Minami-Aoyama, Minato-ku',
      status: isSoldOut ? 'waitlist' : isLow ? 'by-appointment' : 'in-boutique',
    },
    {
      city: { en: 'Saigon', vi: 'Sài Gòn' },
      boutiqueName: { en: 'Saigon · Dong Khoi Private Suite', vi: 'Sài Gòn · Phòng Riêng Đồng Khởi' },
      address: '88 Dong Khoi, District 1, HCMC',
      status: isSoldOut ? 'waitlist' : 'by-appointment',
    },
    {
      city: { en: 'Global', vi: 'Toàn Cầu' },
      boutiqueName: { en: 'Online Atelier Vault (DHL Express)', vi: 'Kho Trực Tuyến Atelier (DHL Express)' },
      address: '48H Air Dispatch · Wax-Sealed',
      status: isSoldOut ? 'waitlist' : isLow ? 'last-piece' : 'in-boutique',
    },
  ];

  return {
    averageRating: category === 'Objects' ? 4.9 : 4.95,
    reviewCount: category === 'Eyewear' ? 48 : category === 'Outerwear' ? 34 : 26,
    fitConsensusPercent: category === 'Outerwear' ? 58 : 50,
    reviews: REVIEWS_BY_CATEGORY[category],
    boutiques,
  };
}
