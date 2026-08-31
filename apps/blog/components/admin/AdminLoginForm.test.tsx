import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminLoginForm } from "./AdminLoginForm";
import { api } from "@/lib/api";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: replace, replace, refresh }) }));
vi.mock("@/lib/api", () => ({ api: { loginAdmin: vi.fn() } }));

describe("AdminLoginForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits normalized credentials and redirects", async () => {
    vi.mocked(api.loginAdmin).mockResolvedValue({
      data: { authenticated: true, user: { email: "admin@example.com" } },
    });
    const user = userEvent.setup();
    render(<AdminLoginForm next="/admin" />);

    await user.type(screen.getByLabelText("Email"), " Admin@Example.com ");
    await user.type(screen.getByLabelText("Password"), "correct-password");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(api.loginAdmin).toHaveBeenCalledWith("admin@example.com", "correct-password");
    expect(replace).toHaveBeenCalledWith("/admin");
    expect(refresh).toHaveBeenCalled();
  });
});
