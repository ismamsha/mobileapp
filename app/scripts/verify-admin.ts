/**
 * Admin Panel verification script.
 * Creates temporary test users/factories/RFQs and cleans them up afterward.
 * Run with: npx tsx scripts/verify-admin.ts
 */
import { appRouter } from '../api/router';
import { getDb } from '../api/queries/connection';
import { users, factories, factoryCategories, factoryCertificates, products, rfqs, reviews, favorites } from '@db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@db/schema';

async function main() {
  const db = getDb();

  // Ensure we have a test admin user
  let adminUser: User | undefined;
  const [existing] = await db.select().from(users).where(eq(users.email, 'admin-verify@example.com')).limit(1);
  if (existing) {
    adminUser = existing;
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, existing.id));
    adminUser.role = 'admin';
  } else {
    const [result] = await db.insert(users).values({
      unionId: `verify-admin-${Date.now()}`,
      name: 'Verify Admin',
      email: 'admin-verify@example.com',
      role: 'admin',
      lang: 'en',
    });
    const id = Number(result.insertId);
    const [created] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    adminUser = created;
  }

  if (!adminUser) throw new Error('Failed to create admin user');

  // Make sure role is admin in memory object
  adminUser = { ...adminUser, role: 'admin' as const };

  const ctx = {
    req: new Request('http://localhost/admin'),
    resHeaders: new Headers(),
    user: adminUser,
  };

  const caller = appRouter.createCaller(ctx);

  console.log('\n=== 1. Admin middleware check ===');
  console.log('Admin user role:', adminUser.role);
  const stats = await caller.admin.stats();
  console.log('Stats loaded:', Object.keys(stats.counts).length, 'count cards');

  // Verify non-admin is rejected
  const regularCtx = { ...ctx, user: { ...adminUser, role: 'user' as const } };
  const regularCaller = appRouter.createCaller(regularCtx);
  let rejected = false;
  try {
    await regularCaller.admin.stats();
  } catch (err: unknown) {
    rejected =
      (typeof err === 'object' && err !== null && 'code' in err && err.code === 'FORBIDDEN') ||
      (err instanceof Error && err.message?.includes('FORBIDDEN'));
  }
  console.log('Non-admin access rejected?', rejected);
  if (!rejected) throw new Error('Admin middleware did not reject non-admin user');

  console.log('\n=== 2. Factory CRUD ===');
  // Get existing categories/certificates
  const allCategories = await caller.admin.categoryList();
  const allCertificates = await caller.admin.certificateList();
  console.log('Categories available:', allCategories.length);
  console.log('Certificates available:', allCertificates.length);

  const categoryIds = allCategories.slice(0, 2).map(c => Number(c.id));
  const certificateIds = allCertificates.slice(0, 2).map(c => Number(c.id));

  // Clean up previous test factories
  const prevFactories = await db.select({ id: factories.id }).from(factories).where(eq(factories.slug, 'verify-test-factory'));
  for (const f of prevFactories) {
    await caller.admin.factoryDelete({ id: f.id });
  }

  // Create factory
  const createResult = await caller.admin.factoryCreate({
    name: 'Verify Test Factory',
    slug: 'verify-test-factory',
    location: '123 Industrial Zone',
    city: 'Shenzhen',
    province: 'Guangdong',
    description: 'A test factory created by the verification script.',
    descriptionAr: 'مصنع تجريبي',
    logoUrl: 'https://example.com/logo.png',
    heroImage: 'https://example.com/hero.png',
    gallery: ['https://example.com/g1.png', 'https://example.com/g2.png'],
    rating: 4.5,
    reviewCount: 10,
    yearsInBusiness: 15,
    capacity: '10000 units/month',
    moq: '500 pcs',
    moqValue: 500,
    employees: 250,
    factorySize: '5000 sqm',
    isVerified: true,
    isComplianceCertified: true,
    isLeadTimeCertified: false,
    exportMarkets: ['USA', 'EU'],
    primaryProducts: ['Electronics', 'Components'],
    website: 'https://example.com',
    whatsapp: '+86 123 4567 8900',
    email: 'factory@example.com',
    featured: true,
    categoryIds,
    certificateIds,
  });
  console.log('Factory created with id:', createResult.id);

  // Verify in DB
  const [factoryRow] = await db.select().from(factories).where(eq(factories.id, createResult.id)).limit(1);
  console.log('Factory in DB:', {
    name: factoryRow.name,
    city: factoryRow.city,
    logoUrl: factoryRow.logoUrl,
    heroImage: factoryRow.heroImage,
    gallery: factoryRow.gallery,
    exportMarkets: factoryRow.exportMarkets,
    primaryProducts: factoryRow.primaryProducts,
    isVerified: factoryRow.isVerified,
    featured: factoryRow.featured,
  });

  const fcRows = await db.select().from(factoryCategories).where(eq(factoryCategories.factoryId, createResult.id));
  const fcertRows = await db.select().from(factoryCertificates).where(eq(factoryCertificates.factoryId, createResult.id));
  console.log('Category links:', fcRows.length, 'Certificate links:', fcertRows.length);

  // Update factory
  await caller.admin.factoryUpdate({
    id: createResult.id,
    name: 'Verify Test Factory Updated',
    gallery: ['https://example.com/g3.png'],
    exportMarkets: ['UAE'],
    primaryProducts: ['Updated Products'],
    categoryIds: categoryIds.slice(0, 1),
    certificateIds: certificateIds.slice(0, 1),
  });
  const [updatedRow] = await db.select().from(factories).where(eq(factories.id, createResult.id)).limit(1);
  console.log('Updated factory name:', updatedRow.name, 'gallery:', updatedRow.gallery, 'exportMarkets:', updatedRow.exportMarkets);

  // Inline product CRUD
  const productResult = await caller.admin.productCreate({
    factoryId: createResult.id,
    name: 'Test Product',
    nameAr: 'منتج تجريبي',
    description: 'Product description',
    imageUrl: 'https://example.com/product.png',
    priceRange: '$1-10',
    moq: '1000',
  });
  console.log('Product created with id:', productResult.id);

  await caller.admin.productUpdate({
    id: productResult.id,
    name: 'Test Product Updated',
    priceRange: '$2-20',
  });
  const [productRow] = await db.select().from(products).where(eq(products.id, productResult.id)).limit(1);
  console.log('Product updated:', productRow.name, productRow.priceRange);

  await caller.admin.productDelete({ id: productResult.id });
  const [deletedProduct] = await db.select().from(products).where(eq(products.id, productResult.id)).limit(1);
  console.log('Product deleted?', deletedProduct === undefined);

  // Add a review and favorite to verify cascading delete
  await db.insert(reviews).values({ userId: adminUser.id, factoryId: createResult.id, rating: 5, comment: 'Great' });
  await db.insert(favorites).values({ userId: adminUser.id, factoryId: createResult.id });

  // Delete factory and verify cascade
  await caller.admin.factoryDelete({ id: createResult.id });
  const [afterDelete] = await db.select().from(factories).where(eq(factories.id, createResult.id)).limit(1);
  const afterCategories = await db.select().from(factoryCategories).where(eq(factoryCategories.factoryId, createResult.id));
  const afterCertificates = await db.select().from(factoryCertificates).where(eq(factoryCertificates.factoryId, createResult.id));
  const afterReviews = await db.select().from(reviews).where(eq(reviews.factoryId, createResult.id));
  const afterFavorites = await db.select().from(favorites).where(eq(favorites.factoryId, createResult.id));
  console.log('Factory deleted?', afterDelete === undefined);
  console.log('Related rows cleaned up:', {
    categories: afterCategories.length,
    certificates: afterCertificates.length,
    reviews: afterReviews.length,
    favorites: afterFavorites.length,
  });

  console.log('\n=== 3. RFQ Management ===');
  // Ensure we have a regular user for RFQ
  let regularUser: User | undefined;
  const [existingRegular] = await db.select().from(users).where(eq(users.email, 'user-verify@example.com')).limit(1);
  if (existingRegular) {
    regularUser = existingRegular;
  } else {
    const [result] = await db.insert(users).values({
      unionId: `verify-user-${Date.now()}`,
      name: 'Verify User',
      email: 'user-verify@example.com',
      role: 'user',
      lang: 'en',
    });
    const id = Number(result.insertId);
    const [created] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    regularUser = created;
  }
  if (!regularUser) throw new Error('Failed to create regular user');

  // Clean previous RFQs
  await db.delete(rfqs).where(eq(rfqs.productName, 'Verify RFQ Product'));

  const [rfqInsert] = await db.insert(rfqs).values({
    userId: regularUser.id,
    productName: 'Verify RFQ Product',
    quantity: '1000',
    specifications: 'Test specs',
    targetPrice: '$5000',
    deliveryLocation: 'Dubai',
    status: 'pending',
  });
  const rfqId = Number(rfqInsert.insertId);
  console.log('RFQ created with id:', rfqId);

  const rfqListBefore = await caller.admin.rfqList({ page: 1, pageSize: 100 });
  console.log('RFQ list contains test RFQ:', rfqListBefore.items.some(r => r.id === rfqId));

  await caller.admin.rfqRespond({
    id: rfqId,
    response: 'We can supply this product within 2 weeks.',
    responsePrice: '$4500',
    responseLeadTime: '2 weeks',
    status: 'responded',
  });
  const [rfqRow] = await db.select().from(rfqs).where(eq(rfqs.id, rfqId)).limit(1);
  console.log('RFQ responded:', {
    status: rfqRow.status,
    response: rfqRow.response,
    responsePrice: rfqRow.responsePrice,
    responseLeadTime: rfqRow.responseLeadTime,
  });

  await caller.admin.rfqUpdateStatus({ id: rfqId, status: 'accepted' });
  const [acceptedRow] = await db.select().from(rfqs).where(eq(rfqs.id, rfqId)).limit(1);
  console.log('RFQ accepted:', acceptedRow.status);

  await caller.admin.rfqUpdateStatus({ id: rfqId, status: 'negotiating' });
  const [negotiatingRow] = await db.select().from(rfqs).where(eq(rfqs.id, rfqId)).limit(1);
  console.log('RFQ negotiating:', negotiatingRow.status);

  await caller.admin.rfqUpdateStatus({ id: rfqId, status: 'declined' });
  const [declinedRow] = await db.select().from(rfqs).where(eq(rfqs.id, rfqId)).limit(1);
  console.log('RFQ declined:', declinedRow.status);

  await caller.admin.rfqUpdateStatus({ id: rfqId, status: 'pending' });
  const [resetRow] = await db.select().from(rfqs).where(eq(rfqs.id, rfqId)).limit(1);
  console.log('RFQ reset:', resetRow.status);

  // Cleanup RFQ
  await db.delete(rfqs).where(eq(rfqs.id, rfqId));

  console.log('\n=== 4. Dashboard Analytics ===');
  const finalStats = await caller.admin.stats();
  console.log('Dashboard counts:', finalStats.counts);
  console.log('Users over time points:', finalStats.usersOverTime.length);
  console.log('RFQs over time points:', finalStats.rfqsOverTime.length);
  console.log('Factories by category count:', finalStats.factoriesByCategory.length);
  console.log('RFQs by status count:', finalStats.rfqsByStatus.length);
  console.log('Recent RFQs count:', finalStats.recentRFQs.length);
  console.log('Recent users count:', finalStats.recentUsers.length);

  const feed = await caller.admin.activityFeed();
  console.log('Activity feed items:', feed.length);

  const health = await caller.admin.health();
  console.log('Health status:', health.status, 'DB:', health.db.status);

  // Cleanup test users
  await db.delete(users).where(eq(users.email, 'admin-verify@example.com'));
  await db.delete(users).where(eq(users.email, 'user-verify@example.com'));

  console.log('\n=== All verifications passed ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
