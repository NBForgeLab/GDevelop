import { isNotificationDisplayable } from './NotificationListItem';
import { type Notification } from '../../Utils/GDevelopServices/Notification';

describe('isNotificationDisplayable', () => {
  it('displays known notifications', () => {
    expect(
      isNotificationDisplayable({
        id: 'notification-1',
        userId: 'user-1',
        createdAt: 1,
        type: 'claimable-game-template',
        data: {
          privateGameTemplateId: 'game-template-1',
          privateGameTemplateName: 'My template',
        },
      })
    ).toBe(true);
  });

  it('does not display notifications of a type unknown to this version', () => {
    expect(
      isNotificationDisplayable(
        // Type sent by a newer backend.
        {
          id: 'notification-2',
          userId: 'user-1',
          createdAt: 1,
          type: 'some-future-type',
          data: {},
        } as unknown as Notification
      )
    ).toBe(false);
  });
});
