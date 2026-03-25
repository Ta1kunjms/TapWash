import type { CustomerAvatarKey } from "@/lib/avatar-catalog";

export type AvatarPickerState = {
  isOpen: boolean;
  committedAvatarKey: CustomerAvatarKey;
  draftAvatarKey: CustomerAvatarKey;
};

export function openAvatarPicker(state: AvatarPickerState): AvatarPickerState {
  return {
    ...state,
    isOpen: true,
    draftAvatarKey: state.committedAvatarKey,
  };
}

export function closeAvatarPicker(state: AvatarPickerState): AvatarPickerState {
  return {
    ...state,
    isOpen: false,
  };
}

export function selectAvatar(state: AvatarPickerState, avatarKey: CustomerAvatarKey): AvatarPickerState {
  return {
    ...state,
    draftAvatarKey: avatarKey,
  };
}

export function commitAvatarSelection(state: AvatarPickerState): AvatarPickerState {
  return {
    ...state,
    committedAvatarKey: state.draftAvatarKey,
    isOpen: false,
  };
}

export function isAvatarSaveDisabled(state: AvatarPickerState, isSaving: boolean): boolean {
  return isSaving || state.draftAvatarKey === state.committedAvatarKey;
}

export function shouldCloseOnEscape(isSaving: boolean, key: string): boolean {
  return !isSaving && key === "Escape";
}

export function getNextAvatarIndex(currentIndex: number, key: string, total: number): number {
  if (total <= 0) return currentIndex;

  if (key === "ArrowRight" || key === "ArrowDown") {
    return (currentIndex + 1 + total) % total;
  }

  if (key === "ArrowLeft" || key === "ArrowUp") {
    return (currentIndex - 1 + total) % total;
  }

  return currentIndex;
}
