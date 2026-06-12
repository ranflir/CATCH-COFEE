import {
  chunk,
  buildExpoMessages,
  sendExpoPush,
  collectInvalidTokensFromTickets,
  collectInvalidTokensFromReceipts,
  type ExpoMessage,
  type ExpoPushTicket,
} from './push';

describe('push', () => {
  describe('chunk', () => {
    it('지정 크기로 분할한다', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('빈 배열은 빈 결과', () => {
      expect(chunk([], 2)).toEqual([]);
    });
  });

  describe('buildExpoMessages', () => {
    const payload = { title: '제목', body: '본문', data: { x: 1 } };

    it('유효 Expo 토큰만 메시지로 변환', () => {
      const tokens = ['ExponentPushToken[abc]', 'invalid-token', 'ExpoPushToken[def]'];
      const messages = buildExpoMessages(tokens, payload);
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({
        to: 'ExponentPushToken[abc]',
        title: '제목',
        body: '본문',
        data: { x: 1 },
      });
    });

    it('유효 토큰 없으면 빈 배열', () => {
      expect(buildExpoMessages(['nope'], payload)).toHaveLength(0);
    });
  });

  describe('sendExpoPush', () => {
    it('메시지 없으면 fetch 호출하지 않는다', async () => {
      const spy = jest.spyOn(global, 'fetch');
      await sendExpoPush([]);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('메시지를 Expo 엔드포인트로 전송한다', async () => {
      const spy = jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response('{}', { status: 200 }));
      await sendExpoPush([{ to: 'ExponentPushToken[a]', title: 't', body: 'b' }]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]![0]).toBe('https://exp.host/--/api/v2/push/send');
      spy.mockRestore();
    });

    it('응답 ticket 을 messages 순서대로 반환', async () => {
      const body = JSON.stringify({
        data: [
          { status: 'ok', id: 'tk1' },
          { status: 'error', details: { error: 'DeviceNotRegistered' } },
        ],
      });
      const spy = jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response(body, { status: 200 }));
      const tickets = await sendExpoPush([
        { to: 'ExponentPushToken[a]', title: 't', body: 'b' },
        { to: 'ExponentPushToken[b]', title: 't', body: 'b' },
      ]);
      expect(tickets).toHaveLength(2);
      expect(tickets[0]).toEqual({ status: 'ok', id: 'tk1' });
      spy.mockRestore();
    });

    it('전송 실패 시 길이 정렬을 위해 error ticket 으로 채운다', async () => {
      const spy = jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response('nope', { status: 500 }));
      const tickets = await sendExpoPush([
        { to: 'ExponentPushToken[a]', title: 't', body: 'b' },
      ]);
      expect(tickets).toHaveLength(1);
      expect(tickets[0]!.status).toBe('error');
      spy.mockRestore();
    });
  });

  describe('collectInvalidTokensFromTickets', () => {
    it('DeviceNotRegistered ticket 의 토큰만 추출', () => {
      const messages: ExpoMessage[] = [
        { to: 'ExponentPushToken[a]', title: 't', body: 'b' },
        { to: 'ExponentPushToken[b]', title: 't', body: 'b' },
        { to: 'ExponentPushToken[c]', title: 't', body: 'b' },
      ];
      const tickets: ExpoPushTicket[] = [
        { status: 'ok', id: 'tk1' },
        { status: 'error', details: { error: 'DeviceNotRegistered' } },
        { status: 'error', details: { error: 'MessageTooBig' } },
      ];
      expect(collectInvalidTokensFromTickets(messages, tickets)).toEqual([
        'ExponentPushToken[b]',
      ]);
    });
  });

  describe('collectInvalidTokensFromReceipts', () => {
    it('DeviceNotRegistered receipt 의 토큰만 추출', () => {
      const map = new Map<string, string>([
        ['r1', 'ExponentPushToken[a]'],
        ['r2', 'ExponentPushToken[b]'],
      ]);
      const receipts = {
        r1: { status: 'ok' as const },
        r2: { status: 'error' as const, details: { error: 'DeviceNotRegistered' } },
      };
      expect(collectInvalidTokensFromReceipts(map, receipts)).toEqual([
        'ExponentPushToken[b]',
      ]);
    });
  });
});
