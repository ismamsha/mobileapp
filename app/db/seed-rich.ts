import { sql } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import * as schema from "@db/schema";

// ── Reference data ─────────────────────────────────────────
const CATEGORIES = [
  { nameEn: "Electronics", nameAr: "إلكترونيات", icon: "smartphone", sortOrder: 1 },
  { nameEn: "Textiles", nameAr: "منسوجات", icon: "shirt", sortOrder: 2 },
  { nameEn: "Machinery", nameAr: "آلات", icon: "cog", sortOrder: 3 },
  { nameEn: "Furniture", nameAr: "أثاث", icon: "armchair", sortOrder: 4 },
  { nameEn: "Auto Parts", nameAr: "قطع سيارات", icon: "car", sortOrder: 5 },
  { nameEn: "Cosmetics", nameAr: "مستحضرات", icon: "sparkles", sortOrder: 6 },
  { nameEn: "Food & Beverage", nameAr: "أغذية ومشروبات", icon: "coffee", sortOrder: 7 },
  { nameEn: "Construction", nameAr: "مواد بناء", icon: "hammer", sortOrder: 8 },
];

const CERTIFICATES = [
  { name: "ISO 9001:2015", type: "Quality Management", icon: "shield" },
  { name: "ISO 14001:2015", type: "Environmental Management", icon: "leaf" },
  { name: "BSCI", type: "Business Social Compliance Initiative", icon: "users" },
  { name: "CE Marking", type: "European Conformity", icon: "check-circle" },
  { name: "FDA Registered", type: "US Food & Drug Administration", icon: "heart-pulse" },
  { name: "RoHS Compliant", type: "Restriction of Hazardous Substances", icon: "recycle" },
  { name: "REACH Compliant", type: "Chemical Safety (EU)", icon: "flask" },
  { name: "GOTS", type: "Global Organic Textile Standard", icon: "sprout" },
];

// ── Users ──────────────────────────────────────────────────
const USERS = [
  { unionId: "dev-test-admin", name: "Test Admin", email: "admin@example.com", avatar: "/images/user-avatar.jpg", phone: "+966-50-000-0001", company: "ChinaFastLane", role: "admin" as const, lang: "en" as const },
  { unionId: "dev-test-user", name: "Test User", email: "user@example.com", avatar: "/images/user-avatar.jpg", phone: "+966-50-000-0002", company: "Riyadh Trading", role: "user" as const, lang: "ar" as const },
  { unionId: "u-ahmed-hassan", name: "Ahmed Hassan", email: "ahmed.hassan@example.com", avatar: "/images/user-avatar.jpg", phone: "+966-55-111-2233", company: "Hassan Imports", role: "user" as const, lang: "ar" as const },
  { unionId: "u-fatima-ali", name: "Fatima Ali", email: "fatima.ali@example.com", avatar: "/images/user-avatar.jpg", phone: "+966-50-222-3344", company: "Ali Trading Co.", role: "user" as const, lang: "ar" as const },
  { unionId: "u-mohammed-saad", name: "Mohammed Saad", email: "mohammed.saad@example.com", avatar: "/images/user-avatar.jpg", phone: "+966-54-333-4455", company: "Saad Group", role: "user" as const, lang: "ar" as const },
  { unionId: "u-layla-omar", name: "Layla Omar", email: "layla.omar@example.com", avatar: "/images/user-avatar.jpg", phone: "+966-56-444-5566", company: "Omar Enterprises", role: "user" as const, lang: "en" as const },
  { unionId: "u-yusuf-ibrahim", name: "Yusuf Ibrahim", email: "yusuf.ibrahim@example.com", avatar: "/images/user-avatar.jpg", phone: "+966-57-555-6677", company: "Ibrahim Holdings", role: "user" as const, lang: "ar" as const },
  { unionId: "u-noor-saleh", name: "Noor Saleh", email: "noor.saleh@example.com", avatar: "/images/user-avatar.jpg", phone: "+966-58-666-7788", company: "Noor Designs", role: "user" as const, lang: "en" as const },
  { unionId: "u-john-chen", name: "John Chen", email: "john.chen@example.com", avatar: "/images/user-avatar.jpg", phone: "+86-138-0000-1001", company: "Chen Global", role: "user" as const, lang: "en" as const },
  { unionId: "u-sarah-miller", name: "Sarah Miller", email: "sarah.miller@example.com", avatar: "/images/user-avatar.jpg", phone: "+1-415-000-2002", company: "Miller Sourcing", role: "user" as const, lang: "en" as const },
  { unionId: "u-omar-khalid", name: "Omar Khalid", email: "omar.khalid@example.com", avatar: "/images/user-avatar.jpg", phone: "+966-50-777-8899", company: "Khalid Ventures", role: "admin" as const, lang: "ar" as const },
  { unionId: "u-emma-wilson", name: "Emma Wilson", email: "emma.wilson@example.com", avatar: "/images/user-avatar.jpg", phone: "+44-20-7946-0958", company: "Wilson Procurement", role: "user" as const, lang: "en" as const },
  { unionId: "u-li-wei", name: "Li Wei", email: "li.wei@example.com", avatar: "/images/user-avatar.jpg", phone: "+86-139-0000-3003", company: "Wei Trading", role: "user" as const, lang: "en" as const },
  { unionId: "u-priya-patel", name: "Priya Patel", email: "priya.patel@example.com", avatar: "/images/user-avatar.jpg", phone: "+91-98-0000-4004", company: "Patel Exports", role: "user" as const, lang: "en" as const },
  { unionId: "u-hassan-abdi", name: "Hassan Abdi", email: "hassan.abdi@example.com", avatar: "/images/user-avatar.jpg", phone: "+252-61-000-5005", company: "Abdi Imports", role: "user" as const, lang: "ar" as const },
  { unionId: "u-sophie-dubois", name: "Sophie Dubois", email: "sophie.dubois@example.com", avatar: "/images/user-avatar.jpg", phone: "+33-1-0000-6006", company: "Dubois SARL", role: "user" as const, lang: "en" as const },
  { unionId: "u-ali-rahimi", name: "Ali Rahimi", email: "ali.rahimi@example.com", avatar: "/images/user-avatar.jpg", phone: "+98-91-000-7007", company: "Rahimi Group", role: "user" as const, lang: "ar" as const },
  { unionId: "u-maria-garcia", name: "Maria Garcia", email: "maria.garcia@example.com", avatar: "/images/user-avatar.jpg", phone: "+34-600-000-8008", company: "Garcia Imports", role: "user" as const, lang: "en" as const },
  { unionId: "u-khaled-nasser", name: "Khaled Nasser", email: "khaled.nasser@example.com", avatar: "/images/user-avatar.jpg", phone: "+966-59-888-9999", company: "Nasser Trading", role: "user" as const, lang: "ar" as const },
  { unionId: "u-lina-haddad", name: "Lina Haddad", email: "lina.haddad@example.com", avatar: "/images/user-avatar.jpg", phone: "+962-79-000-9009", company: "Haddad Co.", role: "user" as const, lang: "ar" as const },
];

// ── Factories ──────────────────────────────────────────────
const FACTORY_TEMPLATES = [
  {
    name: "Shenzhen TechPro Electronics Co., Ltd.",
    slug: "shenzhen-techpro-electronics",
    city: "Shenzhen", province: "Guangdong",
    categoryId: 1,
    description: "Leading manufacturer of consumer electronics with over 12 years of experience. Specializing in wireless audio devices, charging solutions, and mobile accessories. Our 50,000 sqm facility features 12 automated SMT lines and employs over 2,000 skilled workers.",
    descriptionAr: "شركة رائدة في تصنيع الإلكترونيات الاستهلاكية مع أكثر من 12 عاماً من الخبرة. متخصصون في أجهزة الصوت اللاسلكية وشواحن الهواتف وملحقات الجوال.",
    rating: 4.8, reviewCount: 124, yearsInBusiness: 12, capacity: "500K units/month", moq: "100 units", moqValue: 100, employees: 2000, factorySize: "50,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["USA", "EU", "Middle East", "Southeast Asia", "Africa"],
    primaryProducts: ["Wireless Earbuds", "USB-C Cables", "Fast Chargers", "Power Banks"],
    website: "https://techpro-cn.com", whatsapp: "+86-755-8888-1001", email: "sales@techpro-cn.com", featured: true,
  },
  {
    name: "Guangzhou Textile Mills Co., Ltd.",
    slug: "guangzhou-textile-mills",
    city: "Guangzhou", province: "Guangdong",
    categoryId: 2,
    description: "Premium textile manufacturer producing high-quality cotton, silk, and synthetic fabrics. Our state-of-the-art weaving facility serves fashion brands worldwide with sustainable production practices.",
    descriptionAr: "مصنع منسوجات متميز ينتج أقمشة قطنية عالية الجودة وحريرية وصناعية. منشأة النسج المتطورة لدينا تخدم علامات الأزياء في جميع أنحاء العالم.",
    rating: 4.6, reviewCount: 89, yearsInBusiness: 8, capacity: "2M meters/month", moq: "500 meters", moqValue: 500, employees: 800, factorySize: "30,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: false,
    exportMarkets: ["EU", "USA", "Middle East", "Japan"],
    primaryProducts: ["Cotton Fabric", "Silk Scarves", "Polyester Blends", "Linen Yarn"],
    website: "https://gztextile.com", whatsapp: "+86-20-8888-2002", email: "export@gztextile.com", featured: true,
  },
  {
    name: "Hangzhou WoodCraft Furniture Co., Ltd.",
    slug: "hangzhou-woodcraft-furniture",
    city: "Hangzhou", province: "Zhejiang",
    categoryId: 4,
    description: "Master craftsmen creating premium solid wood furniture since 2010. Specializing in oak, walnut, and bamboo furniture for residential and hospitality markets. FSC-certified sustainable sourcing.",
    descriptionAr: "حرفيون ماهرون يصنعون أثاثاً خشبياً صلباً فاخراً منذ عام 2010. متخصصون في أثاث البلوط والجوز والخيزران للأسواق السكنية والفندقية.",
    rating: 4.9, reviewCount: 156, yearsInBusiness: 15, capacity: "50K pieces/month", moq: "50 pieces", moqValue: 50, employees: 1200, factorySize: "40,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["USA", "EU", "Australia", "Middle East"],
    primaryProducts: ["Dining Tables", "Wooden Chairs", "Wardrobes", "Bed Frames"],
    website: "https://woodcraft-hz.com", whatsapp: "+86-571-8888-3003", email: "global@woodcraft-hz.com", featured: true,
  },
  {
    name: "Dongguan AutoParts Hub Manufacturing",
    slug: "dongguan-autoparts-hub",
    city: "Dongguan", province: "Guangdong",
    categoryId: 5,
    description: "Precision auto parts manufacturer specializing in brake systems, suspension components, and engine parts. IATF 16949 certified with CNC machining capabilities.",
    descriptionAr: "مصنع دقيق لقطع غيار السيارات متخصص في أنظمة الفرامل ومكونات التعليق وقطع المحرك.",
    rating: 4.5, reviewCount: 67, yearsInBusiness: 6, capacity: "200K units/month", moq: "200 units", moqValue: 200, employees: 600, factorySize: "25,000 sqm",
    isVerified: false, isComplianceCertified: true, isLeadTimeCertified: false,
    exportMarkets: ["Middle East", "Africa", "Southeast Asia"],
    primaryProducts: ["Brake Pads", "Shock Absorbers", "Oil Filters", "Wheel Bearings"],
    website: "https://dgautoparts.com", whatsapp: "+86-769-8888-4004", email: "sales@dgautoparts.com", featured: false,
  },
  {
    name: "Shanghai Cosmetic Labs Co., Ltd.",
    slug: "shanghai-cosmetic-labs",
    city: "Shanghai", province: "Shanghai",
    categoryId: 6,
    description: "GMP-certified cosmetics manufacturer offering OEM/ODM services for skincare, haircare, and makeup products. ISO 22716 certified with in-house R&D laboratory.",
    descriptionAr: "مصنع مستحضرات تجميل معتمد من GMP يقدم خدمات OEM/ODM للعناية بالبشرة والشعر والمكياج.",
    rating: 4.7, reviewCount: 93, yearsInBusiness: 10, capacity: "1M units/month", moq: "1,000 units", moqValue: 1000, employees: 500, factorySize: "20,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["USA", "EU", "Middle East", "Southeast Asia"],
    primaryProducts: ["Face Creams", "Shampoo", "Lipstick", "Perfume"],
    website: "https://shcosmeticlabs.com", whatsapp: "+86-21-8888-5005", email: "oem@shcosmeticlabs.com", featured: true,
  },
  {
    name: "Ningbo Machinery Works Co., Ltd.",
    slug: "ningbo-machinery-works",
    city: "Ningbo", province: "Zhejiang",
    categoryId: 3,
    description: "Industrial machinery manufacturer specializing in CNC machines, injection molding equipment, and packaging machinery. CE certified with export experience to 40+ countries.",
    descriptionAr: "مصنع آلات صناعية متخصص في ماكينات CNC ومعدات حقن القوالب وآلات التعبئة.",
    rating: 4.4, reviewCount: 45, yearsInBusiness: 18, capacity: "500 units/month", moq: "1 unit", moqValue: 1, employees: 1500, factorySize: "60,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: false,
    exportMarkets: ["EU", "Russia", "Middle East", "South America"],
    primaryProducts: ["CNC Machines", "Injection Molders", "Packaging Lines", "Conveyor Systems"],
    website: "https://nbmachinery.com", whatsapp: "+86-574-8888-6006", email: "export@nbmachinery.com", featured: false,
  },
  {
    name: "Foshan Modern Living Furniture",
    slug: "foshan-modern-living",
    city: "Foshan", province: "Guangdong",
    categoryId: 4,
    description: "Modern furniture manufacturer specializing in contemporary designs for residential and commercial spaces. Known for innovative designs and sustainable materials.",
    descriptionAr: "مصنع أثاث حديث متخصص في التصاميم المعاصرة للمساحات السكنية والتجارية.",
    rating: 4.7, reviewCount: 78, yearsInBusiness: 9, capacity: "30K pieces/month", moq: "30 pieces", moqValue: 30, employees: 900, factorySize: "35,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["USA", "EU", "Australia", "Middle East"],
    primaryProducts: ["Sofas", "Coffee Tables", "TV Stands", "Bookshelves"],
    website: "https://foshanmodern.com", whatsapp: "+86-757-8888-7007", email: "sales@foshanmodern.com", featured: true,
  },
  {
    name: "Xiamen FoodTech Processing Co.",
    slug: "xiamen-foodtech-processing",
    city: "Xiamen", province: "Fujian",
    categoryId: 7,
    description: "HACCP and ISO 22000 certified food processing facility. Specializing in dried fruits, nuts, seafood processing, and health food products.",
    descriptionAr: "منشأة معالجة أغذية معتمدة من HACCP وISO 22000. متخصصون في الفواكه المجففة والمكسرات ومعالجة المأكولات البحرية.",
    rating: 4.3, reviewCount: 34, yearsInBusiness: 7, capacity: "100K tons/year", moq: "500 kg", moqValue: 500, employees: 400, factorySize: "15,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: false,
    exportMarkets: ["EU", "USA", "Japan", "Southeast Asia"],
    primaryProducts: ["Dried Fruits", "Mixed Nuts", "Seaweed Snacks", "Health Bars"],
    website: "https://xmfoodtech.com", whatsapp: "+86-592-8888-8008", email: "export@xmfoodtech.com", featured: false,
  },
  {
    name: "Suzhou BuildMax Construction Materials",
    slug: "suzhou-buildmax-construction",
    city: "Suzhou", province: "Jiangsu",
    categoryId: 8,
    description: "Large-scale manufacturer of construction materials including tiles, sanitary ware, steel frames, and insulation panels. Serving infrastructure projects across Asia and Africa.",
    descriptionAr: "مصنع كبير لمواد البناء بما في ذلك البلاط والأدوات الصحية والهياكل الفولاذية وألواح العزل.",
    rating: 4.5, reviewCount: 52, yearsInBusiness: 14, capacity: "5M sqm/year", moq: "1,000 sqm", moqValue: 1000, employees: 1800, factorySize: "80,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["Middle East", "Africa", "Southeast Asia", "Central Asia"],
    primaryProducts: ["Ceramic Tiles", "Steel Frames", "Insulation Panels", "Sanitary Ware"],
    website: "https://szbuildmax.com", whatsapp: "+86-512-8888-9009", email: "sales@szbuildmax.com", featured: true,
  },
  {
    name: "Wenzhou Golden Electrical Co., Ltd.",
    slug: "wenzhou-golden-electrical",
    city: "Wenzhou", province: "Zhejiang",
    categoryId: 1,
    description: "Specialist in low-voltage electrical products, switches, sockets, LED lighting, and smart home devices. IEC certified with automated assembly lines.",
    descriptionAr: "متخصص في المنتجات الكهربائية منخفضة الجهد والمفاتيح والمقابس وإضاءة LED وأجهزة المنزل الذكي.",
    rating: 4.6, reviewCount: 71, yearsInBusiness: 11, capacity: "2M units/month", moq: "500 units", moqValue: 500, employees: 950, factorySize: "32,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["Middle East", "Africa", "South America", "Southeast Asia"],
    primaryProducts: ["Wall Switches", "LED Bulbs", "Smart Plugs", "Circuit Breakers"],
    website: "https://wzgolden.com", whatsapp: "+86-577-8888-1010", email: "export@wzgolden.com", featured: false,
  },
  {
    name: "Ningbo Silk Road Textiles",
    slug: "ningbo-silk-road-textiles",
    city: "Ningbo", province: "Zhejiang",
    categoryId: 2,
    description: "Premium silk, cashmere, and organic cotton textile manufacturer. OEKO-TEX and GOTS certified with dyeing and finishing capabilities in-house.",
    descriptionAr: "مصنع منسوجات حريرية وكشميرية وقطنية عضوية فاخرة. معتمد من OEKO-TEX وGOTS مع قدرات الصباغة والتشطيب داخلياً.",
    rating: 4.8, reviewCount: 102, yearsInBusiness: 16, capacity: "800K meters/month", moq: "300 meters", moqValue: 300, employees: 700, factorySize: "28,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["EU", "USA", "Japan", "Middle East"],
    primaryProducts: ["Silk Fabric", "Cashmere Yarn", "Organic Cotton", "Printed Textiles"],
    website: "https://nbsilkroad.com", whatsapp: "+86-574-8888-1111", email: "sales@nbsilkroad.com", featured: true,
  },
  {
    name: "Shenzhen AutoMotive Parts Co., Ltd.",
    slug: "shenzhen-automotive-parts",
    city: "Shenzhen", province: "Guangdong",
    categoryId: 5,
    description: "Manufacturer of EV charging components, battery management systems, and electric motor parts. Supporting the global transition to electric vehicles.",
    descriptionAr: "مصنع لقطع شحن المركبات الكهربائية وأنظمة إدارة البطارية وقطع المحرك الكهربائي.",
    rating: 4.7, reviewCount: 88, yearsInBusiness: 9, capacity: "150K units/month", moq: "100 units", moqValue: 100, employees: 850, factorySize: "26,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["EU", "USA", "Middle East", "Southeast Asia"],
    primaryProducts: ["EV Chargers", "Battery Packs", "Motor Controllers", "DC Converters"],
    website: "https://szautomotive.com", whatsapp: "+86-755-8888-1212", email: "sales@szautomotive.com", featured: true,
  },
  {
    name: "Guangzhou Beauty Creations Cosmetics",
    slug: "guangzhou-beauty-creations",
    city: "Guangzhou", province: "Guangdong",
    categoryId: 6,
    description: "Full-service cosmetics OEM/ODM partner for global beauty brands. Specializing in halal-certified skincare and haircare formulations.",
    descriptionAr: "شريك OEM/ODM متكامل لمستحضرات التجميل لعلامات الجمال العالمية. متخصصون في تركيبات العناية بالبشرة والشعر المعتمدة حلالاً.",
    rating: 4.4, reviewCount: 49, yearsInBusiness: 6, capacity: "500K units/month", moq: "500 units", moqValue: 500, employees: 380, factorySize: "14,000 sqm",
    isVerified: false, isComplianceCertified: true, isLeadTimeCertified: false,
    exportMarkets: ["Middle East", "Southeast Asia", "Africa"],
    primaryProducts: ["Halal Shampoo", "Body Lotion", "Face Serum", "Sunscreen"],
    website: "https://gzbeauty.com", whatsapp: "+86-20-8888-1313", email: "oem@gzbeauty.com", featured: false,
  },
  {
    name: "Hangzhou Precision Machinery",
    slug: "hangzhou-precision-machinery",
    city: "Hangzhou", province: "Zhejiang",
    categoryId: 3,
    description: "High-precision machining center for custom metal parts, gears, and industrial automation components. ISO 9001 and CE certified.",
    descriptionAr: "مركز تشغيل عالي الدقة للقطع المعدنية المخصصة والتروس ومكونات الأتمتة الصناعية.",
    rating: 4.6, reviewCount: 63, yearsInBusiness: 13, capacity: "50K parts/month", moq: "50 pieces", moqValue: 50, employees: 520, factorySize: "22,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["EU", "USA", "Japan", "Middle East"],
    primaryProducts: ["Precision Gears", "CNC Parts", "Automation Components", "Hydraulic Fittings"],
    website: "https://hzprecision.com", whatsapp: "+86-571-8888-1414", email: "sales@hzprecision.com", featured: false,
  },
  {
    name: "Foshan Royal Furniture",
    slug: "foshan-royal-furniture",
    city: "Foshan", province: "Guangdong",
    categoryId: 4,
    description: "Luxury furniture manufacturer blending traditional Chinese craftsmanship with modern design. Hotel and villa project specialists.",
    descriptionAr: "مصنع أثاث فاخر يمزج الحرفية الصينية التقليدية بالتصميم العصري. متخصصون في مشاريع الفنادق والفلل.",
    rating: 4.8, reviewCount: 115, yearsInBusiness: 17, capacity: "20K pieces/month", moq: "20 pieces", moqValue: 20, employees: 1100, factorySize: "45,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["USA", "EU", "Australia", "Middle East"],
    primaryProducts: ["Hotel Beds", "Dressers", "Nightstands", "Ottomans"],
    website: "https://foshanroyal.com", whatsapp: "+86-757-8888-1515", email: "sales@foshanroyal.com", featured: true,
  },
  {
    name: "Shanghai FoodPack Solutions",
    slug: "shanghai-foodpack-solutions",
    city: "Shanghai", province: "Shanghai",
    categoryId: 7,
    description: "Food-grade packaging manufacturer producing pouches, bottles, cans, and custom labeling solutions. FDA and BRC certified.",
    descriptionAr: "مصنع تغليف صالح للأغذية ينتج أكياس وزجاجات وعلب وحلول ملصقات مخصصة.",
    rating: 4.5, reviewCount: 58, yearsInBusiness: 10, capacity: "10M units/month", moq: "5,000 units", moqValue: 5000, employees: 620, factorySize: "24,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: false,
    exportMarkets: ["USA", "EU", "Middle East", "Southeast Asia"],
    primaryProducts: ["Food Pouches", "Plastic Bottles", "Aluminum Cans", "Labels"],
    website: "https://shfoodpack.com", whatsapp: "+86-21-8888-1616", email: "sales@shfoodpack.com", featured: false,
  },
  {
    name: "Xiamen BuildRight Materials",
    slug: "xiamen-buildright-materials",
    city: "Xiamen", province: "Fujian",
    categoryId: 8,
    description: "Stone and marble supplier with own quarry and processing plant. Specializing in granite, quartz, and engineered stone for construction and interior design.",
    descriptionAr: "مورد حجر ورخام مع محجر ومصنع معالجة خاص. متخصصون في الجرانيت والكوارتز والحجر الهندسي.",
    rating: 4.2, reviewCount: 41, yearsInBusiness: 8, capacity: "2M sqm/year", moq: "500 sqm", moqValue: 500, employees: 750, factorySize: "55,000 sqm",
    isVerified: false, isComplianceCertified: true, isLeadTimeCertified: false,
    exportMarkets: ["Middle East", "Europe", "Southeast Asia"],
    primaryProducts: ["Granite Slabs", "Quartz Countertops", "Marble Tiles", "Stone Sinks"],
    website: "https://xmbuildright.com", whatsapp: "+86-592-8888-1717", email: "sales@xmbuildright.com", featured: false,
  },
  {
    name: "Dongguan Smart Electronics",
    slug: "dongguan-smart-electronics",
    city: "Dongguan", province: "Guangdong",
    categoryId: 1,
    description: "IoT and smart device manufacturer producing wearables, smart sensors, and home automation controllers. Strong ODM capabilities.",
    descriptionAr: "مصنع أجهزة إنترنت الأشياء والأجهزة الذكية ينتج الأجهزة القابلة للارتداء وأجهزة الاستشعار الذكية ووحدات التحكم في المنزل الذكي.",
    rating: 4.5, reviewCount: 76, yearsInBusiness: 7, capacity: "300K units/month", moq: "200 units", moqValue: 200, employees: 680, factorySize: "21,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["USA", "EU", "Japan", "Middle East"],
    primaryProducts: ["Smart Watches", "Temperature Sensors", "Smart Plugs", "IoT Hubs"],
    website: "https://dgsmart.com", whatsapp: "+86-769-8888-1818", email: "sales@dgsmart.com", featured: false,
  },
  {
    name: "Suzhou Elegance Textiles",
    slug: "suzhou-elegance-textiles",
    city: "Suzhou", province: "Jiangsu",
    categoryId: 2,
    description: "Jacquard and embroidered fabric specialist serving fashion houses and home textile brands. Sustainable dyeing processes.",
    descriptionAr: "متخصص في أقمشة الجاكار والمطرزة لخدمة دور الأزياء وعلامات المنسوجات المنزلية. عمليات صباغة مستدامة.",
    rating: 4.7, reviewCount: 84, yearsInBusiness: 12, capacity: "1.2M meters/month", moq: "400 meters", moqValue: 400, employees: 560, factorySize: "25,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["EU", "USA", "Middle East", "Korea"],
    primaryProducts: ["Jacquard Fabric", "Embroidered Cloth", "Curtain Fabric", "Bedding Sets"],
    website: "https://szelegance.com", whatsapp: "+86-512-8888-1919", email: "sales@szelegance.com", featured: true,
  },
  {
    name: "Shenzhen GreenPack Machinery",
    slug: "shenzhen-greenpack-machinery",
    city: "Shenzhen", province: "Guangdong",
    categoryId: 3,
    description: "Eco-friendly packaging machinery manufacturer. Filling, sealing, labeling, and shrink-wrapping equipment for food and cosmetics.",
    descriptionAr: "مصنع آلات تغليف صديقة للبيئة. معدات التعبئة والسد والتسمير والتغليف بالشرنك للأغذية ومستحضرات التجميل.",
    rating: 4.3, reviewCount: 39, yearsInBusiness: 9, capacity: "200 units/month", moq: "1 unit", moqValue: 1, employees: 420, factorySize: "18,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: false,
    exportMarkets: ["Southeast Asia", "Middle East", "Africa", "South America"],
    primaryProducts: ["Filling Machines", "Sealing Machines", "Labeling Machines", "Shrink Wrappers"],
    website: "https://szgreenpack.com", whatsapp: "+86-755-8888-2020", email: "sales@szgreenpack.com", featured: false,
  },
  {
    name: "Guangzhou Metro Construction",
    slug: "guangzhou-metro-construction",
    city: "Guangzhou", province: "Guangdong",
    categoryId: 8,
    description: "Structural steel, aluminum profiles, and prefabricated building components for large infrastructure and commercial projects.",
    descriptionAr: "صلب إنشائي ومواد ألمنيوم ومكونات بناء Prefabricated لمشاريع البنية التحتية والمشاريع التجارية الكبيرة.",
    rating: 4.6, reviewCount: 69, yearsInBusiness: 15, capacity: "50K tons/year", moq: "10 tons", moqValue: 10, employees: 1300, factorySize: "70,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["Africa", "Middle East", "Southeast Asia"],
    primaryProducts: ["Steel Beams", "Aluminum Profiles", "Prefabricated Walls", "Roofing Sheets"],
    website: "https://gzmetro.com", whatsapp: "+86-20-8888-2121", email: "sales@gzmetro.com", featured: true,
  },
  {
    name: "Hangzhou Nature Cosmetics",
    slug: "hangzhou-nature-cosmetics",
    city: "Hangzhou", province: "Zhejiang",
    categoryId: 6,
    description: "Botanical skincare and personal care manufacturer using natural extracts. ECOCERT and ISO 22716 certified.",
    descriptionAr: "مصنع للعناية بالبشرة والعناية الشخصية بنباتات طبيعية باستخدام مستخلصات طبيعية. معتمد من ECOCERT وISO 22716.",
    rating: 4.5, reviewCount: 57, yearsInBusiness: 8, capacity: "400K units/month", moq: "300 units", moqValue: 300, employees: 340, factorySize: "13,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: false,
    exportMarkets: ["EU", "USA", "Middle East", "Southeast Asia"],
    primaryProducts: ["Natural Shampoo", "Face Masks", "Body Butter", "Essential Oils"],
    website: "https://hznature.com", whatsapp: "+86-571-8888-2222", email: "sales@hznature.com", featured: false,
  },
  {
    name: "Ningbo FreshFood Processing",
    slug: "ningbo-freshfood-processing",
    city: "Ningbo", province: "Zhejiang",
    categoryId: 7,
    description: "Frozen seafood, vegetables, and ready-meal manufacturer. BRC and HACCP certified with cold-chain logistics partners.",
    descriptionAr: "مصنع للمأكولات البحرية المجمدة والخضروات والوجبات الجاهزة. معتمد من BRC وHACCP مع شركاء لوجستيات سلسلة التبريد.",
    rating: 4.4, reviewCount: 46, yearsInBusiness: 11, capacity: "30K tons/year", moq: "1,000 kg", moqValue: 1000, employees: 480, factorySize: "20,000 sqm",
    isVerified: true, isComplianceCertified: true, isLeadTimeCertified: true,
    exportMarkets: ["EU", "USA", "Japan", "Middle East"],
    primaryProducts: ["Frozen Shrimp", "Frozen Vegetables", "Ready Meals", "Fish Fillets"],
    website: "https://nbfreshfood.com", whatsapp: "+86-574-8888-2323", email: "sales@nbfreshfood.com", featured: false,
  },
  {
    name: "Wenzhou DriveAuto Parts",
    slug: "wenzhou-driveauto-parts",
    city: "Wenzhou", province: "Zhejiang",
    categoryId: 5,
    description: "Manufacturer of steering systems, transmission parts, and cooling system components for passenger and commercial vehicles.",
    descriptionAr: "مصنع لأنظمة التوجيه وقطع نقل الحركة ومكونات نظام التبريد للمركبات الخاصة والتجارية.",
    rating: 4.1, reviewCount: 33, yearsInBusiness: 5, capacity: "120K units/month", moq: "150 units", moqValue: 150, employees: 390, factorySize: "16,000 sqm",
    isVerified: false, isComplianceCertified: true, isLeadTimeCertified: false,
    exportMarkets: ["Middle East", "Africa", "Southeast Asia"],
    primaryProducts: ["Steering Racks", "Transmission Belts", "Radiators", "Clutch Plates"],
    website: "https://wzdriveauto.com", whatsapp: "+86-577-8888-2424", email: "sales@wzdriveauto.com", featured: false,
  },
];

const IMAGES_BY_CATEGORY: Record<number, string> = {
  1: "/images/factory-electronics.jpg",
  2: "/images/factory-textile.jpg",
  3: "/images/factory-furniture.jpg",
  4: "/images/factory-furniture.jpg",
  5: "/images/factory-electronics.jpg",
  6: "/images/factory-textile.jpg",
  7: "/images/factory-textile.jpg",
  8: "/images/factory-furniture.jpg",
};

const CERTIFICATE_POOL: Record<number, number[]> = {
  1: [1, 4, 6],
  2: [1, 8],
  3: [1, 4],
  4: [1, 3],
  5: [1, 4],
  6: [1, 5],
  7: [1, 5],
  8: [1, 4],
};

// ── Helper: choose a deterministic pseudo-random item ──────
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRandom(seed) * arr.length)];
}

function pickN<T>(arr: T[], n: number, seed: number): T[] {
  const shuffled = [...arr].sort(() => seededRandom(seed++) - 0.5);
  return shuffled.slice(0, n);
}

// ── Seed runner ────────────────────────────────────────────
async function seed() {
  const db = getDb();
  console.log("🌱 Starting rich seed...");

  // 1. Truncate detail tables for a clean re-seed (categories/certificates included so IDs reset 1-8)
  const tablesToTruncate = [
    "chat_messages",
    "search_history",
    "notifications",
    "reviews",
    "favorites",
    "rfqs",
    "factory_certificates",
    "factory_categories",
    "products",
    "factories",
    "users",
    "certificates",
    "categories",
  ];

  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  for (const table of tablesToTruncate) {
    await db.execute(sql`TRUNCATE TABLE ${sql.raw(table)}`);
  }
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
  console.log("✅ Detail tables truncated");

  // 2. Seed reference tables
  await db.insert(schema.categories).values(CATEGORIES);
  console.log("✅ Categories seeded");

  await db.insert(schema.certificates).values(CERTIFICATES);
  console.log("✅ Certificates seeded");

  // 3. Seed users
  const insertedUsers = await db.insert(schema.users).values(
    USERS.map((u, i) => ({
      ...u,
      createdAt: new Date(Date.now() - i * 86400000 * 2),
      updatedAt: new Date(Date.now() - i * 86400000 * 2),
      lastSignInAt: new Date(Date.now() - i * 86400000),
    })),
  );
  const firstUserId = Number(insertedUsers[0].insertId);
  console.log(`✅ Seeded ${USERS.length} users (first id: ${firstUserId})`);

  // 4. Seed factories with links and products
  const factoryIds: number[] = [];
  for (let i = 0; i < FACTORY_TEMPLATES.length; i++) {
    const tpl = FACTORY_TEMPLATES[i];
    const hero = IMAGES_BY_CATEGORY[tpl.categoryId];
    const gallery = [hero, pick(["/images/factory-electronics.jpg", "/images/factory-textile.jpg", "/images/factory-furniture.jpg"], i)];

    const result = await db.insert(schema.factories).values({
      name: tpl.name,
      slug: tpl.slug,
      location: `${tpl.city}, ${tpl.province}, China`,
      city: tpl.city,
      province: tpl.province,
      description: tpl.description,
      descriptionAr: tpl.descriptionAr,
      logoUrl: hero,
      heroImage: hero,
      gallery,
      rating: tpl.rating,
      reviewCount: tpl.reviewCount,
      yearsInBusiness: tpl.yearsInBusiness,
      capacity: tpl.capacity,
      moq: tpl.moq,
      moqValue: tpl.moqValue,
      employees: tpl.employees,
      factorySize: tpl.factorySize,
      isVerified: tpl.isVerified,
      isComplianceCertified: tpl.isComplianceCertified,
      isLeadTimeCertified: tpl.isLeadTimeCertified,
      exportMarkets: tpl.exportMarkets,
      primaryProducts: tpl.primaryProducts,
      website: tpl.website,
      whatsapp: tpl.whatsapp,
      email: tpl.email,
      featured: tpl.featured,
      viewCount: Math.floor(seededRandom(i) * 5000),
      searchCount: Math.floor(seededRandom(i + 100) * 1200),
      createdAt: new Date(Date.now() - i * 86400000 * 3),
      updatedAt: new Date(Date.now() - i * 86400000 * 3),
    });
    const factoryId = Number(result[0].insertId);
    factoryIds.push(factoryId);

    await db.insert(schema.factoryCategories).values({ factoryId, categoryId: Number(tpl.categoryId) });

    const certIds = CERTIFICATE_POOL[tpl.categoryId] ?? [1];
    for (const certId of certIds) {
      await db.insert(schema.factoryCertificates).values({
        factoryId,
        certificateId: Number(certId),
        issuedAt: new Date(Date.now() - seededRandom(i + certId) * 365 * 86400000),
        expiresAt: new Date(Date.now() + seededRandom(i + certId + 1) * 365 * 86400000),
      } as unknown as typeof schema.factoryCertificates.$inferInsert);
    }

    for (let p = 0; p < tpl.primaryProducts.length; p++) {
      await db.insert(schema.products).values({
        factoryId,
        name: tpl.primaryProducts[p],
        nameAr: tpl.primaryProducts[p],
        description: `High-quality ${tpl.primaryProducts[p].toLowerCase()} from ${tpl.name}.`,
        imageUrl: hero,
        priceRange: `$${(seededRandom(i + p) * 100 + 1).toFixed(2)} - $${(seededRandom(i + p) * 500 + 50).toFixed(2)}`,
        moq: tpl.moq,
        createdAt: new Date(Date.now() - i * 86400000 * 3 - p * 3600000),
      } as unknown as typeof schema.products.$inferInsert);
    }
  }
  console.log(`✅ Seeded ${FACTORY_TEMPLATES.length} factories with categories, certificates & products`);

  // 5. Seed RFQs
  const RFQ_STATUSES: (typeof schema.rfqs.$inferInsert.status)[] = ["pending", "sent", "responded", "negotiating", "accepted", "declined"];
  const RFQ_PRODUCTS = [
    "Wireless Earbuds", "Cotton Fabric 200gsm", "Dining Table Set", "Brake Pads", "Face Cream", "CNC Machine", "Sofa Set", "Dried Mango",
    "Ceramic Tiles", "LED Bulbs", "Silk Scarves", "EV Charger", "Halal Shampoo", "Precision Gears", "Granite Slabs", "Smart Watch",
    "Packaging Machine", "Steel Beams", "Body Butter", "Frozen Shrimp",
  ];
  const RFQ_QUANTITIES = ["500 units", "1,000 meters", "50 sets", "200 units", "1,000 units", "2 units", "30 sets", "1,000 kg"];
  const LOCATIONS = ["Riyadh, Saudi Arabia", "Dubai, UAE", "Cairo, Egypt", "Istanbul, Turkey", "Casablanca, Morocco", "Jeddah, Saudi Arabia"];

  for (let i = 0; i < 20; i++) {
    const userId = firstUserId + (i % USERS.length);
    const factoryId = factoryIds[i % factoryIds.length];
    await db.insert(schema.rfqs).values({
      userId,
      factoryId,
      productName: RFQ_PRODUCTS[i % RFQ_PRODUCTS.length],
      quantity: RFQ_QUANTITIES[i % RFQ_QUANTITIES.length],
      specifications: `Looking for ${RFQ_PRODUCTS[i % RFQ_PRODUCTS.length].toLowerCase()} with custom branding and packaging.`,
      targetPrice: `$${(seededRandom(i) * 50 + 5).toFixed(2)} per unit`,
      deliveryLocation: LOCATIONS[i % LOCATIONS.length],
      status: RFQ_STATUSES[i % RFQ_STATUSES.length],
      response: i % 2 === 0 ? "We can meet your requirements. Please confirm final quantity." : undefined,
      responsePrice: i % 2 === 0 ? `$${(seededRandom(i) * 40 + 8).toFixed(2)}` : undefined,
      responseLeadTime: i % 2 === 0 ? "25-30 days" : undefined,
      createdAt: new Date(Date.now() - i * 43200000),
      updatedAt: new Date(Date.now() - i * 43200000 + 3600000),
    });
  }
  console.log("✅ Seeded 20 RFQs");

  // 6. Seed favorites (unique user/factory combos)
  const favCombos = new Set<string>();
  let favCount = 0;
  let seed = 0;
  while (favCount < 20) {
    const userId = firstUserId + Math.floor(seededRandom(seed) * USERS.length);
    const factoryId = factoryIds[Math.floor(seededRandom(seed + 1000) * factoryIds.length)];
    const key = `${userId}-${factoryId}`;
    if (!favCombos.has(key)) {
      favCombos.add(key);
      await db.insert(schema.favorites).values({
        userId,
        factoryId,
        collectionName: pick(["Default", "Shortlist", "Compare", "Projects"], seed + 2000),
        createdAt: new Date(Date.now() - seed * 7200000),
      });
      favCount++;
    }
    seed++;
  }
  console.log("✅ Seeded 20 favorites");

  // 7. Seed reviews
  const REVIEW_COMMENTS = [
    "Great communication and fast sample delivery.",
    "Product quality exceeded expectations.",
    "Good factory but MOQ is a bit high for us.",
    "Professional team, will order again.",
    "Delivery was delayed by one week.",
    "Excellent value for money.",
    "Quality control could be better.",
    "Very responsive on WhatsApp.",
    "Packaging was perfect.",
    "Need more flexibility on payment terms.",
  ];
  const ARABIC_REVIEWS = [
    "تواصل ممتاز وسرعة في إرسال العينات.",
    "جودة المنتج فاقت التوقعات.",
    "مصنع جيد لكن الحد الأدنى للطلب مرتفع.",
    "فريق محترف، سأطلب مرة أخرى.",
    "التسليم تأخر أسبوعاً واحداً.",
    "قيمة ممتازة مقابل السعر.",
    "مراقبة الجودة يمكن أن تكون أفضل.",
    "سريعون جداً في الرد على الواتساب.",
    "التغليف كان مثالياً.",
    "نحتاج مرونة أكثر في شروط الدفع.",
  ];

  for (let i = 0; i < 20; i++) {
    const userId = firstUserId + (i % USERS.length);
    const factoryId = factoryIds[i % factoryIds.length];
    const lang = USERS[i % USERS.length].lang;
    await db.insert(schema.reviews).values({
      userId,
      factoryId,
      rating: Math.floor(seededRandom(i) * 3) + 3, // 3-5
      comment: lang === "ar" ? ARABIC_REVIEWS[i % ARABIC_REVIEWS.length] : REVIEW_COMMENTS[i % REVIEW_COMMENTS.length],
      verifiedPurchase: seededRandom(i + 500) > 0.4,
      createdAt: new Date(Date.now() - i * 86400000),
    });
  }
  console.log("✅ Seeded 20 reviews");

  // 8. Seed notifications (20 per first 3 active users = 60 total)
  const NOTIF_TYPES: (typeof schema.notifications.$inferInsert.type)[] = ["message", "update", "recommendation", "rfq_response", "system"];
  const NOTIFICATIONS = [
    { title: "New RFQ response", titleAr: "رد جديد على طلب عرض سعر", description: "Factory responded to your RFQ for wireless earbuds.", descriptionAr: "رد المصنع على طلب عرض السعر الخاص بسماعات الأذن اللاسلكية.", icon: "message-circle" },
    { title: "Factory verified", titleAr: "تم التحقق من المصنع", description: "A factory you favorited is now verified.", descriptionAr: "أصبح المصنع الذي أضفته للمفضلة موثقاً الآن.", icon: "check-circle" },
    { title: "Price drop alert", titleAr: "تنبيه انخفاض السعر", description: "LED bulbs price dropped by 8%.", descriptionAr: "انخفض سعر مصابيح LED بنسبة 8%.", icon: "trending-down" },
    { title: "Recommended factory", titleAr: "مصنع موصى به", description: "We found 3 new factories matching your search.", descriptionAr: "وجدنا 3 مصانع جديدة تطابق بحثك.", icon: "star" },
    { title: "Order shipped", titleAr: "تم شحن الطلب", description: "Your sample order #1234 has been shipped.", descriptionAr: "تم شحن طلب العينة رقم 1234.", icon: "truck" },
    { title: "System maintenance", titleAr: "صيانة النظام", description: "Scheduled maintenance tonight at 2 AM GST.", descriptionAr: "صيانة مجدولة الليلة في الساعة 2 صباحاً بتوقيت الخليج.", icon: "alert-triangle" },
    { title: "New message", titleAr: "رسالة جديدة", description: "You have a new message from Shanghai Cosmetic Labs.", descriptionAr: "لديك رسالة جديدة من مختبرات مستحضرات التجميل في شنغهاي.", icon: "mail" },
    { title: "Account verified", titleAr: "تم التحقق من الحساب", description: "Your account is now verified.", descriptionAr: "تم التحقق من حسابك الآن.", icon: "shield" },
  ];

  const activeUserIds = [firstUserId, firstUserId + 1, firstUserId + 2];
  let notifCount = 0;
  for (const userId of activeUserIds) {
    const lang = USERS[(userId - firstUserId) % USERS.length].lang;
    for (let i = 0; i < 20; i++) {
      const idx = notifCount;
      const notif = NOTIFICATIONS[idx % NOTIFICATIONS.length];
      await db.insert(schema.notifications).values({
        userId,
        type: NOTIF_TYPES[idx % NOTIF_TYPES.length],
        title: lang === "ar" && notif.titleAr ? notif.titleAr : notif.title,
        titleAr: notif.titleAr,
        description: lang === "ar" && notif.descriptionAr ? notif.descriptionAr : notif.description,
        descriptionAr: notif.descriptionAr,
        icon: notif.icon,
        link: idx % 3 === 0 ? "/rfqs" : idx % 3 === 1 ? "/favorites" : "/factories",
        isRead: seededRandom(idx + 3000) > 0.6,
        createdAt: new Date(Date.now() - idx * 3600000),
      });
      notifCount++;
    }
  }
  console.log(`✅ Seeded ${notifCount} notifications (${20} per ${activeUserIds.length} users)`);

  // 9. Seed chat messages (realistic sourcing conversations)
  const CHAT_USERS = [firstUserId, firstUserId + 1, firstUserId + 2, firstUserId + 3];
  const chatTurns: { role: "user" | "assistant"; content: string; factoriesSuggested?: number[] }[][] = [
    [
      { role: "user", content: "I need a reliable factory for wireless earbuds with custom logo, MOQ under 500." },
      { role: "assistant", content: "I found verified electronics factories in Shenzhen. TechPro and Smart Electronics both accept 100-200 unit MOQs." },
      { role: "user", content: "Can you compare their pricing and lead time?" },
      { role: "assistant", content: "TechPro: $8.5/unit, 25 days. Smart Electronics: $7.2/unit, 30 days. Both offer custom packaging." },
    ],
    [
      { role: "user", content: "Looking for organic cotton fabric suppliers for a clothing brand." },
      { role: "assistant", content: "Ningbo Silk Road Textiles and Suzhou Elegance Textiles both carry GOTS-certified organic cotton." },
      { role: "user", content: "Which one has faster sampling?" },
      { role: "assistant", content: "Suzhou Elegance averages 5 days for samples; Silk Road is 7 days." },
    ],
    [
      { role: "user", content: "I want to import ceramic tiles to Saudi Arabia, need CE certificate." },
      { role: "assistant", content: "Suzhou BuildMax has CE-marked ceramic tiles and experience shipping to the Middle East." },
      { role: "user", content: "What is their typical lead time to Jeddah?" },
      { role: "assistant", content: "Production 20 days + sea freight 25 days to Jeddah. Total around 45-50 days." },
    ],
    [
      { role: "user", content: "Need halal cosmetics OEM for shampoo and body lotion." },
      { role: "assistant", content: "Guangzhou Beauty Creations and Hangzhou Nature Cosmetics offer halal-certified personal care OEM." },
      { role: "user", content: "Send me their MOQs please." },
      { role: "assistant", content: "Beauty Creations: 500 units. Nature Cosmetics: 300 units per SKU." },
    ],
    [
      { role: "user", content: "Find me a packaging machinery supplier for food pouches." },
      { role: "assistant", content: "Shanghai FoodPack Solutions and Shenzhen GreenPack Machinery both manufacture filling and sealing machines." },
      { role: "user", content: "Do they provide installation support?" },
      { role: "assistant", content: "Yes, both offer English-speaking engineers for installation and training." },
    ],
  ];

  let chatCount = 0;
  for (const userId of CHAT_USERS) {
    for (const turn of chatTurns) {
      for (let t = 0; t < turn.length; t++) {
        const msg = turn[t];
        const suggested = msg.factoriesSuggested ??
          (msg.role === "assistant"
            ? pickN(factoryIds, 2, chatCount + userId)
            : undefined);
        await db.insert(schema.chatMessages).values({
          userId,
          role: msg.role,
          content: msg.content,
          factoriesSuggested: suggested,
          createdAt: new Date(Date.now() - (20 - chatCount) * 900000),
        });
        chatCount++;
      }
    }
  }
  console.log(`✅ Seeded ${chatCount} chat messages`);

  // 10. Seed search history
  const SEARCH_QUERIES = [
    "wireless earbuds factory shenzhen",
    "organic cotton fabric supplier",
    "ceramic tiles exporter china",
    "halal cosmetics OEM",
    "food packaging machine",
    "furniture factory foshan",
    "auto parts manufacturer dongguan",
    "CNC machine supplier ningbo",
    "LED lighting factory wenzhou",
    "textile supplier guangzhou",
    "frozen seafood processing",
    "construction steel beams",
    "smart home devices OEM",
    "perfume manufacturer shanghai",
    "dried fruits supplier xiamen",
    "granite slabs exporter",
    "electric vehicle charger factory",
    "packaging pouches supplier",
    "wooden dining table manufacturer",
    "brake pads wholesale china",
  ];

  for (let i = 0; i < 20; i++) {
    const userId = i % 3 === 0 ? null : firstUserId + (i % USERS.length);
    await db.insert(schema.searchHistory).values({
      userId,
      query: SEARCH_QUERIES[i % SEARCH_QUERIES.length],
      filters: {
        category: i % 3 === 0 ? undefined : FACTORY_TEMPLATES[i % FACTORY_TEMPLATES.length].categoryId,
        city: i % 2 === 0 ? FACTORY_TEMPLATES[i % FACTORY_TEMPLATES.length].city : undefined,
      },
      resultCount: Math.floor(seededRandom(i + 10000) * 50) + 1,
      createdAt: new Date(Date.now() - i * 1800000),
    });
  }
  console.log("✅ Seeded 20 search history entries");

  console.log("🎉 Rich seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
