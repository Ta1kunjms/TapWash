import { describe, expect, it } from "vitest";
import {
  closeAvatarPicker,
  getNextAvatarIndex,
  isAvatarSaveDisabled,
  openAvatarPicker,
  selectAvatar,
  shouldCloseOnEscape,
  type AvatarPickerState,
} from "@/components/customer/avatar-picker-state";

function makeState(): AvatarPickerState {
  return {
    isOpen: false,
    committedAvatarKey: "achiever",
    draftAvatarKey: "achiever",
  };
}

describe("avatar picker state", () => {
  it("opens and closes modal state correctly", () => {
    const opened = openAvatarPicker(makeState());
    expect(opened.isOpen).toBe(true);

    const closed = closeAvatarPicker(opened);
    expect(closed.isOpen).toBe(false);
  });

  it("updates selection state and enables save only when changed", () => {
    const opened = openAvatarPicker(makeState());
    const selected = selectAvatar(opened, "techy");

    expect(selected.draftAvatarKey).toBe("techy");
    expect(isAvatarSaveDisabled(selected, false)).toBe(false);
  });

  it("supports keyboard basics for escape and arrow navigation", () => {
    expect(shouldCloseOnEscape(false, "Escape")).toBe(true);
    expect(shouldCloseOnEscape(true, "Escape")).toBe(false);
    expect(getNextAvatarIndex(0, "ArrowRight", 9)).toBe(1);
    expect(getNextAvatarIndex(0, "ArrowLeft", 9)).toBe(8);
  });
});
