import { api } from './api';
import type {
  NewsArticle,
  NewsCategory,
  NewsFilterParams,
  NewsPageResponse,
  NewsSource,
} from '../types/news';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const SAVED_NEWS_STORAGE_KEY = 'finman_saved_news_ids';

const getLocalSavedIds = (): Set<number> => {
  try {
    const raw = localStorage.getItem(SAVED_NEWS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.map((id) => Number(id)).filter((id) => !Number.isNaN(id)));
    }
  } catch {
    // ignore storage errors
  }
  return new Set();
};

const saveLocalSavedIds = (ids: Set<number>): void => {
  try {
    localStorage.setItem(SAVED_NEWS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore storage errors
  }
};

export const DEFAULT_NEWS_CATEGORIES: NewsCategory[] = [
  {
    id: 1,
    code: 'STOCK',
    nameVi: 'Chứng khoán',
    description: 'Tin tức thị trường chứng khoán, doanh nghiệp niêm yết, báo cáo tài chính',
    displayOrder: 1,
  },
  {
    id: 2,
    code: 'MACRO',
    nameVi: 'Kinh tế vĩ mô',
    description: 'Tin tức kinh tế vĩ mô, GDP, CPI, lạm phát, chính sách tiền tệ',
    displayOrder: 2,
  },
  {
    id: 3,
    code: 'BANKING',
    nameVi: 'Ngân hàng & Lãi suất',
    description: 'Thông tin hệ thống ngân hàng, lãi suất tiền gửi, lãi suất vay',
    displayOrder: 3,
  },
  {
    id: 4,
    code: 'INVESTMENT',
    nameVi: 'Đầu tư',
    description: 'Thị trường bất động sản, vàng, ngoại hối, kênh đầu tư tài sản',
    displayOrder: 4,
  },
  {
    id: 5,
    code: 'PERSONAL_FINANCE',
    nameVi: 'Tài chính cá nhân',
    description: 'Kiến thức chi tiêu, tiết kiệm, thuế, quản lý tài chính gia đình',
    displayOrder: 5,
  },
];

export const DEFAULT_NEWS_SOURCES: NewsSource[] = [
  {
    id: 1,
    code: 'VNEXPRESS',
    name: 'VnExpress Kinh Doanh',
    baseUrl: 'https://vnexpress.net/kinh-doanh',
    rssUrl: 'https://vnexpress.net/rss/kinh-doanh.rss',
    isActive: true,
  },
  {
    id: 2,
    code: 'CAFEF',
    name: 'CafeF',
    baseUrl: 'https://cafef.vn',
    rssUrl: 'https://cafef.vn/tai-chinh-ngan-hang.rss',
    isActive: true,
  },
  {
    id: 3,
    code: 'VIETSTOCK',
    name: 'Vietstock',
    baseUrl: 'https://vietstock.vn',
    rssUrl: 'https://vietstock.vn/rss/tai-chinh.rss',
    isActive: true,
  },
  {
    id: 4,
    code: 'NEWSAPI',
    name: 'NewsAPI Global',
    baseUrl: 'https://newsapi.org',
    isActive: true,
  },
];

const hoursAgoIso = (hours: number): string => {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
};

const VCB_BANNER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23064e3b"/><stop offset="50%" stop-color="%2304382a"/><stop offset="100%" stop-color="%23022c22"/></linearGradient><pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="%2310b981" opacity="0.2"/></pattern></defs><rect width="100%" height="100%" fill="url(%23bg)"/><rect width="100%" height="100%" fill="url(%23dots)"/><g transform="translate(600, 240)"><rect x="-210" y="-22" width="420" height="44" rx="22" fill="%23042f24" stroke="%23eab308" stroke-width="2"/><text text-anchor="middle" y="7" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="%23fef08a" letter-spacing="1">VIETCOMBANK CHI NHÁNH TP. HỒ CHÍ MINH</text></g><text x="600" y="340" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="900" fill="%23ffffff" letter-spacing="0.5">LỄ ĐÓN NHẬN HUÂN CHƯƠNG LAO ĐỘNG HẠNG NHẤT</text><text x="600" y="390" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" fill="%23a7f3d0" letter-spacing="1">Kỷ niệm 50 năm thành lập (1976 – 2026)</text></svg>`;

export const FALLBACK_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 100,
    title: 'Vietcombank TP HCM nhận Huân chương Lao động hạng Nhất lần hai',
    description:
      'Tối 15/11, Ngân hàng TMCP Ngoại thương Việt Nam – Chi nhánh TP HCM (Vietcombank TP HCM) long trọng tổ chức lễ kỷ niệm 50 năm thành lập và đón nhận Huân chương Lao động hạng Nhất lần thứ hai do Chủ tịch nước trao tặng.',
    contentSnippet:
      'Tối 15/11, Ngân hàng TMCP Ngoại thương Việt Nam – Chi nhánh TP HCM (Vietcombank TP HCM) long trọng tổ chức lễ kỷ niệm 50 năm thành lập và đón nhận Huân chương Lao động hạng Nhất lần thứ hai do Chủ tịch nước trao tặng.\n\nĐây là phần thưởng cao quý ghi nhận những đóng góp đặc biệt xuất sắc của tập thể cán bộ, nhân viên chi nhánh trong suốt nửa thế kỷ đồng hành cùng sự phát triển kinh tế – xã hội của TP HCM nói riêng và cả nước nói chung.\n\nTrải qua 50 năm xây dựng và trưởng thành, Vietcombank TP HCM luôn giữ vững vai trò là chi nhánh chủ lực hàng đầu trong toàn hệ thống Vietcombank, tiên phong trong chuyển đổi số, tài trợ vốn cho các dự án trọng điểm và thực hiện tốt công tác an sinh xã hội.',
    originalUrl: 'https://vnexpress.net/kinh-doanh/ngan-hang',
    thumbnailUrl: VCB_BANNER_SVG,
    imageCaption: 'Đại diện lãnh đạo trao Huân chương Lao động hạng Nhất cho tập thể Vietcombank TP HCM tối 15/11.',
    author: 'VnExpress Kinh Doanh',
    publishedAt: hoursAgoIso(4),
    sourceId: 1,
    sourceCode: 'VNEXPRESS',
    sourceName: 'VnExpress Kinh Doanh',
    categoryId: 3,
    categoryCode: 'BANKING',
    categoryName: 'Ngân hàng',
    isAiProcessed: true,
    isSaved: false,
    bulletPoints: JSON.stringify([
      'Sự kiện chính: Vietcombank chi nhánh TP HCM vinh dự đón nhận Huân chương Lao động hạng Nhất lần thứ hai.',
      'Bối cảnh: Sự kiện diễn ra vào tối 15/11, nhân dịp kỷ niệm cột mốc 50 năm thành lập chi nhánh.',
      'Tác động: Khẳng định vị thế thương hiệu đầu ngành ngân hàng, tạo tâm lý tích cực nhưng không gây biến động giá đột biến trong ngắn hạn.',
    ]),
    sentiment: 'NEUTRAL',
    sentimentReason:
      '[Dữ kiện bài báo - Fact] Bài viết tường thuật khách quan lễ trao tặng huân chương và cột mốc hoạt động 50 năm của Vietcombank TP HCM.',
    impactAnalysis:
      '[Dữ kiện bài báo - Fact] Bài viết tường thuật khách quan lễ trao tặng huân chương và cột mốc hoạt động 50 năm của Vietcombank TP HCM. | [Nhận định AI - Opinion] Tin tức mang tính củng cố uy tín doanh nghiệp (Brand Equity), phù hợp cho nhà đầu tư nắm giữ dài hạn nhóm ngân hàng. — Hưởng lợi: Nhóm cổ phiếu ngân hàng vốn hóa lớn (VCB, BID, CTG); Chịu rủi ro: Không có.',
    relatedTickers: 'VCB,HCM',
    tags: '#vietcombank,#vcb,#nganhang,#hcm',
  },
  {
    id: 101,
    title: 'VN-Index vượt mốc 1.285 điểm nhờ dòng tiền mạnh chảy vào nhóm ngân hàng và công nghệ',
    description:
      'Thanh khoản toàn thị trường đạt hơn 24.500 tỷ đồng trong phiên giao dịch hôm nay, dẫn dắt bởi đà bứt phá của FPT, VCB và TCB.',
    contentSnippet:
      'Thị trường chứng khoán Việt Nam ghi nhận phiên tăng điểm ấn tượng với sắc xanh lan tỏa trên diện rộng. Nhóm cổ phiếu vốn hóa lớn VN30 tăng hơn 14 điểm, trong đó FPT lập đỉnh lịch sử mới nhờ kỳ vọng doanh thu mảng AI và bán dẫn toàn cầu. Khối ngoại quay lại mua ròng hơn 420 tỷ đồng tập trung vào các mã ngân hàng đầu ngành như VCB, TCB, MBB và nhóm thép HPG.',
    originalUrl: 'https://vnexpress.net/kinh-doanh/chung-khoan',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=900&q=80',
    author: 'Ban Kinh Doanh',
    publishedAt: hoursAgoIso(1),
    sourceId: 1,
    sourceCode: 'VNEXPRESS',
    sourceName: 'VnExpress Kinh Doanh',
    categoryId: 1,
    categoryCode: 'STOCK',
    categoryName: 'Chứng khoán',
    isAiProcessed: true,
    isSaved: false,
    bulletPoints: JSON.stringify([
      'VN-Index tăng vượt 1.285 điểm với thanh khoản bùng nổ đạt 24.500 tỷ đồng.',
      'Khối ngoại đảo chiều mua ròng 420 tỷ đồng, tâm điểm tại FPT, VCB, TCB và HPG.',
      'Tâm lý nhà đầu tư hưng phấn tạo đà tích cực cho danh mục cổ phiếu vốn hóa lớn ngắn hạn.',
    ]),
    sentiment: 'POSITIVE',
    sentimentReason:
      '[Dữ kiện bài báo - Fact] Chỉ số VN-Index vượt ngưỡng kháng cự 1.285 điểm kèm thanh khoản cao và khối ngoại mua ròng.',
    impactAnalysis:
      '[Dữ kiện bài báo - Fact] Dòng tiền tập trung vào nhóm Ngân hàng và Công nghệ | [Nhận định AI - Opinion] Tác động tích cực đến giá trị danh mục đầu tư chứng khoán ngắn hạn — Hưởng lợi: Nhà đầu tư nắm giữ cổ phiếu VN30; Chịu rủi ro: Nhà đầu tư mua đuổi giá cao (FOMO).',
    relatedTickers: 'FPT,VCB,TCB,MBB,HPG',
    tags: '#chungkhoan,#vnindex,#dongtien',
  },
  {
    id: 102,
    title: 'Mặt bằng lãi suất tiết kiệm kỳ hạn 12 tháng nhích tăng tại nhiều ngân hàng thương mại',
    description:
      'Hơn 10 ngân hàng thương mại cổ phần vừa điều chỉnh biểu lãi suất huy động thêm 0,2% - 0,4%/năm nhằm đón đầu nhu cầu tín dụng cuối năm.',
    contentSnippet:
      'Theo thống kê mới nhất, lãi suất huy động kỳ hạn 12 tháng tại nhóm ngân hàng thương mại cổ phần đã lên mức 5,4% - 6,1%/năm. Trong khi đó, nhóm Big4 gồm Vietcombank (VCB), BIDV (BID), VietinBank (CTG) vẫn duy trì mức lãi suất ổn định quanh 4,7% - 5,0%/năm để hỗ trợ lãi suất cho vay doanh nghiệp. Chuyên gia khuyến nghị người gửi tiền cá nhân có thể chia nhỏ kỳ hạn 6 tháng và 12 tháng để tối ưu hóa lợi tức.',
    originalUrl: 'https://cafef.vn/tai-chinh-ngan-hang.chn',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    author: 'Minh Phương',
    publishedAt: hoursAgoIso(3),
    sourceId: 2,
    sourceCode: 'CAFEF',
    sourceName: 'CafeF',
    categoryId: 3,
    categoryCode: 'BANKING',
    categoryName: 'Ngân hàng & Lãi suất',
    isAiProcessed: true,
    isSaved: false,
    bulletPoints: JSON.stringify([
      'Hơn 10 ngân hàng điều chỉnh tăng lãi suất tiết kiệm thêm 0,2% - 0,4%/năm ở kỳ hạn 6-12 tháng.',
      'Mức lãi suất huy động kỳ hạn 12 tháng phổ biến đạt từ 5,4% đến 6,1%/năm.',
      'Người có tiền nhàn rỗi hưởng lợi trực tiếp khi tái cơ cấu khoản tiền tiết kiệm sang kỳ hạn trung hạn.',
    ]),
    sentiment: 'NEUTRAL',
    sentimentReason:
      '[Dữ kiện bài báo - Fact] Lãi suất huy động nhích tăng có lợi cho người gửi tiết kiệm nhưng tạo áp lực nhẹ lên chi phí vốn vay.',
    impactAnalysis:
      '[Dữ kiện bài báo - Fact] Lãi suất kỳ hạn 12 tháng đạt 5,4% - 6,1%/năm | [Nhận định AI - Opinion] Cơ hội gia tăng thu nhập thụ động cho quỹ dự phòng cá nhân — Hưởng lợi: Người gửi tiết kiệm; Chịu rủi ro: Người vay mua nhà lãi suất thả nổi.',
    relatedTickers: 'VCB,BID,CTG,ACB,VPB',
    tags: '#nganhang,#laisuat,#tietkiem',
  },
  {
    id: 103,
    title: 'CPI bình quân kiểm soát ổn định ở mức 3,6%, tạo dư địa điều hành chính sách tiền tệ linh hoạt',
    description:
      'Chỉ số giá tiêu dùng được giữ vững dưới mục tiêu Quốc hội đề ra nhờ nguồn cung lương thực dồi dào và giá nhiên liệu hạ nhiệt.',
    contentSnippet:
      'Báo cáo kinh tế vĩ mô mới công bố cho thấy chỉ số giá tiêu dùng (CPI) bình quân tăng 3,6% so với cùng kỳ năm trước, nằm trong ngưỡng mục tiêu an toàn 4,0% - 4,5%. Tăng trưởng GDP duy trì đà phục hồi mạnh mẽ nhờ xuất khẩu điện tử, nông sản và giải ngân đầu tư công. Lạm phát hạ nhiệt giúp sức mua của các hộ gia đình ổn định và giảm áp lực chi phí sinh hoạt hàng tháng.',
    originalUrl: 'https://vietstock.vn/kinh-te.htm',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=900&q=80',
    author: 'Quốc Trung',
    publishedAt: hoursAgoIso(5),
    sourceId: 3,
    sourceCode: 'VIETSTOCK',
    sourceName: 'Vietstock',
    categoryId: 2,
    categoryCode: 'MACRO',
    categoryName: 'Kinh tế vĩ mô',
    isAiProcessed: true,
    isSaved: false,
    bulletPoints: JSON.stringify([
      'CPI bình quân ở mức 3,6%, thấp hơn ngưỡng mục tiêu 4,0% - 4,5% của Quốc hội.',
      'Giá xăng dầu và lương thực thực phẩm ổn định giúp kìm giữ lạm phát cơ bản.',
      'Chi phí sinh hoạt gia đình bớt biến động, thuận lợi cho kế hoạch ngân sách chi tiêu tháng.',
    ]),
    sentiment: 'POSITIVE',
    sentimentReason:
      '[Dữ kiện bài báo - Fact] Lạm phát CPI được kiểm soát ở mức 3,6% cùng đà phục hồi xuất khẩu và đầu tư công.',
    impactAnalysis:
      '[Dữ kiện bài báo - Fact] CPI duy trì dưới 4% | [Nhận định AI - Opinion] Sức mua tiền tệ và ngân sách chi tiêu sinh hoạt của hộ gia đình được bảo toàn — Hưởng lợi: Ngành bán lẻ tiêu dùng (MWG, MSN, PNJ); Chịu rủi ro: Thấp.',
    relatedTickers: 'MWG,MSN,PNJ',
    tags: '#kinhtevimo,#cpi,#lamphat',
  },
  {
    id: 104,
    title: 'Giá vàng miếng và vàng nhẫn biến động mạnh theo đà điều chỉnh của thị trường quốc tế',
    description:
      'Giá vàng thế giới giảm nhẹ từ vùng đỉnh lịch sử sau báo cáo việc làm Mỹ, kéo theo chênh lệch mua - bán trong nước nới rộng.',
    contentSnippet:
      'Trên thị trường quốc tế, giá vàng giao ngay điều chỉnh giảm 1,2% khi đồng USD phục hồi. Tại thị trường trong nước, các doanh nghiệp kinh doanh vàng điều chỉnh giảm giá vàng nhẫn tròn trơn từ 400.000 - 600.000 đồng/lượng, đồng thời giữ khoảng cách chênh lệch mua vào - bán ra ở mức 1,5 - 2 triệu đồng/lượng. Các chuyên gia tài chính cảnh báo nhà đầu tư cá nhân không nên lướt sóng ngắn hạn khi biên độ chênh lệch mua bán đang ở mức cao.',
    originalUrl: 'https://vnexpress.net/kinh-doanh/hang-hoa',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=900&q=80',
    author: 'Thanh Tú',
    publishedAt: hoursAgoIso(8),
    sourceId: 1,
    sourceCode: 'VNEXPRESS',
    sourceName: 'VnExpress Kinh Doanh',
    categoryId: 4,
    categoryCode: 'INVESTMENT',
    categoryName: 'Đầu tư',
    isAiProcessed: true,
    isSaved: false,
    bulletPoints: JSON.stringify([
      'Giá vàng nhẫn trong nước giảm 400.000 - 600.000 đồng/lượng theo nhịp điều chỉnh của vàng thế giới.',
      'Chênh lệch giá mua vào - bán ra duy trì ở mức rộng từ 1,5 đến 2,0 triệu đồng/lượng.',
      'Nhà đầu tư lướt sóng ngắn hạn đối mặt rủi ro lỗ ngay khi mua nếu không phân bổ vốn dài hạn.',
    ]),
    sentiment: 'NEGATIVE',
    sentimentReason:
      '[Dữ kiện bài báo - Fact] Giá vàng điều chỉnh giảm và biên độ chênh lệch mua - bán nới rộng lên tới 2 triệu đồng/lượng.',
    impactAnalysis:
      '[Dữ kiện bài báo - Fact] Giá vàng giảm 1,2% quốc tế và chênh lệch mua bán cao | [Nhận định AI - Opinion] Rủi ro cao cho giao dịch ngắn hạn — Hưởng lợi: Người tích sản định kỳ dài hạn chờ nhịp chiết khấu; Chịu rủi ro: Nhà đầu tư mua đuổi ngắn hạn.',
    relatedTickers: 'PNJ',
    tags: '#dautu,#giavang,#taisan',
  },
  {
    id: 105,
    title: 'Quy tắc phân bổ 50/30/20 cải tiến: Cách xây dựng quỹ dự phòng khẩn cấp 6 tháng sinh hoạt phí',
    description:
      'Tách biệt tài khoản chi tiêu hàng ngày và các khoản tiền mục đích giúp gia tăng tỷ lệ tiết kiệm ròng thêm 18% mỗi quý.',
    contentSnippet:
      'Khảo sát tài chính cá nhân tại các đô thị lớn cho thấy những người áp dụng phương pháp chia tách dòng tiền theo từng mục đích cụ thể (Chi tiêu thiết yếu, Quỹ dự phòng khẩn cấp, Đầu tư tích sản, Nuôi con) kiểm soát ngân sách hiệu quả hơn gấp đôi so với việc để chung toàn bộ tiền trong một tài khoản thanh toán. Chuyên gia khuyến nghị duy trì quỹ dự phòng tương đương 3 đến 6 tháng chi phí sinh hoạt trong các tài khoản tiết kiệm linh hoạt.',
    originalUrl: 'https://cafef.vn/tai-chinh-ca-nhan.chn',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=900&q=80',
    author: 'Hoàng Nam',
    publishedAt: hoursAgoIso(12),
    sourceId: 2,
    sourceCode: 'CAFEF',
    sourceName: 'CafeF',
    categoryId: 5,
    categoryCode: 'PERSONAL_FINANCE',
    categoryName: 'Tài chính cá nhân',
    isAiProcessed: true,
    isSaved: false,
    bulletPoints: JSON.stringify([
      'Phân tách tài khoản theo mục đích giúp tăng tỷ lệ tiết kiệm ròng trung bình thêm 18%/quý.',
      'Quỹ dự phòng khẩn cấp tiêu chuẩn cần đảm bảo từ 3 đến 6 tháng chi phí sinh hoạt thiết yếu.',
      'Kỷ luật tự động trích chuyển khoản tiền ngay khi nhận lương giúp chống chi tiêu quá hạn mức.',
    ]),
    sentiment: 'POSITIVE',
    sentimentReason:
      '[Dữ kiện bài báo - Fact] Phương pháp phân bổ ngân sách theo khoản mục đích đem lại hiệu quả tích lũy cao.',
    impactAnalysis:
      '[Dữ kiện bài báo - Fact] Tăng 18% hiệu quả tiết kiệm khi tách quỹ mục đích | [Nhận định AI - Opinion] Củng cố sức khỏe tài chính cá nhân bền vững — Hưởng lợi: Cá nhân và hộ gia đình quản lý thu chi chủ động.',
    relatedTickers: '',
    tags: '#taichinhcanhan,#tietkiem,#ngansach',
  },
  {
    id: 106,
    title: 'Hòa Phát (HPG) ghi nhận sản lượng tiêu thụ thép xây dựng tăng 22% nhờ giải ngân đầu tư công',
    description:
      'Các dự án hạ tầng trọng điểm tăng tốc thi công giúp sản lượng thép xây dựng và thép cuộn cán nóng (HRC) phục hồi tích cực.',
    contentSnippet:
      'Tập đoàn Hòa Phát (mã chứng khoán: HPG) công bố kết quả kinh doanh quý mới nhất với sản lượng tiêu thụ thép xây dựng đạt mức tăng trưởng 22% so với cùng kỳ. Tiến độ giải ngân vốn đầu tư công tại các dự án cao tốc Bắc - Nam và sân bay Long Thành tạo động lực lớn cho nhóm ngành vật liệu xây dựng như HPG, HSG và NKG.',
    originalUrl: 'https://vietstock.vn/doanh-nghiep.htm',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=900&q=80',
    author: 'Hải Đăng',
    publishedAt: hoursAgoIso(18),
    sourceId: 3,
    sourceCode: 'VIETSTOCK',
    sourceName: 'Vietstock',
    categoryId: 1,
    categoryCode: 'STOCK',
    categoryName: 'Chứng khoán',
    isAiProcessed: true,
    isSaved: false,
    bulletPoints: JSON.stringify([
      'Sản lượng tiêu thụ thép xây dựng của Hòa Phát (HPG) tăng trưởng 22% so với cùng kỳ.',
      'Động lực chính đến từ làn sóng đẩy mạnh giải ngân đầu tư công hạ tầng giao thông.',
      'Triển vọng lợi nhuận nhóm ngành thép (HPG, HSG, NKG) cải thiện rõ nét trong nửa cuối năm.',
    ]),
    sentiment: 'POSITIVE',
    sentimentReason:
      '[Dữ kiện bài báo - Fact] Sản lượng tiêu thụ thép HPG tăng 22% nhờ nhu cầu hạ tầng đầu tư công.',
    impactAnalysis:
      '[Dữ kiện bài báo - Fact] Sản lượng thép HPG tăng 22% | [Nhận định AI - Opinion] Tín hiệu khả quan cho cổ phiếu chu kỳ ngành vật liệu xây dựng — Hưởng lợi: HPG, HSG, NKG; Chịu rủi ro: Biến động giá nguyên liệu quặng sắt và than cốc.',
    relatedTickers: 'HPG,HSG,NKG',
    tags: '#chungkhoan,#hpg,#dautucong',
  },
];

let backendHasArticles = false;

const enrichSavedStatus = (article: NewsArticle, savedIds: Set<number>): NewsArticle => ({
  ...article,
  isSaved: Boolean(article.isSaved || savedIds.has(article.id)),
});

const filterFallbackArticles = (params?: NewsFilterParams): NewsPageResponse<NewsArticle> => {
  const savedIds = getLocalSavedIds();
  let filtered = FALLBACK_NEWS_ARTICLES.map((a) => enrichSavedStatus(a, savedIds));

  if (params?.categoryId) {
    filtered = filtered.filter((a) => a.categoryId === params.categoryId);
  } else if (params?.categoryCode && params.categoryCode !== 'ALL') {
    const code = params.categoryCode.trim().toUpperCase();
    filtered = filtered.filter((a) => a.categoryCode?.toUpperCase() === code);
  }

  if (params?.sourceId) {
    filtered = filtered.filter((a) => a.sourceId === params.sourceId);
  } else if (params?.sourceCode && params.sourceCode !== 'ALL') {
    const code = params.sourceCode.trim().toUpperCase();
    filtered = filtered.filter((a) => a.sourceCode?.toUpperCase() === code);
  }

  if (params?.fromDate) {
    const fromTime = new Date(`${params.fromDate}T00:00:00`).getTime();
    if (!Number.isNaN(fromTime)) {
      filtered = filtered.filter((a) => new Date(a.publishedAt).getTime() >= fromTime);
    }
  }

  if (params?.toDate) {
    const toTime = new Date(`${params.toDate}T23:59:59.999`).getTime();
    if (!Number.isNaN(toTime)) {
      filtered = filtered.filter((a) => new Date(a.publishedAt).getTime() <= toTime);
    }
  }

  if (params?.keyword && params.keyword.trim()) {
    const tokens = params.keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
    filtered = filtered.filter((a) => {
      const haystack = `${a.title || ''} ${a.description || ''} ${a.contentSnippet || ''} ${a.relatedTickers || ''} ${a.sourceName || ''}`.toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }

  const page = params?.page ?? 0;
  const size = params?.size ?? 12;
  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const start = page * size;
  const content = filtered.slice(start, start + size);

  return {
    content,
    totalElements,
    totalPages,
    size,
    number: page,
    first: page === 0,
    last: page >= totalPages - 1,
  };
};

export const newsService = {
  /**
   * Kích hoạt cào và làm mới tin tức tài chính thực tế từ các nguồn báo (VnExpress, CafeF, Vietstock...)
   */
  async crawlNews(): Promise<{ savedCount: number; totalArticles: number }> {
    try {
      const res = await api.post<ApiResponse<{ savedCount: number; totalArticles: number }>>('/news/crawl');
      if (res.data?.data) {
        backendHasArticles = true;
        return res.data.data;
      }
    } catch {
      // Fallback nếu có lỗi mạng
    }
    return { savedCount: 0, totalArticles: FALLBACK_NEWS_ARTICLES.length };
  },

  /**
   * Lấy danh sách danh mục tin tức chuẩn hóa
   */
  async getCategories(): Promise<NewsCategory[]> {
    try {
      const res = await api.get<ApiResponse<NewsCategory[]>>('/news/categories');
      const data = res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return DEFAULT_NEWS_CATEGORIES;
    } catch {
      return DEFAULT_NEWS_CATEGORIES;
    }
  },

  /**
   * Lấy danh sách các nguồn báo tài chính đang kích hoạt
   */
  async getSources(): Promise<NewsSource[]> {
    try {
      const res = await api.get<ApiResponse<NewsSource[]>>('/news/sources');
      const data = res.data?.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return DEFAULT_NEWS_SOURCES;
    } catch {
      return DEFAULT_NEWS_SOURCES;
    }
  },

  /**
   * Lấy danh sách bài báo tài chính (hỗ trợ phân trang, lọc theo danh mục, nguồn, ngày, từ khóa)
   */
  async getArticles(params?: NewsFilterParams): Promise<NewsPageResponse<NewsArticle>> {
    const savedIds = getLocalSavedIds();
    try {
      const queryParams: Record<string, string | number> = {
        page: params?.page ?? 0,
        size: params?.size ?? 12,
      };
      if (params?.categoryId) queryParams.categoryId = params.categoryId;
      if (params?.categoryCode && params.categoryCode !== 'ALL') {
        queryParams.categoryCode = params.categoryCode;
      }
      if (params?.sourceId) queryParams.sourceId = params.sourceId;
      if (params?.sourceCode && params.sourceCode !== 'ALL') {
        queryParams.sourceCode = params.sourceCode;
      }
      if (params?.keyword && params.keyword.trim()) {
        queryParams.keyword = params.keyword.trim();
      }
      if (params?.fromDate) queryParams.fromDate = params.fromDate;
      if (params?.toDate) queryParams.toDate = params.toDate;

      const res = await api.get<ApiResponse<NewsPageResponse<NewsArticle>>>('/news/articles', {
        params: queryParams,
      });
      const pageData = res.data?.data;
      if (pageData && Array.isArray(pageData.content)) {
        if (pageData.totalElements > 0) {
          backendHasArticles = true;
        }
        // Nếu DB thực tế trên server chưa có dữ liệu crawl lần đầu nào, hiển thị bộ dữ liệu mẫu để đảm bảo trải nghiệm
        if (!backendHasArticles && pageData.totalElements === 0) {
          return filterFallbackArticles(params);
        }
        return {
          ...pageData,
          content: pageData.content.map((item) => enrichSavedStatus(item, savedIds)),
        };
      }
      return filterFallbackArticles(params);
    } catch {
      return filterFallbackArticles(params);
    }
  },

  /**
   * Lấy chi tiết bài báo theo ID (tùy chọn kích hoạt tóm tắt AI nếu chưa có)
   */
  async getArticleById(id: number, summarize = false): Promise<NewsArticle> {
    const savedIds = getLocalSavedIds();
    try {
      const res = await api.get<ApiResponse<NewsArticle>>(`/news/articles/${id}`, {
        params: { summarize },
      });
      if (res.data?.data) {
        return enrichSavedStatus(res.data.data, savedIds);
      }
    } catch {
      // Fallback sang danh sách mẫu
    }
    const found = FALLBACK_NEWS_ARTICLES.find((a) => a.id === id) || FALLBACK_NEWS_ARTICLES[0];
    return enrichSavedStatus(found, savedIds);
  },

  /**
   * Yêu cầu Gemini AI tóm tắt 3 ý chính, phân tích sắc thái & tác động cho bài viết
   */
  async summarizeArticle(id: number): Promise<NewsArticle> {
    const savedIds = getLocalSavedIds();
    try {
      const res = await api.post<ApiResponse<NewsArticle>>(`/news/articles/${id}/summarize`);
      if (res.data?.data) {
        return enrichSavedStatus(res.data.data, savedIds);
      }
    } catch {
      // Fallback nếu bài viết thuộc bộ mẫu hoặc mất kết nối tạm thời
    }
    const found = FALLBACK_NEWS_ARTICLES.find((a) => a.id === id);
    if (found) {
      return enrichSavedStatus({ ...found, isAiProcessed: true }, savedIds);
    }
    throw new Error('Không thể tóm tắt bài viết lúc này.');
  },

  /**
   * Lưu bài viết vào danh sách đọc sau của người dùng
   */
  async saveArticle(id: number): Promise<NewsArticle> {
    const savedIds = getLocalSavedIds();
    savedIds.add(id);
    saveLocalSavedIds(savedIds);

    try {
      const res = await api.post<ApiResponse<NewsArticle>>(`/news/articles/${id}/save`);
      if (res.data?.data) {
        return { ...res.data.data, isSaved: true };
      }
    } catch {
      // Đã lưu vào localStorage dự phòng
    }

    const found = FALLBACK_NEWS_ARTICLES.find((a) => a.id === id) || {
      id,
      title: '',
      originalUrl: '',
      publishedAt: new Date().toISOString(),
      isSaved: true,
    };
    return { ...found, isSaved: true };
  },

  /**
   * Lấy tổng số lượng bài viết đã lưu hiện tại (dựa trên cache / LocalStorage)
   */
  getSavedCount(): number {
    return getLocalSavedIds().size;
  },

  /**
   * Bỏ lưu bài viết khỏi danh sách cá nhân
   */
  async unsaveArticle(id: number): Promise<void> {
    const savedIds = getLocalSavedIds();
    savedIds.delete(id);
    saveLocalSavedIds(savedIds);

    try {
      await api.delete<ApiResponse<void>>(`/news/articles/${id}/save`);
    } catch {
      // Đã xóa khỏi localStorage dự phòng
    }
  },

  /**
   * Lấy danh sách bài báo đã lưu của người dùng
   */
  async getSavedArticles(page = 0, size = 12): Promise<NewsPageResponse<NewsArticle>> {
    const savedIds = getLocalSavedIds();
    try {
      const res = await api.get<ApiResponse<NewsPageResponse<NewsArticle>>>('/news/saved', {
        params: { page, size },
      });
      const pageData = res.data?.data;
      if (pageData && Array.isArray(pageData.content)) {
        for (const item of pageData.content) {
          savedIds.add(item.id);
        }
        saveLocalSavedIds(savedIds);
        return {
          ...pageData,
          content: pageData.content.map((item) => ({ ...item, isSaved: true })),
        };
      }
    } catch {
      // Fallback sang localStorage nếu mất kết nối
    }

    const savedFallback = FALLBACK_NEWS_ARTICLES.filter((a) => savedIds.has(a.id)).map((a) => ({
      ...a,
      isSaved: true,
    }));
    const totalElements = savedFallback.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const start = page * size;
    return {
      content: savedFallback.slice(start, start + size),
      totalElements,
      totalPages,
      size,
      number: page,
      first: page === 0,
      last: page >= totalPages - 1,
    };
  },
};

