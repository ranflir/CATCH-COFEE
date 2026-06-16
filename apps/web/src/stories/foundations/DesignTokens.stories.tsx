import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Foundations/Design Tokens',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const ColorsAndTypography: Story = {
  render: () => (
    <div className="stack">
      <section className="card stack">
        <h1>제목 (h1)</h1>
        <h2>부제 (h2)</h2>
        <p>본문 텍스트</p>
        <p className="muted">muted 보조 텍스트</p>
        <p className="error">error 상태</p>
        <p className="success">success 상태</p>
      </section>
      <section className="card stack">
        <h2>버튼</h2>
        <div className="row-actions">
          <button type="button">Primary</button>
          <button type="button" className="btn-secondary">
            Secondary
          </button>
          <button type="button" className="btn-danger">
            Danger
          </button>
          <button type="button" disabled>
            Disabled
          </button>
        </div>
      </section>
      <section className="card stack">
        <h2>폼</h2>
        <label className="label">
          라벨
          <input placeholder="input" />
        </label>
        <label className="label">
          선택
          <select>
            <option>옵션 1</option>
            <option>옵션 2</option>
          </select>
        </label>
      </section>
      <div className="grid two">
        <div className="card">카드 A</div>
        <div className="card">카드 B</div>
      </div>
    </div>
  ),
};
