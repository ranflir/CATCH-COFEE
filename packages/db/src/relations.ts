import { relations } from 'drizzle-orm';
import { users } from './schema/users';
import { brands } from './schema/brands';
import { cafes } from './schema/cafes';
import { discounts } from './schema/discounts';
import { discountReports, reportConfirmations } from './schema/reports';
import { paymentMethods, favorites, paymentAlerts } from './schema/payments';
import { userDevices, notifications } from './schema/notifications';
import { crawlSources, crawlLogs, crawlCandidates } from './schema/crawl';
import { auditLogs } from './schema/audit';

export const usersRelations = relations(users, ({ many }) => ({
  ownedCafes: many(cafes),
  reports: many(discountReports),
  confirmations: many(reportConfirmations),
  paymentMethods: many(paymentMethods),
  favorites: many(favorites),
  paymentAlerts: many(paymentAlerts),
  devices: many(userDevices),
  notifications: many(notifications),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  cafes: many(cafes),
  crawlSources: many(crawlSources),
}));

export const cafesRelations = relations(cafes, ({ one, many }) => ({
  brand: one(brands, { fields: [cafes.brandId], references: [brands.id] }),
  owner: one(users, { fields: [cafes.ownerId], references: [users.id] }),
  discounts: many(discounts),
  reports: many(discountReports),
  favorites: many(favorites),
}));

export const discountsRelations = relations(discounts, ({ one }) => ({
  cafe: one(cafes, { fields: [discounts.cafeId], references: [cafes.id] }),
  createdBy: one(users, { fields: [discounts.createdById], references: [users.id] }),
  report: one(discountReports, {
    fields: [discounts.reportId],
    references: [discountReports.id],
  }),
}));

export const discountReportsRelations = relations(discountReports, ({ one, many }) => ({
  cafe: one(cafes, { fields: [discountReports.cafeId], references: [cafes.id] }),
  reporter: one(users, { fields: [discountReports.reporterId], references: [users.id] }),
  confirmations: many(reportConfirmations),
}));

export const reportConfirmationsRelations = relations(reportConfirmations, ({ one }) => ({
  report: one(discountReports, {
    fields: [reportConfirmations.reportId],
    references: [discountReports.id],
  }),
  user: one(users, { fields: [reportConfirmations.userId], references: [users.id] }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, { fields: [paymentMethods.userId], references: [users.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  cafe: one(cafes, { fields: [favorites.cafeId], references: [cafes.id] }),
}));

export const paymentAlertsRelations = relations(paymentAlerts, ({ one }) => ({
  user: one(users, { fields: [paymentAlerts.userId], references: [users.id] }),
}));

export const userDevicesRelations = relations(userDevices, ({ one }) => ({
  user: one(users, { fields: [userDevices.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const crawlSourcesRelations = relations(crawlSources, ({ one, many }) => ({
  brand: one(brands, { fields: [crawlSources.brandId], references: [brands.id] }),
  logs: many(crawlLogs),
  candidates: many(crawlCandidates),
}));

export const crawlLogsRelations = relations(crawlLogs, ({ one }) => ({
  source: one(crawlSources, { fields: [crawlLogs.sourceId], references: [crawlSources.id] }),
}));

export const crawlCandidatesRelations = relations(crawlCandidates, ({ one }) => ({
  source: one(crawlSources, {
    fields: [crawlCandidates.sourceId],
    references: [crawlSources.id],
  }),
  cafe: one(cafes, { fields: [crawlCandidates.cafeId], references: [cafes.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorId], references: [users.id] }),
}));
