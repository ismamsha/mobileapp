import { getDb } from "../api/queries/connection";
import {
  categories,
  factories,
  products,
  certificates,
  factoryCertificates,
  factoryCategories,
} from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // ── Categories ──────────────────────────────────────────
  await db.insert(categories).values([
    { nameEn: "Electronics", nameAr: "إلكترونيات", icon: "smartphone", sortOrder: 1 },
    { nameEn: "Textiles", nameAr: "منسوجات", icon: "shirt", sortOrder: 2 },
    { nameEn: "Machinery", nameAr: "آلات", icon: "cog", sortOrder: 3 },
    { nameEn: "Furniture", nameAr: "أثاث", icon: "armchair", sortOrder: 4 },
    { nameEn: "Auto Parts", nameAr: "قطع سيارات", icon: "car", sortOrder: 5 },
    { nameEn: "Cosmetics", nameAr: "مستحضرات", icon: "sparkles", sortOrder: 6 },
    { nameEn: "Food & Beverage", nameAr: "أغذية ومشروبات", icon: "coffee", sortOrder: 7 },
    { nameEn: "Construction", nameAr: "مواد بناء", icon: "hammer", sortOrder: 8 },
  ]);
  console.log("Categories seeded");

  // ── Certificates ────────────────────────────────────────
  await db.insert(certificates).values([
    { name: "ISO 9001:2015", type: "Quality Management", icon: "shield" },
    { name: "ISO 14001:2015", type: "Environmental Management", icon: "leaf" },
    { name: "BSCI", type: "Business Social Compliance Initiative", icon: "users" },
    { name: "CE Marking", type: "European Conformity", icon: "check-circle" },
    { name: "FDA Registered", type: "US Food & Drug Administration", icon: "heart-pulse" },
    { name: "RoHS Compliant", type: "Restriction of Hazardous Substances", icon: "recycle" },
    { name: "REACH Compliant", type: "Chemical Safety (EU)", icon: "flask" },
    { name: "GOTS", type: "Global Organic Textile Standard", icon: "sprout" },
  ]);
  console.log("Certificates seeded");

  // ── Factories ───────────────────────────────────────────
  const factoryData = [
    {
      name: "Shenzhen TechPro Electronics Co., Ltd.",
      slug: "shenzhen-techpro-electronics",
      location: "Shenzhen, Guangdong, China",
      city: "Shenzhen",
      province: "Guangdong",
      description: "Leading manufacturer of consumer electronics with over 12 years of experience. Specializing in wireless audio devices, charging solutions, and mobile accessories. Our 50,000 sqm facility features 12 automated SMT lines and employs over 2,000 skilled workers.",
      descriptionAr: "شركة رائدة في تصنيع الإلكترونيات الاستهلاكية مع أكثر من 12 عاماً من الخبرة. متخصصون في أجهزة الصوت اللاسلكية وشواحن الهواتف وملحقات الجوال.",
      heroImage: "/images/factory-electronics.jpg",
      gallery: ["/images/factory-electronics.jpg", "/images/factory-textile.jpg"],
      rating: 4.8,
      reviewCount: 124,
      yearsInBusiness: 12,
      capacity: "500K units/month",
      moq: "100 units",
      moqValue: 100,
      employees: 2000,
      factorySize: "50,000 sqm",
      isVerified: true,
      isComplianceCertified: true,
      isLeadTimeCertified: true,
      exportMarkets: ["USA", "EU", "Middle East", "Southeast Asia", "Africa"],
      primaryProducts: ["Wireless Earbuds", "USB-C Cables", "Fast Chargers", "Power Banks"],
      website: "https://techpro-cn.com",
      whatsapp: "+86-755-8888-1001",
      email: "sales@techpro-cn.com",
      featured: true,
    },
    {
      name: "Guangzhou Textile Mills Co., Ltd.",
      slug: "guangzhou-textile-mills",
      location: "Guangzhou, Guangdong, China",
      city: "Guangzhou",
      province: "Guangdong",
      description: "Premium textile manufacturer producing high-quality cotton, silk, and synthetic fabrics. Our state-of-the-art weaving facility serves fashion brands worldwide with sustainable production practices.",
      descriptionAr: "مصنع منسوجات متميز ينتج أقمشة قطنية عالية الجودة وحريرية وصناعية. منشأة النسج المتطورة لدينا تخدم علامات الأزياء في جميع أنحاء العالم.",
      heroImage: "/images/factory-textile.jpg",
      gallery: ["/images/factory-textile.jpg"],
      rating: 4.6,
      reviewCount: 89,
      yearsInBusiness: 8,
      capacity: "2M meters/month",
      moq: "500 meters",
      moqValue: 500,
      employees: 800,
      factorySize: "30,000 sqm",
      isVerified: true,
      isComplianceCertified: true,
      isLeadTimeCertified: false,
      exportMarkets: ["EU", "USA", "Middle East", "Japan"],
      primaryProducts: ["Cotton Fabric", "Silk", "Polyester", "Linen Blends"],
      website: "https://gztextile.com",
      whatsapp: "+86-20-8888-2002",
      email: "export@gztextile.com",
      featured: true,
    },
    {
      name: "Hangzhou WoodCraft Furniture Co., Ltd.",
      slug: "hangzhou-woodcraft-furniture",
      location: "Hangzhou, Zhejiang, China",
      city: "Hangzhou",
      province: "Zhejiang",
      description: "Master craftsmen creating premium solid wood furniture since 2010. Specializing in oak, walnut, and bamboo furniture for residential and hospitality markets. FSC-certified sustainable sourcing.",
      descriptionAr: "حرفيون ماهرون يصنعون أثاثاً خشبياً صلباً فاخراً منذ عام 2010. متخصصون في أثاث البلوط والجوز والخيزران للأسواق السكنية والفندقية.",
      heroImage: "/images/factory-furniture.jpg",
      gallery: ["/images/factory-furniture.jpg", "/images/factory-electronics.jpg"],
      rating: 4.9,
      reviewCount: 156,
      yearsInBusiness: 15,
      capacity: "50K pieces/month",
      moq: "50 pieces",
      moqValue: 50,
      employees: 1200,
      factorySize: "40,000 sqm",
      isVerified: true,
      isComplianceCertified: true,
      isLeadTimeCertified: true,
      exportMarkets: ["USA", "EU", "Australia", "Middle East"],
      primaryProducts: ["Dining Tables", "Chairs", "Cabinets", "Bed Frames", "Sofas"],
      website: "https://woodcraft-hz.com",
      whatsapp: "+86-571-8888-3003",
      email: "global@woodcraft-hz.com",
      featured: true,
    },
    {
      name: "Dongguan AutoParts Hub Manufacturing",
      slug: "dongguan-autoparts-hub",
      location: "Dongguan, Guangdong, China",
      city: "Dongguan",
      province: "Guangdong",
      description: "Precision auto parts manufacturer specializing in brake systems, suspension components, and engine parts. IATF 16949 certified with CNC machining capabilities.",
      descriptionAr: "مصنع دقيق لقطع غيار السيارات متخصص في أنظمة الفرامل ومكونات التعليق وقطع المحرك.",
      heroImage: "/images/factory-electronics.jpg",
      gallery: ["/images/factory-electronics.jpg"],
      rating: 4.5,
      reviewCount: 67,
      yearsInBusiness: 6,
      capacity: "200K units/month",
      moq: "200 units",
      moqValue: 200,
      employees: 600,
      factorySize: "25,000 sqm",
      isVerified: false,
      isComplianceCertified: true,
      isLeadTimeCertified: false,
      exportMarkets: ["Middle East", "Africa", "Southeast Asia"],
      primaryProducts: ["Brake Pads", "Shock Absorbers", "Filters", "Bearings"],
      website: "https://dgautoparts.com",
      whatsapp: "+86-769-8888-4004",
      email: "sales@dgautoparts.com",
      featured: false,
    },
    {
      name: "Shanghai Cosmetic Labs Co., Ltd.",
      slug: "shanghai-cosmetic-labs",
      location: "Shanghai, China",
      city: "Shanghai",
      province: "Shanghai",
      description: "GMP-certified cosmetics manufacturer offering OEM/ODM services for skincare, haircare, and makeup products. ISO 22716 certified with in-house R&D laboratory.",
      descriptionAr: "مصنع مستحضرات تجميل معتمد من GMP يقدم خدمات OEM/ODM للعناية بالبشرة والشعر والمكياج.",
      heroImage: "/images/factory-textile.jpg",
      gallery: ["/images/factory-textile.jpg", "/images/factory-furniture.jpg"],
      rating: 4.7,
      reviewCount: 93,
      yearsInBusiness: 10,
      capacity: "1M units/month",
      moq: "1,000 units",
      moqValue: 1000,
      employees: 500,
      factorySize: "20,000 sqm",
      isVerified: true,
      isComplianceCertified: true,
      isLeadTimeCertified: true,
      exportMarkets: ["USA", "EU", "Middle East", "Southeast Asia"],
      primaryProducts: ["Skincare", "Haircare", "Makeup", "Fragrances"],
      website: "https://shcosmeticlabs.com",
      whatsapp: "+86-21-8888-5005",
      email: "oem@shcosmeticlabs.com",
      featured: true,
    },
    {
      name: "Ningbo Machinery Works Co., Ltd.",
      slug: "ningbo-machinery-works",
      location: "Ningbo, Zhejiang, China",
      city: "Ningbo",
      province: "Zhejiang",
      description: "Industrial machinery manufacturer specializing in CNC machines, injection molding equipment, and packaging machinery. CE certified with export experience to 40+ countries.",
      descriptionAr: "مصنع آلات صناعية متخصص في ماكينات CNC ومعدات حقن القوالب وآلات التعبئة.",
      heroImage: "/images/factory-furniture.jpg",
      gallery: ["/images/factory-furniture.jpg"],
      rating: 4.4,
      reviewCount: 45,
      yearsInBusiness: 18,
      capacity: "500 units/month",
      moq: "1 unit",
      moqValue: 1,
      employees: 1500,
      factorySize: "60,000 sqm",
      isVerified: true,
      isComplianceCertified: true,
      isLeadTimeCertified: false,
      exportMarkets: ["EU", "Russia", "Middle East", "South America"],
      primaryProducts: ["CNC Machines", "Injection Molders", "Packaging Lines"],
      website: "https://nbmachinery.com",
      whatsapp: "+86-574-8888-6006",
      email: "export@nbmachinery.com",
      featured: false,
    },
    {
      name: "Foshan Modern Living Furniture",
      slug: "foshan-modern-living",
      location: "Foshan, Guangdong, China",
      city: "Foshan",
      province: "Guangdong",
      description: "Modern furniture manufacturer specializing in contemporary designs for residential and commercial spaces. Known for innovative designs and sustainable materials.",
      descriptionAr: "مصنع أثاث حديث متخصص في التصاميم المعاصرة للمساحات السكنية والتجارية.",
      heroImage: "/images/factory-furniture.jpg",
      gallery: ["/images/factory-furniture.jpg"],
      rating: 4.7,
      reviewCount: 78,
      yearsInBusiness: 9,
      capacity: "30K pieces/month",
      moq: "30 pieces",
      moqValue: 30,
      employees: 900,
      factorySize: "35,000 sqm",
      isVerified: true,
      isComplianceCertified: true,
      isLeadTimeCertified: true,
      exportMarkets: ["USA", "EU", "Australia", "Middle East"],
      primaryProducts: ["Sofas", "Coffee Tables", "TV Stands", "Bookshelves"],
      website: "https://foshanmodern.com",
      whatsapp: "+86-757-8888-7007",
      email: "sales@foshanmodern.com",
      featured: true,
    },
    {
      name: "Xiamen FoodTech Processing Co.",
      slug: "xiamen-foodtech-processing",
      location: "Xiamen, Fujian, China",
      city: "Xiamen",
      province: "Fujian",
      description: "HACCP and ISO 22000 certified food processing facility. Specializing in dried fruits, nuts, seafood processing, and health food products.",
      descriptionAr: "منشأة معالجة أغذية معتمدة من HACCP وISO 22000. متخصصون في الفواكه المجففة والمكسرات ومعالجة المأكولات البحرية.",
      heroImage: "/images/factory-textile.jpg",
      gallery: ["/images/factory-textile.jpg"],
      rating: 4.3,
      reviewCount: 34,
      yearsInBusiness: 7,
      capacity: "100K tons/year",
      moq: "500 kg",
      moqValue: 500,
      employees: 400,
      factorySize: "15,000 sqm",
      isVerified: true,
      isComplianceCertified: true,
      isLeadTimeCertified: false,
      exportMarkets: ["EU", "USA", "Japan", "Southeast Asia"],
      primaryProducts: ["Dried Fruits", "Nuts", "Seaweed", "Health Snacks"],
      website: "https://xmfoodtech.com",
      whatsapp: "+86-592-8888-8008",
      email: "export@xmfoodtech.com",
      featured: false,
    },
  ];

  for (const f of factoryData) {
    const result = await db.insert(factories).values(f as unknown as typeof factories.$inferInsert);
    const factoryId = Number(result[0].insertId);

    // Determine category from primary products
    let catId = 1;
    if (f.primaryProducts.some(p => ["Wireless", "USB", "Charger", "Power"].some(k => p.includes(k)))) catId = 1;
    else if (f.primaryProducts.some(p => ["Cotton", "Silk", "Polyester"].some(k => p.includes(k)))) catId = 2;
    else if (f.primaryProducts.some(p => ["CNC", "Injection", "Packaging"].some(k => p.includes(k)))) catId = 3;
    else if (f.primaryProducts.some(p => ["Table", "Chair", "Cabinet", "Bed", "Sofa", "Bookshelf"].some(k => p.includes(k)))) catId = 4;
    else if (f.primaryProducts.some(p => ["Brake", "Shock", "Filter", "Bearing"].some(k => p.includes(k)))) catId = 5;
    else if (f.primaryProducts.some(p => ["Skincare", "Haircare", "Makeup", "Fragrance"].some(k => p.includes(k)))) catId = 6;
    else if (f.primaryProducts.some(p => ["Dried", "Nuts", "Seaweed", "Snack"].some(k => p.includes(k)))) catId = 7;

    await db.insert(factoryCategories).values({ factoryId, categoryId: catId });

    // Add products
    for (const productName of f.primaryProducts) {
      await db.insert(products).values({
        factoryId,
        name: productName,
        description: `High-quality ${productName.toLowerCase()} from ${f.name}`,
        imageUrl: `/images/product-${catId === 1 ? 'electronics' : catId === 2 ? 'textile' : 'furniture'}.jpg`,
      });
    }

    // Add certificates
    const certIds = f.isVerified ? [1, 2, 3] : f.isComplianceCertified ? [1, 2] : [1];
    for (const certId of certIds) {
      await db.insert(factoryCertificates).values({
        factoryId,
        certificateId: certId,
        issuedAt: new Date(),
      });
    }
  }

  console.log("Factories, products, categories, and certificates seeded");
  console.log("Seed complete!");
}

seed().catch(console.error);
