import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { LoginPage } from "@/features/auth/pages/LoginPage";

describe("LoginPage", () => { it("switches identifier label to Admission No. for student role", async () => { const user = userEvent.setup(); render(<MemoryRouter><LoginPage /></MemoryRouter>); await user.click(screen.getByRole("button", { name: /student/i })); expect(screen.getByLabelText(/admission no\./i)).toHaveValue("CLS-2026-001"); }); });
