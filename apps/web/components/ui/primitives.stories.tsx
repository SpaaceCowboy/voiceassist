import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
const meta = {
  title: "Design system/Primitives",
  component: Button,
  tags: ["autodocs"],
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Buttons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};
export const Inputs: Story = {
  render: () => (
    <div className="grid w-80 gap-3">
      <Input placeholder="Default input" />
      <Input
        defaultValue="Invalid content"
        aria-invalid
        className="border-destructive"
      />
      <Input disabled placeholder="Disabled" />
    </div>
  ),
};
export const Badges: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge>Default</Badge>
      <Badge variant="primary">Featured</Badge>
      <Badge variant="success">Verified</Badge>
      <Badge variant="warning">Review</Badge>
      <Badge variant="info">Skill</Badge>
    </div>
  ),
};
