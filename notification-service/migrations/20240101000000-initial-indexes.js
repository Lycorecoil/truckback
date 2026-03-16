/**
 * Migration initiale : indexes sur les collections du notification-service
 */
module.exports = {
  async up(db) {
    await db.collection('notifications').createIndex(
      { recipientId: 1 },
      { name: 'notifications_recipientId' },
    );
    await db.collection('notifications').createIndex(
      { createdAt: -1 },
      { name: 'notifications_createdAt_desc' },
    );
    await db.collection('notifications').createIndex(
      { status: 1 },
      { name: 'notifications_status' },
    );
    await db.collection('notificationtemplates').createIndex(
      { name: 1 },
      { unique: true, name: 'templates_name_unique' },
    );
  },

  async down(db) {
    await db.collection('notifications').dropIndex('notifications_recipientId');
    await db.collection('notifications').dropIndex('notifications_createdAt_desc');
    await db.collection('notifications').dropIndex('notifications_status');
    await db.collection('notificationtemplates').dropIndex('templates_name_unique');
  },
};
